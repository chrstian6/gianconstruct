// components/user/team-switcher.tsx
"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User } from "lucide-react";

interface UserWithAvatar {
  user_id: string;
  firstName?: string;
  email: string;
  role: string;
  avatar?: string;
}

export function TeamSwitcher() {
  const router = useRouter();
  const { user, clearUser } = useAuthStore();

  const userWithAvatar = user as UserWithAvatar | null;

  const handleLogout = async () => {
    try {
      await clearUser();
      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const initial =
    userWithAvatar?.firstName?.[0] || userWithAvatar?.email?.[0] || "U";
  const name = userWithAvatar?.firstName || userWithAvatar?.email || "User";
  const role = userWithAvatar?.role
    ? userWithAvatar.role.charAt(0).toUpperCase() +
      userWithAvatar.role.slice(1).toLowerCase()
    : "Member";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="w-full cursor-pointer">
              <div className="flex items-center gap-3 w-full min-w-0">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={userWithAvatar?.avatar} />
                  <AvatarFallback className="bg-orange-500 text-white text-sm font-medium">
                    {initial}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-0.5 leading-none min-w-0 flex-1">
                  <span className="font-bold text-sm truncate">{name}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {role}
                  </span>
                </div>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56"
            align="start"
            side="right"
            sideOffset={10}
          >
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="h-4 w-4 mr-2" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="h-4 w-4 mr-2" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-600 focus:text-red-600"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
