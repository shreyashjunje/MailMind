const mongoose = require("mongoose");

const EmailSummarySchema = new mongoose.Schema({
  emailId: {
    type: String,
    required: true,
    unique: true,
  },
  subject: String,
  from: String,
  summary: String,
  links: [String],
  dates: [String],
  action: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("EmailSummary", EmailSummarySchema);
