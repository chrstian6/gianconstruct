// app/components/SearchParamsHandler.tsx
"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useModalStore } from "@/lib/stores";

// Define the props interface
interface SearchParamsHandlerProps {
  loading: boolean;
  hasOpenedLoginModal: boolean;
  setHasOpenedLoginModal: (value: boolean) => void;
}

const SearchParamsHandler: React.FC<SearchParamsHandlerProps> = ({
  loading,
  hasOpenedLoginModal,
  setHasOpenedLoginModal,
}) => {
  const { isLoginOpen, setIsLoginOpen } = useModalStore();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (
      !loading &&
      searchParams.get("verified") === "true" &&
      !isLoginOpen &&
      !hasOpenedLoginModal
    ) {
      setIsLoginOpen(true);
      setHasOpenedLoginModal(true);
      console.log("Detected verified=true, opening LoginModal");
    }
  }, [
    searchParams,
    setIsLoginOpen,
    isLoginOpen,
    loading,
    hasOpenedLoginModal,
    setHasOpenedLoginModal,
  ]); // Added setHasOpenedLoginModal

  return null;
};

export default SearchParamsHandler;
