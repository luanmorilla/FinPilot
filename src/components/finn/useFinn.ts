"use client";

import { create } from "zustand";
import type { FinnMessage, FinnState } from "./types";

export const useFinn = create<FinnState>((set) => ({
  isOpen: false,
  isTyping: false,

  messages: [],

  open: () =>
    set({
      isOpen: true,
    }),

  close: () =>
    set({
      isOpen: false,
    }),

  setTyping: (value) =>
    set({
      isTyping: value,
    }),

  addMessage: (message: FinnMessage) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  clearMessages: () =>
    set({
      messages: [],
    }),
}));