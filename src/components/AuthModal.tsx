import React, { useState } from "react";
import { 
  X, Mail, Lock, Sparkles, AlertCircle, 
  UserPlus, LogIn, ChevronRight, CheckCircle2
} from "lucide-react";
import { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  googleProvider 
} from "../firebase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onAuthSuccess: (user: any) => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  isDark,
  onAuthSuccess
}: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccessMsg(null);

    // Basic Validations
    if (!email.trim() || !password.trim()) {
      setAuthError("Email and Password are required parameters.");
      return;
    }

    if (password.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setAuthError("Passwords do not match. Please verify.");
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const uCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        setAuthSuccessMsg("Account successfully registered!");
        setTimeout(() => {
          onAuthSuccess(uCred.user);
          onClose();
        }, 800);
      } else {
        const uCred = await signInWithEmailAndPassword(auth, email.trim(), password);
        setAuthSuccessMsg("Signed in successfully!");
        setTimeout(() => {
          onAuthSuccess(uCred.user);
          onClose();
        }, 800);
      }
    } catch (err: any) {
      console.error("Authentication action failed:", err);
      let message = "An authentication error occurred.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        message = "Incorrect email address or password.";
      } else if (err.code === "auth/email-already-in-use") {
        message = "An account already exists with this email address.";
      } else if (err.code === "auth/weak-password") {
        message = "Password criteria not met. Choose a stronger password.";
      } else if (err.code === "auth/invalid-email") {
        message = "Please input a valid email address.";
      } else {
        message = err.message || message;
      }
      setAuthError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setAuthError(null);
    setAuthSuccessMsg(null);
    setLoading(true);

    try {
      const uCred = await signInWithPopup(auth, googleProvider);
      setAuthSuccessMsg("Google authentications loaded!");
      setTimeout(() => {
        onAuthSuccess(uCred.user);
        onClose();
      }, 800);
    } catch (err: any) {
      console.error("Google login failed", err);
      let message = "Google Sign-In failed or was interrupted.";
      if (err.code === "auth/popup-blocked") {
        message = "Your browser blocked the login popup. Please allow popups or try again.";
      } else {
        message = err.message || message;
      }
      setAuthError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background Dim */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-[#0F172A]/70 backdrop-blur-sm transition-all"
      ></div>

      {/* Modal Dialog Card */}
      <div className={`relative w-full max-w-md p-6 md:p-8 rounded-3xl border shadow-2xl transition-all duration-300 z-10 transform translate-y-0 ${
        isDark 
          ? "bg-[#0F172A] border-slate-800 text-slate-100" 
          : "bg-white border-zinc-200 text-zinc-800"
      }`}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-lg border transition-colors ${
            isDark 
              ? "border-slate-800 hover:bg-slate-800 text-slate-400" 
              : "border-zinc-200 hover:bg-zinc-100 text-zinc-500"
          }`}
          title="Dismiss Authentication"
        >
          <X size={16} />
        </button>

        {/* Branding & Welcome */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20 mb-3">
            <Sparkles size={22} />
          </div>
          <h2 className={`font-sans font-semibold tracking-tight text-xl md:text-2xl ${
            isDark ? "text-white" : "text-zinc-900"
          }`}>
            {isSignUp ? "Create Your Account" : "Welcome Back"}
          </h2>
          <p className={`text-xs mt-1 leading-relaxed ${isDark ? "text-slate-400" : "text-zinc-500"}`}>
            {isSignUp 
              ? "Register to securely back up, sync, and organize your conversation logs in the cloud." 
              : "Log in to retrieve and continue your safe conversational dialogues."}
          </p>
        </div>

        {/* Message Banner (Success / Error) */}
        {authError && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/25 p-3 rounded-xl flex items-start gap-2.5 text-rose-500 text-xs">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
            <span className="leading-relaxed">{authError}</span>
          </div>
        )}

        {authSuccessMsg && (
          <div className="mb-4 bg-emerald-500/10 border border-emerald-500/25 p-3 rounded-xl flex items-start gap-2.5 text-emerald-500 text-xs">
            <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0" />
            <span className="leading-relaxed font-semibold">{authSuccessMsg}</span>
          </div>
        )}

        {/* Form elements */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          
          {/* Email input field */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 font-mono opacity-80 ${
              isDark ? "text-slate-300" : "text-zinc-700"
            }`}>
              EMAIL ADDRESS
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 text-zinc-400" size={16} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className={`w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 ${
                  isDark 
                    ? "border-slate-800 text-white placeholder-slate-600 focus:border-indigo-500" 
                    : "border-zinc-200 text-zinc-800 placeholder-zinc-400 focus:border-indigo-400"
                }`}
              />
            </div>
          </div>

          {/* Password input field */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 font-mono opacity-80 ${
              isDark ? "text-slate-300" : "text-zinc-700"
            }`}>
              PASSWORD {isSignUp && <span className="opacity-40 italic font-sans font-normal">(Min 6 chars)</span>}
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 text-zinc-400" size={16} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className={`w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 ${
                  isDark 
                    ? "border-slate-800 text-white placeholder-slate-600 focus:border-indigo-500" 
                    : "border-zinc-200 text-zinc-800 placeholder-zinc-400 focus:border-indigo-400"
                }`}
              />
            </div>
          </div>

          {/* Confirm Password input field */}
          {isSignUp && (
            <div>
              <label className={`block text-xs font-semibold mb-1.5 font-mono opacity-80 ${
                isDark ? "text-slate-300" : "text-zinc-700"
              }`}>
                CONFIRM PASSWORD
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 text-zinc-400" size={16} />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••"
                  className={`w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 ${
                    isDark 
                      ? "border-slate-800 text-white placeholder-slate-600 focus:border-indigo-500" 
                      : "border-zinc-200 text-zinc-800 placeholder-zinc-400 focus:border-indigo-400"
                  }`}
                />
              </div>
            </div>
          )}

          {/* Standard authentication button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : isSignUp ? (
              <>
                <UserPlus size={16} />
                Create Free Account
              </>
            ) : (
              <>
                <LogIn size={16} />
                Sign In Security
              </>
            )}
          </button>
        </form>

        {/* Separator block */}
        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-zinc-200 dark:bg-slate-800"></div>
          <span className="text-[10px] font-bold font-mono text-zinc-400 tracking-wider">OR</span>
          <div className="flex-1 h-px bg-zinc-200 dark:bg-slate-800"></div>
        </div>

        {/* Alternate auth buttons */}
        <div className="space-y-3">
          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className={`w-full py-2.5 px-4 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2.5 ${
              isDark 
                ? "border-slate-800 hover:bg-slate-800 text-slate-200 bg-slate-900/40" 
                : "border-zinc-200 hover:bg-zinc-50 text-zinc-700 bg-white shadow-sm"
            }`}
          >
            {/* Direct Vector Google Icon */}
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.274 1.558-1.579 4.543-6.887 4.543-4.577 0-8.31-3.79-8.31-8.455S7.663 2.033 12.24 2.033c2.605 0 4.348 1.083 5.347 2.04l3.235-3.11c-2.076-1.938-4.767-3.12-8.582-3.12C5.46 1.843 0 7.28 0 14s5.46 12.157 12.24 12.157c7.08 0 11.785-4.98 11.785-11.97 0-.806-.086-1.423-.195-1.902H12.24z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Toggle between registration vs login */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setAuthError(null);
              setAuthSuccessMsg(null);
            }}
            className={`text-xs select-none hover:underline font-medium ${
              isDark ? "text-indigo-400" : "text-indigo-650"
            }`}
          >
            {isSignUp 
              ? "Already have an account? Sign in here" 
              : "Don't have an account yet? Register a free profile"}
          </button>
        </div>

      </div>
    </div>
  );
}
