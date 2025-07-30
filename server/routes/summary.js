const express = require("express");
const router = express.Router();
const EmailSummary = require("../models/EmailSummary");
const verifyJWT = require("../middlewares/verifyJWT");
const User = require("../models/User");

// ✅ GET /emails/summaries
router.get("/summaries", verifyJWT, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const user = await User.findOne({ email: userEmail });

    const hiddenSenders = user?.lowPrioritySenders || [];

    const summaries = await EmailSummary.find({
      userEmail,
      from: { $nin: hiddenSenders }, // exclude hidden senders
    }).sort({ date: -1 }); // sort by date desc

    res.json({ summaries });
  } catch (err) {
    console.error("Error fetching summaries:", err);
    res.status(500).json({ error: "Failed to fetch summaries" });
  }
});

// routes/emailRoutes.js or userRoutes.js

router.post("/hide-sender", verifyJWT, async (req, res) => {
  const userEmail = req.user.email;
  const { sender } = req.body;

  if (!sender) return res.status(400).json({ error: "Sender email required" });

  try {
    await User.findOneAndUpdate(
      { email: userEmail },
      { $addToSet: { lowPrioritySenders: sender } }
    );
    res.json({ message: "Sender marked as low priority." });
  } catch (err) {
    console.error("❌ Error hiding sender:", err.message);
    res.status(500).json({ error: "Internal error" });
  }
});

// ⭐ Toggle star
router.post("/star/:id", verifyJWT, async (req, res) => {
  const id = req.params.id;
  try {
    const email = await EmailSummary.findById(id);
    if (!email) return res.status(404).json({ error: "Email not found" });

    email.starred = !email.starred;
    await email.save();

    res.json({ message: "Star toggled", starred: email.starred });
  } catch (err) {
    console.error("Toggle star failed:", err);
    res.status(500).json({ error: "Failed to toggle star" });
  }
});

// 🔍 Search summaries
router.get("/search", verifyJWT, async (req, res) => {
  const query = req.query.q;
  const userEmail = req.user.email;

  if (!query) return res.status(400).json({ error: "Query missing" });

  try {
    const summaries = await EmailSummary.find({ userEmail });

    const results = summaries.filter(
      (item) =>
        item.subject.toLowerCase().includes(query.toLowerCase()) ||
        item.summary.toLowerCase().includes(query.toLowerCase())
    );

    res.json({ results });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

// GET /summaries?email=user@example.com
router.get("/", async (req, res) => {
  const userEmail = req.query.email;
  if (!userEmail) {
    return res.status(400).json({ error: "Email required" });
  }

  try {
    const summaries = await EmailSummary.find({ userEmail }).sort({ date: -1 });
    res.json({ summaries });
  } catch (err) {
    console.error("Error fetching summaries:", err);
    res.status(500).json({ error: "Failed to fetch summaries" });
  }
});

module.exports = router;
