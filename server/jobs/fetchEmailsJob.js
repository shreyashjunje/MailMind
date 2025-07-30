const cron = require("node-cron");
const fetchEmailsJob = require("./fetchEmailsJob"); // your job logic

module.exports = () => {
  // Runs every 15 minutes
  cron.schedule("*/15 * * * *", () => {
    console.log("[Cron] Checking for new emails at", new Date().toISOString());
    fetchEmailsJob();
  }, {
    timezone: "Asia/Kolkata"
  });
};
