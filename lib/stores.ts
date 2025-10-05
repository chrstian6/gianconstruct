// lib/stores.ts
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { IInventory } from "@/types/Inventory";

// Define User type for user management
interface User {
  user_id: string;
  firstName: string;
  lastName: string;
  address: string;
  contactNo?: string;
  email: string;
  role: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ModalStore {
  // Auth modals
  isLoginOpen: boolean;
  isCreateAccountOpen: boolean;

  // Design modals
  isDeleteDesignOpen: boolean;
  designIdToDelete: string | null;

  // Project modals
  isCreateProjectOpen: boolean;
  isEditProjectOpen: boolean;
  editingProject: any | null;

  // Inventory modals
  isEditInventoryOpen: boolean;
  editingInventory: IInventory | null;

  // User management modals
  isEditUserOpen: boolean;
  editingUser: User | null;

  // Modal control methods
  setIsLoginOpen: (open: boolean) => void;
  setIsCreateAccountOpen: (open: boolean) => void;
  setIsDeleteDesignOpen: (open: boolean, designId?: string) => void;
  setIsCreateProjectOpen: (open: boolean) => void;
  setIsEditProjectOpen: (open: boolean, project?: any) => void;
  setIsEditInventoryOpen: (
    open: boolean,
    inventory?: IInventory | null
  ) => void;
  setIsEditUserOpen: (open: boolean, user?: User | null) => void;
}

interface AuthStore {
  user: {
    user_id: string;
    firstName?: string;
    email: string;
    role: string;
  } | null;
  loading: boolean;
  initialized: boolean;
  setUser: (
    user: {
      user_id: string;
      firstName?: string;
      email: string;
      role: string;
    } | null
  ) => Promise<void>;
  setLoading: (loading: boolean) => void;
  clearUser: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useModalStore = create<ModalStore>((set) => ({
  // Initial state
  isLoginOpen: false,
  isCreateAccountOpen: false,
  isDeleteDesignOpen: false,
  isCreateProjectOpen: false,
  isEditProjectOpen: false,
  isEditInventoryOpen: false,
  isEditUserOpen: false,

  designIdToDelete: null,
  editingProject: null,
  editingInventory: null,
  editingUser: null,

  // Modal control methods
  setIsLoginOpen: (open: boolean) => {
    set({ isLoginOpen: open });
  },

  setIsCreateAccountOpen: (open: boolean) => {
    set({ isCreateAccountOpen: open });
  },

  setIsDeleteDesignOpen: (open: boolean, designId?: string) => {
    set({
      isDeleteDesignOpen: open,
      designIdToDelete: open ? (designId ?? null) : null,
    });
    if (!open) {
      window.location.reload();
    }
  },

  setIsCreateProjectOpen: (open: boolean) => {
    set({ isCreateProjectOpen: open });
    if (!open) {
      window.location.reload();
    }
  },

  setIsEditProjectOpen: (open: boolean, project?: any) => {
    set({
      isEditProjectOpen: open,
      editingProject: open ? project : null,
    });
    if (!open) {
      window.location.reload();
    }
  },

  setIsEditInventoryOpen: (open: boolean, inventory?: IInventory | null) => {
    set({
      isEditInventoryOpen: open,
      editingInventory: open ? inventory : null,
    });
    if (!open) {
      window.location.reload();
    }
  },

  setIsEditUserOpen: (open: boolean, user?: User | null) => {
    set({
      isEditUserOpen: open,
      editingUser: open ? user : null,
    });
    if (!open) {
      window.location.reload();
    }
  },
}));

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      loading: true,
      initialized: false,

      setUser: async (
        user: {
          user_id: string;
          firstName?: string;
          email: string;
          role: string;
        } | null
      ) => {
        set({ user, loading: false });
      },

      setLoading: (loading: boolean) => set({ loading }),

      clearUser: async () => {
        set({ user: null, initialized: false, loading: false });
        try {
          const response = await fetch("/api/auth/session", {
            method: "DELETE",
            credentials: "include",
          });
          if (!response.ok) {
            console.error("Failed to clear session:", response.statusText);
            throw new Error(`Failed to clear session: ${response.statusText}`);
          }
        } catch (error) {
          console.error("Error clearing session:", error);
        }
      },

      initialize: async () => {
        const { initialized } = get();

        if (initialized) {
          set({ loading: false });
          return;
        }

        set({ loading: true });
        try {
          const response = await fetch("/api/auth/session", {
            credentials: "include",
          });
          if (!response.ok) {
            set({ loading: false, initialized: true });
            return;
          }
          const data = await response.json();
          set({
            user: data.user
              ? {
                  user_id: data.user.user_id,
                  firstName: data.user.name,
                  email: data.user.email,
                  role: data.user.role || "user",
                }
              : null,
            loading: false,
            initialized: true,
          });
        } catch (error) {
          console.error("Failed to initialize session:", error);
          set({ loading: false, initialized: true });
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        initialized: state.initialized,
      }),
    }
  )
);
