"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores";

export default function UserDashboard() {
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
    <div className="container mx-auto px-4 py-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-text-secondary">
          User Dashboard
        </h1>
        <Button
          variant="ghost"
          size="icon"
          className="text-text-secondary hover:bg-text-secondary hover:text-text-secondary-foreground"
          onClick={handleLogout}
          title="Sign Out"
        >
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Sign Out</span>
        </Button>
      </header>
      <main>
        <p className="text-gray-600">Welcome to your user dashboard!</p>
        {/* Add more dashboard content here as needed */}
      </main>
    </div>
  );
}
