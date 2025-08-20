// components/admin/usermanagement/UserManagementTable.tsx
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateUserStatus } from "@/action/userManagement";
import { getUsers } from "@/action/userManagement"; // Import getUsers
import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/stores";

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

export function UserManagementTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: authUser } = useAuthStore();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const result = await getUsers();
        if (result.success) {
          setUsers(result.users || []);
        } else {
          toast.error(result.error || "Failed to load users");
        }
      } catch (error) {
        toast.error("An error occurred while loading users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleToggleInactive = async (userId: string) => {
    const userToUpdate = users.find((u) => u.user_id === userId);
    if (!userToUpdate) return;

    const result = await updateUserStatus(userId, !userToUpdate.verified);
    if (result.success) {
      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === userId ? { ...u, verified: result.verified } : u
        )
      );
      toast.success(
        `User ${result.verified ? "activated" : "deactivated"} successfully`
      );
    } else {
      toast.error(result.error || "Failed to update user status");
    }
  };

  if (loading)
    return <p className="text-center text-[var(--orange)]">Loading...</p>;

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200 shadow-md">
      <Table className="min-w-full divide-y divide-gray-200">
        <TableHeader className="bg-[var(--orange)]/10">
          <TableRow>
            {[
              "User ID",
              "Name",
              "Email",
              "Contact",
              "Address",
              "Role",
              "Status",
              "Actions",
            ].map((header) => (
              <TableHead
                key={header}
                className="px-6 py-3 text-left text-xs font-medium text-[var(--orange)] uppercase tracking-wider"
              >
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <TableRow
              key={user.user_id}
              className="hover:bg-gray-50 transition-colors"
            >
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {user.user_id}
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {`${user.firstName} ${user.lastName}`}
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {user.email}
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {user.contactNo || "N/A"}
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {user.address || "N/A"}
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {user.role}
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {user.verified ? "Active" : "Inactive"}
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <Button
                  variant="outline"
                  onClick={() => handleToggleInactive(user.user_id)}
                  className="text-[var(--orange)] border-[var(--orange)] hover:bg-[var(--orange)]/10"
                >
                  {user.verified ? "Set Inactive" : "Set Active"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
