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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit3, UserX, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useModalStore } from "@/lib/stores";

// Define the User type locally
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

interface UserManagementTableProps {
  users: User[];
  onUpdate: (user: User) => void;
  onToggleStatus: (userId: string, verified: boolean) => void;
  columnVisibility: {
    user_id: boolean;
    firstName: boolean;
    lastName: boolean;
    email: boolean;
    role: boolean;
    contactNo: boolean;
    verified: boolean;
    createdAt: boolean;
    actions: boolean;
  };
}

export function UserManagementTable({
  users,
  onUpdate,
  onToggleStatus,
  columnVisibility,
}: UserManagementTableProps) {
  const { setIsEditUserOpen } = useModalStore();

  const handleToggleInactive = async (userId: string) => {
    const userToUpdate = users.find((u) => u.user_id === userId);
    if (!userToUpdate) return;

    const result = await updateUserStatus(userId, !userToUpdate.verified);
    if (result.success) {
      onToggleStatus(userId, result.verified as boolean);
      toast.success(
        `User ${result.verified ? "activated" : "deactivated"} successfully`
      );
    } else {
      toast.error(result.error || "Failed to update user status");
    }
  };

  const handleEditClick = (user: User) => {
    setIsEditUserOpen(true, user);
  };

  const formatText = (text: string, maxLength: number = 20) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Define table headers with visibility control
  const tableHeaders = [
    { key: "user_id", label: "ID", visible: columnVisibility.user_id },
    {
      key: "firstName",
      label: "Name",
      visible: columnVisibility.firstName || columnVisibility.lastName,
    },
    { key: "email", label: "Email", visible: columnVisibility.email },
    { key: "contactNo", label: "Contact", visible: columnVisibility.contactNo },
    { key: "role", label: "Role", visible: columnVisibility.role },
    { key: "verified", label: "Status", visible: columnVisibility.verified },
    { key: "actions", label: "Actions", visible: columnVisibility.actions },
  ].filter((header) => header.visible);

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <Table className="min-w-full compact-table">
          <TableHeader className="bg-muted/50">
            <TableRow className="h-10">
              {tableHeaders.map((header) => (
                <TableHead
                  key={header.key}
                  className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  {header.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="bg-card divide-y divide-border">
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={tableHeaders.length}
                  className="px-3 py-4 text-center text-sm text-muted-foreground"
                >
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow
                  key={user.user_id}
                  className="h-12 hover:bg-accent/50 transition-colors"
                >
                  {/* User ID Column */}
                  {columnVisibility.user_id && (
                    <TableCell className="px-3 py-2 whitespace-nowrap text-xs text-foreground font-mono">
                      {formatText(user.user_id, 8)}
                    </TableCell>
                  )}

                  {/* Name Column */}
                  {(columnVisibility.firstName ||
                    columnVisibility.lastName) && (
                    <TableCell className="px-3 py-2 whitespace-nowrap text-xs text-foreground">
                      {formatText(`${user.firstName} ${user.lastName}`, 15)}
                    </TableCell>
                  )}

                  {/* Email Column */}
                  {columnVisibility.email && (
                    <TableCell className="px-3 py-2 whitespace-nowrap text-xs text-foreground">
                      {formatText(user.email, 20)}
                    </TableCell>
                  )}

                  {/* Contact Column */}
                  {columnVisibility.contactNo && (
                    <TableCell className="px-3 py-2 whitespace-nowrap text-xs text-foreground">
                      {user.contactNo ? formatText(user.contactNo, 12) : "N/A"}
                    </TableCell>
                  )}

                  {/* Role Column */}
                  {columnVisibility.role && (
                    <TableCell className="px-3 py-2 whitespace-nowrap">
                      <Badge variant="secondary" className="text-xs capitalize">
                        {user.role}
                      </Badge>
                    </TableCell>
                  )}

                  {/* Status Column */}
                  {columnVisibility.verified && (
                    <TableCell className="px-3 py-2 whitespace-nowrap">
                      <Badge
                        className="text-xs"
                        variant={user.verified ? "default" : "secondary"}
                      >
                        {user.verified ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  )}

                  {/* Actions Column */}
                  {columnVisibility.actions && (
                    <TableCell className="px-3 py-2 whitespace-nowrap text-xs text-foreground">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem className="text-xs cursor-pointer">
                            <Eye className="mr-2 h-3.5 w-3.5" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-xs cursor-pointer"
                            onClick={() => handleEditClick(user)}
                          >
                            <Edit3 className="mr-2 h-3.5 w-3.5" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-xs cursor-pointer"
                            onClick={() => handleToggleInactive(user.user_id)}
                          >
                            {user.verified ? (
                              <>
                                <UserX className="mr-2 h-3.5 w-3.5" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="mr-2 h-3.5 w-3.5" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
