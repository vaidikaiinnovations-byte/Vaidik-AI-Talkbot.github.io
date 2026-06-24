import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Send, Bot, User, Trash2, ArrowRight,
  RefreshCw, FileText, AlertCircle, Search, ExternalLink,
  BookOpen, Code, Lightbulb, ShieldCheck, HelpCircle,
  Mic, MicOff, Image, X
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import Sidebar from "./components/Sidebar";
import PresetSelector from "./components/PresetSelector";
import { ChatSession, Message, PresetPersona } from "./types";
import { PRESET_PERSONAS, AVAILABLE_MODELS } from "./data";
import { auth, onAuthStateChanged, FirebaseUser, signOut } from "./firebase";
import { saveSessionToFirestore, deleteSessionFromFirestore, loadSessionsFromFirestore, migrateGuestSessionsToCloud } from "./sync";
import AuthModal from "./components/AuthModal";


const generateUUID = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "id-" + Math.random().toString(36).substring(2, 15) + "-" + Date.now().toString(36);
};

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // Voice Speech & Image Search state
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<{ mimeType: string; data: string } | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // Initialize Speech Recognition API
  useEffect(() => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-US";

        rec.onstart = () => {
          setIsListening(true);
        };

        rec.onerror = (e: any) => {
          console.error("Speech recognition error:", e);
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInput((prev) => prev + (prev ? " " : "") + transcript);
          }
        };

        setRecognition(rec);
      }
    } catch (err) {
      console.error("Speech recognition initialization error:", err);
    }
  }, []);

  const handleToggleListening = () => {
    if (!recognition) {
      alert("Speech recognition is not fully supported on this platform/browser.");
      return;
    }
    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPG, JPEG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(",")[1];
      setSelectedImage({
        mimeType: file.type,
        data: base64Data
      });
      setImagePreviewUrl(result);
    };
    reader.onerror = (err) => {
      console.error("Reader failed to read image file as data URL:", err);
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setImagePreviewUrl(null);
  };

  // Load configuration and listen to Auth State Changes
  useEffect(() => {
    // 1. Initial theme load
    try {
      const themePref = localStorage.getItem("ai_chatbot_theme");
      if (themePref === "dark") {
        setIsDark(true);
      }
    } catch (e) {
      console.error("Failed to load local storage theme", e);
    }

    // 2. Setup auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        console.log("Firebase Authenticated:", currentUser.email);
        try {
          const cloudSessions = await loadSessionsFromFirestore(currentUser.uid);
          if (cloudSessions.length > 0) {
            setSessions(cloudSessions);
            setActiveSessionId(cloudSessions[0].id);
            localStorage.setItem("ai_chatbot_sessions", JSON.stringify(cloudSessions));
          } else {
            const localRaw = localStorage.getItem("ai_chatbot_sessions");
            if (localRaw) {
              const localSessions = JSON.parse(localRaw);
              if (Array.isArray(localSessions) && localSessions.length > 0) {
                console.log("Migrating local guest sessions to cloud account...");
                await migrateGuestSessionsToCloud(currentUser.uid, localSessions);
                const reloaded = await loadSessionsFromFirestore(currentUser.uid);
                setSessions(reloaded);
                setActiveSessionId(reloaded[0]?.id || null);
              }
            }
          }
        } catch (error) {
          console.error("Failed to sync/retrieve user's conversations:", error);
        }
      } else {
        console.log("Firebase Unauthenticated: Loading guest localStorage");
        const persisted = localStorage.getItem("ai_chatbot_sessions");
        if (persisted) {
          try {
            const parsed = JSON.parse(persisted);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setSessions(parsed);
              setActiveSessionId(parsed[0].id);
              return;
            }
          } catch (e) {
            console.error(e);
          }
        }
        setSessions([]);
        setActiveSessionId(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("ai_chatbot_sessions");
      setSessions([]);
      setActiveSessionId(null);
    } catch (err) {
      console.error("Sign out action failed:", err);
    }
  };

  // Save changes to local storage
  const saveSessions = (updatedSessions: ChatSession[]) => {
    setSessions(updatedSessions);
    try {
      localStorage.setItem("ai_chatbot_sessions", JSON.stringify(updatedSessions));
    } catch (e) {
      console.error("Failed to persist local storage state", e);
    }
  };

  // Toggle theme dark / light
  const handleToggleTheme = () => {
    const nextTheme = !isDark;
    setIsDark(nextTheme);
    localStorage.setItem("ai_chatbot_theme", nextTheme ? "dark" : "light");
  };

  // Create a new session with custom settings
  const handleNewSession = (persona?: PresetPersona) => {
    const defaultPersona = persona || PRESET_PERSONAS[0];
    const newSession: ChatSession = {
      id: generateUUID(),
      title: `${defaultPersona.name} Chat`,
      messages: [],
      createdAt: new Date().toLocaleTimeString(),
      modelName: "gemini-3.5-flash",
      systemInstruction: defaultPersona.systemInstruction,
      temperature: 0.7,
      searchGrounding: false
    };

    const nextSessions = [newSession, ...sessions];
    saveSessions(nextSessions);
    setActiveSessionId(newSession.id);
    setErrorText(null);

    if (user) {
      saveSessionToFirestore(user.uid, newSession).catch(err => console.error("Firestore sync error:", err));
    }
  };

  // Activate selected chat session
  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    setErrorText(null);
  };

  // Delete chat session
  const handleDeleteSession = (id: string) => {
    const filtered = sessions.filter(s => s.id !== id);
    saveSessions(filtered);
    if (activeSessionId === id) {
      setActiveSessionId(filtered.length > 0 ? filtered[0].id : null);
    }
    if (user) {
      deleteSessionFromFirestore(id).catch(err => console.error("Firestore delete error:", err));
    }
  };

  // Rename selected session
  const handleRenameSession = (id: string, newTitle: string) => {
    const updated = sessions.map(s => s.id === id ? { ...s, title: newTitle } : s);
    saveSessions(updated);

    const target = updated.find(s => s.id === id);
    if (user && target) {
      saveSessionToFirestore(user.uid, target).catch(err => console.error("Firestore rename sync error:", err));
    }
  };

  // Update session configuration values (such as model, temperature)
  const handleUpdateSessionConfig = (id: string, updates: Partial<ChatSession>) => {
    const updated = sessions.map(s => s.id === id ? { ...s, ...updates } : s);
    saveSessions(updated);

    const target = updated.find(s => s.id === id);
    if (user && target) {
      saveSessionToFirestore(user.uid, target).catch(err => console.error("Firestore config sync error:", err));
    }
  };

  // Backup and export chat logs to JSON
  const handleExportHistory = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sessions, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `ai-dialogue-backup-${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      setErrorText("Could not export history backup file.");
    }
  };

  // Restore chat logs from JSON
  const handleImportHistory = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = event.target.files;
    if (!files || files.length === 0) return;

    fileReader.onload = async (e) => {
      try {
        const payload = JSON.parse(e.target?.result as string);
        if (Array.isArray(payload)) {
          saveSessions(payload);
          if (payload.length > 0) {
            setActiveSessionId(payload[0].id);
          }
          if (user) {
            await migrateGuestSessionsToCloud(user.uid, payload);
            const cloudSess = await loadSessionsFromFirestore(user.uid);
            setSessions(cloudSess);
            if (cloudSess.length > 0) setActiveSessionId(cloudSess[0].id);
          }
          alert("Backup chat system restored successfully!");
        } else {
          setErrorText("Invalid backup schema shape.");
        }
      } catch (err) {
        setErrorText("Failed to parse the backup JSON file.");
      }
    };
    fileReader.readAsText(files[0]);
  };

  // Auto scroll down to the bottom
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessions, activeSessionId, isGenerating]);

  // Submit trigger
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if ((!query && !selectedImage) || isGenerating) return;

    setInput("");
    setErrorText(null);

    const imagePayload = selectedImage;
    setSelectedImage(null);
    setImagePreviewUrl(null);

    // If there's no active session, bootstrap one on-the-fly
    let currentSessionId = activeSessionId;
    let currentSession = sessions.find(s => s.id === currentSessionId);

    const initialTitleText = query || "Image Query";

    if (!currentSession) {
      const defaultPersona = PRESET_PERSONAS[0];
      const newSession: ChatSession = {
        id: generateUUID(),
        title: initialTitleText.length > 20 ? initialTitleText.substring(0, 20) + "..." : initialTitleText,
        messages: [],
        createdAt: new Date().toLocaleTimeString(),
        modelName: "gemini-3.5-flash",
        systemInstruction: defaultPersona.systemInstruction,
        temperature: 0.7,
        searchGrounding: false
      };
      
      const newSessions = [newSession, ...sessions];
      sessions.unshift(newSession); // Instantly mutate local to proceed securely
      currentSessionId = newSession.id;
      currentSession = newSession;
      setActiveSessionId(newSession.id);
    }

    // Append user message
    const userMessage: Message = {
      id: generateUUID(),
      role: "user",
      content: query || "Analyze this image.",
      timestamp: new Date().toLocaleTimeString(),
      ...(imagePayload ? { image: imagePayload } : {})
    };

    // Auto update empty/generic title if this is the first message
    let updatedTitle = currentSession.title;
    if (currentSession.messages.length === 0 && currentSession.title.endsWith("Chat")) {
      updatedTitle = query.length > 26 ? query.substring(0, 25) + "..." : query;
    }

    const placeholderBotMessage: Message = {
      id: generateUUID(),
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleTimeString(),
      isGenerating: true
    };

    const sessionMessages = [...currentSession.messages, userMessage, placeholderBotMessage];
    
    // Save state
    const nextSessions = sessions.map(s => 
      s.id === currentSessionId 
        ? { ...s, title: updatedTitle, messages: sessionMessages } 
        : s
    );
    saveSessions(nextSessions);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: sessionMessages.slice(0, -1), // Send user query + historical logs
          systemInstruction: currentSession.systemInstruction,
          temperature: currentSession.temperature,
          modelName: currentSession.modelName,
          searchGrounding: currentSession.searchGrounding
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned error status ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("Could not acquire SSE reader channel.");

      let streamText = "";
      let groundingData: any = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const dataText = line.substring(6).trim();
          if (dataText === "[DONE]") continue;

          let parsed;
          try {
            parsed = JSON.parse(dataText);
          } catch (e: any) {
            console.error("Failure parsing SSE data line:", e);
            continue;
          }

          if (parsed.error) {
            throw new Error(parsed.error);
          }

          if (parsed.text) {
            streamText += parsed.text;
            // Real-time incremental state update
            setSessions(prev => prev.map(s => {
              if (s.id === currentSessionId) {
                return {
                  ...s,
                  messages: s.messages.map(m => 
                    m.id === placeholderBotMessage.id ? { ...m, content: streamText } : m
                  )
                };
              }
              return s;
            }));
          }
          if (parsed.groundingMetadata) {
            groundingData = parsed.groundingMetadata;
            setSessions(prev => prev.map(s => {
              if (s.id === currentSessionId) {
                return {
                  ...s,
                  messages: s.messages.map(m => 
                    m.id === placeholderBotMessage.id ? { ...m, groundingMetadata: groundingData } : m
                  )
                };
              }
              return s;
            }));
          }
        }
      }

      // Finish generation and remove generating visual skeleton
      setSessions(prev => {
        const finalSessions = prev.map(s => {
          if (s.id === currentSessionId) {
            return {
              ...s,
              messages: s.messages.map(m => 
                m.id === placeholderBotMessage.id ? { ...m, isGenerating: false } : m
              )
            };
          }
          return s;
        });
        localStorage.setItem("ai_chatbot_sessions", JSON.stringify(finalSessions));

        if (user) {
          const completedSession = finalSessions.find(s => s.id === currentSessionId);
          if (completedSession) {
            saveSessionToFirestore(user.uid, completedSession).catch(err => 
              console.error("Firestore sync on stream completion failed:", err)
            );
          }
        }

        return finalSessions;
      });

    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || "An error occurred connecting to the service.");
      // Revoke live loader flag on error
      setSessions(prev => {
        const finalSessions = prev.map(s => {
          if (s.id === currentSessionId) {
            return {
              ...s,
              messages: s.messages.map(m => 
                m.id === placeholderBotMessage.id ? { ...m, isGenerating: false, content: m.content + "\n\n⚠️ *An error occurred stream processing this query.*" } : m
              )
            };
          }
          return s;
        });

        if (user) {
          const completedSession = finalSessions.find(s => s.id === currentSessionId);
          if (completedSession) {
            saveSessionToFirestore(user.uid, completedSession).catch(e => console.error(e));
          }
        }

        return finalSessions;
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Launch a prompt immediately upon selecting persona or prompt preview from start screen
  const handleLaunchPresetPrompt = (prompt: string, persona: PresetPersona) => {
    // 1. Create a session matching that persona
    const newSession: ChatSession = {
      id: generateUUID(),
      title: `${persona.name} Chat`,
      messages: [],
      createdAt: new Date().toLocaleTimeString(),
      modelName: "gemini-3.5-flash",
      systemInstruction: persona.systemInstruction,
      temperature: 0.7,
      searchGrounding: false
    };

    // Direct mutation to state first
    const nextSessions = [newSession, ...sessions];
    saveSessions(nextSessions);
    setActiveSessionId(newSession.id);
    setErrorText(null);

    if (user) {
      saveSessionToFirestore(user.uid, newSession).catch(err => console.error("Firestore sync error:", err));
    }

    // 2. Trigger send
    setTimeout(() => {
      handleSendMessage(prompt);
    }, 100);
  };

  // Choose a custom persona start point
  const handleSelectPersona = (persona: PresetPersona) => {
    handleNewSession(persona);
  };

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  return (
    <div className={`flex h-screen w-screen overflow-hidden font-sans transition-colors duration-300 ${
      isDark ? "bg-[#0B0F19] text-slate-100" : "bg-[#fdfdfd] text-slate-800"
    }`}>
      
      {/* Sidebar Panel */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onUpdateSessionConfig={handleUpdateSessionConfig}
        onExportHistory={handleExportHistory}
        onImportHistory={handleImportHistory}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        user={user}
        onSignOut={handleSignOut}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Container Area */}
      <main className={`flex-1 flex flex-col h-full relative overflow-hidden ${
        isDark ? "bg-[#0F172A]" : "bg-white"
      }`}>
        
        {/* Header - Professional Polish Layout */}
        <header className={`h-16 flex-shrink-0 px-6 flex items-center justify-between border-b ${
          isDark ? "bg-[#0B0F19] border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div className="flex items-center gap-3">
            {activeSession ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-150 dark:bg-slate-800/80 rounded-full border border-slate-200 dark:border-slate-700">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-bold uppercase tracking-wide tracking-tighter opacity-80 text-slate-700 dark:text-slate-200">
                  Model: {AVAILABLE_MODELS.find(m => m.id === activeSession.modelName)?.name || "Gemini"}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="text-indigo-600 dark:text-indigo-400" size={18} />
                <span className="text-sm font-semibold tracking-tight">Vaidik AI Talkbot</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick Helper Badge */}
            {activeSession && activeSession.searchGrounding && (
              <span className="text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 px-2 py-1 rounded-md flex items-center gap-1 font-bold">
                <Search size={11} /> Grounding Connected
              </span>
            )}
            
            {activeSession && (
              <button
                onClick={() => handleDeleteSession(activeSession.id)}
                className={`p-2 rounded-lg border transition-colors ${
                  isDark 
                    ? "border-slate-700 hover:bg-slate-800 text-rose-400" 
                    : "border-slate-200 hover:bg-slate-50 text-rose-600"
                }`}
                title="Wipe Out Dialogue"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </header>

        {/* Error Callout */}
        {errorText && (
          <div className="bg-rose-500/10 border-b border-rose-500/20 px-6 py-3 flex items-center justify-between gap-3 text-rose-500 text-xs">
            <span className="flex items-center gap-2 font-medium">
              <AlertCircle size={15} />
              {errorText}
            </span>
            <button 
              onClick={() => setErrorText(null)} 
              className="hover:scale-105 active:scale-95 font-bold font-mono opacity-80 hover:opacity-100"
            >
              [Dismiss]
            </button>
          </div>
        )}

        {/* Dynamic Center Stage Area */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-[#fdfdfd] dark:bg-[#0F172A]">
          {!activeSession || activeSession.messages.length === 0 ? (
            <PresetSelector
              onSelectPersona={handleSelectPersona}
              onSelectPrompt={handleLaunchPresetPrompt}
              isDark={isDark}
            />
          ) : (
            <div className="max-w-4xl mx-auto px-6 py-8 space-y-6 md:space-y-8">
              
              {/* Persona Context Card */}
              <div className={`p-4 rounded-xl border border-dashed flex items-center gap-4 ${
                isDark 
                  ? "bg-slate-900/30 border-slate-800/80 text-slate-300"
                  : "bg-indigo-50/20 border-indigo-200/60 text-slate-700"
              }`}>
                <div className="p-2 bg-indigo-600 text-white rounded-lg">
                  <Bot size={18} />
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-indigo-700 dark:text-indigo-400 tracking-tight">Active Conversation Persona</h4>
                  <p className="text-[11px] opacity-80 leading-relaxed">
                    Custom context filters and system cues are actively guiding responses. Customize models and parameters in the sidebar.
                  </p>
                </div>
              </div>

              {/* Message List */}
              {activeSession.messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div 
                    key={msg.id} 
                    className={`flex gap-4 max-w-4xl ${
                      isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    {/* AVATAR LEFT side for Bot */}
                    {!isUser && (
                      <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-indigo-950 flex-shrink-0 flex items-center justify-center text-white dark:text-indigo-300 font-bold text-xs border border-slate-700 dark:border-indigo-900">
                        <Bot size={15} />
                      </div>
                    )}

                    {/* Content Box */}
                    <div className={`flex-1 max-w-[85%] ${isUser ? "text-right" : "text-left"}`}>
                      <div className={`text-xs font-semibold mb-1 opacity-60 ${
                        isDark ? "text-slate-300" : "text-slate-600"
                      }`}>
                        {isUser ? "You" : "Assistant"} • {msg.timestamp}
                      </div>

                      <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        isUser 
                          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/10 rounded-tr-none text-left" 
                          : isDark
                            ? "bg-slate-900/60 border border-slate-800 text-slate-200 rounded-tl-none"
                            : "bg-[#f8fafc] border border-slate-200 text-slate-800 rounded-tl-none shadow-sm"
                      }`}>
                        {msg.image && (
                          <div className="mb-3 max-w-xs md:max-w-sm rounded-xl overflow-hidden border border-zinc-200/20 dark:border-slate-800/80 shadow-sm bg-white dark:bg-slate-950">
                            <img 
                              src={`data:${msg.image.mimeType};base64,${msg.image.data}`} 
                              alt="Uploaded context" 
                              className="w-full h-auto object-contain max-h-60"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}

                        {msg.content === "" && msg.isGenerating ? (
                          <div className="flex items-center gap-2.5 py-1 text-zinc-400">
                            <RefreshCw className="animate-spin" size={14} />
                            <span className="font-mono text-xs animate-pulse font-medium">Formulating streamed answer...</span>
                          </div>
                        ) : (
                          <div className="prose dark:prose-invert prose-xs max-w-none break-words">
                            <ReactMarkdown
                              components={{
                                code({ node, className, children, ...props }) {
                                  const match = /language-(\w+)/.exec(className || "");
                                  return match ? (
                                    <pre className="bg-slate-950 text-emerald-400 p-3 rounded-lg overflow-x-auto my-2 text-xs font-mono">
                                      <code className={className} {...props}>
                                        {children}
                                      </code>
                                    </pre>
                                  ) : (
                                    <code className="bg-slate-200/70 dark:bg-slate-800 text-rose-600 dark:text-rose-400 px-1 py-0.5 rounded text-xs font-mono" {...props}>
                                      {children}
                                    </code>
                                  );
                                },
                                p({ children }) {
                                  return <p className="mb-2 last:mb-0 leading-relaxed font-sans">{children}</p>;
                                },
                                ul({ children }) {
                                  return <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>;
                                },
                                ol({ children }) {
                                  return <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>;
                                },
                                li({ children }) {
                                  return <li className="leading-relaxed">{children}</li>;
                                }
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        )}

                        {/* Search Grounding Citation Box */}
                        {msg.groundingMetadata && (
                          <div className="mt-4 pt-3 border-t border-dashed border-zinc-300 dark:border-slate-800">
                            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">
                              <Search size={12} />
                              Search Grounding Citations
                            </div>
                            
                            {/* Queries used */}
                            {msg.groundingMetadata.webSearchQueries && (
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                <span className="text-[10px] text-zinc-400 dark:text-slate-500 font-mono mt-0.5">Queries:</span>
                                {msg.groundingMetadata.webSearchQueries.map((q: string, idx: number) => (
                                  <span key={idx} className="bg-zinc-200/50 dark:bg-slate-800 text-zinc-500 dark:text-slate-400 text-[10px] px-1.5 py-0.5 rounded font-mono">
                                    "{q}"
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Verification sources list */}
                            {msg.groundingMetadata.groundingChunks && (
                              <div className="space-y-1.5">
                                {msg.groundingMetadata.groundingChunks.map((chunk: any, chunkIdx: number) => {
                                  if (!chunk.web?.uri) return null;
                                  return (
                                    <a
                                      key={chunkIdx}
                                      href={chunk.web.uri}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-900 text-[11px] transition-all"
                                    >
                                      <span className="font-medium text-zinc-600 dark:text-slate-300 truncate max-w-[280px] md:max-w-[450px]">
                                        🔗 {chunk.web.title || chunk.web.uri}
                                      </span>
                                      <span className="text-zinc-400 dark:text-slate-500 flex items-center gap-1 flex-shrink-0 ml-2">
                                        Visit Source <ExternalLink size={10} />
                                      </span>
                                    </a>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* AVATAR RIGHT side for User */}
                    {isUser && (
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex-shrink-0 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-xs border border-indigo-200 dark:border-indigo-900">
                        <User size={15} />
                      </div>
                    )}

                  </div>
                );
              })}

              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input Bar Area - Professional Polish styling applied with voice & image keys */}
        <div className={`p-6 md:p-8 flex-shrink-0 border-t ${
          isDark ? "bg-[#0B0F19] border-slate-800" : "bg-[#fafafa] border-slate-200"
        }`}>
          <div className="max-w-4xl mx-auto">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
            >
              <div className={`rounded-2xl border shadow-sm p-2 transition-all duration-200 ${
                isDark 
                  ? "bg-slate-900 border-slate-800 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20" 
                  : "bg-white border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-400/20"
              }`}>
                {/* Optional Image Preview strip */}
                {imagePreviewUrl && (
                  <div className="flex items-center gap-3 p-3 border-b border-zinc-100 dark:border-slate-800/60">
                    <div className="relative group w-16 h-16 rounded-xl overflow-hidden border border-zinc-200 dark:border-slate-700 bg-zinc-50 dark:bg-slate-950 flex-shrink-0">
                      <img 
                        src={imagePreviewUrl} 
                        alt="Attachment preview" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={handleClearImage}
                        className="absolute top-1 right-1 p-0.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow"
                        title="Remove image attachment"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-700 dark:text-slate-300">Image attachment selected</p>
                      <p className="text-[10px] text-zinc-400 dark:text-slate-500 font-mono">Ready to analyze with Vaidik AI innovations</p>
                    </div>
                  </div>
                )}

                {/* Text Input area */}
                <div className="relative flex items-end">
                  <textarea
                    rows={2}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={isGenerating}
                    placeholder={
                      isGenerating 
                        ? "Streaming answer, please wait..." 
                        : recognition 
                          ? "Message or tap Mic to dictate / Image to attach..." 
                          : "Ask a follow-up or query another topic..."
                    }
                    className="w-full px-4 py-3 bg-transparent outline-none resize-none text-sm border-0 focus:ring-0 focus:outline-none text-slate-800 dark:text-slate-100 placeholder-zinc-400 dark:placeholder-slate-500"
                  />
                </div>

                {/* Toolbar Actions Bar */}
                <div className="flex items-center justify-between px-3 py-1.5 border-t border-zinc-50 dark:border-slate-800/40">
                  <div className="flex items-center gap-2">
                    {/* Image input selector */}
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        disabled={isGenerating}
                      />
                      <div className={`p-2 rounded-xl transition-all hover:scale-105 ${
                        isDark 
                          ? "text-slate-400 hover:text-white hover:bg-slate-800" 
                          : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                      }`} title="Attach photo or screen capture for analysis">
                        <Image size={18} />
                      </div>
                    </label>

                    {/* Speech input mic trigger */}
                    <button
                      type="button"
                      onClick={handleToggleListening}
                      disabled={isGenerating}
                      className={`p-2 rounded-xl transition-all hover:scale-105 relative ${
                        isListening
                          ? "bg-rose-500 text-white animate-pulse"
                          : isDark
                            ? "text-slate-400 hover:text-white hover:bg-slate-800"
                            : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                      }`}
                      title={isListening ? "Listening... click to stop" : "Dictate via voice input"}
                    >
                      {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                      {isListening && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                        </span>
                      )}
                    </button>
                    
                    {isListening && (
                      <span className="text-[10px] font-mono text-rose-500 animate-pulse font-semibold">
                        Listening voice input...
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {input.trim() && (
                      <button
                        type="button"
                        onClick={() => setInput("")}
                        className="p-1.5 px-2 rounded-lg text-xs font-semibold opacity-60 hover:opacity-100 hover:bg-zinc-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        Clear
                      </button>
                    )}
                    
                    <button
                      type="submit"
                      disabled={(!input.trim() && !selectedImage) || isGenerating}
                      className={`px-4 py-2 rounded-xl shadow transition-all duration-200 text-xs font-semibold flex items-center gap-1.5 ${
                        (!input.trim() && !selectedImage) || isGenerating
                          ? "bg-zinc-100 dark:bg-slate-800 text-zinc-400 dark:text-slate-600 cursor-not-allowed shadow-none"
                          : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-indigo-600/10"
                      }`}
                      title="Send Dialogue Query"
                    >
                      <span>Send</span>
                      <Send size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </form>
            <div className="mt-2 text-center text-xs text-zinc-400 dark:text-slate-500 font-sans space-y-0.5">
              <p className="font-semibold text-zinc-500 dark:text-slate-400">Developed by Vaidik AI innovations</p>
              <p className="text-[10px] font-mono opacity-85">Where intelligence meets innovations</p>
            </div>
          </div>
        </div>

      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        isDark={isDark}
        onAuthSuccess={(u) => {
          setUser(u);
        }}
      />

    </div>
  );
}
