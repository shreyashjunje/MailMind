const chrono = require('chrono-node');

function extractInterviewEvent(emailSummary) {
  const text = `${emailSummary.subject || ''}\n${emailSummary.body || emailSummary.originalBody || ''}`;
  const lower = text.toLowerCase();

  if (!/(interview|technical interview|call|meeting)/.test(lower)) return null;

  const parsed = chrono.parse(text, new Date(), { forwardDate: true });
  if (!parsed || parsed.length === 0) return null;

  const now = new Date();
  const candidate = parsed.find(p => p.start && p.start.date() > now) || parsed[0];
  const start = candidate.start.date();
  const end = candidate.end ? candidate.end.date() : new Date(start.getTime() + 60 * 60 * 1000); // 1h default

  return {
    title: emailSummary.subject || 'Interview',
    start,
    end,
    type: 'interview',
    priority: 'high',
    location: '', // optional enhancement later
    description: emailSummary.summary || '',
    sourceEmailId: emailSummary.emailId,
  };
}

module.exports = { extractInterviewEvent };
