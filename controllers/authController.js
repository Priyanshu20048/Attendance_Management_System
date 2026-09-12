// controllers/authController.js
const User = require("../models/User");
const bcrypt = require("bcrypt");
const validClasses = require("../utils/validClasses");

// -------------------- SIGNUP (GET) --------------------
exports.getSignup = (req, res) => {
  res.render("signup", { error: null, success: null });
};

// -------------------- SIGNUP (POST) --------------------
exports.postSignup = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      // old field (single class) – ab use nahi kar rahe, sirf backward compatible ke liye rakha
      className,
      // NEW:
      subject,
      classesInput, // comma separated classes string (e.g. "5A, 5B, 6A")
    } = req.body;

    // Basic validation
    if (!password || password.length < 8) {
      return res.render("signup", {
        error: "Password must be at least 8 characters long!",
        success: null,
      });
    }

    if (!role || (role !== "admin" && role !== "teacher")) {
      return res.render("signup", {
        error: "Please select a valid role (admin or teacher).",
        success: null,
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render("signup", {
        error: "Email already registered!",
        success: null,
      });
    }

    // Defaults (for admin or future roles)
    let subjectToSave = null;
    let classesToSave = [];

    // ---------------- TEACHER VALIDATION ----------------
    if (role === "teacher") {
      // Subject required
      if (!subject || !subject.trim()) {
        return res.render("signup", {
          error: "Subject is required for teacher signup.",
          success: null,
        });
      }

      // Classes required
      let rawClasses = classesInput && classesInput.trim()
        ? classesInput
        : "";

      // Agar user ne naya field use nahi kiya aur sirf purana className diya ho:
      if (!rawClasses && className) {
        rawClasses = className;
      }

      if (!rawClasses) {
        return res.render("signup", {
          error:
            "Please provide at least one class (comma separated) for the teacher.",
          success: null,
        });
      }

      // "5A, 5B, 6A" -> ["5A","5B","6A"]
      let classes = rawClasses
        .split(",")
        .map(function (c) {
          return c.trim().toUpperCase();
        })
        .filter(function (c) {
          return c;
        });

      if (classes.length === 0) {
        return res.render("signup", {
          error: "Please enter at least one valid class.",
          success: null,
        });
      }

      // Format check: 1A–12D (validClasses utility se)
      for (var i = 0; i < classes.length; i++) {
        var c = classes[i];
        if (!validClasses.includes(c)) {
          return res.render("signup", {
            error: "Invalid class: " + c + ". Please use 1A–12D format.",
            success: null,
          });
        }
      }

      subjectToSave = subject.trim();
      classesToSave = classes;
    }

    // ---------------- CREATE USER ----------------
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      // Only meaningful for teacher:
      subject: subjectToSave,
      classes: classesToSave,
    });

    await newUser.save();

    // Redirect to login with success message
    return res.redirect("/login?success=Signup successful! Please login.");
  } catch (err) {
    console.error("❌ Signup Error:", err);
    return res.render("signup", {
      error: "Error during signup: " + err.message,
      success: null,
    });
  }
};

// -------------------- LOGIN (GET) --------------------
exports.getLogin = (req, res) => {
  const success = req.query.success || null;
  res.render("login", { error: null, success });
};

// -------------------- LOGIN (POST) --------------------
exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!password || password.length < 8) {
      return res.render("login", {
        error: "Password must be at least 8 characters long!",
        success: null,
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.render("login", {
        error: "Invalid email or password!",
        success: null,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render("login", {
        error: "Invalid email or password!",
        success: null,
      });
    }

    // ✅ Save user in session (subject + classes bhi store)
    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      subject: user.subject,
      classes: user.classes,
    };

    if (user.role === "admin") {
      return res.redirect("/admin/dashboard");
    } else if (user.role === "teacher") {
      return res.redirect("/teacher/dashboard");
    } else {
      // fallback
      return res.redirect("/login");
    }
  } catch (err) {
    console.error("💥 Login Error:", err);
    return res.render("login", {
      error: "Error during login: " + err.message,
      success: null,
    });
  }
};

// -------------------- LOGOUT --------------------
exports.logout = (req, res) => {
  req.session.destroy(function () {
    res.redirect("/login?success=Logged out successfully.");
  });
};
