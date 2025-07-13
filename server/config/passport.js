const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,       // from Google Console
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",         // or full URL if deploying
    },
    (accessToken, refreshToken, profile, done) => {
      // You can save the user to DB here
      return done(null, profile); // pass profile to next step
    }
  )
);

// Required to support session-based login (even if you're not using sessions now)
passport.serializeUser((user, done) => {
  done(null, user); // Store the whole user object (or just id)
});

passport.deserializeUser((obj, done) => {
  done(null, obj); // Retrieve user
});
