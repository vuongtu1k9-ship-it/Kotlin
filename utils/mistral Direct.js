// Direct API workaround - bypass OpenClaw formatter
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || process.env.MISTRAL_API_KEY_2;
const MODEL = process.env.MODEL || "mistral-small-latest";

async function chat(prompt) {
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${MISTRAL_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }]
    })
  });
  
  const data = await res.json();
  return data.choices?.[0]?.message?.content || data.detail || "Error";
}

module.exports = { chat };