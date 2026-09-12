// controllers/teacherController.js
const Student = require("../models/Student");
const Attendance = require("../models/Attendance");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const redisClient = require("../config/redis");


/* ================= HELPERS ================= */

function normalizeWebPath(p) {
  if (!p) return "";
  p = String(p).trim();
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  if (!p.startsWith("/")) return "/" + p;
  return p;
}

function normalizeClassName(c) {
  if (!c && c !== 0) return "";
  return String(c).trim().toUpperCase();
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

/* ================= TEACHER DASHBOARD ================= */
/* ================= TEACHER DASHBOARD ================= */

const getDashboard = async (req, res) => {
  try {
    const success = req.query.successMsg || null;

    /* ---------- USER (SESSION + FRESH) ---------- */
    const sessionUser = req.session.user || {};
    let teacher = sessionUser;

    if (sessionUser._id) {
      const fresh = await User.findById(sessionUser._id).lean();
      if (fresh) {
        fresh.profilePhoto = normalizeWebPath(fresh.profilePhoto);
        teacher = fresh;

        // sync session
        req.session.user.name = fresh.name;
        req.session.user.email = fresh.email;
        req.session.user.subject = fresh.subject;
        req.session.user.classes = fresh.classes;
        req.session.user.profilePhoto = fresh.profilePhoto || null;
      }
    }

    const subject = teacher.subject;
    const classes = Array.isArray(teacher.classes)
      ? teacher.classes.map(normalizeClassName).filter(Boolean)
      : [];

    const today = todayStr();
    const selectedDate = (req.query.date || today).trim();
    const selectedClass = normalizeClassName(
      req.query.className || classes[0] || ""
    );

    /* ---------- BASIC VALIDATIONS (NO REDIS) ---------- */
    if (!subject || classes.length === 0) {
      return res.render("teacherDashboard", {
        user: req.session.user,
        classes,
        subject,
        students: [],
        selectedClass: "",
        selectedDate,
        records: [],
        error: "No subject or classes assigned.",
        success,
      });
    }

    if (!classes.includes(selectedClass)) {
      return res.render("teacherDashboard", {
        user: req.session.user,
        classes,
        subject,
        students: [],
        selectedClass,
        selectedDate,
        records: [],
        error: "You are not assigned to this class.",
        success: null,
      });
    }

    if (selectedDate > today) {
      return res.render("teacherDashboard", {
        user: req.session.user,
        classes,
        subject,
        students: [],
        selectedClass,
        selectedDate,
        records: [],
        error: "Future dates are not allowed.",
        success: null,
      });
    }

    /* ---------- 🔑 REDIS KEY (teacher + class + date) ---------- */
    const cacheKey = `teacher:dashboard:${teacher._id}:${selectedClass}:${selectedDate}`;

    /* ---------- REDIS CHECK (READ ONLY) ---------- */
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log("🔥 Teacher Dashboard from REDIS");
      const data = JSON.parse(cached);

      return res.render("teacherDashboard", {
        user: req.session.user, // user NEVER from redis
        classes,
        subject,
        selectedClass,
        selectedDate,
        success,
        error: null,
        ...data, // students + records
      });
    }

    /* ---------- MONGODB (HEAVY PART) ---------- */

    const students = await Student.find({ className: selectedClass }).sort({
      rollNo: 1,
    });

    // Auto-create ABSENT only for TODAY (never cached)
    if (selectedDate === today) {
      for (const student of students) {
        const exists = await Attendance.findOne({
          studentId: student._id,
          className: selectedClass,
          subject,
          date: selectedDate,
        });

        if (!exists) {
          await Attendance.create({
            studentId: student._id,
            className: selectedClass,
            subject,
            teacherId: teacher._id,
            date: selectedDate,
            status: "Absent",
          });
        }
      }
    }

    const records = await Attendance.find({
      className: selectedClass,
      subject,
      date: selectedDate,
    }).populate("studentId");

    /* ---------- SAVE ONLY DATA TO REDIS ---------- */
    const cachePayload = {
      students,
      records,
    };

    await redisClient.setEx(
      cacheKey,
      60, // 1 minute cache
      JSON.stringify(cachePayload)
    );

    console.log("🗄️ Teacher Dashboard from MONGODB");

    return res.render("teacherDashboard", {
      user: req.session.user,
      classes,
      subject,
      students,
      selectedClass,
      selectedDate,
      records,
      error: null,
      success,
    });
  } catch (err) {
    console.error("❌ getDashboard error:", err);
    return res.redirect("/teacher/dashboard");
  }
};


/* ================= MARK ATTENDANCE ================= */

const markAttendance = async (req, res) => {
  try {
    const teacher = req.session.user;
    const subject = teacher.subject;
    const io = req.app.get("io");

    let { studentId, className, date, status, markAll } = req.body;
    className = normalizeClassName(className);
    const today = todayStr();
    date = date || today;

    if (markAll === "1") {
      const students = await Student.find({ className });
      for (const s of students) {
        await Attendance.findOneAndUpdate(
          { studentId: s._id, className, subject, date },
          {
            studentId: s._id,
            className,
            subject,
            teacherId: teacher._id,
            date,
            status: "Present",
          },
          { upsert: true }
        );
      }
    } else {
      await Attendance.findOneAndUpdate(
        { studentId, className, subject, date },
        {
          studentId,
          className,
          subject,
          teacherId: teacher._id,
          date,
          status,
        },
        { upsert: true }
      );
    }

    // 🔔 WebSocket notify
    if (io) {
      io.to("admins").emit("attendance:update", {
        teacherName: teacher.name,
        className,
      });
    }

    // ✅ REDIS CACHE INVALIDATION (CORRECT PLACE)
    const cacheKey = `teacher:dashboard:${teacher._id}:${className}:${date}`;
    await redisClient.del(cacheKey);
    console.log("🧹 Teacher dashboard cache cleared:", cacheKey);

    const msg = encodeURIComponent("Attendance updated successfully.");
    return res.redirect(
      `/teacher/dashboard?date=${date}&className=${className}&successMsg=${msg}`
    );
  } catch (err) {
    console.error("❌ markAttendance error:", err);
    return res.redirect("/teacher/dashboard");
  }
};


/* ================= VIEW ATTENDANCE RANGE ================= */

const viewAttendanceRange = async (req, res) => {
  try {
    const teacher = req.session.user;
    const subject = teacher.subject;

    const selectedClass = normalizeClassName(req.query.className || "");
    const { studentId, fromDate, toDate } = req.query;

    if (!fromDate || !toDate) {
      return res.render("attendanceRange", {
        user: req.session.user,
        className: selectedClass,
        subject,
        records: [],
        fromDate: "",
        toDate: "",
        studentName: "",
        error: null,
        dates: [],
      });
    }

    const students = await Student.find({ className: selectedClass }).sort({
      rollNo: 1,
    });

    let records = [];
    let dates = [];

    let cur = new Date(fromDate);
    let end = new Date(toDate);
    while (cur <= end) {
      dates.push(cur.toISOString().split("T")[0]);
      cur.setDate(cur.getDate() + 1);
    }

    for (const student of students) {
      const data = await Attendance.find({
        studentId: student._id,
        className: selectedClass,
        subject,
        date: { $gte: fromDate, $lte: toDate },
      });

      let map = {};
      data.forEach((d) => (map[d.date] = d.status));

      let filled = {};
      dates.forEach((d) => (filled[d] = map[d] || "Absent"));

      records.push({ student, attendance: filled });
    }

    return res.render("attendanceRange", {
      user: req.session.user,
      className: selectedClass,
      subject,
      records,
      fromDate,
      toDate,
      studentName: "",
      error: null,
      dates,
    });
  } catch (err) {
    console.error("❌ viewAttendanceRange error:", err);
    return res.redirect("/teacher/dashboard");
  }
};

/* ================= TEACHER PROFILE ================= */

const getProfile = async (req, res) => {
  const teacher = await User.findById(req.session.user._id);
  teacher.profilePhoto = normalizeWebPath(teacher.profilePhoto);
  res.render("teacherProfile", { user: teacher, error: null, success: null });
};

const updateProfile = async (req, res) => {
  try {
    const teacher = await User.findById(req.session.user._id);
    const { name, email, password } = req.body;

    if (name) teacher.name = name;
    if (email) teacher.email = email;
    if (password && password.length >= 8) {
      teacher.password = await bcrypt.hash(password, 10);
    }

    if (req.file) {
      teacher.profilePhoto = "/uploads/" + req.file.filename;
    }

    await teacher.save();
    res.render("teacherProfile", {
      user: teacher,
      error: null,
      success: "Profile updated successfully!",
    });
  } catch (e) {
    res.render("teacherProfile", {
      user: null,
      error: "Error updating profile",
      success: null,
    });
  }
};

/* ================= EXPORT ================= */

module.exports = {
  getDashboard,
  markAttendance,
  viewAttendanceRange,
  getProfile,
  updateProfile,
};
