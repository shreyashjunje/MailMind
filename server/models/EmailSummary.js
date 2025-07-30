// models/EmailSummary.js
const mongoose = require("mongoose");

const EmailSummarySchema = new mongoose.Schema({
  emailId: { type: String, required: true, unique: true },
  subject: String,
  from: String,
  date: Date,
  body: String,
  summary: String,
  userEmail: String, // so we fetch summaries per user
  starred: {
  type: Boolean,
  default: false,
}
});

module.exports = mongoose.model("EmailSummary", EmailSummarySchema);
