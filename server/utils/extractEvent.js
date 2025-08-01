// utils/extractEvent.js
const chrono = require("chrono-node");

/**
 * Returns a candidate event if the email contains something schedulable.
 * Supports interviews, deadlines/assignments, meetings, reminders, exams, etc.
 */
function extractInterviewEvent(emailSummary) {
  const subject = emailSummary.subject || "";
  const body = emailSummary.body || emailSummary.originalBody || "";
  const text = `${subject}\n${body}`;
  const lower = text.toLowerCase();

  // Keywords and heuristics for different event types
  const typeMap = [
    { regex: /(interview|technical interview|call)/, type: "interview", priority: "high" },
    { regex: /\b(meeting)\b/, type: "meeting", priority: "medium" },
    { regex: /(deadline|due|submission|assignment)/, type: "reminder", priority: "high" },
    { regex: /\b(exam|test)\b/, type: "reminder", priority: "high" },
    { regex: /\b(schedule|event)\b/, type: "appointment", priority: "low" },
  ];

  // Determine if email has any of the interest keywords
  const matched = typeMap.find((m) => m.regex.test(lower));
  if (!matched) return null; // nothing worth extracting

  // Parse dates with chrono, preferring future dates
  const parsed = chrono.parse(text, new Date(), { forwardDate: true });
  if (!parsed || parsed.length === 0) return null;

  const now = new Date();
  const candidate = parsed.find((p) => p.start && p.start.date() > now) || parsed[0];
  if (!candidate || !candidate.start) return null;

  const start = candidate.start.date();
  const end = candidate.end ? candidate.end.date() : new Date(start.getTime() + 60 * 60 * 1000); // default 1h

  // Build title fallback: for assignment/deadline use subject or infer
  let title = subject || "Event";
  if (matched.type === "reminder" && /assignment/i.test(lower)) {
    title = "Assignment deadline";
  } else if (matched.type === "reminder" && /exam|test/i.test(lower)) {
    title = "Exam / Test";
  }

  return {
    title,
    start,
    end,
    type: matched.type,
    priority: matched.priority,
    location: "", // could attempt to extract later
    description: emailSummary.summary || "",
    sourceEmailId: emailSummary.emailId,
  };
}

module.exports = { extractInterviewEvent };
