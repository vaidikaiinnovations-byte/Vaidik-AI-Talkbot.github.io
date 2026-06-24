import React, { useState } from "react";
import { 
  MessageSquare, Plus, Trash2, Download, Upload, 
  Settings, Sliders, Sparkles, Globe, X, Menu,
  ChevronLeft, ChevronRight, HelpCircle, HardDrive, LogOut, LogIn,
  Search, Mic, MicOff
} from "lucide-react";
import { ChatSession, PresetPersona } from "../types";
import { AVAILABLE_MODELS } from "../data";
import { FirebaseUser } from "../firebase";

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: (persona?: PresetPersona) => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onUpdateSessionConfig: (id: string, updates: Partial<ChatSession>) => void;
  onExportHistory: () => void;
  onImportHistory: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  user: FirebaseUser | null;
  onSignOut: () => void;
  onOpenAuth: () => void;
}


export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  onUpdateSessionConfig,
  onExportHistory,
  onImportHistory,
  isDark,
  onToggleTheme,
  user,
  onSignOut,
  onOpenAuth,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchListening, setIsSearchListening] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSearchVoiceInput = () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Speech recognition is not supported in this browser.");
        return;
      }
      
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";
      
      rec.onstart = () => {
        setIsSearchListening(true);
      };
      
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsSearchListening(false);
      };
      
      rec.onerror = (err: any) => {
        console.error("Search voice error:", err);
        setIsSearchListening(false);
      };
      
      rec.onend = () => {
        setIsSearchListening(false);
      };
      
      rec.start();
    } catch (e) {
      console.error(e);
      setIsSearchListening(false);
    }
  };

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  const filteredSessions = sessions.filter(session => 
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleStartRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter") {
      handleSaveRename(id);
    } else if (e.key === "Escape") {
      setEditingId(null);
    }
  };

  return (
    <>
      {/* Mobile Menu trigger */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          id="mobile-sidebar-toggle"
          onClick={() => setIsOpen(!isOpen)}
          className={`p-2.5 rounded-xl shadow-lg border transition-all duration-300 ${
            isDark 
              ? "bg-[#1E293B] border-slate-700 text-slate-100 hover:bg-slate-800" 
              : "bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-50"
          }`}
          aria-label="Toggle Navigation Menu"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar container */}
      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r transition-all duration-300 ease-in-out md:static ${
          isOpen ? "w-80 translate-x-0" : "w-0 -translate-x-full md:w-0 md:translate-x-0 overflow-hidden"
        } ${
          isDark 
            ? "bg-[#0F172A] border-slate-800 text-slate-300" 
            : "bg-zinc-50 border-zinc-200 text-zinc-700"
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden w-80">
          
          {/* Header branding */}
          <div className={`p-5 border-b flex items-center justify-between ${
            isDark ? "border-slate-800 bg-[#0B0F19]" : "border-zinc-200 bg-zinc-100"
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-md shadow-indigo-500/20">
                <Sparkles size={20} />
              </div>
              <div>
                <h1 className={`font-sans font-semibold tracking-tight text-base ${isDark ? "text-white" : "text-zinc-900"}`}>
                  Vaidik AI Talkbot
                </h1>
                <p className="text-xs text-zinc-400 font-mono">Powered by Gemini</p>
              </div>
            </div>

            <button
              id="theme-toggler"
              onClick={onToggleTheme}
              className={`p-1.5 rounded-lg border transition-colors ${
                isDark 
                  ? "border-slate-700 hover:bg-slate-800 text-amber-400" 
                  : "border-zinc-200 hover:bg-zinc-200 text-indigo-600"
              }`}
              title="Switch Color Theme"
            >
              {isDark ? "☀️" : "🌙"}
            </button>
          </div>

          {/* Action Callouts */}
          <div className="p-4 space-y-2">
            <button
              id="new-chat-button"
              onClick={() => onNewSession()}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl transition-all shadow-md shadow-indigo-600/20 active:scale-[0.98]"
            >
              <Plus size={18} />
              Start New Dialogue
            </button>
          </div>

          {/* Voice Search filter input */}
          <div className="px-4 pb-2">
            <div className={`relative flex items-center rounded-xl border ${
              isDark 
                ? "bg-[#0B0F19] border-slate-800 focus-within:border-indigo-500" 
                : "bg-white border-zinc-200 focus-within:border-indigo-500 shadow-sm"
            }`}>
              <Search size={14} className="absolute left-3 text-zinc-400 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dialogue titles..."
                className={`w-full pl-9 pr-8 py-2 text-xs bg-transparent outline-none border-0 focus:ring-0 ${
                  isDark ? "text-slate-200 placeholder-slate-500" : "text-zinc-800 placeholder-zinc-400"
                }`}
              />
              <button
                type="button"
                onClick={handleSearchVoiceInput}
                className={`absolute right-2 p-1.5 rounded-lg transition-colors ${
                  isSearchListening
                    ? "bg-rose-500 text-white animate-pulse"
                    : isDark
                      ? "text-slate-400 hover:text-white hover:bg-slate-800"
                      : "text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100"
                }`}
                title="Search via voice query"
              >
                {isSearchListening ? <MicOff size={11} /> : <Mic size={11} />}
              </button>
            </div>
          </div>

          {/* Chat Sessions list scroll */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-xs font-semibold tracking-wider uppercase opacity-60 text-indigo-500 font-mono">
                Conversations
              </span>
              <span className="text-xs opacity-50 font-mono bg-zinc-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {filteredSessions.length}
              </span>
            </div>

            {filteredSessions.length === 0 ? (
              <div className="text-center py-8 px-4 opacity-50 text-xs">
                {searchQuery ? "No matches found." : "No conversations yet."}<br />
                {searchQuery ? "Try another search phrase." : "Click the button above to begin!"}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredSessions.map((session) => {
                  const isActive = session.id === activeSessionId;
                  return (
                    <div
                      key={session.id}
                      onClick={() => onSelectSession(session.id)}
                      className={`group flex items-center justify-between p-3 rounded-lg text-sm cursor-pointer transition-all duration-200 ${
                        isActive
                          ? isDark 
                            ? "bg-slate-800/80 text-white ring-1 ring-slate-700 shadow-sm" 
                            : "bg-indigo-50/80 text-indigo-900 ring-1 ring-indigo-100 shadow-sm font-medium"
                          : isDark
                            ? "hover:bg-slate-900/60 text-slate-400 hover:text-slate-200"
                            : "hover:bg-zinc-200/50 text-zinc-600 hover:text-zinc-900"
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
                        <MessageSquare
                          size={16}
                          className={`flex-shrink-0 ${
                            isActive ? "text-indigo-600" : "opacity-60"
                          }`}
                        />
                        {editingId === session.id ? (
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={() => handleSaveRename(session.id)}
                            onKeyDown={(e) => handleKeyPress(e, session.id)}
                            onClick={(e) => e.stopPropagation()}
                            className={`w-full bg-transparent border-b outline-none text-sm p-0 focus:border-indigo-500 ${
                              isDark ? "text-white border-slate-600" : "text-zinc-900 border-zinc-300"
                            }`}
                            autoFocus
                          />
                        ) : (
                          <span 
                            className="truncate select-none"
                            onDoubleClick={(e) => handleStartRename(session, e)}
                            title="Double-click to rename"
                          >
                            {session.title}
                          </span>
                        )}
                      </div>

                      {/* Hover action items */}
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        {editingId !== session.id && (
                          <button
                            onClick={(e) => handleStartRename(session, e)}
                            className="p-1 rounded hover:bg-zinc-300 dark:hover:bg-slate-700 opacity-70 hover:opacity-100"
                            title="Rename Conversation"
                          >
                            ✏️
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(session.id);
                          }}
                          className="p-1 rounded hover:bg-rose-500/10 text-rose-500/80 hover:text-rose-600"
                          title="Delete Conversation"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick config collapse box */}
          {activeSession && (
            <div className={`mx-3 mb-2 p-3 rounded-xl border transition-all ${
              showConfig 
                ? isDark ? "bg-slate-900/60 border-slate-800" : "bg-[#F8FAFC] border-zinc-200"
                : "border-transparent bg-transparent"
            }`}>
              <button
                onClick={() => setShowConfig(!showConfig)}
                className={`w-full flex items-center justify-between text-xs font-mono font-bold tracking-wider uppercase opacity-75 hover:opacity-100 transition-opacity ${
                  isDark ? "text-slate-300" : "text-zinc-700"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Sliders size={13} />
                  Session Settings
                </span>
                <span>{showConfig ? "▲" : "▼"}</span>
              </button>

              {showConfig && (
                <div className="mt-4 space-y-4 text-xs">
                  {/* Model Name Select */}
                  <div>
                    <label className="block font-medium opacity-80 mb-1.5 font-mono">MODEL SURFACE</label>
                    <select
                      value={activeSession.modelName}
                      onChange={(e) => onUpdateSessionConfig(activeSession.id, { modelName: e.target.value })}
                      className={`w-full p-2 rounded-lg border focus:ring-1 focus:ring-indigo-500 outline-none ${
                        isDark 
                          ? "bg-slate-800 border-slate-700 text-white" 
                          : "bg-white border-zinc-200 text-zinc-800"
                      }`}
                    >
                      {AVAILABLE_MODELS.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Search Grounding Option */}
                  <div className="flex items-center justify-between">
                    <div className="pr-2">
                      <span className="font-medium opacity-80 font-mono block">SEARCH GROUNDING</span>
                      <span className="text-[10px] text-zinc-400 leading-tight block">Use Google Search for real-time validation</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!activeSession.searchGrounding}
                        onChange={(e) => onUpdateSessionConfig(activeSession.id, { searchGrounding: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {/* Temperature Slider */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium opacity-80 font-mono">CREATIVITY (TEMP)</span>
                      <span className="font-mono">{activeSession.temperature ?? 0.7}</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.5"
                      step="0.1"
                      value={activeSession.temperature ?? 0.7}
                      onChange={(e) => onUpdateSessionConfig(activeSession.id, { temperature: parseFloat(e.target.value) })}
                      className="w-full accent-indigo-600 cursor-ew-resize bg-zinc-200 dark:bg-slate-700 rounded-lg h-1.5"
                    />
                    <div className="flex justify-between text-[9px] opacity-50 mt-0.5">
                      <span>Strict & Objective</span>
                      <span>Expressive & Creative</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bottom utils & imports */}
          <div className={`p-4 border-t space-y-3.5 ${
            isDark ? "border-slate-800 bg-[#0B0F19]" : "border-zinc-200 bg-zinc-100"
          }`}>
            {/* User Account / Sync Widget */}
            {user ? (
              <div className={`p-2.5 rounded-xl flex items-center justify-between gap-2.5 border ${
                isDark 
                  ? "bg-slate-900/40 border-slate-800/80" 
                  : "bg-white border-zinc-200 shadow-sm"
              }`}>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {user.email ? user.email.substring(0, 2).toUpperCase() : "U"}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold truncate ${isDark ? "text-slate-100" : "text-zinc-800"}`} title={user.email || ""}>
                      {user.email}
                    </p>
                    <p className="text-[9px] text-emerald-500 font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Cloud Sync Active
                    </p>
                  </div>
                </div>
                <button 
                  onClick={onSignOut}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors flex-shrink-0"
                  title="Sign Out Account"
                >
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <div className={`p-3 rounded-xl border ${
                isDark 
                  ? "bg-slate-900/20 border-slate-800/60" 
                  : "bg-white border-zinc-200 shadow-sm"
              }`}>
                <p className={`text-xs text-center mb-2.5 leading-normal ${isDark ? "text-slate-400" : "text-zinc-600"}`}>
                  Access your chat conversations from any device.
                </p>
                <button
                  onClick={onOpenAuth}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-sm"
                >
                  <LogIn size={13} />
                  Sign In / Create Account
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onExportHistory}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs rounded-lg border transition-all ${
                  isDark
                    ? "border-slate-800 bg-[#1E293B] hover:bg-slate-800 text-slate-300 hover:text-white"
                    : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 hover:text-zinc-950"
                }`}
                title="Save chat data locally as JSON file"
              >
                <Download size={13} />
                Backup Log
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs rounded-lg border transition-all ${
                  isDark
                    ? "border-slate-800 bg-[#1E293B] hover:bg-slate-800 text-slate-300 hover:text-white"
                    : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 hover:text-zinc-950"
                }`}
                title="Restore from previously exported JSON backup"
              >
                <Upload size={13} />
                Restore Log
              </button>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={onImportHistory}
                accept=".json"
                className="hidden"
              />
            </div>

            <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono text-center justify-center">
              <HardDrive size={11} />
              <span>{user ? "Cloud database synchronized" : "Saves securely to local browser cache"}</span>
            </div>
          </div>

        </div>
      </aside>

      {/* Floating Minimize/Maximize toggle handle for sidebars on Desktop */}
      <button
        id="toggle-desktop-sidebar"
        onClick={() => setIsOpen(!isOpen)}
        className={`hidden md:flex fixed bottom-6 left-6 z-50 p-2.5 rounded-full shadow-lg border transition-all items-center justify-center hover:scale-105 active:scale-95 ${
          isOpen
            ? isDark
              ? "bg-[#1E293B] hover:bg-slate-800 border-slate-700 text-slate-300"
              : "bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700"
            : "bg-indigo-600 hover:bg-indigo-700 text-white border-transparent"
        }`}
        title={isOpen ? "Collapse panel" : "Expand panel"}
      >
        {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>
    </>
  );
}
