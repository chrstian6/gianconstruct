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
import { getNotifications } from "@/action/inquiries";
import { motion } from "framer-motion"; // Import Framer Motion

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isNotificationSheetOpen, setIsNotificationSheetOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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
  }, []);

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
          onClick: () => setIsNotificationSheetOpen(true),
          icon: MessageSquare,
        },
        { name: "User Management", href: "/admin/usermanagement", icon: User },
      ],
    },
  ];

  // Framer Motion variants for sidebar collapse/expand animation
  const sidebarVariants = {
    expanded: { width: 256 }, // 64px (w-64)
    collapsed: { width: 64 }, // 16px (w-16)
  };

  // Micro animation variants for icons
  const iconVariants = {
    initial: { scale: 1, rotate: 0 },
    animate: {
      scale: [1, 1.1, 1], // Slight scale up and back
      rotate: [0, 5, -5, 0], // Subtle rotation
    },
  };

  return (
    <div className="flex h-screen">
      <motion.div
        className="flex flex-col h-full bg-background border-r relative"
        variants={sidebarVariants}
        initial="expanded"
        animate={isCollapsed ? "collapsed" : "expanded"}
        transition={{ duration: 0.3, ease: "easeInOut" }}
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
                      className={`flex items-center rounded-md text-sm font-medium text-accent hover:bg-accent hover:text-accent-foreground ${isCollapsed ? "justify-start" : "justify-start"}`}
                    >
                      {item.href ? (
                        <Link
                          href={item.href}
                          className="flex items-center gap-2 w-full p-2"
                        >
                          <div className="flex-shrink-0 w-6 flex justify-center">
                            <motion.div
                              variants={iconVariants}
                              initial="initial"
                              animate={isCollapsed ? "initial" : "animate"}
                              transition={{ duration: 0.3, ease: "easeOut" }}
                            >
                              <item.icon className="h-4 w-4" />
                            </motion.div>
                          </div>
                          {!isCollapsed && <span>{item.name}</span>}
                        </Link>
                      ) : (
                        <Button
                          variant="ghost"
                          className={`flex items-center gap-2 w-full p-2 relative ${isCollapsed ? "justify-start" : "justify-start"}`}
                          onClick={item.onClick}
                        >
                          <div className="flex-shrink-0 w-6 flex justify-center relative">
                            <motion.div
                              variants={iconVariants}
                              initial="initial"
                              animate={isCollapsed ? "initial" : "animate"}
                              transition={{ duration: 0.3, ease: "easeOut" }}
                            >
                              <item.icon className="h-4 w-4" />
                            </motion.div>
                            {item.name === "Notifications" &&
                              unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-xs font-medium">
                                  {unreadCount}
                                </span>
                              )}
                          </div>
                          {!isCollapsed && <span>{item.name}</span>}
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
      </motion.div>

      {/* Notification Sheet */}
      <NotificationSheet
        open={isNotificationSheetOpen}
        onOpenChange={setIsNotificationSheetOpen}
        isCollapsed={isCollapsed}
      />
    </div>
  );
}
