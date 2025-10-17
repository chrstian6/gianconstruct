"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores";
import PublicCatalog from "@/components/public/catalog/PublicCatalog";

export default function UserCatalogPage() {
  const router = useRouter();
  const { clearUser } = useAuthStore();

  const handleLogout = async () => {
    try {
      await clearUser();
      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-sidebar">
      <PublicCatalog />
    </div>
  );
}
