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
// Helper to perform HTTP POST fetch requests to generic OpenAI endpoints
async function callOpenAICompatibleAPI(
  endpoint: string,
  apiKey: string,
  model: string,
  messages: any[],
  systemInstruction?: string
) {
  const requestMessages = [];
  if (systemInstruction) {
    requestMessages.push({ role: "system", content: systemInstruction });
  }
  requestMessages.push(...messages);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: requestMessages,
      max_tokens: 2048,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    let parsedErr;
    try {
      parsedErr = JSON.parse(errText);
    } catch (e) {}
    const errorDetails = parsedErr?.error?.message || errText || "HTTP Error";
    throw new Error(`${errorDetails}`);
  }

  const data: any = await response.json();
  const text = data?.choices?.[0]?.message?.content || "";
  return { text, sources: [] };
}

// Helper to perform Anthropic Claude API call
async function callAnthropicAPI(
  apiKey: string,
  model: string,
  messages: any[],
  systemInstruction?: string
) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 2048,
      system: systemInstruction,
      messages: messages.map((m: any) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content || ""
      }))
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    let parsedErr;
    try {
      parsedErr = JSON.parse(errText);
    } catch (e) {}
    const errorDetails = parsedErr?.error?.message || errText || "HTTP Error";
    throw new Error(`${errorDetails}`);
  }

  const data: any = await response.json();
  const text = data?.content?.[0]?.text || "";
  return { text, sources: [] };
}

app.post("/api/verify-key", async (req, res) => {
  try {
    const { provider, customApiKey, modelName } = req.body;
    const activeProvider = provider || "sambanova";
    const key = customApiKey?.trim() || "";

    if (activeProvider === "groq") {
      const activeKey = key || process.env.GROQ_API_KEY || "";
      if (!activeKey) {
        return res.json({ success: false, status: "untested", error: "Groq API key is not configured." });
      }
      await callOpenAICompatibleAPI(
        "https://api.groq.com/openai/v1/chat/completions",
        activeKey,
        modelName || "llama-3.1-8b-instant",
        [{ role: "user", content: "Hi" }]
      );
    } else if (activeProvider === "openai") {
      const activeKey = key || process.env.OPENAI_API_KEY || "";
      if (!activeKey) {
        return res.json({ success: false, status: "untested", error: "OpenAI API key is not configured." });
      }
      await callOpenAICompatibleAPI(
        "https://api.openai.com/v1/chat/completions",
        activeKey,
        modelName || "gpt-4o-mini",
        [{ role: "user", content: "Hi" }]
      );
    } else if (activeProvider === "deepseek") {
      const activeKey = key || process.env.DEEPSEEK_API_KEY || "";
      if (!activeKey) {
        return res.json({ success: false, status: "untested", error: "DeepSeek API key is not configured." });
      }
      await callOpenAICompatibleAPI(
        "https://api.deepseek.com/chat/completions",
        activeKey,
        modelName || "deepseek-chat",
        [{ role: "user", content: "Hi" }]
      );
    } else if (activeProvider === "anthropic") {
      const activeKey = key || process.env.ANTHROPIC_API_KEY || "";
      if (!activeKey) {
        return res.json({ success: false, status: "untested", error: "Anthropic API key is not configured." });
      }
      await callAnthropicAPI(
        activeKey,
        modelName || "claude-3-5-haiku-20241022",
        [{ role: "user", content: "Hi" }]
      );
    } else if (activeProvider === "sambanova") {
      const activeKey = key || process.env.SAMBANOVA_API_KEY || "";
      if (!activeKey) {
        return res.json({ success: false, status: "untested", error: "SambaNova API key is not configured." });
      }
      await callOpenAICompatibleAPI(
        "https://api.sambanova.ai/v1/chat/completions",
        activeKey,
        modelName || "Meta-Llama-3.3-70B-Instruct",
        [{ role: "user", content: "Hi" }]
      );
    }

    res.json({
      success: true,
      status: "valid",
      message: `${activeProvider.toUpperCase()} Key is certified and fully active!`
    });
  } catch (error: any) {
    const errMsg = String(error.message || "");
    let status = "invalid";
    
    if (errMsg.includes("leaked") || errMsg.includes("leak") || errMsg.includes("revoked") || errMsg.includes("PERMISSION_DENIED") || errMsg.includes("403")) {
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
    const { messages, systemInstruction, useSearch, modelName, provider, customApiKey } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, error: "messages array is required" });
    }

    const activeProvider = provider || "sambanova";
    const selectedModel = modelName || "Meta-Llama-3.3-70B-Instruct";
    const key = customApiKey?.trim() || "";

    // OpenAI compatible providers
    const formattedOpenAiMessages = messages.map((m: any) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "")
    }));

    if (activeProvider === "groq") {
      const activeKey = key || process.env.GROQ_API_KEY;
      if (!activeKey) {
        throw new Error("Groq API Key (GROQ_API_KEY) is not set. Please enter or paste your Groq Key in the Subu AI configuration panel.");
      }
      const data = await callOpenAICompatibleAPI(
        "https://api.groq.com/openai/v1/chat/completions",
        activeKey,
        selectedModel,
        formattedOpenAiMessages,
        systemInstruction
      );
      return res.json({ success: true, text: data.text, sources: [] });
    }

    if (activeProvider === "openai") {
      const activeKey = key || process.env.OPENAI_API_KEY;
      if (!activeKey) {
        throw new Error("OpenAI API Key (OPENAI_API_KEY) is not set. Please enter or paste your OpenAI Key in the Subu AI configuration panel.");
      }
      const data = await callOpenAICompatibleAPI(
        "https://api.openai.com/v1/chat/completions",
        activeKey,
        selectedModel,
        formattedOpenAiMessages,
        systemInstruction
      );
      return res.json({ success: true, text: data.text, sources: [] });
    }

    if (activeProvider === "deepseek") {
      const activeKey = key || process.env.DEEPSEEK_API_KEY;
      if (!activeKey) {
        throw new Error("DeepSeek API Key (DEEPSEEK_API_KEY) is not set. Please enter or paste your DeepSeek Key in the Subu AI configuration panel.");
      }
      const data = await callOpenAICompatibleAPI(
        "https://api.deepseek.com/chat/completions",
        activeKey,
        selectedModel,
        formattedOpenAiMessages,
        systemInstruction
      );
      return res.json({ success: true, text: data.text, sources: [] });
    }

    if (activeProvider === "anthropic") {
      const activeKey = key || process.env.ANTHROPIC_API_KEY;
      if (!activeKey) {
        throw new Error("Anthropic Claude API Key (ANTHROPIC_API_KEY) is not set. Please enter or paste your Anthropic Key in the Subu AI configuration panel.");
      }
      const data = await callAnthropicAPI(
        activeKey,
        selectedModel,
        formattedOpenAiMessages,
        systemInstruction
      );
      return res.json({ success: true, text: data.text, sources: [] });
    }

    if (activeProvider === "sambanova") {
      const activeKey = key || process.env.SAMBANOVA_API_KEY;
      if (!activeKey) {
        throw new Error("SambaNova API Key (SAMBANOVA_API_KEY) is not set. Please enter or paste your SambaNova Key in the Subu AI configuration panel.");
      }
      const data = await callOpenAICompatibleAPI(
        "https://api.sambanova.ai/v1/chat/completions",
        activeKey,
        selectedModel,
        formattedOpenAiMessages,
        systemInstruction
      );
      return res.json({ success: true, text: data.text, sources: [] });
    }

    throw new Error(`Unsupported provider config option: ${activeProvider}`);
  } catch (error: any) {
    console.error("Multi-Provider API Server Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An unexpected error occurred in multi-provider AI communication",
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
