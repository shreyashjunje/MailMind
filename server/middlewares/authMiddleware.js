// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: missing token" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: malformed header" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload?.email) {
      return res.status(401).json({ message: "Unauthorized: invalid token payload" });
    }

    const user = await User.findOne({ email: payload.email });
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: user not found" });
    }

    req.user = user; // full Mongoose user doc (with tokens, etc.)
    next();
  } catch (err) {
    console.error("Authentication middleware error:", err);
    // Distinguish expired vs other errors if you want more granularity
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

module.exports = authenticate;
