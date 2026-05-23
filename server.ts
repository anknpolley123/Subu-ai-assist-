import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Parse JSON bodies with custom limit
app.use(express.json({ limit: "15mb" }));

// Initialize GoogleGenAI client dynamically or fallback to lazy initialized background workspace key
let aiClient: GoogleGenAI | null = null;

function getAiClient(customKey?: string): GoogleGenAI {
  if (customKey && customKey.trim()) {
    return new GoogleGenAI({
      apiKey: customKey.trim(),
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build-override",
        },
      },
    });
  }

  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not set. Please add it via Settings > Secrets panel in AI Studio.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API Routes
app.post("/api/verify-key", async (req, res) => {
  try {
    const { customApiKey } = req.body;
    const ai = getAiClient(customApiKey);
    
    // Perform a tiny quick confirmation call to verify token readiness
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Hi",
      config: {
        maxOutputTokens: 2,
      }
    });

    res.json({
      success: true,
      status: "valid",
      message: "API key is fully active and synchronized!"
    });
  } catch (error: any) {
    const errMsg = String(error.message || "");
    let status = "invalid";
    
    if (errMsg.includes("leaked") || errMsg.includes("leak") || errMsg.includes("revoked") || errMsg.includes("PERMISSION_DENIED")) {
      status = "leaked";
    }

    res.json({
      success: false,
      status,
      error: errMsg
    });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { messages, systemInstruction, useSearch, modelName, customApiKey } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, error: "messages array is required" });
    }

    // Format the messages to match expected Gemini types exactly:
    // { role: "user" | "model", parts: [{ text: string }] }
    const formattedMessages = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: Array.isArray(m.parts) ? m.parts : [{ text: String(m.content || m.text || "") }],
    }));

    const selectedModel = modelName || "gemini-3.5-flash";
    const ai = getAiClient(customApiKey);

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: formattedMessages,
      config: {
        systemInstruction: systemInstruction || "You are a helpful, friendly, and extremely capable AI assistant. Answer the user's questions clearly, accurately, and with excellent layout and markdown format.",
        tools: useSearch ? [{ googleSearch: {} }] : undefined,
      },
    });

    const text = response.text || "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    // Extract search query details or grounding resources
    const webSources = groundingChunks
      .map((chunk: any) => ({
        title: chunk.web?.title || chunk.maps?.title || "Web Search Detail",
        uri: chunk.web?.uri || chunk.maps?.uri || "",
      }))
      .filter((item: any) => item.uri);

    res.json({
      success: true,
      text,
      sources: webSources,
    });
  } catch (error: any) {
    console.error("Gemini Server Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An unexpected error occurred in Gemini API communication",
    });
  }
});

// Serving built files or proxying source code with Vite middleware
const isProd = process.env.NODE_ENV === "production";

async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running in ${isProd ? "production" : "development"} mode on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
});
