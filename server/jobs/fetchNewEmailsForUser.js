// jobs/fetchNewEmailsForUser.js
const { google } = require("googleapis");
const EmailSummary = require("../models/EmailSummary");
const { summarizeWithGemini } = require("../utils/gemini");
const { htmlToText } = require("html-to-text");

const createOAuthClient = require('../config/googeConfig');
const oauth2Client = createOAuthClient();

const fetchNewEmailsForUser = async (accessToken, userEmail) => {
  if (!accessToken || !userEmail) throw new Error("Missing accessToken/email");

  oauth2Client.setCredentials({ access_token: accessToken });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const res = await gmail.users.messages.list({
    userId: "me",
    maxResults: 10,
  });

  const messages = res.data.messages || [];
  const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  for (const msg of messages) {
    const msgDetail = await gmail.users.messages.get({
      userId: "me",
      id: msg.id,
    });

    const headers = msgDetail.data.payload.headers;
    const subject = headers.find((h) => h.name === "Subject")?.value || "";
    const from = headers.find((h) => h.name === "From")?.value || "";
    const dateStr = headers.find((h) => h.name === "Date")?.value || "";
    const date = new Date(dateStr);

    if (date < oneMonthAgo) continue;

    const exists = await EmailSummary.findOne({ emailId: msg.id });
    if (exists) continue;

    // extract body (handle html/plain)
    let body = "";
    const getText = (payload) => {
      if (payload.mimeType === "text/plain" && payload.body?.data) {
        return Buffer.from(payload.body.data, "base64").toString("utf-8");
      }
      if (payload.mimeType === "text/html" && payload.body?.data) {
        return htmlToText(
          Buffer.from(payload.body.data, "base64").toString("utf-8")
        );
      }
      if (payload.parts) {
        for (let part of payload.parts) {
          const text = getText(part);
          if (text) return text;
        }
      }
      return "";
    };
    body = getText(msgDetail.data.payload);

    // check importance
    const keywords = [
      "meeting", "exam", "deadline", "assignment", "interview", "form", "link",
    ];
    const isImportant = keywords.some(
      (k) =>
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

  console.log(`✅ Fetched emails for ${userEmail}`);
};

module.exports = fetchNewEmailsForUser;
