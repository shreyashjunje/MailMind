const router = require("express").Router();
const { google } = require("googleapis");
const EmailSummary = require("../models/EmailSummary");
const { summarizeEmail } = require("../utils/openai");
const isAuthenticated = require("../middlewares/isAuthenticated");
const quotedPrintable = require("quoted-printable");
const fetchEmailsFromLast30Days = require("../utils/fetchEmails");


// Extract both plain text and HTML content from email
// const extractContent = (payload) => {
//   let plainText = "";
//   let htmlContent = "";

//   const processParts = (part) => {
//     if (!part) return;

//     if (part.mimeType === "text/plain" && part.body?.data) {
//       plainText += Buffer.from(part.body.data, "base64").toString("utf-8");
//     } else if (part.mimeType === "text/html" && part.body?.data) {
//       htmlContent += Buffer.from(part.body.data, "base64").toString("utf-8");
//     }

//     if (part.parts && Array.isArray(part.parts)) {
//       part.parts.forEach(processParts);
//     }
//   };

//   processParts(payload);
//   return { plainText, htmlContent };
// };
const extractContent = (payload) => {
  let plainText = "";
  let htmlContent = "";

  const processPart = (part) => {
    if (!part) return;

    const mimeType = part.mimeType;
    const body = part.body || {};
    let data = body.data;

    if (data) {
      // Decode Base64 first
      data = Buffer.from(data, "base64").toString("utf-8");

      // If it looks like quoted-printable, decode it
      if (
        data.includes("=3D") ||
        data.includes("=C2") ||
        data.includes("=E2")
      ) {
        data = quotedPrintable.decode(data);
      }
    }

    if (mimeType === "text/plain") {
      plainText += data || "";
    } else if (mimeType === "text/html") {
      htmlContent += data || "";
    }

    if (part.parts) {
      part.parts.forEach(processPart);
    }
  };

  processPart(payload);

  return { plainText: plainText.trim(), htmlContent: htmlContent.trim() };
};

// Convert HTML to clean text
const htmlToText = (html) => {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

// Return searchable text
const getSearchableText = ({ plainText, htmlContent }) => {
  if (plainText) return plainText.toLowerCase();
  if (htmlContent) return htmlToText(htmlContent).toLowerCase();
  return "";
};

// Keywords to detect important emails
const IMPORTANT_KEYWORDS = [
  "assignment",
  "deadline",
  "meeting",
  "exam",
  "interview",
  "project",
  "submission",
  "call",
  "netflix",
  "airtel",
  "invited",
  "password",
  "task",
  "job",
  "pw",
  "reset",
  "mba",
  "OTP",
];

// Check for important keywords
const isImportantEmail = (text) =>
  IMPORTANT_KEYWORDS.some((keyword) => text.includes(keyword.toLowerCase()));

// Extract basic headers
const extractHeaders = (headers) => {
  const get = (name) =>
    headers.find((h) => h.name === name)?.value || `No ${name}`;
  return {
    subject: get("Subject"),
    from: get("From"),
    date: get("Date"),
  };
};

router.get("/emails", isAuthenticated, async (req, res) => {
  try {
    // console.log("🔐 Authenticated user:", req.user);

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: req.user.accessToken });

    const gmail = google.gmail({ version: "v1", auth });

    const date = new Date();
    date.setDate(date.getDate() - 30);
    const afterDate = date.toISOString().split("T")[0];

    // console.log("📅 Fetching emails after:", afterDate);

    const { data } = await gmail.users.messages.list({
      userId: "me",
      maxResults: 10, // reduce for testing
      q: `after:${afterDate}`,
    });

    const messages = data.messages || [];
    // console.log(`📨 Total messages fetched: ${messages.length}`);

    const result = [];

    for (const msg of messages) {
      // console.log("🔍 Checking email:", msg.id);

      const exists = await EmailSummary.findOne({ emailId: msg.id });
      if (exists) {
        // console.log("✅ Already summarized:", msg.id);
        result.push(exists);
        continue;
      }

      const { data: fullMsg } = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
      });

      const payload = fullMsg.payload || {};
      const headers = extractHeaders(payload.headers || []);
      const content = extractContent(payload);
      const searchable = getSearchableText(content);

      if (!searchable) {
        // console.log("⚠️ No searchable content found, skipping:", msg.id);
        continue;
      }

      if (!isImportantEmail(searchable)) {
        // console.log("⏭️ Not important:", headers.subject);
        continue;
      }

      // console.log("🧠 Summarizing important email:", headers.subject);

      let summaryRes;
      try {
        summaryRes = await summarizeEmail(searchable);
      } catch (err) {
        console.error("❌ summarizeEmail failed:", err.message);
        continue;
      }

      // const summaryDoc = new EmailSummary({
      //   emailId: msg.id,
      //   subject: headers.subject,
      //   from: headers.from,
      //   date: headers.date,
      //   summary: summaryRes.summary || searchable.slice(0, 300),
      //   links: summaryRes.links || [],
      //   dates: summaryRes.dates || [],
      //   action: summaryRes.action || "",
      //   rawHtml: content.htmlContent,
      // });

      // await summaryDoc.save();
      // result.push(summaryDoc);
      await EmailSummary.updateOne(
        { emailId: msg.id },
        {
          $setOnInsert: {
            subject: headers.subject,
            from: headers.from,
            date: headers.date,
            summary: summaryRes.summary || searchable.slice(0, 300),
            links: summaryRes.links || [],
            dates: summaryRes.dates || [],
            action: summaryRes.action || "",
            rawHtml: content.htmlContent,
          },
        },
        { upsert: true }
      );

      const saved = await EmailSummary.findOne({ emailId: msg.id });
      result.push(saved);
      // console.log("✅ Email saved:", msg.id);
    }

    res.json(result);
  } catch (error) {
    // console.error("❌ API Error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
});

router.get("/attachments", isAuthenticated, async (req, res) => {
  try {
    const auth = req.user.authClient; // or however you're storing the OAuth client
    const emails = await fetchEmailsFromLast30Days(auth);
    res.status(200).json({ success: true, emails });
  } catch (error) {
    console.error("Error fetching emails:", error);
    res.status(500).json({ success: false, message: "Failed to fetch emails." });
  }
});

module.exports = router;
