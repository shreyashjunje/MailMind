const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: String,
  start: Date,
  end: Date,
  type: String,
  priority: String,
  location: String,
  description: String,
  sourceEmailId: String,
  googleEventId: String,
  syncedToGoogle: { type: Boolean, default: false },
  googleCalendarLink: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
});

module.exports = mongoose.model('Event', EventSchema);
