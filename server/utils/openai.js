const { OpenAI } = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function summarizeEmail(body) {
  const prompt = `
You are a helpful assistant. Read the following email and extract useful information in this JSON format:

{
  "summary": "short overview of email",
  "links": ["any link found"],
  "dates": ["any deadline, exam date, etc."],
  "action": "any task user must take"
}

Email:
${body}
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const result = response.choices[0].message.content;

    // Try parsing as JSON
    try {
      return JSON.parse(result);
    } catch (jsonError) {
      return { summary: result }; // fallback if JSON parsing fails
    }
  } catch (error) {
    console.error("OpenAI Error:", error);
    return { summary: "Could not summarize due to AI error." };
  }
}

module.exports = { summarizeEmail };
