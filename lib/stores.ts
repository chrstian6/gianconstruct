"use client";

import { create } from "zustand";

// Interface for ModalStore state
interface ModalStore {
  isLoginOpen: boolean;
  isCreateAccountOpen: boolean;
  setIsLoginOpen: (open: boolean) => void;
  setIsCreateAccountOpen: (open: boolean) => void;
}

// Interface for AuthStore state
interface AuthStore {
  user: {
    user_id: string;
    email: string;
    role: string;
  } | null;
  loading: boolean;
  setUser: (
    user: { user_id: string; email: string; role: string } | null
  ) => Promise<void>;
  setLoading: (loading: boolean) => void;
  clearUser: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useModalStore = create<ModalStore>((set) => ({
  isLoginOpen: false,
  isCreateAccountOpen: false,
  setIsLoginOpen: (open: boolean) => set({ isLoginOpen: open }),
  setIsCreateAccountOpen: (open: boolean) => set({ isCreateAccountOpen: open }),
}));

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: false,
  setUser: async (
    user: { user_id: string; email: string; role: string } | null
  ) => {
    set({ user });
    // Call Server Action to store session in Redis
    try {
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user }),
      });
      if (!response.ok) {
        console.error("Failed to set session:", response.statusText);
      }
    } catch (error) {
      console.error("Error setting session:", error);
    }
  },
  setLoading: (loading: boolean) => set({ loading }),
  clearUser: async () => {
    set({ user: null });
    // Call Server Action to clear session in Redis
    try {
      const response = await fetch("/api/auth/session", {
        method: "DELETE",
      });
      if (!response.ok) {
        console.error("Failed to clear session:", response.statusText);
      }
    } catch (error) {
      console.error("Error clearing session:", error);
    }
  },
  initialize: async () => {
    set({ loading: true });
    try {
      const response = await fetch("/api/auth/session");
      if (!response.ok) {
        console.error("Failed to fetch session:", response.statusText);
        return;
      }
      const data = await response.json();
      if (data.user) {
        set({ user: data.user });
      }
    } catch (error) {
      console.error("Failed to initialize session:", error);
    } finally {
      set({ loading: false });
    }
  },
}));
