// jobs/fetchEmailsJob.js
const { google } = require("googleapis");
const { summarizeEmail } = require("../utils/openai");
const EmailSummary = require("../models/EmailSummary");
require("dotenv").config(); // load env variables

const getEmailBody = (payload) => {
  if (!payload) return "";
  const parts = payload.parts || [payload];
  const part = parts.find(
    (p) => p.mimeType === "text/plain" || p.mimeType === "text/html"
  );
  const data = part?.body?.data || "";
  return Buffer.from(data, "base64").toString("utf-8");
};

const fetchEmailsJob = async () => {
  try {
    console.log("⏳ Cron job: Fetching important emails...");

    const accessToken = process.env.GMAIL_ACCESS_TOKEN;
    if (!accessToken) throw new Error("No access token found in .env");

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: "v1", auth });

    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 30,
      q: "is:important newer_than:30d", // only last 30 days
    });

    const messages = response.data.messages || [];

    for (let msg of messages) {
      const alreadyExists = await EmailSummary.findOne({ messageId: msg.id });
      if (alreadyExists) continue;

      const detail = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
      });

      const body = getEmailBody(detail.data.payload);

      // ✅ Keyword filter before sending to OpenAI
      if (!/assignment|deadline|meeting|exam|task/i.test(body)) continue;

      const summaryData = await summarizeEmail(body);

      const subjectHeader = detail.data.payload.headers.find(
        (h) => h.name === "Subject"
      );
      const fromHeader = detail.data.payload.headers.find(
        (h) => h.name === "From"
      );

      await EmailSummary.create({
        messageId: msg.id,
        subject: subjectHeader?.value,
        from: fromHeader?.value,
        summary: summaryData.summary || body.slice(0, 200),
        links: summaryData.links || [],
        dates: summaryData.dates || [],
        action: summaryData.action || "",
      });

      console.log(`✅ Stored summarized email: ${msg.id}`);
    }

    console.log("✅ Cron job done.");
  } catch (error) {
    console.error("❌ Error in fetchEmailsJob:", error.message);
  }
};

module.exports = fetchEmailsJob;
