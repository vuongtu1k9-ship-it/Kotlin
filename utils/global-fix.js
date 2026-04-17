// Global output fix - Prevents [object Object] in all outputs
// This file should be loaded first in any agent session

const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// 🚨 Output Guard - Block [object Object] and bad patterns
function cleanContent(str) {
  if (!str) return "";
  const cleaned = String(str)
    .replace(/\[object Object\]+/g, "")
    .replace(/\[[\]]/g, "")
    .replace(/HEARTBEAT_OK/g, "")
    .replace(/\s+/g, " ")
    .trim();
  // Reject if still dirty
  return cleaned.includes("[object Object]") ? "" : cleaned;
}

function safeStringify(val, depth = 0) {
  if (depth > 10) return "[circular]";
  if (val === null || val === undefined) return "";
  if (val === "HEARTBEAT_OK") return "";
  if (typeof val === "string") return cleanContent(val);
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (Array.isArray(val)) return val.map(v => safeStringify(v, depth + 1)).filter(Boolean).join("");
  if (typeof val === "object") {
    if (val.type === "heartbeat") return "";
    if (val.text) return safeStringify(val.text, depth + 1);
    if (val.message) return safeStringify(val.message, depth + 1);
    if (val.data) return safeStringify(val.data, depth + 1);
    if (val.content) return safeStringify(val.content, depth + 1);
    try {
      return cleanContent(JSON.stringify(val));
    } catch {
      return "";
    }
  }
  return cleanContent(String(val));
}

function cleanStringify(...args) {
  return args
    .map(arg => safeStringify(arg))
    .filter(s => s && s.trim())
    .join(" ");
}

console.log = function(...args) {
  const output = cleanStringify(...args);
  if (output) originalConsoleLog(output);
};

console.error = function(...args) {
  const output = cleanStringify(...args);
  if (output) originalConsoleError(output);
};

module.exports = { safeStringify, cleanStringify };