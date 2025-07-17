// server/routes/auth.js
const express = require("express");
const router = express.Router();
const { google } = require("googleapis");
const oauth2Client = require("../config/googeConfig");
const passport = require("passport");
let userTokens = null;

// Step 1: Redirect to Google
// router.get("/google", (req, res) => {
//   const scopes = [
//     "https://www.googleapis.com/auth/gmail.readonly",
//     "profile",
//     "email",
//   ];
//   const url = oauth2Client.generateAuthUrl({
//     access_type: "offline",
//     scope: scopes,
//   });
//   res.redirect(url);
// });

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

// Step 2: Google redirects back here
// router.get("/google/callback", async (req, res) => {
//   const code = req.query.code;
//   const { tokens } = await oauth2Client.getToken(code);
//   oauth2Client.setCredentials(tokens);

//   // You can now fetch user profile or Gmail emails here
//   res.redirect("http://localhost:5173/auth/callback");
// });
// router.get("/google/callback", async (req, res) => {
//   const code = req.query.code;

//   try {
//     const { tokens } = await oauth2Client.getToken(code);
//     oauth2Client.setCredentials(tokens);

//     // Save tokens globally (for testing)
//     userTokens = tokens;

//     // Optional: log email
//     const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
//     const userInfo = await oauth2.userinfo.get();
//     console.log("Logged in as:", userInfo.data.email);

//     // res.redirect("http://localhost:5173/dashboard");

//     res.redirect(
//       `http://localhost:5173/auth/callback?name=${user.name}&email=${user.email}&picture=${user.picture}`
//     );
//   } catch (err) {
//     console.error("Login error:", err);
//     res.status(500).send("Google login failed");
//   }
// });

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:5173/login",
    // successRedirect: "http://localhost:5173/callback",

    // session: false,
  }),
  (req, res) => {
    // console.log("User authenticated:", req.user);
    const user = req.user;
    // console.log("User tokens:", user.tokens);

    if (!user) {
      return res.redirect("http://localhost:5173/login?error=No%20User");
    }

    const name = user.displayName;
    const email = user.emails?.[0]?.value;
    const picture = user.photos?.[0]?.value;
    const token = user.accessToken;

    console.log("token->", token);
   

    // You might want to send token to frontend too (for fetching Gmail data)
    res.redirect(
      `http://localhost:5173/auth/callback?name=${encodeURIComponent(
        name
      )}&email=${encodeURIComponent(email)}&picture=${encodeURIComponent(
        picture
      )}&token=${encodeURIComponent(token)}`
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
