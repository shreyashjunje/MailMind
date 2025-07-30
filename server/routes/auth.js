// server/routes/auth.js
const express = require("express");
const router = express.Router();
const EmailSummary = require("../models/EmailSummary");
const { summarizeWithGemini } = require("../utils/gemini");
const { htmlToText } = require("html-to-text");
const { google } = require("googleapis");
const oauth2Client = require("../config/googeConfig");
const passport = require("passport");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

let userTokens = null;

// Google OAuth login route
router.get(
  "/google",
  passport.authenticate("google", {
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/gmail.readonly",
    ],
    accessType: "offline",
    prompt: "consent",
  })
);

// ✅ Background email fetch + summary job
const processEmailsInBackground = async (user) => {
  try {
    const { email: userEmail, accessToken } = user;
    oauth2Client.setCredentials({ access_token: accessToken });
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

      const body = getText(msgDetail.data.payload);

      const isImportant = keywords.some(
        (k) =>
          subject.toLowerCase().includes(k) || body.toLowerCase().includes(k)
      );

      if (!isImportant) continue;

      const summary = await summarizeWithGemini(body);

      await EmailSummary.create({
        emailId: msgDetail.data.id,
        subject,
        from,
        date,
        body,
        summary,
        userEmail,
      });
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

    // Save or update user
    await User.findOneAndUpdate(
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

    // Create token and redirect quickly
    const token = jwt.sign(
      { name, email, picture, accessToken },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);

    // Fire background email processing after redirect
    processEmailsInBackground(user);
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
