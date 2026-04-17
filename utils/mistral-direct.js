#!/usr/bin/env node
// Mistral Direct API - bypass OpenClaw formatter
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
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    console.error(data.detail || JSON.stringify(data));
    process.exit(1);
  }
  console.log(content);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: mistral-direct.js \"prompt\"");
  process.exit(1);
}

chat(args.join(" ")).catch(e => { console.error(e); process.exit(1); });