const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Welcome Page
router.get("/", (req, res) => {
  res.render("welcome");
});

router.get("/login", authController.getLogin);
router.post("/login", (req, res, next) => {
  console.log("🚀 /login POST route hit!");
  console.log("📩 Raw Body:", req.body);
  next();
}, authController.postLogin);

// Public signup is disabled. Admin can create teacher accounts only from admin panel.
router.get("/signup", (req, res) => {
  res.redirect("/login");
});

router.post("/signup", (req, res) => {
  res.redirect("/login");
});

// ✅ Add Logout Route Here
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout Error:", err);
      return res.redirect("/");
    }
    res.clearCookie("connect.sid"); // Session cookie clear karein
    res.render("logout"); // views/logout.ejs render hogi
  });
});

module.exports = router;