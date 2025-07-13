const express = require("express");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
require("dotenv").config();
require("./config/passport"); // ✅ Your passport setup

const authRoutes = require('./routes/auth'); // ✅ AFTER passport config

const app = express();

// ✅ Middleware
app.use(cors({
  origin: "http://localhost:5173", // your frontend origin
  credentials: true,
}));
app.use(express.json());

// ✅ Session setup - should come before passport
app.use(session({
  secret: "mailmind_secret", // You can move to .env for safety
  resave: false,
  saveUninitialized: true,
}));

// ✅ Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// ✅ Routes
app.use("/auth", authRoutes);

// ✅ Root test route
app.get("/", (req, res) => {
  res.send("MailMind backend is running! 🚀");
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
