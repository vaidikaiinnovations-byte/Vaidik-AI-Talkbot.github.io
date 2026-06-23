import React from "react";
import { 
  Sparkles, Code, PenTool, GraduationCap, Palette, Heart, ShieldCheck 
} from "lucide-react";
import { PresetPersona } from "../types";
import { PRESET_PERSONAS } from "../data";

interface PresetSelectorProps {
  onSelectPersona: (persona: PresetPersona) => void;
  onSelectPrompt: (prompt: string, persona: PresetPersona) => void;
  isDark: boolean;
}

export default function PresetSelector({
  onSelectPersona,
  onSelectPrompt,
  isDark
}: PresetSelectorProps) {
  
  const getIcon = (iconName: string, colorClass: string) => {
    switch (iconName) {
      case "Code":
        return <Code className={colorClass} size={22} />;
      case "PenTool":
        return <PenTool className={colorClass} size={22} />;
      case "GraduationCap":
        return <GraduationCap className={colorClass} size={22} />;
      case "Palette":
        return <Palette className={colorClass} size={22} />;
      case "Heart":
        return <Heart className={colorClass} size={22} />;
      case "Sparkles":
      default:
        return <Sparkles className={colorClass} size={22} />;
    }
  };

  const getThemeColors = (theme: string) => {
    switch (theme) {
      case "emerald":
        return {
          bg: "bg-emerald-500/10 hover:bg-emerald-500/15 dark:bg-emerald-500/5 dark:hover:bg-emerald-500/10",
          border: "border-emerald-300 dark:border-emerald-950/40 focus-within:ring-emerald-500",
          text: "text-emerald-700 dark:text-emerald-400"
        };
      case "amber":
        return {
          bg: "bg-amber-500/10 hover:bg-amber-500/15 dark:bg-amber-500/5 dark:hover:bg-amber-500/10",
          border: "border-amber-300 dark:border-amber-950/40 focus-within:ring-amber-500",
          text: "text-amber-700 dark:text-amber-400"
        };
      case "sky":
        return {
          bg: "bg-sky-500/10 hover:bg-sky-500/15 dark:bg-sky-500/5 dark:hover:bg-sky-500/10",
          border: "border-sky-300 dark:border-sky-950/40 focus-within:ring-sky-500",
          text: "text-sky-700 dark:text-sky-400"
        };
      case "rose":
        return {
          bg: "bg-rose-500/10 hover:bg-rose-500/15 dark:bg-rose-500/5 dark:hover:bg-rose-500/10",
          border: "border-rose-300 dark:border-rose-950/40 focus-within:ring-rose-500",
          text: "text-rose-700 dark:text-rose-400"
        };
      case "teal":
        return {
          bg: "bg-teal-500/10 hover:bg-teal-500/15 dark:bg-teal-500/5 dark:hover:bg-teal-500/10",
          border: "border-teal-300 dark:border-teal-950/40 focus-within:ring-teal-500",
          text: "text-teal-700 dark:text-teal-400"
        };
      default:
        return {
          bg: "bg-indigo-500/10 hover:bg-indigo-500/15 dark:bg-indigo-500/5 dark:hover:bg-indigo-500/10",
          border: "border-indigo-300 dark:border-indigo-950/40 focus-within:ring-indigo-500",
          text: "text-indigo-700 dark:text-indigo-400"
        };
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-16 flex flex-col justify-center min-h-full">
      {/* Intro Greetings */}
      <div className="text-center mb-10 md:mb-14">
        <h2 className={`font-sans font-medium tracking-tight text-3xl md:text-5xl leading-tight ${
          isDark ? "text-slate-100" : "text-zinc-900"
        }`}>
          How can I assist you <span className="text-indigo-600 dark:text-indigo-400">today?</span>
        </h2>
        <p className={`mt-3 max-w-xl mx-auto text-sm md:text-base leading-relaxed ${
          isDark ? "text-slate-400" : "text-zinc-500"
        }`}>
          Select one of our preset agent personas or select a topic below to initiate a custom, real-time streamed chat.
        </p>
      </div>

      {/* Preset Personas Grid list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {PRESET_PERSONAS.map((persona) => {
          const colors = getThemeColors(persona.themeColor);
          return (
            <div
              key={persona.id}
              className={`flex flex-col border rounded-2xl p-5 hover:scale-[1.01] transition-all duration-350 cursor-pointer ${
                isDark 
                  ? "bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60" 
                  : "bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-md"
              }`}
              onClick={() => onSelectPersona(persona)}
            >
              {/* Header */}
              <div className="flex items-center gap-3.5 mb-3.5">
                <div className={`p-2.5 rounded-xl ${colors.bg}`}>
                  {getIcon(persona.icon, colors.text)}
                </div>
                <div>
                  <h3 className={`font-semibold text-sm ${isDark ? "text-slate-100" : "text-zinc-900"}`}>
                    {persona.name}
                  </h3>
                  <span className={`text-[10px] font-mono tracking-wide uppercase font-semibold ${colors.text}`}>
                    {persona.themeColor} Core
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className={`text-xs leading-relaxed flex-grow opacity-85 mb-4 ${
                isDark ? "text-slate-400" : "text-zinc-600"
              }`}>
                {persona.description}
              </p>

              {/* Suggested Launchers */}
              <div className="space-y-1.5 mt-auto pt-3 border-t border-dashed border-zinc-200 dark:border-slate-800">
                <span className="text-[9px] font-bold font-mono tracking-wider text-zinc-400 dark:text-slate-500 uppercase block mb-1">
                  Suggested Prompts
                </span>
                {persona.suggestionPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPrompt(prompt, persona);
                    }}
                    className={`w-full text-left font-sans text-[11px] py-1.5 px-2 rounded-md truncate transition-all ${
                      isDark
                        ? "bg-slate-800/40 hover:bg-slate-800 text-slate-300 hover:text-white"
                        : "bg-zinc-100 hover:bg-indigo-50 hover:text-indigo-950 text-zinc-600"
                    }`}
                    title={prompt}
                  >
                    💡 {prompt}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Grounding Info / API Note footer bar */}
      <div className={`mt-12 p-4 rounded-xl border text-center flex flex-col md:flex-row items-center justify-center gap-3 ${
        isDark ? "bg-slate-900/20 border-slate-800" : "bg-zinc-50 border-zinc-200"
      }`}>
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-indigo-600 dark:text-indigo-400" size={16} />
          <span className={`text-xs font-medium ${isDark ? "text-slate-300" : "text-zinc-700"}`}>
            Secure Server-Side Grounding
          </span>
        </div>
        <span className="hidden md:inline text-zinc-300 dark:text-slate-700">|</span>
        <p className="text-[11px] text-zinc-400 leading-normal max-w-lg">
          None of your input is shared publicly. Your Gemini API key is managed securely on the backend. Double click conversation titles to rename them.
        </p>
      </div>
    </div>
  );
}
