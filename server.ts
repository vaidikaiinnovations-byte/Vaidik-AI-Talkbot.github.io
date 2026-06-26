import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const currentDirname = typeof __Dirname !== 'undefined'
? __dirname
: path.dirname(fileURLToPath(import.meta.URL));

const app = express();
constr PORT = process.env.PORT || 3000;
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Gemini client safely
// The API key is acquired via GEMINI_API_KEY on the server.
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is responding!", hasApiKey: !!process.env.GEMINI_API_KEY });
});
function extractErrorMessage(err: any): string {
  if (!err) return "An unknown error occurred.";
  let message = err.message || String(err);
  
  if (typeof message === "string" && message.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(message);
      if (parsed.error?.message) {
        return parsed.error.message;
      }
    } catch (e) {
      // Cannot parse, continue
    }
  }
  return message;
}

async function getGenerateContentStreamWithRetry(
  params: {
    model: string;
    contents: any;
    config: any;
  },
  maxRetries = 2
): Promise<any> {
  let attempt = 0;
  let currentModel = params.model;

  while (attempt <= maxRetries) {
    try {
      const stream = await ai.models.generateContentStream({
        model: currentModel,
        contents: params.contents,
        config: params.config,
      });
      return stream;
    } catch (err: any) {
      attempt++;
      const errMsg = err.message || String(err);
      const is503OrUnavailable = 
        errMsg.includes("503") || 
        errMsg.includes("UNAVAILABLE") || 
        errMsg.includes("high demand") ||
        err.status === 503 ||
        err.code === 503;

      if (is503OrUnavailable && attempt <= maxRetries) {
        console.warn(`[RETRY] Gemini temporary 503/UNAVAILABLE on model ${currentModel}. Waiting to retry attempt ${attempt} of ${maxRetries}...`);
        await new Promise((resolve) => setTimeout(resolve, 1200));
        
        // Final retry attempt, switch to highly available flash-lite
        if (attempt === maxRetries && currentModel !== "gemini-3.1-flash-lite") {
          console.warn(`[FALLBACK] Switching model from ${currentModel} to gemini-3.1-flash-lite for session resolution.`);
          currentModel = "gemini-3.1-flash-lite";
        }
        continue;
      }
      throw err;
    }
  }
}

// SSE Streaming Route for conversation
app.post("/api/chat", async (req, res) => {
  const { messages, systemInstruction, temperature, modelName, searchGrounding } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    res.status(500).json({ error: "GEMINI_API_KEY environment variable is not defined." });
    return;
  }

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: "Missing or invalid 'messages' parameter." });
    return;
  }

  // Set response headers for Server-Sent Events (SSE)
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Prevent buffering in nginx proxies

  try {
    // Format history for the SDK: 'user' or 'model'. 
    const formattedHistory = messages.map((msg: any) => {
      const parts: any[] = [{ text: msg.content || "" }];
      if (msg.image && msg.image.data) {
        parts.unshift({
          inlineData: {
            mimeType: msg.image.mimeType,
            data: msg.image.data
          }
        });
      }
      return {
        role: msg.role === "assistant" ? "model" : "user",
        parts
      };
    });

    // Configure search grounding tool if enabled
    const tools: any[] = [];
    if (searchGrounding) {
      tools.push({ googleSearch: {} });
    }

    const stream = await getGenerateContentStreamWithRetry({
      model: modelName || "gemini-3.5-flash",
      contents: formattedHistory,
      config: {
        systemInstruction: systemInstruction || undefined,
        temperature: temperature !== undefined ? Number(temperature) : 0.7,
        tools: tools.length > 0 ? tools : undefined,
      },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }

      // Extract search grounding metadata if available
      const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
      if (groundingMetadata) {
        res.write(`data: ${JSON.stringify({ groundingMetadata })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err: any) {
    console.error("Gemini SSE error:", err);
    const cleanMsg = extractErrorMessage(err);
    res.write(`data: ${JSON.stringify({ error: cleanMsg })}\n\n`);
    res.end();
  }
});

// Vite middleware development / Production setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite dev server middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Setting up production static file assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
