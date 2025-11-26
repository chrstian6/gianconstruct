// lib/stores.ts
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { IInventory } from "@/types/Inventory";
import { ISupplier } from "@/types/supplier";
import { Project } from "@/types/project"; // Import your actual Project type

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

interface CreateAccountData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
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
  editingProject: Project | null;

  // Inventory modals
  isEditInventoryOpen: boolean;
  editingInventory: IInventory | null;

  // Supplier modals
  isCreateSupplierOpen: boolean;
  isViewSupplierOpen: boolean;
  viewingSupplier: ISupplier | null;

  // User management modals
  isEditUserOpen: boolean;
  editingUser: User | null;

  // Timeline modals
  isAddTimelineUpdateOpen: boolean;
  timelineProject: Project | null;

  // Create account from notification
  createAccountData: CreateAccountData | null;

  // Modal control methods
  setIsLoginOpen: (open: boolean) => void;
  setIsCreateAccountOpen: (open: boolean) => void;
  setIsDeleteDesignOpen: (open: boolean, designId?: string) => void;
  setIsCreateProjectOpen: (open: boolean) => void;
  setIsEditProjectOpen: (open: boolean, project?: Project | null) => void;
  setIsEditInventoryOpen: (
    open: boolean,
    inventory?: IInventory | null
  ) => void;
  setIsCreateSupplierOpen: (open: boolean) => void;
  setIsViewSupplierOpen: (open: boolean, supplier?: ISupplier | null) => void;
  setIsEditUserOpen: (open: boolean, user?: User | null) => void;
  setIsAddTimelineUpdateOpen: (open: boolean, project?: Project | null) => void;
  setCreateAccountData: (data: CreateAccountData | null) => void;
}

interface AuthStore {
  user: {
    user_id: string;
    firstName?: string;
    lastName?: string;
    contactNo?: string;
    email: string;
    role: string;
    avatar?: string;
  } | null;
  loading: boolean;
  initialized: boolean;
  setUser: (
    user: {
      user_id: string;
      firstName?: string;
      lastName?: string;
      contactNo?: string;
      email: string;
      role: string;
      avatar?: string;
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
  isCreateSupplierOpen: false,
  isViewSupplierOpen: false,
  isEditUserOpen: false,
  isAddTimelineUpdateOpen: false,

  designIdToDelete: null,
  editingProject: null,
  editingInventory: null,
  viewingSupplier: null,
  editingUser: null,
  timelineProject: null,
  createAccountData: null,

  // Modal control methods
  setIsLoginOpen: (open: boolean) => {
    set({ isLoginOpen: open });
  },

  setIsCreateAccountOpen: (open: boolean) => {
    set({ isCreateAccountOpen: open });
    if (!open) {
      set({ createAccountData: null });
    }
  },

  setIsDeleteDesignOpen: (open: boolean, designId?: string) => {
    set({
      isDeleteDesignOpen: open,
      designIdToDelete: open ? (designId ?? null) : null,
    });
  },

  setIsCreateProjectOpen: (open: boolean) => {
    set({ isCreateProjectOpen: open });
  },

  setIsEditProjectOpen: (open: boolean, project?: Project | null) => {
    set({
      isEditProjectOpen: open,
      editingProject: open ? project : null,
    });
  },

  setIsEditInventoryOpen: (open: boolean, inventory?: IInventory | null) => {
    set({
      isEditInventoryOpen: open,
      editingInventory: open ? inventory : null,
    });
  },

  setIsCreateSupplierOpen: (open: boolean) => {
    set({ isCreateSupplierOpen: open });
  },

  setIsViewSupplierOpen: (open: boolean, supplier?: ISupplier | null) => {
    set({
      isViewSupplierOpen: open,
      viewingSupplier: open ? supplier : null,
    });
  },

  setIsEditUserOpen: (open: boolean, user?: User | null) => {
    set({
      isEditUserOpen: open,
      editingUser: open ? user : null,
    });
  },

  setIsAddTimelineUpdateOpen: (open: boolean, project?: Project | null) => {
    set({
      isAddTimelineUpdateOpen: open,
      timelineProject: open ? project : null,
    });
  },

  setCreateAccountData: (data: CreateAccountData | null) => {
    set({ createAccountData: data });
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
          lastName?: string;
          contactNo?: string;
          email: string;
          role: string;
          avatar?: string;
        } | null
      ) => {
        set({ user, loading: false, initialized: true });
      },

      setLoading: (loading: boolean) => set({ loading }),

      clearUser: async () => {
        set({ user: null, initialized: true, loading: false });
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

        // If already initialized, don't do anything
        if (initialized) {
          return;
        }

        try {
          const response = await fetch("/api/auth/session", {
            credentials: "include",
          });

          if (response.ok) {
            const data = await response.json();
            set({
              user: data.user
                ? {
                    user_id: data.user.user_id,
                    firstName: data.user.name,
                    lastName: data.user.lastName || "",
                    contactNo: data.user.contactNo || "",
                    email: data.user.email,
                    role: data.user.role || "user",
                    avatar: data.user.avatar || "",
                  }
                : null,
              initialized: true,
            });
          } else {
            set({ initialized: true });
          }
        } catch (error) {
          console.error("Failed to initialize session:", error);
          set({ initialized: true });
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
