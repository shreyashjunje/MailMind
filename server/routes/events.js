const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const EventModel = require("../models/Event");
const User = require("../models/User");
const { google } = require("googleapis");
const createOAuthClient = require("../config/googeConfig");
const passport = require("passport");
const authenticate = require("../middlewares/authMiddleware");

// Helper function for Google Calendar sync
const syncEventWithGoogle = async (event, user) => {
  // Validate input
  if (!event || !user) {
    throw new Error("Event and user objects are required");
  }

  try {
    const oauth2Client = createOAuthClient();
    oauth2Client.setCredentials({
      access_token: user.accessToken,
      refresh_token: user.refreshToken,
    });

    // Handle token refresh
    oauth2Client.on("tokens", async (tokens) => {
      if (tokens.access_token) {
        user.accessToken = tokens.access_token;
        await user.save();
      }
      if (tokens.refresh_token) {
        user.refreshToken = tokens.refresh_token;
        await user.save();
      }
    });

    // Force refresh if token is expired
    try {
      await oauth2Client.getAccessToken();
    } catch (refreshError) {
      console.error("Token refresh failed:", refreshError);
      throw new Error("Google authentication failed. Please re-authenticate.");
    }

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Validate event data
    if (!event.start || !event.end) {
      throw new Error("Event must have start and end dates");
    }

    const eventData = {
      summary: event.title || "No title",
      description: event.description || "",
      start: {
        dateTime: event.start.toISOString(),
        timeZone: "Asia/Kolkata",
      },
      end: {
        dateTime: event.end.toISOString(),
        timeZone: "Asia/Kolkata",
      },
    };

    console.log("Syncing event to Google:", event._id);

    let response;
    try {
      if (event.googleEventId) {
        response = await calendar.events.update({
          calendarId: "primary",
          eventId: event.googleEventId,
          requestBody: eventData,
        });
      } else {
        response = await calendar.events.insert({
          calendarId: "primary",
          requestBody: eventData,
        });
        event.googleEventId = response.data.id;
        event.googleCalendarLink = response.data.htmlLink;
      }
    } catch (apiError) {
      // Handle specific Google API errors
      if (apiError.code === 401) {
        throw new Error(
          "Google authentication expired. Please re-authenticate."
        );
      }
      if (apiError.code === 404 && event.googleEventId) {
        // Event not found in Google Calendar - clear ID and retry as new event
        event.googleEventId = undefined;
        return syncEventWithGoogle(event, user);
      }
      throw apiError;
    }

    console.log("Google API response:", response.data);

    event.syncedToGoogle = true;
    event.lastSyncAttempt = new Date();
    event.syncError = null;
    await event.save();

    return response.data;
  } catch (error) {
    console.error("Google Calendar sync error:", error.message);

    event.syncedToGoogle = false;
    event.lastSyncAttempt = new Date();
    event.syncError = error.message;
    await event.save();

    // Throw user-friendly error
    throw new Error(`Failed to sync with Google Calendar: ${error.message}`);
  }
};

// List events for user
router.get("/", authenticate, async (req, res) => {
  const userEmail = req.user.email;
  if (!userEmail) return res.status(401).send("Unauthorized");

  try {
    const events = await Event.find({ userId: userEmail }).sort({ start: 1 });
    res.json({ events });
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).send("Server error");
  }
});

// Create new event with automatic sync
router.post("/", authenticate, async (req, res) => {
  try {
    const { title, description, start, end, type, priority, location } =
      req.body;

    // Create event in your database
    const newEvent = new Event({
      title,
      description,
      start,
      end,
      type,
      priority,
      location,
      userId: req.user.email,
    });

    // Save to database first
    await newEvent.save();

    // Get user credentials
    const user = await User.findOne({ email: req.user.email });
    if (!user || !user.accessToken) {
      return res.status(201).json({
        event: newEvent,
        warning: "Event saved but not synced to Google (no auth)",
      });
    }

    // Attempt to sync with Google Calendar
    try {
      await syncEventWithGoogle(newEvent, user);
      res.status(201).json({ event: newEvent });
    } catch (syncError) {
      res.status(201).json({
        event: newEvent,
        warning: "Event saved but Google sync failed",
      });
    }
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: "Failed to create event" });
  }
});

// Update event with automatic sync
router.put("/:id", authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).send("Event not found");
    if (event.userId !== req.user.email) {
      return res.status(403).send("Not authorized to update this event");
    }

    // Update event fields
    Object.assign(event, req.body);
    await event.save();

    // Get user credentials
    const user = await User.findOne({ email: req.user.email });
    if (!user || !user.accessToken) {
      return res.json({
        event,
        warning: "Event updated but not synced to Google (no auth)",
      });
    }

    // Attempt to sync with Google Calendar
    try {
      await syncEventWithGoogle(event, user);
      res.json({ event });
    } catch (syncError) {
      res.json({
        event,
        warning: "Event updated but Google sync failed",
      });
    }
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ error: "Failed to update event" });
  }
});

// Force resync to Google for one event
router.post("/:id/sync-google", authenticate, async (req, res) => {
  try {
    const event = await EventModel.findById(req.params.id);
    console.log(event, "..........event found for sync");
    if (!event) return res.status(404).send("Event not found");
    if (event.userId !== req.user.email) {
      return res.status(403).json({ error: "Forbidden: not your event" });
    }

    const user = await User.findOne({ email: event.userId });
    console.log(user, "..........user found for sync");
    if (!user) return res.status(400).send("User credentials missing");
    if (!user.accessToken) {
      return res
        .status(400)
        .send("User not properly authenticated with Google");
    }

    await syncEventWithGoogle(event, user);
    // console.log("Event synced with Google:", res);
    res.json({ success: true, event });
  } catch (e) {
    console.error("Google sync failed:", e.response?.data || e.message);
    res.status(500).json({
      error: "Google sync failed",
      details: e.response?.data || e.message,
    });
  }
});

// Sync all unsynced events for user
router.post("/sync/all", authenticate, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user || !user.accessToken) {
      return res
        .status(400)
        .json({ error: "User not authenticated with Google" });
    }

    const events = await Event.find({
      userId: req.user.email,
      $or: [{ syncedToGoogle: false }, { syncedToGoogle: { $exists: false } }],
    });

    let syncedCount = 0;
    const results = [];

    for (const event of events) {
      try {
        await syncEventWithGoogle(event, user);
        syncedCount++;
        results.push({
          eventId: event._id,
          status: "success",
          googleEventId: event.googleEventId,
        });
      } catch (syncError) {
        results.push({
          eventId: event._id,
          status: "failed",
          error: syncError.message,
        });
      }
    }

    res.json({
      message: `Synced ${syncedCount} of ${events.length} events`,
      totalEvents: events.length,
      syncedCount,
      failedCount: events.length - syncedCount,
      results,
    });
  } catch (error) {
    console.error("Error syncing all events:", error);
    res.status(500).json({ error: "Failed to sync all events" });
  }
});

module.exports = router;
