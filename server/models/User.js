const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  googleId: String,
  name: String,
  email: { type: String, unique: true },
  picture: String,
  accessToken: String,
  refreshToken: String,
  lowPrioritySenders: {
    type: [String], // array of email addresses (e.g., ["noreply@flipkart.com"])
    default: [],
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
