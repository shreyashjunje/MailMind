// utils/fetchEmails.js
const { google } = require("googleapis");

const fetchEmailsFromLast30Days = async (auth) => {
  const gmail = google.gmail({ version: "v1", auth });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const query = `after:${Math.floor(thirtyDaysAgo.getTime() / 1000)}`;

  const res = await gmail.users.messages.list({
    userId: "me",
    q: query,
  });

  const messages = res.data.messages || [];

  const emails = await Promise.all(
    messages.map(async (message) => {
      const msg = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
      });
      return msg.data;
    })
  );

  return emails;
};

module.exports = fetchEmailsFromLast30Days;
