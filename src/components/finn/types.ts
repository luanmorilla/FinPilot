export type FinnRole = "user" | "assistant";

export interface FinnMessage {
  id: string;
  role: FinnRole;
  content: string;
  createdAt: string;
}

export interface FinnSuggestion {
  id: string;
  label: string;
  prompt: string;
}

export interface FinnState {
  isOpen: boolean;
  isTyping: boolean;
  messages: FinnMessage[];

  open: () => void;
  close: () => void;

  setTyping: (value: boolean) => void;

  addMessage: (message: FinnMessage) => void;

  clearMessages: () => void;
}