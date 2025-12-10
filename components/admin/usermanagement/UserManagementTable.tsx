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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Eye,
  Edit3,
  UserX,
  UserCheck,
  User,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Shield,
  UserRoundPen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useModalStore } from "@/lib/stores";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    if (!text) return "—";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "—";
    }
  };

  // Get status info for user
  const getUserStatusInfo = (verified: boolean) => {
    if (verified) {
      return {
        text: "Active",
        variant: "default" as const,
        icon: CheckCircle,
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
      };
    } else {
      return {
        text: "Inactive",
        variant: "destructive" as const,
        icon: XCircle,
        color: "text-rose-600",
        bgColor: "bg-rose-50",
      };
    }
  };

  // Get role info
  const getRoleInfo = (role: string) => {
    if (!role)
      return {
        text: "—",
        icon: User,
        color: "text-gray-600",
        bgColor: "bg-gray-50",
      };

    switch (role.toLowerCase()) {
      case "admin":
        return {
          text: "Admin",
          icon: Shield,
          color: "text-purple-600",
          bgColor: "bg-purple-50",
        };
      default:
        return {
          text: role.charAt(0).toUpperCase() + role.slice(1),
          icon: User,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Header */}

      {/* Table Content */}
      <div>
        <Table className="border border-border rounded-lg overflow-hidden">
          <TableHeader className="bg-background">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-16 font-semibold text-foreground">
                #
              </TableHead>
              {(columnVisibility.firstName || columnVisibility.lastName) && (
                <TableHead className="font-semibold text-foreground">
                  User
                </TableHead>
              )}
              {columnVisibility.email && (
                <TableHead className="font-semibold text-foreground">
                  Contact
                </TableHead>
              )}
              {columnVisibility.role && (
                <TableHead className="font-semibold text-foreground">
                  Role
                </TableHead>
              )}
              {columnVisibility.verified && (
                <TableHead className="font-semibold text-foreground">
                  Status
                </TableHead>
              )}
              {columnVisibility.createdAt && (
                <TableHead className="font-semibold text-foreground">
                  Created
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No Users Found
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    No users have been registered yet.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user, index) => {
                const statusInfo = getUserStatusInfo(user.verified);
                const roleInfo = getRoleInfo(user.role);
                const StatusIcon = statusInfo.icon;
                const RoleIcon = roleInfo.icon;

                return (
                  <TableRow
                    key={user.user_id}
                    className="hover:bg-accent/50 border-border"
                  >
                    <TableCell className="font-medium text-foreground">
                      {index + 1}
                    </TableCell>

                    {/* User Column */}
                    {(columnVisibility.firstName ||
                      columnVisibility.lastName) && (
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded bg-muted">
                              <User className="h-3.5 w-3.5 text-foreground" />
                            </div>
                            <div>
                              <div className="font-semibold text-sm text-foreground">
                                {formatText(
                                  `${user.firstName || ""} ${user.lastName || ""}`,
                                  20
                                )}
                              </div>
                              {columnVisibility.user_id && (
                                <div className="text-xs text-muted-foreground">
                                  ID: {formatText(user.user_id, 8)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    )}

                    {/* Contact Column */}
                    {columnVisibility.email && (
                      <TableCell>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm text-foreground truncate max-w-[200px]">
                              {formatText(user.email || "", 25)}
                            </span>
                          </div>
                          {user.contactNo && columnVisibility.contactNo && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {formatText(user.contactNo, 15)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    )}

                    {/* Role Column */}
                    {columnVisibility.role && (
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${roleInfo.bgColor} ${roleInfo.color} border-0 flex items-center gap-1.5`}
                        >
                          <RoleIcon className="h-3 w-3" />
                          {roleInfo.text}
                        </Badge>
                      </TableCell>
                    )}

                    {/* Status Column */}
                    {columnVisibility.verified && (
                      <TableCell>
                        <Badge
                          variant={statusInfo.variant}
                          className={`${statusInfo.bgColor} ${statusInfo.color} border-0 flex items-center gap-1.5`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.text}
                        </Badge>
                      </TableCell>
                    )}

                    {/* Created At Column */}
                    {columnVisibility.createdAt && (
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-foreground">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {formatDate(user.createdAt)}
                        </div>
                      </TableCell>
                    )}

                    {/* Actions Column */}
                    {columnVisibility.actions && (
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditClick(user)}
                                  className="h-8 w-8 hover:bg-accent text-foreground"
                                >
                                  <UserRoundPen className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View Details</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-accent text-foreground"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleEditClick(user)}
                                className="cursor-pointer"
                              >
                                <Edit3 className="h-4 w-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  handleToggleInactive(user.user_id)
                                }
                                className={
                                  user.verified
                                    ? "text-amber-600 focus:text-amber-600 cursor-pointer"
                                    : "text-emerald-600 focus:text-emerald-600 cursor-pointer"
                                }
                              >
                                {user.verified ? (
                                  <>
                                    <UserX className="h-4 w-4 mr-2" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
