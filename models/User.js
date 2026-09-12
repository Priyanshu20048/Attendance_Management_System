// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "teacher"],
      required: true,
    },

    // ✅ For teachers
    subject: {
      type: String,
      trim: true,
    },
    classes: [
      {
        type: String, // e.g. "5A", "10B"
        trim: true,
      },
    ],

    // ✅ NEW: profile photo path (relative to /public)
    profilePhoto: {
      type: String, // e.g. "/uploads/1712345678-myphoto.jpg"
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
