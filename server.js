// server.js
import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());

// Serve static frontend (optional if deploying frontend separately)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, ".")));

// Basic / health
app.get("/ping", (req, res) => res.json({ ok: true }));

// /solve endpoint
app.post("/solve", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: "No question provided" });

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) return res.status(500).json({ error: "OpenAI API key not set on server" });

    // Build prompt — keep it instructive for step-by-step answers
    const system = "You are a helpful tutor. Give clear, step-by-step answers. If it's math, show steps. If it's an essay or explanation, include concise explanation and examples where relevant.";

    const payload = {
      model: "gpt-4o-mini", // update model if desired/available
      messages: [
        { role: "system", content: system },
        { role: "user", content: question }
      ],
      temperature: 0.2,
      max_tokens: 800
    };

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error("OpenAI error:", openaiRes.status, errText);
      return res.status(500).json({ error: "OpenAI API error" });
    }

    const openaiData = await openaiRes.json();
    const answer = openaiData?.choices?.[0]?.message?.content || "";

    res.json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
