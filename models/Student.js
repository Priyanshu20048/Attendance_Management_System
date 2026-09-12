// models/Student.js
const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true 
    },
    rollNo: { 
      type: String, 
      required: true 
    },
    className: { 
      type: String, 
      required: true 
    }
  },
  {
    // ✅ createdAt, updatedAt for students
    timestamps: true,
  }
);

// ✅ Roll number should be unique *inside* a class
studentSchema.index({ rollNo: 1, className: 1 }, { unique: true });

module.exports = mongoose.model("Student", studentSchema);
