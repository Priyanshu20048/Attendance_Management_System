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

// Signup Routes
router.get("/signup", authController.getSignup);
router.post("/signup", authController.postSignup);

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