// utils/normalize.js
// Normalize payload to ensure clean string output
// Prevents [object Object] and other implicit type coercion issues

const content = (clean) => clean?.replace(/\[object Object\]+/g, "")?.replace(/~/g, "")?.replace(/@/g, "")?.replace(/#/g, "")?.replace(/\$/g, "")?.replace(/\^/g, "")?.replace(/_/g, "")?.replace(/HEARTBEAT_OK/g, "")?.trim() ?? "";

function normalizePayload(p, depth = 0) {
  if (depth > 10) return "";
  if (!p) return "";
  if (p === "HEARTBEAT_OK") return "";
  if (typeof p === "string") return content(p);
  if (typeof p === "number" || typeof p === "boolean") return String(p);

  if (typeof p === "object") {
    if (p.type === "heartbeat") return "";
    const text = p.text ?? p.message ?? p.data ?? p.content;
    if (text) return normalizePayload(text, depth + 1);

    try {
      return content(JSON.stringify(p));
    } catch (e) {
      return "";
    }
  }

  return content(String(p));
}

module.exports = { normalizePayload };