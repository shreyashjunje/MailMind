// server/routes/auth.js
const express = require("express");
const router = express.Router();
const { google } = require("googleapis");
const oauth2Client = require("../config/googeConfig");
const passport = require("passport");
require("dotenv").config();
const jwt = require("jsonwebtoken");

let userTokens = null;


// update scope:
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

// Step 2: Handle Google callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/login`,
    session: false,
  }),
  (req, res) => {
    const user = req.user;
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=true`);
    }

    const { name, email, picture, accessToken } = user;

     // 🔐 Create JWT with user info
    const token = jwt.sign(
      {
        name,
        email,
        picture,
        accessToken, // optional: you can store this too
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    
    // res.redirect(
    //   `${process.env.FRONTEND_URL}/auth/callback?name=${encodeURIComponent(
    //     name
    //   )}&email=${encodeURIComponent(email)}&picture=${encodeURIComponent(
    //     picture
    //   )}&token=${encodeURIComponent(accessToken)}`
    // );
     // 👇 Redirect to frontend with token
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?token=${token}`
    );
  }
);

// 👉 Logout route (optional)
router.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("http://localhost:5173/");
  });
});

router.get("/emails", async (req, res) => {
  console.log("Fetching emails...");
  if (!userTokens) {
    return res.status(401).json({ error: "User not logged in" });
  }

  // Use the saved tokens to access Gmail API
  console.log(userTokens, "usertokens");

  try {
    oauth2Client.setCredentials(userTokens);
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 50,
    });

    console.log("Response-->", response.data.messages);

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

      // 🧠 New Part: Extract plain body
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

      // 🧠 Keywords in subject OR body
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
        "Airtel"
       
      ];

      const isImportant = keywords.some(
        (keyword) =>
          subject.toLowerCase().includes(keyword) ||
          body.toLowerCase().includes(keyword)
      );

      if (isImportant) {
        emails.push({ subject, from, date, body }); // Send body to frontend too
      }
    }

    res.json({ emails });
  } catch (err) {
    console.error("Failed to fetch emails:", err);
    res.status(500).json({ error: "Failed to fetch emails" });
  }
});

module.exports = router;
