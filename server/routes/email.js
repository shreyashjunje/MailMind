// server/routes/emails.js
const express = require("express");
const router = express.Router();
const EmailSummary = require("../models/EmailSummary");
const verifyJWT = require("../middlewares/verifyJWT");
const { summarizeWithGemini } = require("../utils/gemini");
const { google } = require("googleapis");
const { htmlToText } = require("html-to-text");




router.get("/check-new", verifyJWT, async (req, res) => {
  const { email: userEmail, accessToken } = req.user;

  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 20,
    });

    const messages = response.data.messages || [];

    const keywords = [
      "meeting", "exam", "deadline", "test", "assignment", "interview", "schedule",
      "reminder", "event", "submit", "form", "link", "password", "Airtel"
    ];

    for (const msg of messages) {
      const exists = await EmailSummary.findOne({ emailId: msg.id });
      if (exists) continue;

      const msgDetail = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
      });

      const headers = msgDetail.data.payload.headers;
      const subject = headers.find(h => h.name === "Subject")?.value || "";
      const from = headers.find(h => h.name === "From")?.value || "";
      const dateStr = headers.find(h => h.name === "Date")?.value || "";
      const date = new Date(dateStr);

      const getText = (payload) => {
        if (payload.mimeType === "text/plain" && payload.body.data) {
          return Buffer.from(payload.body.data, "base64").toString("utf-8");
        }
        if (payload.mimeType === "text/html" && payload.body.data) {
          const html = Buffer.from(payload.body.data, "base64").toString("utf-8");
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

      const isImportant = keywords.some(k =>
        subject.toLowerCase().includes(k) || body.toLowerCase().includes(k)
      );

      if (!isImportant) continue;

      const summary = await summarizeWithGemini(body);

      await EmailSummary.create({
        emailId: msg.id,
        subject,
        from,
        date,
        body,
        summary,
        userEmail,
      });
    }

    res.json({ message: "Checked and saved new important emails" });
  } catch (err) {
    console.error("🔁 Error checking new emails:", err);
    res.status(500).json({ error: "Failed to check new emails" });
  }
});




module.exports = router;
