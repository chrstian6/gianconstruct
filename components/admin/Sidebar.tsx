"use client";

import * as React from "react";
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
  User,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { NotificationSheet } from "@/components/admin/NotificationSheet";
import { getNotifications } from "@/action/inquiries"; // Import to fetch notifications

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isNotificationSheetOpen, setIsNotificationSheetOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0); // State for unread notifications

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const result = await getNotifications();
        if (result.success) {
          const unread = result.notifications.filter((n) => !n.isRead).length;
          setUnreadCount(unread);
        }
      } catch (error) {
        console.error("Error fetching unread notifications:", error);
      }
    };
    fetchUnreadCount();
  }, []); // Run once on mount

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
          icon: MessageSquare,
          onClick: () => setIsNotificationSheetOpen(true),
        },
        { name: "User Management", href: "/admin/users", icon: User },
      ],
    },
  ];

  return (
    <div className="flex h-screen">
      <div
        className={`flex flex-col h-full bg-background border-r transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"} relative`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          {!isCollapsed && (
            <Link href="/" className="text-xl font-bold text-accent">
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
                <div className="space-y-1 mt-2">
                  {section.items.map((item) => (
                    <div
                      key={item.name}
                      className={`flex items-center rounded-md text-sm font-medium text-accent hover:bg-accent hover:text-accent-foreground ${isCollapsed ? "justify-center" : ""}`}
                    >
                      {item.href ? (
                        <Link
                          href={item.href}
                          className="flex items-center gap-2 w-full p-2"
                        >
                          <item.icon className="h-4 w-4" />
                          {!isCollapsed && <span>{item.name}</span>}
                        </Link>
                      ) : (
                        <Button
                          variant="ghost"
                          className={`flex items-center gap-2 w-full p-2 ${isCollapsed ? "justify-center" : "justify-start"} relative`}
                          onClick={item.onClick}
                        >
                          <item.icon className="h-4 w-4" />
                          {!isCollapsed && (
                            <span className="flex items-center">
                              {item.name}
                              {item.name === "Notifications" &&
                                unreadCount > 0 && (
                                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full bg-red-500 text-white text-xs font-medium">
                                    {unreadCount}
                                  </span>
                                )}
                            </span>
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
              {index < menuItems.length - 1 && <Separator className="my-4" />}
            </Collapsible>
          ))}
        </nav>
      </div>

      {/* Notification Sheet */}
      <NotificationSheet
        open={isNotificationSheetOpen}
        onOpenChange={setIsNotificationSheetOpen}
        isCollapsed={isCollapsed}
      />
    </div>
  );
}
