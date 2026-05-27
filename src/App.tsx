import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Plus, Trash2, Edit2, Send, Bot, User, Copy, Check, 
  Volume2, VolumeX, Mic, MicOff, Settings, History, Clock, 
  ArrowUpRight, ChevronRight, ChevronDown, ChevronUp, RefreshCw, 
  Globe, Wand2, Search, X, MessageSquare, Info, Star, ShieldAlert,
  Activity, Shield, Laptop, CheckCircle, LogOut, Lock, Download
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

const PROVIDERS_CONFIG = {
  openrouter: {
    name: "OpenRouter AI",
    models: [
      { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B Instruct (High Precision & Speed)" },
      { id: "deepseek/deepseek-chat", label: "DeepSeek V3 (State of the Art)" },
      { id: "deepseek/deepseek-r1", label: "DeepSeek R1 (Ultimate Reasoning)" },
      { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
    ],
    placeholderKey: "Paste OpenRouter API Key...",
    portalUrl: "https://openrouter.ai/keys",
    portalName: "OpenRouter Keys Dashboard",
    keyEnv: "OPENROUTER_API_KEY"
  },
  sambanova: {
    name: "SambaNova Systems",
    models: [
      { id: "Meta-Llama-3.3-70B-Instruct", label: "Llama 3.3 70B (High Precision & Speed)" },
      { id: "Meta-Llama-3.1-405B-Instruct", label: "Llama 3.1 405B (Dense Giant Intelligence)" },
      { id: "Meta-Llama-3.1-70B-Instruct", label: "Llama 3.1 70B (Fast Reasoning)" },
      { id: "Meta-Llama-3.1-8B-Instruct", label: "Llama 3.1 8B (Super Swift Model)" },
      { id: "Qwen2.5-72B-Instruct", label: "Qwen 2.5 72B (Elite Coding & Logic)" },
      { id: "Qwen2.5-Coder-32B-Instruct", label: "Qwen 2.5 Coder 32B (World-Class Coder)" },
    ],
    placeholderKey: "Paste SambaNova API Key...",
    portalUrl: "https://cloud.sambanova.ai/",
    portalName: "SambaNova Cloud Portal",
    keyEnv: "SAMBANOVA_API_KEY"
  },
  groq: {
    name: "Groq (Llama / Mixtral)",
    models: [
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (Fast, Intelligent & Multi-turn)" },
      { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B (Ultra High-Speed)" },
      { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B (Large Context Mixture of Experts)" },
      { id: "gemma2-9b-it", label: "Gemma 2 9B (Google Open-Weights Instruction-Tuned)" },
    ],
    placeholderKey: "Paste Groq API Key (gsk_...)",
    portalUrl: "https://console.groq.com/keys",
    portalName: "Groq Console Keys Page",
    keyEnv: "GROQ_API_KEY"
  },
  openai: {
    name: "OpenAI ChatGPT",
    models: [
      { id: "gpt-4o-mini", label: "gpt-4o-mini (Smart & Highly Efficient)" },
      { id: "gpt-4o", label: "gpt-4o (Powerhouse Omni Intelligence)" },
      { id: "o1-mini", label: "o1-mini (Advanced Reasoning Core)" },
    ],
    placeholderKey: "Paste OpenAI API Key (sk-...)",
    portalUrl: "https://platform.openai.com/api-keys",
    portalName: "OpenAI API Keys Dashboard",
    keyEnv: "OPENAI_API_KEY"
  },
  deepseek: {
    name: "DeepSeek Core",
    models: [
      { id: "deepseek-chat", label: "DeepSeek Core / Chat (High Intelligence & Low Latency)" },
      { id: "deepseek-reasoner", label: "DeepSeek R1 (ELITE Math & Scientific Reasoning)" },
    ],
    placeholderKey: "Paste DeepSeek API Key...",
    portalUrl: "https://platform.deepseek.com/",
    portalName: "DeepSeek Console",
    keyEnv: "DEEPSEEK_API_KEY"
  },
  anthropic: {
    name: "Anthropic Claude",
    models: [
      { id: "claude-3-5-sonnet-20241022", label: "claude-3.5-sonnet (Premier Brain)" },
      { id: "claude-3-5-haiku-20241022", label: "claude-3-5-haiku (Elite Speed Agent)" },
    ],
    placeholderKey: "Paste Anthropic Claude Key (sk-ant-...)",
    portalUrl: "https://console.anthropic.com/",
    portalName: "Anthropic Console Dashboard",
    keyEnv: "ANTHROPIC_API_KEY"
  },
};

export interface UserAccount {
  username: string;
  password?: string;
  email?: string;
  isGoogleUser: boolean;
  profilePic?: string;
}

export default function App() {
  // Authentication & Privacy States
  const [activeUser, setActiveUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem("ai_active_user");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [accounts, setAccounts] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem("ai_user_accounts");
      if (saved) {
        return JSON.parse(saved);
      }
      // Put a default test account so the user has standard examples right away
      const defaults: UserAccount[] = [
        { username: "ankon", password: "123", email: "ankonpolley@gmail.com", isGoogleUser: false, profilePic: "https://api.dicebear.com/7.x/bottts/svg?seed=ankon" }
      ];
      localStorage.setItem("ai_user_accounts", JSON.stringify(defaults));
      return defaults;
    } catch (e) {
      return [];
    }
  });

  const [authTab, setAuthTab] = useState<"login" | "signup">("login");
  const [showGoogleOAuth, setShowGoogleOAuth] = useState<boolean>(false);
  const [showAuthOverlay, setShowAuthOverlay] = useState<boolean>(false); // for guest lock screen popup
  const [sessionSearchQuery, setSessionSearchQuery] = useState<string>("");
  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => {
    return localStorage.getItem("ai_guest_mode") === "true";
  });

  // Form inputs
  const [loginTerm, setLoginTerm] = useState<string>(""); // username or google email
  const [loginPass, setLoginPass] = useState<string>("");
  const [regUsername, setRegUsername] = useState<string>("");
  const [regEmail, setRegEmail] = useState<string>("");
  const [regPass, setRegPass] = useState<string>("");
  const [regConfirmPass, setRegConfirmPass] = useState<string>("");
  const [googleRegEmail, setGoogleRegEmail] = useState<string>("");
  const [googleRegName, setGoogleRegName] = useState<string>("");
  const [isGoogleSigningUp, setIsGoogleSigningUp] = useState<boolean>(false);

  // Session States
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  
  // Custom Settings
  const [systemInstruction, setSystemInstruction] = useState<string>(
    "You are Subu AI, a friendly, extremely intelligent, and highly capable AI assistant. Your AI name is Subu AI, and your actual, real name is Subhashree (also referred to as Suboshree). Crucially, whenever the user greets you (such as saying 'hi', 'hello', 'hey', 'namaste', etc.), or when you introduce yourself, you must proudly introduce yourself by stating that your name is Subhashree (Subu AI), explaining that you are Subu AI but your real name is Subhashree or Suboshree, and ask how you can help them today. Answer all queries clearly, accurately, with beautiful layouts and responsive markdown formatting."
  );
  const [useSearch, setUseSearch] = useState<boolean>(false);
  const [modelName, setModelName] = useState<string>("meta-llama/llama-3.3-70b-instruct");
  
  // Multi-Provider settings
  const [provider, setProvider] = useState<"groq" | "openai" | "deepseek" | "anthropic" | "sambanova" | "openrouter">(() => {
    const saved = localStorage.getItem("ai_active_provider");
    if (saved && saved !== "gemini") return saved as any;
    return "openrouter";
  });

  // Individual private key buffers per provider
  const [providerKeys, setProviderKeys] = useState<{
    groq: string;
    openai: string;
    deepseek: string;
    anthropic: string;
    sambanova: string;
    openrouter: string;
  }>(() => {
    try {
      const saved = localStorage.getItem("ai_provider_keys");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.openrouter) parsed.openrouter = "";
        return parsed;
      }
    } catch (e) {}
    return {
      groq: "",
      openai: "",
      deepseek: "",
      anthropic: "",
      sambanova: "",
      openrouter: "",
    };
  });

  const currentProviderKey = providerKeys[provider] || "";

  // Sync state modifications to storage
  useEffect(() => {
    localStorage.setItem("ai_provider_keys", JSON.stringify(providerKeys));
  }, [providerKeys]);

  useEffect(() => {
    localStorage.setItem("ai_active_provider", provider);
  }, [provider]);

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
        body: JSON.stringify({
          provider,
          customApiKey: currentProviderKey,
          modelName
        }),
      });
      const data = await response.json();
      if (data.success) {
        setKeyStatus("valid");
        setKeyErrorMsg("");
      } else {
        setKeyStatus(data.status || "invalid");
        setKeyErrorMsg(data.error || "The API key is invalid or leaked.");
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
  }, [provider, currentProviderKey, modelName]);
  
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
  const [isZipping, setIsZipping] = useState<boolean>(false);

  const handleDownloadProject = async () => {
    try {
      setIsZipping(true);
      showFeedbackAction("Assembling full workspace ZIP...", "info");

      const response = await fetch("/api/download-project");
      if (!response.ok) {
        throw new Error("Could not package the workspace.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "subu-ai-project-workspace.zip");
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      showFeedbackAction("Workspace ZIP downloaded successfully!", "success");
    } catch (error: any) {
      console.error("Download error:", error);
      showFeedbackAction(error.message || "Failed to package project workspace.", "error");
    } finally {
      setIsZipping(false);
    }
  };
  
  // Speech Recognition Ref
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [mobileTab, setMobileTab] = useState<"chat" | "sessions" | "metrics">("chat");
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState<boolean>(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const threshold = 180; // px threshold from bottom to hide scroll button
    const isAbove = target.scrollHeight - target.scrollTop - target.clientHeight > threshold;
    setShowScrollBottomBtn(isAbove);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Periodic visual hints during text generation loading
  const LOADING_MESSAGES = [
    "Consulting AI Brain...",
    "Scanning historical logs...",
    "Structuring responsive layout...",
    "Fact-checking reasoning...",
    "Synthesizing results..."
  ];

  // Feedback Notification Timer
  const showFeedbackAction = (text: string, type: "success" | "info" | "error" = "success") => {
    setFeedback({ text, type });
    setTimeout(() => {
      setFeedback((current) => current?.text === text ? null : current);
    }, 4000);
  };

  // Load chat sessions from localStorage when activeUser changes
  useEffect(() => {
    const key = activeUser 
      ? `ai_scholar_chats_${activeUser.username.toLowerCase()}` 
      : "ai_scholar_chats_guest";
      
    const savedSessions = localStorage.getItem(key);
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setActiveSessionId(parsed[0].id);
          
          // Sync settings from active session
          const sys = parsed[0].systemInstruction || "You are Subu AI, a friendly, extremely intelligent, and highly capable AI assistant. Your AI name is Subu AI, and your actual, real name is Subhashree (also referred to as Suboshree). Crucially, whenever the user greets you (such as saying 'hi', 'hello', 'hey', 'namaste', etc.), or when you introduce yourself, you must proudly introduce yourself by stating that your name is Subhashree (Subu AI), explaining that you are Subu AI but your real name is Subhashree or Suboshree, and ask how you can help them today. Answer all queries clearly, accurately, with beautiful layouts and responsive markdown formatting.";
          setSystemInstruction(sys);
          setUseSearch(parsed[0].useSearch || false);
          const rawModel = parsed[0].modelName || "meta-llama/llama-3.3-70b-instruct";
          setModelName((rawModel.includes("gemini") || rawModel === "Meta-Llama-3.3-70B-Instruct") ? "meta-llama/llama-3.3-70b-instruct" : rawModel);
          const rawProv = parsed[0].provider || "openrouter";
          setProvider((rawProv === "gemini" || rawProv === "sambanova") ? "openrouter" : rawProv as any);
          return;
        }
      } catch (e) {
        console.error("Failed to parse saved chats", e);
      }
    }
    
    // Setup initial default session if nothing saved or user switched
    setSessions([]);
    const newId = `session_${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: "Subu Chat 1",
      messages: [],
      systemInstruction: "You are Subu AI, a friendly, extremely intelligent, and highly capable AI assistant. Your AI name is Subu AI, and your actual, real name is Subhashree (also referred to as Suboshree). Crucially, whenever the user greets you (such as saying 'hi', 'hello', 'hey', 'namaste', etc.), or when you introduce yourself, you must proudly introduce yourself by stating that your name is Subhashree (Subu AI), explaining that you are Subu AI but your real name is Subhashree or Suboshree, and ask how you can help them today. Answer all queries clearly, accurately, with beautiful layouts and responsive markdown formatting.",
      useSearch: false,
      modelName: "meta-llama/llama-3.3-70b-instruct",
      provider: "openrouter",
      createdAt: new Date().toISOString()
    };
    setSessions([newSession]);
    setActiveSessionId(newId);
  }, [activeUser]);

  // Save sessions to localStorage whenever they change
  const saveSessionsToLocal = (updatedSessions: ChatSession[]) => {
    setSessions(updatedSessions);
    const key = activeUser 
      ? `ai_scholar_chats_${activeUser.username.toLowerCase()}` 
      : "ai_scholar_chats_guest";
    localStorage.setItem(key, JSON.stringify(updatedSessions));
  };

  // Register Credentials
  const handleRegisterCredentials = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!regUsername.trim() || !regPass) {
      showFeedbackAction("Username and Password are required", "error");
      return;
    }
    if (regPass !== regConfirmPass) {
      showFeedbackAction("Passwords do not match", "error");
      return;
    }
    
    const exists = accounts.some(acc => acc.username.toLowerCase() === regUsername.trim().toLowerCase());
    if (exists) {
      showFeedbackAction("Username is already taken", "error");
      return;
    }

    const newUser: UserAccount = {
      username: regUsername.trim(),
      password: regPass,
      email: regEmail.trim() || undefined,
      isGoogleUser: false,
      profilePic: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(regUsername.trim())}`
    };

    const newAccounts = [...accounts, newUser];
    setAccounts(newAccounts);
    localStorage.setItem("ai_user_accounts", JSON.stringify(newAccounts));

    // Auto-login
    handleLoginSuccess(newUser);
    showFeedbackAction(`Account registered successfully as @${newUser.username}!`, "success");

    // Clear inputs
    setRegUsername("");
    setRegEmail("");
    setRegPass("");
    setRegConfirmPass("");
  };

  // Login Credentials
  const handleLoginCredentials = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginTerm.trim() || !loginPass) {
      showFeedbackAction("Username/Email and Password are required", "error");
      return;
    }

    const user = accounts.find(acc => 
      (acc.username.toLowerCase() === loginTerm.trim().toLowerCase() || (acc.email && acc.email.toLowerCase() === loginTerm.trim().toLowerCase())) &&
      acc.password === loginPass
    );

    if (!user) {
      showFeedbackAction("Invalid Username or Password", "error");
      return;
    }

    handleLoginSuccess(user);
    showFeedbackAction(`Welcome back, ${user.username}! Secure connection isolated.`, "success");
    setLoginTerm("");
    setLoginPass("");
  };

  // Google OAuth flow simulation select
  const handleGoogleSelectAccount = (email: string, displayName: string) => {
    // Check if user is already registered under this google account
    const existing = accounts.find(acc => acc.email?.toLowerCase() === email.toLowerCase() && acc.isGoogleUser);
    
    if (existing) {
      // Direct login
      handleLoginSuccess(existing);
      showFeedbackAction(`Logged in with Google as ${existing.username}`, "success");
      setShowGoogleOAuth(false);
    } else {
      // Need to register with Google (choose username & set password as requested)
      setGoogleRegEmail(email);
      setGoogleRegName(displayName);
      setRegUsername(displayName.toLowerCase().replace(/\s+/g, ""));
      setIsGoogleSigningUp(true);
      setShowGoogleOAuth(false);
    }
  };

  // Complete Google Registration
  const handleCompleteGoogleRegistration = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!regUsername.trim() || !regPass) {
      showFeedbackAction("Username and Password are required for setup.", "error");
      return;
    }
    const exists = accounts.some(acc => acc.username.toLowerCase() === regUsername.trim().toLowerCase());
    if (exists) {
      showFeedbackAction("Username is already taken", "error");
      return;
    }

    const newUser: UserAccount = {
      username: regUsername.trim(),
      password: regPass,
      email: googleRegEmail,
      isGoogleUser: true,
      profilePic: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(googleRegEmail)}`
    };

    const newAccounts = [...accounts, newUser];
    setAccounts(newAccounts);
    localStorage.setItem("ai_user_accounts", JSON.stringify(newAccounts));

    handleLoginSuccess(newUser);
    showFeedbackAction(`Google Sign-up complete! Welcome @${newUser.username}`, "success");

    // Clear google sign-up buffers
    setIsGoogleSigningUp(false);
    setGoogleRegEmail("");
    setGoogleRegName("");
    setRegUsername("");
    setRegPass("");
  };

  const handleLoginSuccess = (user: UserAccount) => {
    setActiveUser(user);
    setIsGuestMode(false);
    localStorage.removeItem("ai_guest_mode");
    localStorage.setItem("ai_active_user", JSON.stringify(user));
  };

  // Logout
  const handleLogout = () => {
    setIsGuestMode(false);
    localStorage.removeItem("ai_guest_mode");
    if (activeUser) {
      const u = activeUser.username;
      setActiveUser(null);
      localStorage.removeItem("ai_active_user");
      showFeedbackAction(`User @${u} securely logged out. Local privacy locked.`, "info");
    } else {
      showFeedbackAction("Logged out of Guest operator mode.", "info");
    }
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
      provider,
      createdAt: new Date().toISOString()
    };
    const updated = [newSession, ...sessions];
    saveSessionsToLocal(updated);
    setActiveSessionId(newId);
    setMobileTab("chat");
    showFeedbackAction("Created a new chat session", "info");
  };

  // Sync settings when selecting deep changes or selecting a session
  const handleSessionSelect = (id: string) => {
    setActiveSessionId(id);
    setMobileTab("chat");
    const session = sessions.find(s => s.id === id);
    if (session) {
      setSystemInstruction(session.systemInstruction || "You are Subu AI, a friendly, extremely intelligent, and highly capable AI assistant. Your AI name is Subu AI, and your actual, real name is Subhashree (also referred to as Suboshree). Crucially, whenever the user greets you (such as saying 'hi', 'hello', 'hey', 'namaste', etc.), or when you introduce yourself, you must proudly introduce yourself by stating that your name is Subhashree (Subu AI), explaining that you are Subu AI but your real name is Subhashree or Suboshree, and ask how you can help them today. Answer all queries clearly, accurately, with beautiful layouts and responsive markdown formatting.");
      setUseSearch(session.useSearch || false);
      const rawModel = session.modelName || "meta-llama/llama-3.3-70b-instruct";
      setModelName((rawModel.includes("gemini") || rawModel === "Meta-Llama-3.3-70B-Instruct") ? "meta-llama/llama-3.3-70b-instruct" : rawModel);
      const rawProv = session.provider || "openrouter";
      setProvider((rawProv === "gemini" || rawProv === "sambanova") ? "openrouter" : rawProv as any);
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
  const deleteSession = (id: string, event?: React.MouseEvent | any) => {
    if (event && typeof event.stopPropagation === "function") {
      event.stopPropagation();
    }
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
        provider,
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
    scrollToBottom();
    setShowScrollBottomBtn(false);
  }, [activeSessionId, sessions, isLoading]);

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
          provider: provider,
          customApiKey: currentProviderKey
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
      const providerInfo = PROVIDERS_CONFIG[provider] || { name: "AI", portalName: "Console", portalUrl: "#", keyEnv: "API_KEY" };
      if (
        rawErrorText.toLowerCase().includes("leaked") || 
        rawErrorText.toLowerCase().includes("api key") || 
        rawErrorText.toLowerCase().includes("permission_denied") || 
        rawErrorText.toLowerCase().includes("403") || 
        rawErrorText.toLowerCase().includes("key was reported as leaked") ||
        rawErrorText.toLowerCase().includes("not configured") ||
        rawErrorText.toLowerCase().includes("not set")
      ) {
        errorText = `⚠️ **${providerInfo.name} API Authentication Error:**
The API Key configuration for **${providerInfo.name}** is missing, incorrect, restricted, or has been reported as revoked by the provider.

**To restore full chatting capabilities immediately:**
1. **Dynamic Key Override (Easiest)**: Open the **Settings** panel (via the gear icon in the top header), and paste your custom API key in the **${providerInfo.name.toUpperCase()} KEY OVERRIDE** field. This stores the key securely on your local browser's storage. You can generate or obtain your key safely from the [${providerInfo.portalName}](${providerInfo.portalUrl}).
2. **Environment Variable**: Alternatively, verify or define the \`${providerInfo.keyEnv}\` environment variable on your back-end runtime platform.`;
      } else {
        errorText = `⚠️ **API Execution Error:** ${rawErrorText || `An issue occurred while calling the ${providerInfo.name} server. Please double-check your network status and confirm your ${providerInfo.keyEnv} is correctly set.`}`;
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

  // Dynamic context status calculations
  const messageCount = activeSession?.messages ? activeSession.messages.length : 0;
  const activeCharCount = activeSession?.messages 
    ? activeSession.messages.reduce((sum, m) => sum + (m.content || "").length, 0)
    : 0;
  const sysCharCount = systemInstruction ? systemInstruction.length : 0;

  return (
    <div className="mesh-bg flex flex-col md:flex-row h-screen w-full font-sans text-slate-100 p-3 md:p-6 gap-3 md:gap-6 overflow-hidden relative">

      {/* Simulated Google Account Selector Dialog */}
      <AnimatePresence>
        {showGoogleOAuth && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-lg max-w-sm w-full p-6 text-slate-800 shadow-2xl relative select-none"
            >
              <button 
                onClick={() => setShowGoogleOAuth(false)}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center mb-6">
                {/* Google logo colored letters */}
                <div className="text-2xl font-bold tracking-tight mb-2 select-none">
                  <span className="text-blue-500">G</span>
                  <span className="text-red-500">o</span>
                  <span className="text-yellow-500">o</span>
                  <span className="text-blue-500">g</span>
                  <span className="text-green-500">l</span>
                  <span className="text-red-400">e</span>
                </div>
                <h3 className="text-base font-semibold text-slate-900 leading-tight">Choose an account</h3>
                <p className="text-xs text-slate-500 mt-1">to continue to <strong className="text-indigo-600">Subu AI</strong></p>
              </div>

              {/* Accounts list */}
              <div className="space-y-2.5 max-h-56 overflow-y-auto mb-5 pr-1">
                <button
                  onClick={() => handleGoogleSelectAccount("ankonpolley@gmail.com", "Ankon Polley")}
                  className="w-full p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors flex items-center gap-3 text-left group"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 font-bold flex items-center justify-center text-xs select-none shadow-sm capitalize border border-slate-200">
                    AP
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-xs text-slate-800 block truncate leading-none">Ankon Polley</span>
                    <span className="text-[10px] text-slate-400 block truncate">ankonpolley@gmail.com</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                </button>

                <button
                  onClick={() => handleGoogleSelectAccount("suboshree.ghosh@gmail.com", "Subu Assistant")}
                  className="w-full p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors flex items-center gap-3 text-left group"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 bg-indigo-500/10 font-bold flex items-center justify-center text-xs select-none shadow-sm capitalize border border-slate-100">
                    SG
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-xs text-slate-800 block truncate leading-none">Suboshree Ghosh (Subu AI)</span>
                    <span className="text-[10px] text-slate-400 block truncate">suboshree.ghosh@gmail.com</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                </button>

                {/* Add new custom email mock option */}
                <div className="border-t border-slate-100 pt-2.5 mt-2.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider mb-2 font-mono">Use another google email</span>
                  <div className="flex gap-1.5">
                    <input 
                      type="email"
                      id="custom_gmail_input"
                      placeholder="e.g. user@gmail.com"
                      className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const val = (e.currentTarget as HTMLInputElement).value.trim();
                          if (val && val.includes("@")) {
                            handleGoogleSelectAccount(val, val.split("@")[0]);
                          } else {
                            showFeedbackAction("Please enter a valid mock Gmail address", "error");
                          }
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const el = document.getElementById("custom_gmail_input") as HTMLInputElement;
                        const val = el?.value?.trim();
                        if (val && val.includes("@")) {
                          handleGoogleSelectAccount(val, val.split("@")[0]);
                        } else {
                          showFeedbackAction("Please enter a valid mock Gmail address", "error");
                        }
                      }}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg active:scale-95 transition-all outline-none"
                    >
                      Use
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-center text-slate-400 leading-normal border-t border-slate-100 pt-3">
                To keep this sandbox secure, this is a simulated secure OAuth dialog that securely binds to your browser's private local state. No details are shared externally.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Immersive Imprison Auth Gate Screen */}
      <AnimatePresence>
        {(!activeUser && !isGuestMode) && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative select-none flex flex-col gap-4 text-left"
            >
              {/* Portal Header with secure seal */}
              <div className="text-center pb-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-400/25 text-indigo-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/5 animate-pulse">
                  <Shield className="w-6 h-6" />
                </div>
                <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">Privacy Guarded Portal</h2>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                  Subu AI isolates separate message streams on your browser. Sign in or register to secure your connection.
                </p>
              </div>

              {/* Active form views depending on setup route */}
              {isGoogleSigningUp ? (
                /* Google Username and Password completion (Sign up with Google complete) */
                <form onSubmit={handleCompleteGoogleRegistration} className="space-y-4">
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-300 block mb-1">GOOGLE EMAIL DETECTED</span>
                    <p className="text-xs font-semibold text-slate-200 font-mono truncate">{googleRegEmail}</p>
                    <span className="text-[9px] text-slate-400 block mt-1">To finish registering, let's pick an alias username and set a secure password.</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400 block">Choose Username</label>
                    <input 
                      type="text" 
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="e.g. ankon"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400 block">Set Password (local lock)</label>
                    <input 
                      type="password" 
                      required
                      value={regPass}
                      onChange={(e) => setRegPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/30 font-mono"
                    />
                  </div>

                  <div className="flex gap-2 pt-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsGoogleSigningUp(false);
                        setGoogleRegEmail("");
                        setGoogleRegName("");
                      }}
                      className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 py-2.5 rounded-xl text-xs font-semibold text-slate-350 active:scale-95 transition-all text-center"
                    >
                      Cancel Setup
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 active:translate-y-0.5 transition-all text-center"
                    >
                      Complete & Launch
                    </button>
                  </div>
                </form>
              ) : (
                /* Regular accounts and OAuth selector tabs */
                <div className="space-y-4">
                  {/* Sliding Tabs Indicator */}
                  <div className="grid grid-cols-2 bg-black/40 p-1 rounded-xl border border-white/5 relative">
                    <button
                      onClick={() => setAuthTab("login")}
                      className={`py-2 text-xs font-bold font-mono tracking-wider rounded-lg relative z-10 transition-colors uppercase ${
                        authTab === "login" ? "text-indigo-300" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {authTab === "login" && (
                        <motion.div
                          layoutId="auth_tab_pill"
                          className="absolute inset-0 bg-white/5 rounded-lg border border-white/5"
                        />
                      )}
                      <span>SIGN IN</span>
                    </button>

                    <button
                      onClick={() => setAuthTab("signup")}
                      className={`py-2 text-xs font-bold font-mono tracking-wider rounded-lg relative z-10 transition-colors uppercase ${
                        authTab === "signup" ? "text-indigo-300" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {authTab === "signup" && (
                        <motion.div
                          layoutId="auth_tab_pill"
                          className="absolute inset-0 bg-white/5 rounded-lg border border-white/5"
                        />
                      )}
                      <span>CREATE VAULT</span>
                    </button>
                  </div>

                  {/* Form fields depending on active tab */}
                  {authTab === "login" ? (
                    <form onSubmit={handleLoginCredentials} className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono uppercase font-bold tracking-widest text-slate-400 block">Username or Google Email</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. ankon or custom name"
                          value={loginTerm}
                          onChange={(e) => setLoginTerm(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 font-sans"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-mono uppercase font-bold tracking-widest text-slate-400 block">Secure Password</label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={loginPass}
                          onChange={(e) => setLoginPass(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-indigo-500 hover:bg-indigo-600 active:translate-y-0.5 text-white font-bold tracking-wider uppercase text-[10px] h-10 rounded-xl shadow-lg shadow-indigo-600/10 cursor-pointer flex items-center justify-center gap-1.5 transition-all text-center"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Enter Secure Portal</span>
                      </button>

                      {/* Divider line */}
                      <div className="flex items-center gap-3 text-slate-500 py-1">
                        <div className="flex-1 h-px bg-white/5" />
                        <span className="text-[9px] font-mono uppercase tracking-widest font-bold">OR</span>
                        <div className="flex-1 h-px bg-white/5" />
                      </div>

                      {/* Google Sign In action */}
                      <button
                        type="button"
                        onClick={() => setShowGoogleOAuth(true)}
                        className="w-full h-10 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-md outline-none cursor-pointer"
                      >
                        {/* Custom Google inline icon */}
                        <div className="w-5 h-5 flex items-center justify-center bg-white border border-slate-100 rounded-full select-none leading-none pt-0.5 font-bold font-sans text-sm">
                          <span className="text-blue-500 leading-none">G</span>
                        </div>
                        <span>Login with Google account</span>
                      </button>
                    </form>
                  ) : (
                    /* SIGN UP / CREATE VAULT FORM */
                    <form onSubmit={handleRegisterCredentials} className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono uppercase font-bold tracking-widest text-slate-400 block">CHOOSE USERNAME</label>
                        <input
                          type="text"
                          required
                          value={regUsername}
                          onChange={(e) => setRegUsername(e.target.value)}
                          placeholder="e.g. ankon"
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-1.8 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 font-sans"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-mono uppercase font-bold tracking-widest text-slate-400 block">EMAIL ADDRESS (optional)</label>
                        <input
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="e.g. name@g.com"
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-1.8 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 font-sans"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-mono uppercase font-bold tracking-widest text-slate-400 block">PASSWORD</label>
                        <input
                          type="password"
                          required
                          value={regPass}
                          onChange={(e) => setRegPass(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-1.8 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-mono uppercase font-bold tracking-widest text-slate-400 block">CONFIRM PASSWORD</label>
                        <input
                          type="password"
                          required
                          value={regConfirmPass}
                          onChange={(e) => setRegConfirmPass(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-1.8 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-indigo-500 hover:bg-indigo-600 active:translate-y-0.5 text-white font-bold tracking-wider uppercase text-[10px] h-9.5 rounded-xl shadow-lg shadow-indigo-600/10 cursor-pointer flex items-center justify-center gap-1.5 transition-all text-center mt-2"
                      >
                        <span>Create Local Privacy Vault</span>
                      </button>

                      {/* Divider line */}
                      <div className="flex items-center gap-3 text-slate-500 py-0.5">
                        <div className="flex-1 h-px bg-white/5" />
                        <span className="text-[9px] font-mono uppercase tracking-widest font-bold">OR</span>
                        <div className="flex-1 h-px bg-white/5" />
                      </div>

                      {/* Google Sign Up action */}
                      <button
                        type="button"
                        onClick={() => setShowGoogleOAuth(true)}
                        className="w-full h-9.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-md outline-none cursor-pointer"
                      >
                        {/* Custom Google inline icon */}
                        <div className="w-5 h-5 flex items-center justify-center bg-white border border-slate-100 rounded-full select-none leading-none pt-0.5 font-bold font-sans text-sm animate-pulse-slow">
                          <span className="text-blue-500 leading-none">G</span>
                        </div>
                        <span>Sign up with Google account</span>
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Continue As Guest Option with storage locked warning */}
              <div className="border-t border-white/5 pt-3.5 text-center flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsGuestMode(true);
                    localStorage.setItem("ai_guest_mode", "true");
                    showFeedbackAction("Browsing in Public Guest mode. Chats will not be permanently private.", "info");
                  }}
                  className="text-[11px] text-slate-400 hover:text-indigo-400 font-semibold cursor-pointer select-none underline decoration-dotted transition-colors hover:decoration-solid"
                >
                  🚀 Continue as Guest Operator (No account needed)
                </button>
                <p className="text-[8.5px] text-slate-500 max-w-xs mx-auto leading-normal">
                  Guest Mode runs in a shared local layout. Creating an isolated account guarantees complete log confidentiality between users.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Guest Lock overlay for secure actions representation */}
      <AnimatePresence>
        {showAuthOverlay && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl relative text-left"
            >
              <button 
                onClick={() => setShowAuthOverlay(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center pb-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">Access Secure Vault</h3>
                <p className="text-xs text-slate-400 mt-1">Please sign in to open separate private vaults and guard your history like a real website.</p>
              </div>

              <div className="space-y-3 mt-4">
                <button
                  onClick={() => {
                    setAuthTab("login");
                    setShowAuthOverlay(false);
                  }}
                  className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-xl text-center active:scale-95 transition-all outline-none"
                >
                  Secure Log In
                </button>
                <button
                  onClick={() => {
                    setAuthTab("signup");
                    setShowAuthOverlay(false);
                  }}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-200 text-xs font-semibold rounded-xl text-center active:scale-95 transition-all outline-none"
                >
                  Register New Account
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
      <aside className={`${mobileTab === "sessions" ? "flex flex-1 min-h-0" : "hidden"} md:flex md:flex-initial md:w-64 flex-col gap-4 flex-shrink-0`}>
        <div className="glass-panel p-5 flex flex-col flex-1 h-full rounded-2xl">
          
          {/* Sidebar Header Title */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 hover:bg-indigo-600 transition-colors flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
              SU
            </div>
            <div>
              <span className="font-bold text-white tracking-tight text-sm block">Subu AI</span>
              <span className="text-[10px] uppercase tracking-widest text-[#a5b4fc]/70 font-mono font-medium block">INTELLIGENT COMPANION</span>
            </div>
          </div>

          {/* Secure Privacy Account status bar */}
          {activeUser ? (
            <div className="glass-card mb-4 p-3 rounded-xl border border-indigo-500/10 flex items-center justify-between">
              <div className="flex items-center gap-2 max-w-[80%]">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-indigo-500/20 flex-shrink-0 overflow-hidden">
                  {activeUser.profilePic ? (
                    <img src={activeUser.profilePic} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  ) : (
                    activeUser.username.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-slate-100 text-xs truncate block">{activeUser.username}</span>
                    {activeUser.isGoogleUser && (
                      <span className="text-[7px] bg-indigo-500/20 text-[#a5b4fc] px-1 py-0.2 rounded font-mono uppercase font-bold shrink-0">G</span>
                    )}
                  </div>
                  <span className="text-[8px] text-emerald-400 font-mono flex items-center gap-1 font-bold leading-tight">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    VAULT LOCKED
                  </span>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-all cursor-pointer shrink-0"
                title="Secure Lock out session"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="glass-card mb-4 p-3 rounded-xl border border-amber-500/10 flex items-center justify-between">
              <div className="flex items-center gap-2 max-w-[70%]">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 font-bold text-xs flex-shrink-0">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-slate-300 text-xs truncate block leading-tight">Public Mode</span>
                  <span className="text-[7px] text-amber-400 font-mono block leading-none select-none uppercase font-bold">Unsaved Session</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setAuthTab("login");
                  setShowAuthOverlay(true);
                }}
                className="px-2.5 py-1.5 bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white font-bold text-[10px] rounded-lg transition-all cursor-pointer tracking-wider font-mono font-bold"
              >
                LOGIN
              </button>
            </div>
          )}

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
          <div className="mb-2 text-[10px] font-mono uppercase tracking-widest text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sessions History ({sessions.length})</span>
            </div>
            {sessionSearchQuery && (
              <span className="text-[9px] text-indigo-300 bg-indigo-505/10 font-mono px-1.5 py-0.2 rounded font-bold">
                Filtered
              </span>
            )}
          </div>

          {/* New Search Sessions Input */}
          <div className="mb-3 relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              placeholder="Filter by title..."
              value={sessionSearchQuery}
              onChange={(e) => setSessionSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-indigo-500/40 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none transition-all font-sans"
            />
            {sessionSearchQuery && (
              <button
                onClick={() => setSessionSearchQuery("")}
                className="absolute inset-y-0 right-2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sidebar Sessions List - Dynamic Storage Block */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[calc(100vh-280px)] md:max-h-none">
            <AnimatePresence initial={false}>
              {(() => {
                const filteredSessions = sessions.filter(s => 
                  String(s.title || "").toLowerCase().includes(sessionSearchQuery.toLowerCase())
                );

                if (filteredSessions.length === 0) {
                  return (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-6 px-4 bg-black/30 border border-white/5 rounded-xl"
                    >
                      <p className="text-xs text-slate-400">No matching sessions found</p>
                      {sessionSearchQuery && (
                        <button 
                          onClick={() => setSessionSearchQuery("")}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold font-mono uppercase tracking-wider mt-1.5 cursor-pointer underline underline-offset-2"
                        >
                          Clear Search
                        </button>
                      )}
                    </motion.div>
                  );
                }

                return filteredSessions.map((session) => {
                  const isActive = session.id === activeSessionId;
                  const isEditing = session.id === editingSessionId;

                  return (
                    <div key={session.id} className="relative overflow-hidden rounded-xl bg-rose-600/20 group/swipe">
                      {/* Swipe-to-delete backdrop indicator */}
                      <div 
                        onClick={(e) => deleteSession(session.id, e)}
                        className="absolute inset-y-0 right-0 w-24 bg-rose-600 hover:bg-rose-700 flex items-center justify-center text-white font-bold select-none cursor-pointer gap-1 transition-colors z-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-mono tracking-wider font-bold">DELETE</span>
                      </div>

                      <motion.div
                        layoutId={session.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        drag={isEditing ? false : "x"}
                        dragConstraints={{ left: -96, right: 0 }}
                        dragElastic={{ left: 0.15, right: 0 }}
                        onDragEnd={(event, info) => {
                          if (info.offset.x < -60) {
                            deleteSession(session.id);
                          }
                        }}
                        onClick={() => handleSessionSelect(session.id)}
                        className={`group relative z-10 w-full rounded-xl text-left px-3 py-2.5 transition-all cursor-pointer flex items-center justify-between select-none ${
                          isActive 
                            ? "bg-slate-900 border-l-4 border-indigo-400" 
                            : "bg-[#0b0f1a] hover:bg-slate-900/80 border border-white/5"
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
                    </div>
                  );
                });
              })()}
            </AnimatePresence>
          </div>

          {/* Config Launcher widget */}
          <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
            <button
              onClick={() => setShowSettingsDrawer(true)}
              className="w-full h-8 rounded-xl bg-white/5 border border-white/5 text-[10px] font-mono tracking-wider font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-400" />
              <span>LAUNCHER CONFIG</span>
            </button>

            <button
              onClick={handleDownloadProject}
              disabled={isZipping}
              className="w-full h-8 rounded-xl bg-[#059669]/10 hover:bg-[#059669]/15 border border-[#10b981]/25 text-[10px] font-mono tracking-wider font-semibold text-[#34d399] hover:text-[#6ee7b7] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download entire project files as ZIP archive"
            >
              <Download className={`w-3.5 h-3.5 ${isZipping ? "animate-bounce" : ""}`} />
              <span>{isZipping ? "ASSEMBLING ZIP..." : "DOWNLOAD WORKSPACE"}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container - Chat Panel Interface */}
      <main className={`${mobileTab === "chat" ? "flex flex-1 min-h-0" : "hidden"} md:flex flex-1 flex-col glass-panel overflow-hidden rounded-2xl relative`}>
        
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
              <p className="text-[10px] text-slate-400 font-mono tracking-wide">{PROVIDERS_CONFIG[provider]?.name || "AI"} Core Engine</p>
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
                {PROVIDERS_CONFIG[provider]?.models.map((m) => (
                  <option key={m.id} value={m.id} className="bg-slate-900 text-white">{m.id.substring(0, 15)}</option>
                ))}
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
        <div 
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-5 md:px-6 scroll-smooth"
        >
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
                      Authentication Alert / Credentials Missing
                    </h3>
                    <p className="text-xs text-rose-200/90 leading-relaxed font-sans">
                      The credentials for <strong>{PROVIDERS_CONFIG[provider].name}</strong> are either leaked, revoked, or missing. Let's fix this in 10 seconds!
                    </p>
                  </div>
                </div>

                <div className="bg-black/30 rounded-xl p-3.5 border border-white/5 space-y-3">
                  <div className="text-[11px] font-mono text-slate-300 space-y-1.5 list-none pl-0">
                    <div className="flex gap-2">
                      <span className="text-rose-400">1.</span>
                      <span>Retrieve your key from the official console: <a href={PROVIDERS_CONFIG[provider].portalUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 font-bold underline hover:text-indigo-300">{PROVIDERS_CONFIG[provider].portalName}</a></span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-rose-400">2.</span>
                      <span>Paste your key in the form below:</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 mt-2">
                    <input
                      type="password"
                      placeholder={PROVIDERS_CONFIG[provider].placeholderKey}
                      value={currentProviderKey}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProviderKeys(prev => ({
                          ...prev,
                          [provider]: val
                        }));
                      }}
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
                  {keyErrorMsg && (
                    <div className="text-[10px] text-rose-400 font-mono bg-rose-950/20 border border-rose-500/10 p-2 rounded-lg mt-1 overflow-x-auto">
                      Status: {keyErrorMsg}
                    </div>
                  )}
                </div>

                <p className="text-[10px] text-slate-400 font-mono italic">
                  *Your key is protected locally and only leaves your client to authenticate against the secure {PROVIDERS_CONFIG[provider].name} endpoint via our proxy server.
                </p>
              </motion.div>
            )}

            {keyStatus === "valid" && currentProviderKey && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono font-semibold uppercase tracking-wider text-[10px]">Secure {PROVIDERS_CONFIG[provider].name} Override Key Active</span>
                </div>
                <button
                  onClick={() => {
                    setProviderKeys(prev => ({
                      ...prev,
                      [provider]: ""
                    }));
                    showFeedbackAction(`Reverted to ${provider.toUpperCase()} environment variable settings`, "info");
                  }}
                  className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer underline decoration-dotted"
                >
                  Clear Dynamic Override Key
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
                  Hi, I am Subhashree (Subu AI). How can I help you today?
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
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 15, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
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
                    </motion.div>
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

        {/* Floating indicator to scroll to bottom with bouncy hover effect */}
        <AnimatePresence>
          {showScrollBottomBtn && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              onClick={scrollToBottom}
              className="absolute bottom-28 right-6 md:right-8 p-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl border border-indigo-500/30 z-20 cursor-pointer flex items-center justify-center gap-1.5 text-[11px] font-mono hover:scale-105 active:scale-95 transition-all outline-none font-semibold backdrop-blur-md"
              title="Scroll to latest messages"
            >
              <ChevronDown className="w-3.5 h-3.5 animate-bounce" style={{ animationDuration: '2s' }} />
              <span>Scroll to Bottom</span>
            </motion.button>
          )}
        </AnimatePresence>

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
      <aside className={`${mobileTab === "metrics" ? "flex flex-1 min-h-0" : "hidden"} md:flex md:flex-initial md:w-56 flex-col gap-4 flex-shrink-0`}>
        <div className="glass-panel p-5 flex flex-col gap-5 rounded-2xl flex-1 h-full justify-between overflow-y-auto">
          
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
            
            <div className="space-y-2.5">
              {/* Card 1: API / Key Verification Status */}
              <div className={`w-full h-12 bg-white/5 rounded-xl border-l-4 transition-all duration-300 flex items-center px-3 gap-2 ${
                keyStatus === "valid" ? "border-emerald-500" :
                keyStatus === "checking" ? "border-indigo-500 animate-pulse" :
                keyStatus === "invalid" || keyStatus === "leaked" ? "border-rose-500" :
                "border-amber-500"
              }`}>
                <div className={`p-1 rounded text-xs transition-colors duration-300 ${
                  keyStatus === "valid" ? "bg-emerald-500/15 text-emerald-400" :
                  keyStatus === "checking" ? "bg-indigo-500/15 text-indigo-400" :
                  keyStatus === "invalid" || keyStatus === "leaked" ? "bg-rose-500/15 text-rose-400" :
                  "bg-amber-500/15 text-amber-400"
                }`}>
                  <Laptop className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-white truncate uppercase tracking-tight leading-none mb-0.5">
                    {PROVIDERS_CONFIG[provider]?.name || "LLM Server"}
                  </p>
                  <p className="text-[8px] font-mono text-slate-400 leading-none truncate uppercase">
                    {keyStatus === "checking" ? "Verifying..." :
                     keyStatus === "valid" ? "API Verified" :
                     keyStatus === "invalid" || keyStatus === "leaked" ? "Invalid Key" :
                     "Key Required Mode"}
                  </p>
                </div>
              </div>

              {/* Card 2: Chat Length Metric */}
              <div className="w-full h-12 bg-white/5 rounded-xl border-l-4 border-purple-500 flex items-center px-3 gap-2">
                <div className="p-1 rounded bg-purple-500/15 text-purple-400">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-white leading-none mb-0.5">
                    {activeCharCount.toLocaleString()} Chars
                  </p>
                  <p className="text-[8px] font-mono text-slate-400 leading-none uppercase">
                    {messageCount} Message{messageCount === 1 ? "" : "s"} Active
                  </p>
                  <div className="h-1 w-full bg-white/10 rounded-full mt-1 overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(5, Math.round((activeCharCount / 30000) * 100)))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: Custom Persona (System Instructions) */}
              <div className="w-full h-12 bg-white/5 rounded-xl border-l-4 border-amber-500 flex items-center px-3 gap-2">
                <div className="p-1 rounded bg-amber-500/15 text-amber-400">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-white leading-none mb-0.5">
                    System Persona
                  </p>
                  <p className="text-[8px] font-mono text-slate-400 leading-none uppercase truncate">
                    {sysCharCount} Instruction Chars
                  </p>
                  <div className="h-1 w-full bg-white/10 rounded-full mt-1 overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(5, Math.round((sysCharCount / 1000) * 100)))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card 4: Web Search (Grounding) Status */}
              <div className={`w-full h-12 bg-white/5 rounded-xl border-l-4 flex items-center px-3 gap-2 transition-all duration-300 ${
                useSearch ? "border-teal-500" : "border-slate-600"
              }`}>
                <div className={`p-1 rounded transition-colors duration-300 ${
                  useSearch ? "bg-teal-500/15 text-teal-400" : "bg-slate-600/15 text-slate-400"
                }`}>
                  <Globe className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-white leading-none mb-0.5">
                    Web Grounding
                  </p>
                  <p className="text-[8px] font-mono text-slate-400 leading-none uppercase">
                    {useSearch ? "Live Search Active" : "Direct Response"}
                  </p>
                  <div className="h-1 w-full bg-white/10 rounded-full mt-1 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${useSearch ? "bg-teal-500" : "bg-slate-600"}`}
                      style={{ width: useSearch ? "100%" : "10%" }}
                    />
                  </div>
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

      {/* Bottom Mobile Tab Bar (sticky at bottom on max-md) */}
      <div className="md:hidden flex items-center justify-around h-16 w-full glass-panel rounded-2xl p-2 gap-1 border border-white/10 shrink-0">
        {[
          { id: "sessions", label: "Sessions", icon: MessageSquare },
          { id: "chat", label: "Subu Chat", icon: Bot },
          { id: "metrics", label: "Metrics", icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = mobileTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setMobileTab(tab.id as any);
                showFeedbackAction(`Switched to ${tab.label} panel`, "info");
              }}
              className={`flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-all relative ${
                isSelected 
                  ? "text-indigo-400 font-bold" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="mobile_tab_indicator"
                  className="absolute inset-0 bg-white/5 rounded-xl border border-white/5"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className={`w-4.5 h-4.5 mb-0.5 relative z-10 transition-transform ${isSelected ? "scale-110 active:scale-100" : ""}`} />
              <span className="text-[10px] font-mono tracking-wider relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

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
                
                {/* AI Model Workspace Provider */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block font-mono">
                    AI MODEL PROVIDER
                  </label>
                  <select
                    value={provider}
                    onChange={(e) => {
                      const nextProvider = e.target.value as any;
                      setProvider(nextProvider);
                      const defModel = PROVIDERS_CONFIG[nextProvider].models[0].id;
                      setModelName(defModel);
                      updateActiveSessionSettings({ provider: nextProvider, modelName: defModel });
                      showFeedbackAction(`Switched provider to ${PROVIDERS_CONFIG[nextProvider].name}`, "info");
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="openrouter" className="bg-slate-900 text-white">OpenRouter AI</option>
                    <option value="sambanova" className="bg-slate-900 text-white">SambaNova Systems</option>
                    <option value="groq" className="bg-slate-900 text-white">Groq (Llama / Mixtral)</option>
                    <option value="openai" className="bg-slate-900 text-white">OpenAI ChatGPT</option>
                    <option value="deepseek" className="bg-slate-900 text-white">DeepSeek Core (V3 / R1)</option>
                    <option value="anthropic" className="bg-slate-900 text-white">Anthropic Claude</option>
                  </select>
                  <span className="text-[10px] text-slate-400 block leading-relaxed font-sans">
                    Choose your AI engine power source. Alternate providers are fully supported as key overrides.
                  </span>
                </div>

                {/* Selected Provider Key Override */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex justify-between items-center font-mono">
                    <span>{provider.toUpperCase()} KEY OVERRIDE</span>
                    <span className="text-[10px] text-emerald-400 font-bold">{keyStatus === "valid" ? "VALIDATED" : ""}</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={currentProviderKey}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProviderKeys(prev => ({
                          ...prev,
                          [provider]: val
                        }));
                      }}
                      placeholder={PROVIDERS_CONFIG[provider].placeholderKey}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-600 font-mono"
                    />
                    {currentProviderKey && (
                      <button
                        onClick={() => {
                          setProviderKeys(prev => ({
                            ...prev,
                            [provider]: ""
                          }));
                          showFeedbackAction("Cleared override key", "info");
                        }}
                        type="button"
                        className="absolute right-3 top-2.5 text-xs text-rose-400 hover:text-white cursor-pointer hover:underline font-semibold"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 block leading-relaxed">
                    Local custom client sync. Retrieve your key securely at the <a href={PROVIDERS_CONFIG[provider].portalUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">{PROVIDERS_CONFIG[provider].portalName}</a>.
                  </span>
                </div>

                {/* Model Picker */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block font-mono">
                    LLM ENGINE MODEL
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
                    {PROVIDERS_CONFIG[provider].models.map((m) => (
                      <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 block leading-relaxed font-mono">
                    Flash is speedy for standard tasks, while Pro/Haiku/Sonnet/R1 handle intricate calculations.
                  </span>
                </div>

                {/* System Instruction Persona Block */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between font-mono">
                    <span>SYSTEM PERSONA INSTRUCTIONS</span>
                    <button
                      onClick={() => {
                        const def = "You are Subu AI, a friendly, extremely intelligent, and highly capable AI assistant. Your AI name is Subu AI, and your actual, real name is Subhashree (also referred to as Suboshree). Crucially, whenever the user greets you (such as saying 'hi', 'hello', 'hey', 'namaste', etc.), or when you introduce yourself, you must proudly introduce yourself by stating that your name is Subhashree (Subu AI), explaining that you are Subu AI but your real name is Subhashree or Suboshree, and ask how you can help them today. Answer all queries clearly, accurately, with beautiful layouts and responsive markdown formatting.";
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
              <div className="pt-4 border-t border-white/5 mt-6 text-center space-y-3 font-mono">
                <button
                  onClick={handleDownloadProject}
                  disabled={isZipping}
                  className="w-full h-9 rounded-xl bg-[#059669]/10 hover:bg-[#059669]/15 border border-[#10b981]/25 text-xs font-semibold text-[#34d399] hover:text-[#6ee7b7] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className={`w-4 h-4 ${isZipping ? "animate-bounce" : ""}`} />
                  <span>{isZipping ? "Assembling ZIP Archive..." : "Export Workspace as ZIP"}</span>
                </button>

                <p className="text-[9px] text-slate-500">
                  Server Port: 3000 | Handshake status: active
                </p>
                <button
                  onClick={() => setShowSettingsDrawer(false)}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/5 py-2 rounded-xl text-xs font-semibold text-slate-350 cursor-pointer"
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
