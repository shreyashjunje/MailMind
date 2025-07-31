const express = require("express");
const router = express.Router();
const Event = require("../models/Event");

// List events for user
router.get("/", async (req, res) => {
  const userEmail = req.user?.email; // assume JWT middleware populates req.user
  if (!userEmail) return res.status(401).send("Unauthorized");

  const events = await Event.find({ userId: userEmail }).sort({ start: 1 });
  res.json({ events });
});

// Force resync to Google for one event
router.post("/:id/sync-google", async (req, res) => {
  const EventModel = require("../models/Event");
  const User = require("../models/User");
  const { google } = require("googleapis");
  const createOAuthClient = require("../config/googeConfig");

  const event = await EventModel.findById(req.params.id);
  if (!event) return res.status(404).send("Event not found");

  const user = await User.findOne({ email: event.userId });
  if (!user) return res.status(400).send("User credentials missing");

  try {
    const oauth2Client = createOAuthClient();
    oauth2Client.setCredentials({
      access_token: user.accessToken,
      refresh_token: user.refreshToken,
    });

    // Handle token refresh
    oauth2Client.on("tokens", (tokens) => {
      if (tokens.access_token) user.accessToken = tokens.access_token;
      if (tokens.refresh_token) user.refreshToken = tokens.refresh_token;
      user.save();
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    if (event.googleEventId) {
      // update existing
      await calendar.events.update({
        calendarId: "primary",
        eventId: event.googleEventId,
        requestBody: {
          summary: event.title,
          description: event.description,
          start: {
            dateTime: event.start.toISOString(),
            timeZone: "Asia/Kolkata",
          },
          end: { dateTime: event.end.toISOString(), timeZone: "Asia/Kolkata" },
        },
      });
    } else {
      const response = await calendar.events.insert({
        calendarId: "primary",
        requestBody: {
          summary: event.title,
          description: event.description,
          start: {
            dateTime: event.start.toISOString(),
            timeZone: "Asia/Kolkata",
          },
          end: { dateTime: event.end.toISOString(), timeZone: "Asia/Kolkata" },
        },
      });
      event.googleEventId = response.data.id;
      event.googleCalendarLink = response.data.htmlLink;
      event.syncedToGoogle = true;
      await event.save();
    }

    res.json({ success: true, event });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Google sync failed" });
  }
});

module.exports = router;
