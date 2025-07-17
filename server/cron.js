// cron.js

// This is your cron runner file that will manually run the fetch job when executed

const fetchEmailsJob = require("./jobs/fetchEmailsJob");

const runCron = async () => {
  console.log("⏳ Running email fetch job manually...");
  await fetchEmailsJob();
  console.log("✅ Email fetch job completed");
  process.exit(); // Exit the process after job is done
};

runCron();
