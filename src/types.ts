export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isGenerating?: boolean;
  groundingMetadata?: any;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  modelName: string;
  systemInstruction?: string;
  temperature?: number;
  searchGrounding?: boolean;
}

export interface PresetPersona {
  id: string;
  name: string;
  description: string;
  icon: string; // Used to look up Lucide icons
  systemInstruction: string;
  suggestionPrompts: string[];
  themeColor: string; // Tailwind class color for UI accents (e.g., 'blue', 'purple', 'emerald')
}
