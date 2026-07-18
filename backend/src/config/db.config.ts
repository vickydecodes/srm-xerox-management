// src/config/db.config.js
import mongoose from "mongoose";

const connectDB = async (MONGO_URI: string): Promise<void> => {
  if (!MONGO_URI) {
    console.error("MONGO_URI is missing!");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB...");
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;