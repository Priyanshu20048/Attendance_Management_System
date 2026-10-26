const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Welcome Page
router.get("/", (req, res) => {
  res.render("welcome");
});

router.get("/login", authController.getLogin);
router.post("/login", authController.postLogin);

// Public signup is disabled. Admin can create teacher accounts only from admin panel.
router.get("/signup", (req, res) => {
  res.redirect("/login");
});

router.post("/signup", (req, res) => {
  res.redirect("/login");
});

router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout Error:", err);
      return res.status(500).send("Unable to log out. Please try again.");
    }
    res.clearCookie("connect.sid");
    res.redirect("/login?success=Logged%20out%20successfully.");
  });
});

module.exports = router;