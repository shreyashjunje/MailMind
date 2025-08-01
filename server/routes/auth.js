// server/routes/auth.js
const express = require("express");
const router = express.Router();
const EmailSummary = require("../models/EmailSummary");
const { summarizeWithGemini } = require("../utils/gemini");
const { htmlToText } = require("html-to-text");
const { google } = require("googleapis");
const createOAuthClient = require("../config/googeConfig");
const passport = require("passport");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { extractInterviewEvent } = require("../utils/extractEvent");
const Event = require("../models/Event");


let userTokens = null;

// Google OAuth login route
router.get(
  "/google",
  passport.authenticate("google", {
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ],
    accessType: "offline",
    prompt: "consent",
  })
);

// ✅ Background email fetch + summary job
const processEmailsInBackground = async (user) => {
  try {
    const { email: userEmail, accessToken,refreshToken } = user;
    // Create a fresh OAuth client instance and set credentials
    const oauth2Client = createOAuthClient();
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    // // Handle token refresh events
    oauth2Client.on("tokens", (tokens) => {
      if (tokens.access_token) {
        user.accessToken = tokens.access_token;
      }
      if (tokens.refresh_token) {
        user.refreshToken = tokens.refresh_token;
      }
      user.save();
    });
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 50,
    });

    const messages = response.data.messages || [];
    const oneMonthAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

    const keywords = [
      "meeting",
      "exam",
      "deadline",
      "test",
      "assignment",
      "interview",
      "schedule",
      "reminder",
      "event",
      "submit",
      "form",
      "link",
      "password",
      "Airtel",
    ];

    // Fetch all messages in parallel
    const detailPromises = messages.map((msg) =>
      gmail.users.messages.get({ userId: "me", id: msg.id })
    );

    const details = await Promise.allSettled(detailPromises);

    for (const result of details) {
      if (result.status !== "fulfilled") continue;
      const msgDetail = result.value;

      const headers = msgDetail.data.payload.headers;
      const subject = headers.find((h) => h.name === "Subject")?.value || "";
      const from = headers.find((h) => h.name === "From")?.value || "";
      const dateStr = headers.find((h) => h.name === "Date")?.value || "";
      const date = new Date(dateStr);

      if (date < oneMonthAgo) continue;

      const exists = await EmailSummary.findOne({ emailId: msgDetail.data.id });
      if (exists) continue;

      // Extract plain or HTML body
      const getText = (payload) => {
        if (payload.mimeType === "text/plain" && payload.body.data) {
          return Buffer.from(payload.body.data, "base64").toString("utf-8");
        }
        if (payload.mimeType === "text/html" && payload.body.data) {
          const html = Buffer.from(payload.body.data, "base64").toString(
            "utf-8"
          );
          return htmlToText(html);
        }
        if (payload.parts) {
          for (let part of payload.parts) {
            const text = getText(part);
            if (text) return text;
          }
        }
        return "";
      };

      const getRawBody = (payload) => {
        if (payload.mimeType === "text/plain" && payload.body.data) {
          return {
            type: "text",
            content: Buffer.from(payload.body.data, "base64").toString("utf-8"),
          };
        }

        if (payload.mimeType === "text/html" && payload.body.data) {
          return {
            type: "html",
            content: Buffer.from(payload.body.data, "base64").toString("utf-8"),
          };
        }

        if (payload.parts) {
          for (let part of payload.parts) {
            const content = getRawBody(part);
            if (content) return content;
          }
        }

        return { type: "unknown", content: "" };
      };

      const body = getText(msgDetail.data.payload);
      const { content: originalBody } = getRawBody(msgDetail.data.payload);

      const isImportant = keywords.some(
        (k) =>
          subject.toLowerCase().includes(k) || body.toLowerCase().includes(k)
      );

      if (!isImportant) continue;

      const summary = await summarizeWithGemini(body);

      // After saving email summary:
      const savedSummary = await EmailSummary.create({
        emailId: msgDetail.data.id,
        subject,
        from,
        date,
        body,
        originalBody,
        summary,
        userEmail,
      });

      // Extract candidate event
      const candidate = extractInterviewEvent(savedSummary);
      if (candidate) {
        // Dedupe
        let eventDoc = await Event.findOne({
          sourceEmailId: candidate.sourceEmailId,
          start: candidate.start,
          userId: user.email,
        });

        if (!eventDoc) {
          eventDoc = await Event.create({
            ...candidate,
            userId: user.email,
          });
        }

        // Sync to Google Calendar if tokens exist
        if (user.accessToken && user.refreshToken) {
          try {
            // const oauth2Client = require("../config/googeConfig"); // ensure this returns a fresh OAuth2 client instance
            const oauth2Client = createOAuthClient();

            oauth2Client.setCredentials({
              access_token: user.accessToken,
              refresh_token: user.refreshToken,
            });
            // oauth2Client.on("tokens", (tokens) => {
            //   if (tokens.access_token) user.accessToken = tokens.access_token;
            //   if (tokens.refresh_token)
            //     user.refreshToken = tokens.refresh_token;
            //   user.save(); // persist rotated tokens
            // });

            // // Refresh tokens automatically if needed
            // oauth2Client.on("tokens", (tokens) => {
            //   if (tokens.access_token) user.accessToken = tokens.access_token;
            //   if (tokens.refresh_token)
            //     user.refreshToken = tokens.refresh_token;
            //   user.save(); // persist updates
            // });

            const calendar = google.calendar({
              version: "v3",
              auth: oauth2Client,
            });

            if (!eventDoc.syncedToGoogle) {
              const gEvent = {
                summary: eventDoc.title,
                description: eventDoc.description,
                start: {
                  dateTime: eventDoc.start.toISOString(),
                  timeZone: "Asia/Kolkata",
                },
                end: {
                  dateTime: eventDoc.end.toISOString(),
                  timeZone: "Asia/Kolkata",
                },
              };

              const response = await calendar.events.insert({
                calendarId: "primary",
                requestBody: gEvent,
              });

              eventDoc.googleEventId = response.data.id;
              eventDoc.googleCalendarLink = response.data.htmlLink;
              eventDoc.syncedToGoogle = true;
              await eventDoc.save();
            }
          } catch (err) {
            console.warn("Google Calendar sync failed:", err);
            // optional: flag for retry later
          }
        }
      }
    }
  } catch (err) {
    console.error("Email processing failed:", err);
  }
};

// Handle Google callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/login`,
    session: false,
  }),
  async (req, res) => {
    const user = req.user;
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=true`);
    }

    const { name, email, picture, accessToken, refreshToken } = user;
    console.log("User authenticated:", email);

    // // Save or update user
    // await User.findOneAndUpdate(
    //   { email },
    //   {
    //     name,
    //     email,
    //     picture,
    //     accessToken,
    //     refreshToken: refreshToken || "",
    //   },
    //   { upsert: true, new: true }
    // );

    // // Create token and redirect quickly
    // const token = jwt.sign(
    //   { name, email, picture, accessToken },
    //   process.env.JWT_SECRET,
    //   { expiresIn: "8h" }
    // );

    // res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);

    // // Fire background email processing after redirect
    // processEmailsInBackground(user);

    // Save or update user and get the fresh document (with tokens)
    const savedUser = await User.findOneAndUpdate(
      { email },
      {
        name,
        email,
        picture,
        accessToken,
        refreshToken: refreshToken || "",
      },
      { upsert: true, new: true }
    );

    // Create JWT and redirect
    const token = jwt.sign(
      { name, email, picture, accessToken: savedUser.accessToken },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    console.log("Redirecting with token---------->:", token.email);

    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);

    // Fire background email processing using the persisted user (has tokens)
    processEmailsInBackground(savedUser);
  }
);

// Logout
router.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("http://localhost:5173/");
  });
});

// Emails endpoint (optional)
router.get("/emails", async (req, res) => {
  console.log("Fetching emails...");
  if (!userTokens) {
    return res.status(401).json({ error: "User not logged in" });
  }

  try {
    const oauth2Client = createOAuthClient();

    oauth2Client.setCredentials(userTokens);
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 50,
    });

    const messages = response.data.messages || [];
    const emails = [];

    for (const msg of messages) {
      const msgDetail = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
      });

      const headers = msgDetail.data.payload.headers;
      const subject = headers.find((h) => h.name === "Subject")?.value || "";
      const from = headers.find((h) => h.name === "From")?.value || "";
      const date = headers.find((h) => h.name === "Date")?.value || "";

      // Extract plain body
      let body = "";

      const getPlainText = (payload) => {
        const parts = payload.parts || [];
        for (let part of parts) {
          if (part.mimeType === "text/plain" && part.body.data) {
            return Buffer.from(part.body.data, "base64").toString("utf-8");
          } else if (part.parts) {
            const text = getPlainText(part);
            if (text) return text;
          }
        }
        return "";
      };

      if (msgDetail.data.payload.mimeType === "text/plain") {
        body = Buffer.from(msgDetail.data.payload.body.data, "base64").toString(
          "utf-8"
        );
      } else {
        body = getPlainText(msgDetail.data.payload);
      }

      const keywords = [
        "meeting",
        "exam",
        "deadline",
        "test",
        "assignment",
        "interview",
        "schedule",
        "reminder",
        "event",
        "submit",
        "form",
        "link",
        "password",
        "Airtel",
      ];

      const isImportant = keywords.some(
        (keyword) =>
          subject.toLowerCase().includes(keyword) ||
          body.toLowerCase().includes(keyword)
      );

      if (isImportant) {
        emails.push({ subject, from, date, body });
      }
    }

    res.json({ emails });
  } catch (err) {
    console.error("Failed to fetch emails:", err);
    res.status(500).json({ error: "Failed to fetch emails" });
  }
});

module.exports = router;
