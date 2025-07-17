const express = require("express");
const { google } = require("googleapis");
const isAuthenticated = require("../middlewares/isAuthenticated");
const { summarizeEmail } = require("../utils/openai");
const EmailSummary = require("../models/EmailSummary");

const router = express.Router();

router.get("/emails", isAuthenticated, async (req, res) => {
  try {
    const accessToken = req.user.accessToken;

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: "v1", auth });

    // 📅 Filter emails from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const formattedDate = thirtyDaysAgo.toISOString().split("T")[0];

    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 30,
      q: `is:important after:${formattedDate}`,
    });

    const messages = response.data.messages || [];
    const emailData = [];

    const getEmailBody = (payload) => {
      if (!payload) return "";
      const parts = payload.parts || [payload];
      const part = parts.find(
        (p) => p.mimeType === "text/plain" || p.mimeType === "text/html"
      );
      const data = part?.body?.data || "";
      return Buffer.from(data, "base64").toString("utf-8");
    };

    const importantKeywords = [
      "assignment",
      "deadline",
      "meeting",
      "exam",
      "interview",
      "project",
      "submission",
      "call",
      "task",
    ];

    for (let msg of messages) {
      const exists = await EmailSummary.findOne({ emailId: msg.id });
      if (exists) {
        emailData.push(exists);
        continue;
      }

      const detail = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
      });

      const payload = detail.data.payload;
      const body = getEmailBody(payload).toLowerCase();

      // ⛔️ Skip emails with no important keywords
      const isRelevant = importantKeywords.some((keyword) =>
        body.includes(keyword)
      );
      if (!isRelevant) continue;

      const summaryData = await summarizeEmail(body);

      const subjectHeader = payload.headers.find((h) => h.name === "Subject");
      const fromHeader = payload.headers.find((h) => h.name === "From");

      const summaryObj = new EmailSummary({
        emailId: msg.id,
        subject: subjectHeader?.value || "No Subject",
        from: fromHeader?.value || "Unknown",
        summary: summaryData.summary || body.slice(0, 200),
        links: summaryData.links || [],
        dates: summaryData.dates || [],
        action: summaryData.action || "",
      });

      await summaryObj.save();
      emailData.push(summaryObj);
    }

    res.json(emailData);
  } catch (error) {
    console.error("Email fetch error:", error.message);
    res.status(500).json({ error: "Failed to fetch emails" });
  }
});

module.exports = router;
