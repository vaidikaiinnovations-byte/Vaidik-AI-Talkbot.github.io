import React, { useState } from "react";
import { X, LogIn, Sparkles, Shield, AlertCircle } from "lucide-react";
import { signInWithPopup, googleProvider, auth, FirebaseUser } from "../firebase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onAuthSuccess: (user: FirebaseUser) => void;
}

export default function AuthModal({ isOpen, onClose, isDark, onAuthSuccess }: AuthModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        onAuthSuccess(result.user);
        onClose();
      }
    } catch (err: any) {
      console.error("Authentication Error:", err);
      setError(err.message || "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className={`relative w-full max-w-md p-6 rounded-2xl border shadow-xl transform transition-all duration-300 animate-in fade-in zoom-in-95 ${
        isDark 
          ? "bg-[#0B0F19] border-slate-800 text-slate-100" 
          : "bg-white border-slate-100 text-slate-800"
      }`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors ${
            isDark ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
          }`}
        >
          <X size={16} />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center mt-2">
          {/* Brand Visual */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
            isDark ? "bg-indigo-900/40 text-indigo-400" : "bg-indigo-50 text-indigo-600"
          }`}>
            <Sparkles size={24} />
          </div>

          <h2 className="text-xl font-bold tracking-tight">Sync conversations to Cloud</h2>
          <p className={`text-xs mt-1.5 max-w-xs ${isDark ? "text-slate-400" : "text-zinc-500"}`}>
            Securely save your conversations with AI VAIDIK Talkbot and resume them on any device.
          </p>

          {error && (
            <div className="mt-4 w-full flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs text-left animate-shake">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className={`mt-6 w-full flex items-center justify-center gap-2.5 py-3 px-4 text-sm font-semibold rounded-xl transition-all shadow-md ${
              loading 
                ? "bg-zinc-200 dark:bg-slate-800 text-zinc-400 dark:text-slate-600 cursor-not-allowed shadow-none" 
                : "bg-indigo-600 hover:bg-indigo-700 text-white active:scale-[0.98] shadow-indigo-600/10 hover:shadow-indigo-600/20"
            }`}
          >
            <LogIn size={16} />
            {loading ? "Connecting to Google..." : "Continue with Google Account"}
          </button>

          {/* Trust/Privacy Note */}
          <div className="mt-6 flex items-center justify-center gap-1.5 opacity-60">
            <Shield size={12} className={isDark ? "text-indigo-400" : "text-indigo-600"} />
            <span className="text-[10px] font-mono tracking-tight">Zero-Trust Google Identity Verification</span>
          </div>
        </div>
      </div>
    </div>
  );
}
