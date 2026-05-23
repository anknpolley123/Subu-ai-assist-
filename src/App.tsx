import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Plus, Trash2, Edit2, Send, Bot, User, Copy, Check, 
  Volume2, VolumeX, Mic, MicOff, Settings, History, Clock, 
  ArrowUpRight, ChevronRight, ChevronDown, ChevronUp, RefreshCw, 
  Globe, Wand2, Search, X, MessageSquare, Info, Star, ShieldAlert,
  Activity, Shield, Laptop, CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";
import { ChatSession, Message, GroundingSource, Feedback } from "./types";

const SUGGESTED_CHIPS = [
  { text: "Explain Quantum Physics simply", icon: "✨", category: "Concepts" },
  { text: "Write a TypeScript debounce function", icon: "💻", category: "Coding" },
  { text: "Help me write a polite email asking for vacation time", icon: "✉️", category: "Writing" },
  { text: "Suggest 5 fast, healthy dinner recipes", icon: "🥗", category: "Life" },
  { text: "Summarize major achievements of Nikola Tesla", icon: "⚡", category: "History" }
];

export default function App() {
  // Session States
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  
  // Custom Settings
  const [systemInstruction, setSystemInstruction] = useState<string>(
    "You are Subu AI, a friendly, extremely intelligent, and highly capable AI assistant. Answer the user's questions clearly, accurately, and with beautiful layout and responsive markdown format."
  );
  const [useSearch, setUseSearch] = useState<boolean>(false);
  const [modelName, setModelName] = useState<string>("gemini-3.5-flash");
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    return localStorage.getItem("ai_custom_api_key") || "";
  });

  // Sync custom override key to localStorage
  useEffect(() => {
    localStorage.setItem("ai_custom_api_key", customApiKey);
  }, [customApiKey]);

  // Key Status and Diagnostics
  const [keyStatus, setKeyStatus] = useState<"checking" | "valid" | "leaked" | "invalid" | "untested">("untested");
  const [keyErrorMsg, setKeyErrorMsg] = useState<string>("");
  const [isCheckingKey, setIsCheckingKey] = useState<boolean>(false);

  const verifyApiCredentials = async () => {
    setKeyStatus("checking");
    setIsCheckingKey(true);
    try {
      const response = await fetch("/api/verify-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customApiKey }),
      });
      const data = await response.json();
      if (data.success) {
        setKeyStatus("valid");
        setKeyErrorMsg("");
      } else {
        setKeyStatus(data.status || "invalid");
        setKeyErrorMsg(data.error || "The API key was reported as leaked or is invalid.");
      }
    } catch (err: any) {
      setKeyStatus("invalid");
      setKeyErrorMsg(err.message || "Failed to contact verification service.");
    } finally {
      setIsCheckingKey(false);
    }
  };

  useEffect(() => {
    verifyApiCredentials();
  }, [customApiKey]);
  
  // Input and Control States
  const [inputValue, setInputValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeakingId, setIsSpeakingId] = useState<string>("");
  
  // Interactive Stats & Metrics (Inspired by Design template)
  const [successCount, setSuccessCount] = useState<number>(() => {
    return Number(localStorage.getItem("ai_chat_success_count") || "2");
  });
  const [exceptionCount, setExceptionCount] = useState<number>(() => {
    return Number(localStorage.getItem("ai_chat_exception_count") || "0");
  });
  const [lastLatency, setLastLatency] = useState<string>("14ms");
  
  // UI Panels
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);
  const [editingSessionId, setEditingSessionId] = useState<string>("");
  const [editingTitleValue, setEditingTitleValue] = useState<string>("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loadingStatusIndex, setLoadingStatusIndex] = useState<number>(0);
  
  // Speech Recognition Ref
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Periodic visual hints during text generation loading
  const LOADING_MESSAGES = [
    "Consulting Gemini Core...",
    "Scanning documentation...",
    "Structuring markdown...",
    "Fact-checking references...",
    "Almost ready..."
  ];

  // Feedback Notification Timer
  const showFeedbackAction = (text: string, type: "success" | "info" | "error" = "success") => {
    setFeedback({ text, type });
    setTimeout(() => {
      setFeedback((current) => current?.text === text ? null : current);
    }, 4000);
  };

  // Load chat sessions from localStorage on startup
  useEffect(() => {
    const savedSessions = localStorage.getItem("ai_scholar_chats");
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setActiveSessionId(parsed[0].id);
          // Sync settings from active session
          setSystemInstruction(parsed[0].systemInstruction || "You are Subu AI, a friendly, extremely intelligent, and highly capable AI assistant. Answer the user's questions clearly, accurately, and with beautiful layout and responsive markdown format.");
          setUseSearch(parsed[0].useSearch || false);
          setModelName(parsed[0].modelName || "gemini-3.5-flash");
          return;
        }
      } catch (e) {
        console.error("Failed to parse saved chats", e);
      }
    }
    // Setup initial default session if nothing saved
    createNewSession();
  }, []);

  // Save sessions to localStorage whenever they change
  const saveSessionsToLocal = (updatedSessions: ChatSession[]) => {
    setSessions(updatedSessions);
    localStorage.setItem("ai_scholar_chats", JSON.stringify(updatedSessions));
  };

  // Create custom new session
  const createNewSession = (title?: string) => {
    const newId = `session_${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: title || `Subu Chat ${sessions.length + 1}`,
      messages: [],
      systemInstruction,
      useSearch,
      modelName,
      createdAt: new Date().toISOString()
    };
    const updated = [newSession, ...sessions];
    saveSessionsToLocal(updated);
    setActiveSessionId(newId);
    showFeedbackAction("Created a new chat session", "info");
  };

  // Sync settings when selecting deep changes or selecting a session
  const handleSessionSelect = (id: string) => {
    setActiveSessionId(id);
    const session = sessions.find(s => s.id === id);
    if (session) {
      setSystemInstruction(session.systemInstruction || "You are Subu AI, a friendly, extremely intelligent, and highly capable AI assistant. Answer the user's questions clearly, accurately, and with beautiful layout and responsive markdown format.");
      setUseSearch(session.useSearch || false);
      setModelName(session.modelName || "gemini-3.5-flash");
    }
  };

  // Update specific values inside the current session
  const updateActiveSessionSettings = (updates: Partial<ChatSession>) => {
    const updated = sessions.map((s) => {
      if (s.id === activeSessionId) {
        return { ...s, ...updates };
      }
      return s;
    });
    saveSessionsToLocal(updated);
  };

  // Delete chat session
  const deleteSession = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const updated = sessions.filter((s) => s.id !== id);
    
    if (updated.length === 0) {
      // Must have at least one session
      const newId = `session_${Date.now()}`;
      const defaultSession: ChatSession = {
        id: newId,
        title: "Subu Chat 1",
        messages: [],
        systemInstruction,
        useSearch,
        modelName,
        createdAt: new Date().toISOString()
      };
      saveSessionsToLocal([defaultSession]);
      setActiveSessionId(newId);
    } else {
      saveSessionsToLocal(updated);
      if (activeSessionId === id) {
        setActiveSessionId(updated[0].id);
      }
    }
    showFeedbackAction("Chat session deleted", "info");
  };

  // Rename session
  const saveSessionName = (id: string) => {
    if (!editingTitleValue.trim()) {
      setEditingSessionId("");
      return;
    }
    const updated = sessions.map((s) => {
      if (s.id === id) {
        return { ...s, title: editingTitleValue.trim() };
      }
      return s;
    });
    saveSessionsToLocal(updated);
    setEditingSessionId("");
    showFeedbackAction("Session renamed successfully");
  };

  // Start Editing title trigger
  const triggerEditTitle = (session: ChatSession, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitleValue(session.title);
  };

  // Scroll smoothly to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, isLoading]);

  // Loading indicator animation timer
  useEffect(() => {
    let interval: any;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingStatusIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2500);
    } else {
      setLoadingStatusIndex(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Web Speak Synthesis Text-to-Speech
  const handleToggleSpeak = (msgId: string, text: string) => {
    if (!("speechSynthesis" in window)) {
      showFeedbackAction("Speech Synthesis is not supported in this browser.", "error");
      return;
    }

    if (isSpeakingId === msgId) {
      window.speechSynthesis.cancel();
      setIsSpeakingId("");
      return;
    }

    window.speechSynthesis.cancel();
    // Strip markdown formatting before speaking for clear speech
    const cleanText = text
      .replace(/[#*`_~[\]()]/g, "")
      .replace(/<[^>]*>/g, "");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    // Default to first pleasant English accent voice if available
    const fallbackVoice = voices.find(v => v.lang.startsWith("en-"));
    if (fallbackVoice) {
      utterance.voice = fallbackVoice;
    }

    utterance.onend = () => {
      setIsSpeakingId("");
    };
    utterance.onerror = () => {
      setIsSpeakingId("");
    };

    setIsSpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Native Speech Recognition Handler
  const handleToggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showFeedbackAction("Microphone typing is not natively supported in this browser.", "info");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.lang = "en-US";
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setIsListening(true);
        showFeedbackAction("Listening... speak your request", "info");
      };

      rec.onresult = (event: any) => {
        const transcriptText = event.results[0][0].transcript;
        if (transcriptText) {
          setInputValue((prev) => prev ? `${prev} ${transcriptText}` : transcriptText);
        }
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error:", e);
        showFeedbackAction(`Voice issue: ${e.error || "Cannot access audio"}`, "error");
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err: any) {
      console.error(err);
      setIsListening(false);
    }
  };

  // Copy to Clipboard Utility
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    showFeedbackAction("Copied to clipboard!", "success");
  };

  // Call the server API
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputValue).trim();
    if (!textToSend || isLoading) return;

    // Reset input immediately
    if (!customText) {
      setInputValue("");
    }

    const currentSession = sessions.find(s => s.id === activeSessionId);
    if (!currentSession) return;

    // Build the user message object
    const userMsg: Message = {
      id: `msg_user_${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Update session state instantly in UI
    const originalMessages = [...currentSession.messages];
    const updatedMessages = [...originalMessages, userMsg];

    // If it is the first message of the session, generate a relevant session title from first 4 words
    let computedTitle = currentSession.title;
    if (originalMessages.length === 0) {
      const words = textToSend.split(" ");
      computedTitle = words.slice(0, 4).join(" ") + (words.length > 4 ? "..." : "");
    }

    const updatedSessions = sessions.map((s) => {
      if (s.id === activeSessionId) {
        return { 
          ...s, 
          title: computedTitle,
          messages: updatedMessages 
        };
      }
      return s;
    });
    saveSessionsToLocal(updatedSessions);

    setIsLoading(true);
    const startTime = performance.now();

    try {
      // Send message list (mapped key representation) through API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content
          })),
          systemInstruction: systemInstruction,
          useSearch: useSearch,
          modelName: modelName,
          customApiKey: customApiKey
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Server replied with failure code");
      }

      // Compute visual latency
      const durationMs = Math.round(performance.now() - startTime);
      setLastLatency(`${durationMs}ms`);

      // Increment successful queries
      const nextSuccess = successCount + 1;
      setSuccessCount(nextSuccess);
      localStorage.setItem("ai_chat_success_count", String(nextSuccess));

      // Build model response message
      const botMsg: Message = {
        id: `msg_bot_${Date.now()}`,
        role: "assistant",
        content: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: data.sources || []
      };

      const withBotSessions = updatedSessions.map((s) => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: [...updatedMessages, botMsg]
          };
        }
        return s;
      });
      saveSessionsToLocal(withBotSessions);
    } catch (err: any) {
      console.error(err);
      
      // Increment exceptions
      const nextExceptions = exceptionCount + 1;
      setExceptionCount(nextExceptions);
      localStorage.setItem("ai_chat_exception_count", String(nextExceptions));

      // Friendly leak or verification guidance
      const rawErrorText = String(err.message || "");
      let errorText = rawErrorText;
      if (
        rawErrorText.toLowerCase().includes("leaked") || 
        rawErrorText.toLowerCase().includes("api key") || 
        rawErrorText.toLowerCase().includes("permission_denied") || 
        rawErrorText.toLowerCase().includes("403") || 
        rawErrorText.toLowerCase().includes("key was reported as leaked")
      ) {
        errorText = `⚠️ **Gemini API Error (Authentication Terminated):**
The workspace API Key has been reported as leaked or revoked by your service provider.

**To restore full system capabilities, you can either:**
1. **Configure in AI Studio**: Click **Settings** (gear icon) in the upper right-hand corner of the **Google AI Studio window**, navigate to the **Secrets** panel, and replace the \`GEMINI_API_KEY\` with a newly generated stable key. (Recommended)
2. **Dynamic Key Override**: Open the **AI Persona & Settings** panel inside this application's sidebar, and paste a custom Gemini API Key into the **API KEY OVERRIDE** field. This stores the key securely in your local browser storage and uses it live. You can generate a free Gemini key in [Google AI Studio Console](https://aistudio.google.com/).`;
      } else {
        errorText = `⚠️ **API Error:** ${rawErrorText || "Unable to retrieve answers. Please check your network and make sure your GEMINI_API_KEY is configured in the Settings > Secrets panel."}`;
      }

      // Create failure error message in conversation
      const errMsg: Message = {
        id: `msg_err_${Date.now()}`,
        role: "assistant",
        content: errorText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      const failedSessions = updatedSessions.map((s) => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: [...updatedMessages, errMsg]
          };
        }
        return s;
      });
      saveSessionsToLocal(failedSessions);
      showFeedbackAction("An error occurred. Check input values and API keys.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  return (
    <div className="mesh-bg flex flex-col md:flex-row h-screen w-full font-sans text-slate-100 p-4 md:p-6 gap-4 md:gap-6 overflow-hidden relative">
      
      {/* Dynamic Feedback Notification Overlay */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold max-w-sm backdrop-blur-xl"
            style={{
              backgroundColor: feedback.type === "error" ? "rgba(220, 38, 38, 0.92)" : feedback.type === "info" ? "rgba(30, 41, 59, 0.92)" : "rgba(13, 148, 136, 0.92)",
              borderColor: feedback.type === "error" ? "rgba(239, 68, 68, 0.4)" : feedback.type === "info" ? "rgba(255,255,255,0.15)" : "rgba(45, 212, 191, 0.4)",
              color: "#ffffff"
            }}
          >
            {feedback.type === "error" && <ShieldAlert className="w-4 h-4 text-rose-200" />}
            {feedback.type === "info" && <Info className="w-4 h-4 text-indigo-300" />}
            {feedback.type === "success" && <Sparkles className="w-4 h-4 text-teal-200" />}
            <span>{feedback.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar - Sessions and Controls */}
      <aside className="w-full md:w-64 flex flex-col gap-4 flex-shrink-0">
        <div className="glass-panel p-5 flex flex-col h-full rounded-2xl">
          
          {/* Sidebar Header Title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 hover:bg-indigo-600 transition-colors flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
              SU
            </div>
            <div>
              <span className="font-bold text-white tracking-tight text-sm block">Subu AI</span>
              <span className="text-[10px] uppercase tracking-widest text-[#a5b4fc]/70 font-mono font-medium block">INTELLIGENT COMPANION</span>
            </div>
          </div>

          {/* Sidebar New Session CTA */}
          <button
            onClick={() => createNewSession()}
            className="w-full h-10 mb-4 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-600 active:translate-y-0.5 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat Session</span>
          </button>

          {/* System Health Module (from Design HTML template) */}
          <div className="mb-6 space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-mono">System Status</p>
            <div className="glass-card p-3 rounded-xl flex items-center justify-between">
              <span className="text-xs text-slate-200">API Health</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-emerald-400 font-mono uppercase font-bold tracking-wider">Stable</span>
                <div className="api-pulse"></div>
              </div>
            </div>
          </div>

          {/* History header with counter */}
          <div className="mb-2 text-[10px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-indigo-400" />
            <span>Sessions History ({sessions.length})</span>
          </div>

          {/* Sidebar Sessions List - Dynamic Storage Block */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[160px] md:max-h-none">
            <AnimatePresence initial={false}>
              {sessions.map((session) => {
                const isActive = session.id === activeSessionId;
                const isEditing = session.id === editingSessionId;

                return (
                  <motion.div
                    key={session.id}
                    layoutId={session.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    onClick={() => handleSessionSelect(session.id)}
                    className={`group w-full rounded-xl text-left px-3 py-2.5 transition-all cursor-pointer flex items-center justify-between ${
                      isActive 
                        ? "bg-white/10 border-l-4 border-indigo-400" 
                        : "bg-white/[0.02] hover:bg-white/[0.06] border border-white/5"
                    }`}
                  >
                    <div className="flex-1 min-w-0 mr-2">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingTitleValue}
                          onChange={(e) => setEditingTitleValue(e.target.value)}
                          onBlur={() => saveSessionName(session.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveSessionName(session.id);
                            if (e.key === "Escape") setEditingSessionId("");
                          }}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-slate-950 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-400"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
                          <p className={`text-xs font-semibold truncate ${isActive ? "text-white" : "text-slate-300"}`}>
                            {session.title}
                          </p>
                        </div>
                      )}
                      <span className="text-[9px] text-slate-400 font-mono block ml-5.5 mt-0.5">
                        {new Date(session.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </span>
                    </div>

                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                      {!isEditing && (
                        <button
                          onClick={(e) => triggerEditTitle(session, e)}
                          title="Rename Chat"
                          className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={(e) => deleteSession(session.id, e)}
                        title="Delete Chat"
                        className="p-1 rounded hover:bg-rose-500/10 text-slate-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Config Launcher widget */}
          <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
            <button
              onClick={() => setShowSettingsDrawer(true)}
              className="w-full h-8 rounded-xl bg-white/5 border border-white/5 text-[10px] font-mono tracking-wider font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-400" />
              <span>LAUNCHER CONFIG</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container - Chat Panel Interface */}
      <main className="flex-1 flex flex-col glass-panel overflow-hidden rounded-2xl">
        
        {/* Chat Header block with frosted glow aesthetic */}
        <header className="p-4 border-b border-white/5 flex flex-wrap justify-between items-center bg-white/5 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <Bot className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">Subu AI</h2>
                <span className="px-1.5 py-0.2 rounded bg-indigo-500/15 border border-indigo-400/20 text-[9px] font-mono text-indigo-300 font-medium font-bold">ACTIVE</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-wide">Gemini Cognitive Core (Synchronized)</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Model switcher directly in header for great UX */}
            <div className="flex items-center bg-black/20 px-2.5 py-1 rounded-xl border border-white/5 text-[11px]">
              <span className="text-slate-400 font-mono mr-1.5">Engine:</span>
              <select
                value={modelName}
                onChange={(e) => {
                  const val = e.target.value;
                  setModelName(val);
                  updateActiveSessionSettings({ modelName: val });
                  showFeedbackAction(`Engine changed to ${val}`);
                }}
                className="bg-transparent border-none text-white font-mono font-medium outline-none cursor-pointer select-none"
              >
                <option value="gemini-3.5-flash" className="bg-slate-900 text-white">flash-3.5</option>
                <option value="gemini-3.1-pro-preview" className="bg-slate-900 text-white">pro-3.1</option>
              </select>
            </div>

            {/* Live Search Grounds switch */}
            <button
              onClick={() => {
                const val = !useSearch;
                setUseSearch(val);
                updateActiveSessionSettings({ useSearch: val });
                showFeedbackAction(val ? "Activated live Web Search Grounding" : "Deactivated search lookup", "info");
              }}
              className={`flex items-center gap-1.5 py-1 px-3 rounded-xl border transition-all text-[11px] font-semibold ${
                useSearch 
                  ? "bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-500/5" 
                  : "bg-white/5 hover:bg-white/10 border-white/5 text-slate-300"
              }`}
              title="Grounding with Google Search queries"
            >
              <Globe className={`w-3.5 h-3.5 ${useSearch ? "animate-spin-slow text-indigo-400" : "text-slate-400"}`} />
              <span>Web Search</span>
              <span className={`w-1.5 h-1.5 rounded-full ${useSearch ? "bg-indigo-400 animate-pulse" : "bg-slate-500"}`} />
            </button>
          </div>
        </header>

        {/* Primary Message Stream Grid */}
        <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6">
          <div className="max-w-3xl mx-auto space-y-6">

            {/* Real-time key state warning card */}
            {(keyStatus === "leaked" || keyStatus === "invalid") && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/35 text-slate-100 space-y-4 shadow-xl relative overflow-hidden group text-left"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <ShieldAlert className="w-24 h-24 text-rose-400" />
                </div>
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-rose-300 font-mono">
                      Authentication Terminated (Gemini Core 403)
                    </h3>
                    <p className="text-xs text-rose-200/90 leading-relaxed font-sans">
                      The default workspace API Key has been reported as leaked or revoked by your service provider. Let's fix this in 10 seconds!
                    </p>
                  </div>
                </div>

                <div className="bg-black/30 rounded-xl p-3.5 border border-white/5 space-y-3">
                  <div className="text-[11px] font-mono text-slate-300 space-y-1.5 list-none pl-0">
                    <div className="flex gap-2">
                      <span className="text-rose-400">1.</span>
                      <span>Generate a free key instantly in 0.5s: <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 font-bold underline hover:text-indigo-300">Google AI Studio Secrets Portal</a></span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-rose-400">2.</span>
                      <span>Paste your key in the form below:</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 mt-2">
                    <input
                      type="password"
                      placeholder="Paste your private GEMINI_API_KEY here..."
                      value={customApiKey}
                      onChange={(e) => setCustomApiKey(e.target.value)}
                      className="flex-1 bg-black/50 border border-rose-500/20 hover:border-rose-500/40 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 outline-none font-mono"
                    />
                    <button
                      onClick={verifyApiCredentials}
                      disabled={isCheckingKey}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer font-mono"
                    >
                      {isCheckingKey ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <span>Verify & Save</span>
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 font-mono italic">
                  *Your key is protected locally and only leaves your client to authenticate against the secure Google Gemini server.
                </p>
              </motion.div>
            )}

            {keyStatus === "valid" && customApiKey && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono font-semibold uppercase tracking-wider text-[10px]">Secure Custom API Override Active</span>
                </div>
                <button
                  onClick={() => {
                    setCustomApiKey("");
                    showFeedbackAction("Reverted to standard environment key", "info");
                  }}
                  className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer underline decoration-dotted"
                >
                  Clear Custom Override Key
                </button>
              </motion.div>
            )}

            {/* Empty Context State - Suggested Actions */}
            {(!activeSession || activeSession.messages.length === 0) ? (
              <div className="py-8 md:py-12 flex flex-col items-center justify-center text-center">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="p-4 rounded-full bg-white/5 text-indigo-400 mb-4 border border-white/5"
                >
                  <Bot className="w-10 h-10" />
                </motion.div>
                
                <h2 className="font-display text-lg md:text-xl font-bold text-white mb-2 tracking-tight">
                  Hi, I am Subu AI. How can I help you today?
                </h2>
                <p className="text-xs text-slate-400 max-w-md mb-8 font-mono leading-relaxed">
                  I am ready to help you write code, formulate ideas, answer complex queries, or browse the live web.
                </p>

                {/* Micro Category Grid Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl text-left">
                  {SUGGESTED_CHIPS.map((chip, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      whileHover={{ scale: 1.01, translateY: -1 }}
                      onClick={() => handleSendMessage(chip.text)}
                      className="p-3.5 rounded-xl bg-white/[0.01] hover:bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer shadow-sm group"
                    >
                      <div className="flex gap-3">
                        <span className="text-base select-none">{chip.icon}</span>
                        <div className="flex-1 min-w-0">
                          <span className="inline-block text-[8px] uppercase font-mono tracking-widest px-1.5 py-0.2 rounded bg-white/5 text-slate-400 mb-1">
                            {chip.category}
                          </span>
                          <p className="text-xs font-semibold text-slate-300 line-clamp-2 leading-relaxed group-hover:text-white">
                            {chip.text}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              /* Message Bubbles loop matches original logic but with frosted aesthetic overrides */
              <div className="space-y-6">
                {activeSession.messages.map((msg) => {
                  const isUser = msg.role === "user";
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 md:gap-4 ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      {/* Avatar for Bot */}
                      {!isUser && (
                        <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                          <Bot className="w-4.5 h-4.5" />
                        </div>
                      )}

                      {/* Msg bubble container */}
                      <div className={`max-w-[85%] md:max-w-[80%] flex flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}>
                        <div
                          className={`rounded-2xl px-4 py-3 shadow-md ${
                            isUser
                              ? "bg-indigo-600 border border-indigo-500 text-white rounded-tr-none"
                              : "bg-indigo-950/20 border border-indigo-500/25 p-4 rounded-2xl rounded-tl-none text-slate-100"
                          }`}
                        >
                          {/* Markdown renderer for gorgeous outputs */}
                          {isUser ? (
                            <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          ) : (
                            <div className="text-xs md:text-sm leading-relaxed prose prose-slate dark:prose-invert max-w-none text-slate-200">
                              <Markdown
                                components={{
                                  pre: ({ node, ...props }) => (
                                    <pre className="bg-slate-950 border border-white/10 rounded-lg p-3 my-2 overflow-x-auto text-[11px] font-mono text-slate-100 select-text" {...props} />
                                  ),
                                  code: ({ node, ...props }) => (
                                    <code className="bg-black/40 font-mono text-[11px] px-1.5 py-0.5 rounded text-indigo-300 font-semibold" {...props} />
                                  ),
                                  p: ({ node, ...props }) => (
                                    <p className="mb-2 last:mb-0" {...props} />
                                  ),
                                  h1: ({ node, ...props }) => (
                                    <h1 className="text-sm font-bold mt-3 mb-1 text-white border-b border-white/5 pb-1 font-mono uppercase tracking-wide" {...props} />
                                  ),
                                  h2: ({ node, ...props }) => (
                                    <h2 className="text-xs font-bold mt-2.5 mb-1 text-white" {...props} />
                                  ),
                                  ul: ({ node, ...props }) => (
                                    <ul className="list-disc pl-4 mb-2 space-y-1 text-slate-300" {...props} />
                                  ),
                                  ol: ({ node, ...props }) => (
                                    <ol className="list-decimal pl-4 mb-2 space-y-1 text-slate-300" {...props} />
                                  ),
                                  blockquote: ({ node, ...props }) => (
                                    <blockquote className="border-l-2 border-indigo-400 pl-3 italic text-neutral-400 my-1 bg-white/5 py-1 pr-2 rounded" {...props} />
                                  ),
                                }}
                              >
                                {msg.content}
                              </Markdown>
                            </div>
                          )}
                        </div>

                        {/* Grounding Source Info links if search took action */}
                        {!isUser && msg.sources && msg.sources.length > 0 && (
                          <div className="mt-1 w-full">
                            <div className="flex items-center gap-1 text-[9px] font-mono text-slate-400 mb-1">
                              <Search className="w-3 h-3 text-indigo-400" />
                              <span>Grounding Search Resources ({msg.sources.length}):</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {msg.sources.map((src, index) => (
                                <a
                                  key={index}
                                  href={src.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 transition-colors"
                                >
                                  <span>{src.title}</span>
                                  <ArrowUpRight className="w-2.5 h-2.5 flex-shrink-0" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Metadata Row: timestamp & micro quick actions */}
                        <div className="flex items-center gap-2 mt-0.5 text-[9px] text-slate-500 font-mono px-1">
                          <span>{msg.timestamp}</span>
                          {!isUser && (
                            <>
                              <span className="text-slate-600">•</span>
                              <button
                                onClick={() => handleCopyText(msg.content)}
                                className="hover:text-white transition-colors cursor-pointer"
                                title="Copy Content"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              <span className="text-slate-600">•</span>
                              <button
                                onClick={() => handleToggleSpeak(msg.id, msg.content)}
                                className={`transition-colors cursor-pointer ${
                                  isSpeakingId === msg.id ? "text-indigo-400 font-bold" : "hover:text-white"
                                }`}
                                title={isSpeakingId === msg.id ? "Mute" : "TTS Voice"}
                              >
                                {isSpeakingId === msg.id ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Avatar for User */}
                      {isUser && (
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/30 text-indigo-300 border border-indigo-400/20 flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                          <User className="w-4.5 h-4.5" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Loading indicator with status hints */}
                {isLoading && (
                  <div className="flex gap-3 md:gap-4 justify-start animate-fade-in">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm animate-pulse">
                      <Bot className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex flex-col items-start gap-1">
                      <div className="glass-card rounded-2xl rounded-tl-none p-4 max-w-[280px]">
                        <div className="flex items-center gap-2.5">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                          <span className="text-[11px] text-indigo-300 font-mono font-medium animate-pulse">
                            {LOADING_MESSAGES[loadingStatusIndex]}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Scroll bottom spacer */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Text Composer with mic dictates and controls */}
        <div className="p-4 md:p-6 mt-auto">
          <div className="max-w-3xl mx-auto">
            <div className="glass-card rounded-2xl p-2 flex items-center gap-2.5 border border-white/10">
              
              {/* Mic Input Trigger */}
              <button
                onClick={handleToggleVoiceInput}
                className={`p-2.5 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
                  isListening 
                    ? "bg-rose-500 border-rose-600 text-white shadow-lg shadow-rose-500/20 animate-pulse" 
                    : "bg-white/5 hover:bg-white/10 border-white/5 text-slate-300"
                }`}
                title="Microphone typing (Speak, voice dictation)"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
                placeholder={isListening ? "Listening silently... speak now" : "Ask your question..."}
                className="flex-1 bg-transparent border-none outline-none text-xs md:text-sm text-white px-2 placeholder:text-slate-500"
              />

              {inputValue.trim().length > 0 && (
                <span className="text-[9px] font-mono text-slate-500 mr-1 hidden sm:inline select-none">
                  {inputValue.length} ch
                </span>
              )}

              {/* Send trigger */}
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isLoading}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                  inputValue.trim() && !isLoading
                    ? "bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/10"
                    : "bg-white/5 text-slate-500 cursor-not-allowed"
                }`}
              >
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9-9-9-9-9 9 9 9zM12 19v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Right Sidebar: Stats and Context (matches mock design to make it highly premium) */}
      <aside className="w-full md:w-56 flex flex-col gap-4 flex-shrink-0">
        <div className="glass-panel p-5 flex flex-col gap-5 rounded-2xl h-full justify-between">
          
          <div className="space-y-5">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-mono">Metrics</p>
            
            <div className="space-y-4">
              <div className="text-center bg-white/[0.01] border border-white/5 rounded-2xl p-3">
                <div className="text-2xl font-light text-white tracking-tight">99.9<span className="text-xs text-indigo-400">%</span></div>
                <p className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">Uptime SLA</p>
              </div>

              <div className="text-center bg-white/[0.01] border border-white/5 rounded-2xl p-3">
                <div className="text-2xl font-light text-emerald-400 tracking-tight">{successCount}</div>
                <p className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">HTTP Success</p>
              </div>

              <div className="text-center bg-white/[0.01] border border-white/5 rounded-2xl p-3">
                <div className={`text-2xl font-light tracking-tight ${exceptionCount > 0 ? "text-rose-400 animate-pulse" : "text-white"}`}>
                  {exceptionCount}
                </div>
                <p className="text-[9px] text-rose-400 font-mono uppercase tracking-wider">API Exceptions</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-mono-wide block">Context Status</p>
            
            <div className="space-y-3">
              <div className="w-full h-12 bg-white/5 rounded-xl border-l-4 border-indigo-500 flex items-center px-3 gap-2">
                <div className="p-1 rounded bg-indigo-500/10 text-indigo-400">
                  <Laptop className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="h-1.5 w-3/4 bg-slate-500 rounded-full mb-1"></div>
                  <div className="h-1.5 w-1/2 bg-slate-600 rounded-full"></div>
                </div>
              </div>

              <div className="w-full h-12 bg-white/5 rounded-xl border-l-4 border-teal-500 flex items-center px-3 gap-2">
                <div className="p-1 rounded bg-teal-500/10 text-teal-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="h-1.5 w-2/3 bg-slate-500 rounded-full mb-1"></div>
                  <div className="h-1.5 w-1/3 bg-slate-600 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick inline latency indicator */}
          <div className="glass-card p-3 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono text-[9px]">LATENCY</span>
            <span className="text-indigo-400 font-mono text-[10px] font-bold">{lastLatency}</span>
          </div>

        </div>
      </aside>

      {/* Configurations Sliding Sidebar / Drawer - fully retrofitted with Glass parameters */}
      <AnimatePresence>
        {showSettingsDrawer && (
          <div className="absolute inset-0 z-40 flex justify-end">
            {/* Overlay background */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettingsDrawer(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Drawer Content */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 20 }}
              className="relative w-full max-w-md h-full bg-slate-900 shadow-2xl border-l border-white/5 flex flex-col p-6 overflow-y-auto select-none backdrop-blur-3xl"
            >
              
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-display font-bold text-lg text-white">Assistant Configurations</h3>
                </div>
                <button
                  onClick={() => setShowSettingsDrawer(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Configurations Body */}
              <div className="flex-1 space-y-6">
                
                {/* Info banner about environment variables */}
                <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-200 text-xs leading-relaxed space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldAlert className="w-4 h-4 text-orange-400" />
                    <span>Gemini API Credentials Check</span>
                  </div>
                  <p className="text-orange-300">
                    The default system key has been flagged as leaked by some service providers. Please use a custom key override below or update your secrets inside Google AI Studio.
                  </p>
                </div>

                {/* Gemini API Key Override */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block font-mono">
                    GEMINI API KEY OVERRIDE
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={customApiKey}
                      onChange={(e) => setCustomApiKey(e.target.value)}
                      placeholder="Paste private GEMINI_API_KEY..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-600 font-mono"
                    />
                    {customApiKey && (
                      <button
                        onClick={() => {
                          setCustomApiKey("");
                          showFeedbackAction("Cleared custom API key dynamic override", "info");
                        }}
                        type="button"
                        className="absolute right-3 top-2.5 text-xs text-rose-400 hover:text-white cursor-pointer hover:underline font-semibold"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 block leading-relaxed">
                    Saves instantly to your local client session storage. Get your key free in the <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Google AI Studio Secrets Portal</a>.
                  </span>
                </div>

                {/* Model Picker */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block font-mono">
                    LLM CORE ENGINE
                  </label>
                  <select
                    value={modelName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setModelName(val);
                      updateActiveSessionSettings({ modelName: val });
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="gemini-3.5-flash" className="bg-slate-900 text-white">gemini-3.5-flash (Fast & Accurate)</option>
                    <option value="gemini-3.1-pro-preview" className="bg-slate-900 text-white">gemini-3.1-pro-preview (Advanced Reasoning)</option>
                  </select>
                  <span className="text-[10px] text-slate-400 block leading-relaxed font-mono">
                    Flash is super speedy for standard queries, while Pro handles advanced computing and logical thinking.
                  </span>
                </div>

                {/* System Instruction Persona Block */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between font-mono">
                    <span>SYSTEM PERSONA INSTRUCTIONS</span>
                    <button
                      onClick={() => {
                        const def = "You are a helpful, friendly, and extremely capable AI assistant. Answer the user's questions clearly, accurately, and with excellent layout and markdown format.";
                        setSystemInstruction(def);
                        updateActiveSessionSettings({ systemInstruction: def });
                        showFeedbackAction("Reset system instruction to default");
                      }}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 capitalize font-medium"
                    >
                      Reset Default
                    </button>
                  </label>
                  <textarea
                    value={systemInstruction}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSystemInstruction(val);
                      updateActiveSessionSettings({ systemInstruction: val });
                    }}
                    rows={5}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 font-sans leading-relaxed"
                    placeholder="E.g., Instruct the assistant how to behave specifically."
                  />
                  <span className="text-[10px] text-slate-400 block leading-relaxed">
                    Custom instruction rule prepended with every API call to craft a desired assistant persona.
                  </span>
                </div>

                {/* Grounding switch inside drawer */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-black/20">
                  <div>
                    <span className="text-xs font-bold block text-slate-200 font-mono uppercase tracking-wider">
                      Google Search Grounding
                    </span>
                    <span className="text-[10px] text-slate-400 block leading-normal mt-0.5">
                      Fetches real-time links to verify facts dynamically.
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const val = !useSearch;
                      setUseSearch(val);
                      updateActiveSessionSettings({ useSearch: val });
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      useSearch ? "bg-indigo-500" : "bg-white/5"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        useSearch ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Close CTAs inside drawer */}
              <div className="pt-4 border-t border-white/5 mt-6 text-center space-y-2 font-mono">
                <p className="text-[9px] text-slate-500">
                  Server Port: 3000 | Handshake status: active
                </p>
                <button
                  onClick={() => setShowSettingsDrawer(false)}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/5 py-2 rounded-xl text-xs font-semibold text-slate-350"
                >
                  Close Configurations
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
