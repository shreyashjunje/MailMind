// server/jobs/cron.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const User = require("../models/User");
const fetchNewEmailsForUser = require("./cronRunner");

const connectToDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

const startPolling = async () => {
  await connectToDB();

  setInterval(async () => {
    console.log("🔁 Polling for new emails...");

    // const users = await User.find({ accessToken: { $exists: true, $ne: "" } });
const users = await User.find();

    for (const user of users) {
      if (!user.accessToken || !user.email) continue;

      try {
        await fetchNewEmailsForUser(user.accessToken, user.refreshToken, user.email);
      } catch (err) {
        console.error(`❌ Error while polling for ${user.email}:`, err.message);
      }
    }
  }, 1000 * 60 * 5); // every 5 minutes
};

startPolling();
