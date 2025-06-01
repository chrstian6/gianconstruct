"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Folder,
  Home,
  MessageSquare,
  Settings,
  User,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    {
      section: "Quick Actions",
      items: [
        {
          name: "Set Appointment",
          href: "/admin/appointments",
          icon: Calendar,
        },
      ],
    },
    {
      section: "Main",
      items: [
        { name: "Dashboard", href: "/admin/admindashboard", icon: Home },
        { name: "Projects", href: "/admin/projects", icon: Folder },
        { name: "Meetings", href: "/admin/meetings", icon: MessageSquare },
        { name: "Schedules", href: "/admin/schedules", icon: Clock },
        { name: "Catalog", href: "/admin/catalog", icon: Folder },
        {
          name: "Notifications",
          href: "/admin/notifications",
          icon: MessageSquare,
        },
        { name: "User Management", href: "/admin/users", icon: User },
      ],
    },
  ];

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-background border-r transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        {!isCollapsed && (
          <Link href="/" className="text-xl font-bold text-text-secondary">
            GianConstruct®
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="ml-auto"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
      <Separator />

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto p-4">
        {menuItems.map((section, index) => (
          <Collapsible key={index} defaultOpen>
            <CollapsibleTrigger className="flex items-center w-full text-left">
              {!isCollapsed && (
                <span className="text-sm font-semibold text-muted-foreground">
                  {section.section}
                </span>
              )}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-md p-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground",
                      isCollapsed && "justify-center"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                ))}
              </div>
            </CollapsibleContent>
            {index < menuItems.length - 1 && <Separator className="my-4" />}
          </Collapsible>
        ))}
      </nav>
    </div>
  );
}
