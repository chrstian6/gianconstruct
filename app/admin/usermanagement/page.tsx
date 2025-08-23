// app/admin/usermanagement/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagementTable } from "@/components/admin/usermanagement/UserManagementTable";
import { UserForm } from "@/components/admin/usermanagement/UserForm";
import { getUsers } from "@/action/userManagement";
import { toast } from "sonner";

// Define the User type locally since it doesn't exist in types/user
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

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<string>("list");

  // Fetch users on mount
  useEffect(() => {
    async function fetchUsers() {
      const result = await getUsers();
      if (result.success && result.users) {
        setUsers(result.users);
      } else {
        toast.error(result.error || "Failed to fetch users");
      }
    }
    fetchUsers();
  }, []);

  // Handle user addition
  const handleAddUser = (user: User) => {
    setUsers([...users, user]);
    setActiveTab("list");
    toast.success("User added successfully");
  };

  // Handle user update
  const handleUpdate = (updatedUser: User) => {
    setUsers(
      users.map((user) =>
        user.user_id === updatedUser.user_id ? updatedUser : user
      )
    );
    toast.success("User updated successfully");
  };

  // Handle user status toggle
  const handleToggleStatus = (userId: string, verified: boolean) => {
    setUsers(
      users.map((user) =>
        user.user_id === userId ? { ...user, verified } : user
      )
    );
  };

  return (
    <div className="p-6 max-w-7xl overflow-y-auto">
      <h1 className="text-2xl font-bold text-text-secondary mb-6">
        User Management
      </h1>

      {/* User Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">User List</TabsTrigger>
          <TabsTrigger value="add">Add User</TabsTrigger>
        </TabsList>
        <hr className="my-4 border-t border-gray-200" />
        <TabsContent value="list">
          <UserManagementTable
            users={users}
            onUpdate={handleUpdate}
            onToggleStatus={handleToggleStatus}
          />
        </TabsContent>
        <TabsContent value="add">
          <div className="flex justify-start">
            <UserForm onAddUser={handleAddUser} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
