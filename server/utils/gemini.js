// utils/gemini.js
const axios = require("axios");

const summarizeWithGemini = async (emailBody) => {
  try {
    const prompt = `
You are an expert email summarizer.

ONLY return the key points directly, without any introduction like "Here is a summary:" or "Of course."

Remove any fluff or polite words. Return only the actionable or informative content in bullet points or concise lines.

Email content:
${emailBody}
    `;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const fullText =
      response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No summary";

    // Optional: Clean polite prefixes manually if still present
    const cleanedText = fullText.replace(/^Of course.*?:\s*/i, "").trim();

    return cleanedText;
  } catch (err) {
    console.error("Gemini error:", err.response?.data || err.message);
    return "Error generating summary";
  }
};

module.exports = { summarizeWithGemini };
