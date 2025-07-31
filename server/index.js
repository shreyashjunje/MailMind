const express = require("express");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const connectDB = require("./config/db");

// const cron = require("node-cron");
// const startCron = require("./jobs/cronRunner");

// const fetchEmailsJob = require("./jobs/fetchEmailsJob"); // You’ll create this function

require("dotenv").config();
require("./config/passport"); // ✅ Your passport setup

const authRoutes = require("./routes/auth"); // ✅ AFTER passport config
const emailRoutes = require("./routes/email");
const summaryRoutes = require("./routes/summary");
const eventsRoutes = require("./routes/events"); // ✅ Add events route

const app = express();
connectDB();
// startCron();

// app.use("/api", router); // full URL becomes /api/attachments

// ✅ Middleware
app.use(
  cors({
    origin: "http://localhost:5173", // your frontend origin
    credentials: true,
  })
);
app.use(express.json());

// ✅ Session setup - should come before passport
app.use(
  session({
    secret: "mailmind_secret", // Consider using process.env.SESSION_SECRET
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set true in production (with HTTPS)
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// ✅ Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// ✅ Routes
app.use("/auth", authRoutes);
app.use("/", emailRoutes);
app.use("/api/summaries", summaryRoutes);
app.use("/emails", summaryRoutes);
app.use("/api/events", eventsRoutes); // ✅ Add events route

// ✅ Root test route
app.get("/", (req, res) => {
  res.send("MailMind backend is running! 🚀");
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
