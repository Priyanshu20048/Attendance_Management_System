const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // MongoDB Atlas connection string format:
    // mongodb+srv://username:password@cluster.mongodb.net/attendanceDB?retryWrites=true&w=majority
    const mongoURI =
      process.env.MONGO_URI || "mongodb+srv://username:password@cluster.mongodb.net/attendanceDB?retryWrites=true&w=majority";

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // Try for 5 seconds then fail
    });

    console.log("✓ MongoDB Atlas Connected Successfully");
  } catch (err) {
    console.warn("⚠ MongoDB unavailable - app running without database");
    console.warn("   Error:", err.message);
    // Don't exit - allow app to run without DB for development
  }
};

module.exports = connectDB;
