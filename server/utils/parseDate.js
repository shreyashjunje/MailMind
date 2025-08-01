// utils/parseDate.js
const { parse, isValid } = require("date-fns");

/**
 * Try common date formats in a sensible order, prioritizing dd/MM/yyyy.
 * Returns a Date or null.
 */
function smartParseDate(str) {
  if (!str || typeof str !== "string") return null;
  const cleaned = str.trim();

  const tryFormats = [
    "dd/MM/yyyy", // Indian / day-first e.g., 12/08/2025 -> 12 Aug 2025
    "d/M/yyyy",
    "MM/dd/yyyy", // fallback US
    "M/d/yyyy",
    "yyyy-MM-dd", // ISO
  ];

  for (const fmt of tryFormats) {
    const dt = parse(cleaned, fmt, new Date());
    if (isValid(dt)) {
      return dt;
    }
  }

  // Last resort: built-in Date (can be ambiguous)
  const native = new Date(cleaned);
  if (isValid(native)) return native;

  return null;
}

module.exports = { smartParseDate };
