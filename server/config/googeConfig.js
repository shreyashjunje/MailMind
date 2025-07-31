// const { google } = require("googleapis");
// require("dotenv").config();

// const oauth2Client = new google.auth.OAuth2(
//   process.env.GOOGLE_CLIENT_ID,
//   process.env.GOOGLE_CLIENT_SECRET,
//   process.env.GOOGLE_REDIRECT_URI
// );

// module.exports = oauth2Client;

const { google } = require("googleapis");
require("dotenv").config();

function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI // e.g., `${process.env.BACKEND_URL}/auth/google/callback`
  );
}

module.exports = createOAuthClient;
