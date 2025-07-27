const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  googleId: String,
  name: String,
  email: { type: String, unique: true },
  picture: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
