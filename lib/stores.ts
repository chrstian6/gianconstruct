// lib/stores.ts - UPDATED WITH checkSession METHOD
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { IInventory } from "@/types/Inventory";
import { ISupplier } from "@/types/supplier";
import { Project } from "@/types/project";
import { ProjectTransactionDetail } from "@/action/confirmed-projects";

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

// Add Payment Dialog State interface
interface PaymentDialogState {
  transaction: ProjectTransactionDetail | null;
}

// Add Manual Payment Dialog State interface - UPDATED
interface ManualPaymentData {
  projectId: string;
  clientEmail: string;
  clientName?: string;
  projectName?: string;
  remainingBalance?: number;
  totalValue?: number;
  totalPaid?: number;
  description?: string;
  maxAmount?: number;
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

  // Payment Dialog Modal
  isPaymentDialogOpen: boolean;
  paymentDialogState: PaymentDialogState;

  // Manual Payment Dialog Modal - ADDED
  isManualPaymentDialogOpen: boolean;
  manualPaymentData: ManualPaymentData | null;

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

  // Payment Dialog Modal methods
  setIsPaymentDialogOpen: (
    open: boolean,
    transaction?: ProjectTransactionDetail | null
  ) => void;
  setPaymentDialogState: (state: Partial<PaymentDialogState>) => void;

  // Manual Payment Dialog Modal methods - ADDED
  setIsManualPaymentDialogOpen: (
    open: boolean,
    paymentData?: ManualPaymentData | null
  ) => void;
  setManualPaymentData: (data: Partial<ManualPaymentData> | null) => void;
  resetManualPaymentData: () => void;
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
  checkSession: () => Promise<void>; // NEW METHOD ADDED
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
  isPaymentDialogOpen: false,
  isManualPaymentDialogOpen: false, // ADDED

  designIdToDelete: null,
  editingProject: null,
  editingInventory: null,
  viewingSupplier: null,
  editingUser: null,
  timelineProject: null,
  createAccountData: null,
  paymentDialogState: {
    transaction: null,
  },
  manualPaymentData: null, // ADDED

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

  // Payment Dialog Modal methods
  setIsPaymentDialogOpen: (
    open: boolean,
    transaction?: ProjectTransactionDetail | null
  ) => {
    set({
      isPaymentDialogOpen: open,
      paymentDialogState: {
        transaction: open ? (transaction ?? null) : null,
      },
    });
  },

  setPaymentDialogState: (state: Partial<PaymentDialogState>) => {
    set((prev) => ({
      paymentDialogState: {
        ...prev.paymentDialogState,
        ...state,
      },
    }));
  },

  // ADDED: Manual Payment Dialog Modal methods
  setIsManualPaymentDialogOpen: (
    open: boolean,
    paymentData?: ManualPaymentData | null
  ) => {
    set({
      isManualPaymentDialogOpen: open,
      manualPaymentData: open ? (paymentData ?? null) : null,
    });
  },

  setManualPaymentData: (data: Partial<ManualPaymentData> | null) => {
    set((prev) => ({
      manualPaymentData: data
        ? {
            ...(prev.manualPaymentData || {
              projectId: "",
              clientEmail: "",
              clientName: "",
              projectName: "",
              remainingBalance: 0,
              totalValue: 0,
              totalPaid: 0,
              description: "",
              maxAmount: 0,
            }),
            ...data,
          }
        : null,
    }));
  },

  resetManualPaymentData: () => {
    set({
      manualPaymentData: null,
    });
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
              loading: false,
            });
          } else {
            set({ initialized: true, loading: false });
          }
        } catch (error) {
          console.error("Failed to initialize session:", error);
          set({ initialized: true, loading: false });
        }
      },

      // NEW METHOD: Check current session (used after redirects like Google OAuth)
      checkSession: async () => {
        try {
          console.log("Checking current session...");

          const response = await fetch("/api/auth/session", {
            credentials: "include",
            cache: "no-store", // Prevent caching for fresh session data
          });

          console.log("Session check response status:", response.status);

          if (response.ok) {
            const data = await response.json();
            console.log("Session data received:", data);

            if (data.user) {
              set({
                user: {
                  user_id: data.user.user_id,
                  firstName: data.user.name,
                  lastName: data.user.lastName || "",
                  contactNo: data.user.contactNo || "",
                  email: data.user.email,
                  role: data.user.role || "user",
                  avatar: data.user.avatar || "",
                },
                loading: false,
              });
              console.log("Session updated for user:", data.user.email);
            } else {
              console.log("No user found in session");
              set({ user: null, loading: false });
            }
          } else {
            console.log("Session check failed with status:", response.status);
            set({ user: null, loading: false });
          }
        } catch (error) {
          console.error("Failed to check session:", error);
          set({ user: null, loading: false });
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
