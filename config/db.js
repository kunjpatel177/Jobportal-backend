const mongoose = require('mongoose');

// Global cache for serverless environments (e.g. Vercel)
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  // If connection is already established and active, reuse it immediately
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    const errorMsg = 'MONGO_URI is not defined in environment variables.';
    console.error(`[DB Error] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Prevents queries from buffering and hanging on cold starts
      serverSelectionTimeoutMS: 5000 // Fast fail-over (5s) instead of 30s hang
    };

    cached.promise = mongoose.connect(mongoUri, opts).then((mongooseInstance) => {
      console.log(`MongoDB Connected: ${mongooseInstance.connection.host}`);
      return mongooseInstance;
    }).catch((err) => {
      console.error(`Database connection error: ${err.message}`);
      cached.promise = null; // Reset so subsequent requests can attempt to reconnect
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
};

module.exports = connectDB;
