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
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  loading: false,
  setLoading: (loading) => set({ loading }),
}));

export const useModalStore = create<ModalStore>((set) => ({
  isLoginOpen: false,
  isCreateAccountOpen: false,
  setIsLoginOpen: (open) => set({ isLoginOpen: open }),
  setIsCreateAccountOpen: (open) => set({ isCreateAccountOpen: open }),
}));
