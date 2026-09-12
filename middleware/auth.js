// middleware/auth.js

// ✅ User logged-in hai ya nahi
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  // Not logged in → send to login
  return res.redirect("/login");
};

// ✅ Only Admin allowed
const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === "admin") {
    return next();
  }
  // Forbidden: not an admin
  return res.status(403).send("Forbidden: Admins only.");
};

// ✅ Only Teacher allowed
const isTeacher = (req, res, next) => {
  if (req.session.user && req.session.user.role === "teacher") {
    return next();
  }
  // Forbidden: not a teacher
  return res.status(403).send("Forbidden: Teachers only.");
};

module.exports = {
  isAuthenticated,
  isAdmin,
  isTeacher,
};
