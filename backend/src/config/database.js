const mongoose = require("mongoose");

async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  await mongoose.connect(mongoUri);
  console.log(`Connected to MongoDB at ${mongoose.connection.host}`);
}

module.exports = { connectDatabase };
