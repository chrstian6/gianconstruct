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
import { updateUserStatus, updateUser } from "@/action/userManagement";
import { useState, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Eye,
  Edit3,
  UserX,
  UserCheck,
  Save,
  X,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
}

// Define the editable user fields type (excluding role)
interface EditableUserFields {
  firstName: string;
  lastName: string;
  address: string;
  contactNo?: string;
  email: string;
  verified: boolean;
}

export function UserManagementTable({
  users,
  onUpdate,
  onToggleStatus,
}: UserManagementTableProps) {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState<EditableUserFields>({
    firstName: "",
    lastName: "",
    address: "",
    email: "",
    verified: false,
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter users based on search query using useMemo for optimization
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;

    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.firstName.toLowerCase().includes(query) ||
        user.lastName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.contactNo?.toLowerCase().includes(query) ||
        user.user_id.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

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
    setEditingUser(user);
    setEditFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      address: user.address,
      contactNo: user.contactNo,
      email: user.email,
      verified: user.verified,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditFormChange = (
    field: keyof EditableUserFields,
    value: string | boolean
  ) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    const result = await updateUser(editingUser.user_id, editFormData);
    if (result.success && result.user) {
      onUpdate(result.user as User);
      setIsEditDialogOpen(false);
      setEditingUser(null);
    } else {
      toast.error(result.error || "Failed to update user");
    }
  };

  const formatText = (text: string, maxLength: number = 20) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <>
      <div className="w-full space-y-4">
        {/* Search Input */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users by name, email, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border-gray-300 focus:border-[var(--orange)] focus:ring-[var(--orange)]"
          />
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto rounded-md border border-gray-200 shadow-sm">
          <Table className="min-w-full compact-table">
            <TableHeader className="bg-[var(--orange)]/5">
              <TableRow className="h-10">
                {[
                  "ID",
                  "Name",
                  "Email",
                  "Contact",
                  "Role",
                  "Status",
                  "Actions",
                ].map((header) => (
                  <TableHead
                    key={header}
                    className="px-3 py-2 text-left text-xs font-medium text-[var(--orange)] uppercase tracking-wider"
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="px-3 py-4 text-center text-sm text-gray-500"
                  >
                    {searchQuery
                      ? "No users found matching your search"
                      : "No users found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow
                    key={user.user_id}
                    className="h-12 hover:bg-gray-50 transition-colors"
                  >
                    <TableCell className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 font-mono">
                      {formatText(user.user_id, 8)}
                    </TableCell>
                    <TableCell className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {formatText(`${user.firstName} ${user.lastName}`, 15)}
                    </TableCell>
                    <TableCell className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {formatText(user.email, 20)}
                    </TableCell>
                    <TableCell className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {user.contactNo ? formatText(user.contactNo, 12) : "N/A"}
                    </TableCell>
                    <TableCell className="px-3 py-2 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className="text-xs capitalize"
                        style={{
                          backgroundColor:
                            user.role === "admin"
                              ? "rgba(var(--orange-rgb), 0.1)"
                              : "transparent",
                          borderColor: "var(--orange)",
                          color: "var(--orange)",
                        }}
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-3 py-2 whitespace-nowrap">
                      <Badge
                        className="text-xs"
                        variant={user.verified ? "default" : "secondary"}
                        style={{
                          backgroundColor: user.verified
                            ? "var(--orange)"
                            : "#f1f5f9",
                          color: user.verified ? "white" : "#64748b",
                        }}
                      >
                        {user.verified ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-xs">
                            <Eye className="mr-2 h-3.5 w-3.5" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-xs"
                            onClick={() => handleEditClick(user)}
                          >
                            <Edit3 className="mr-2 h-3.5 w-3.5" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-xs"
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
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white border border-gray-200 rounded-lg shadow-lg">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <DialogTitle className="text-xl font-bold text-[var(--orange)]">
              Edit User
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Update user information below
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="firstName"
                    className="text-sm font-medium text-gray-700"
                  >
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    value={editFormData.firstName}
                    onChange={(e) =>
                      handleEditFormChange("firstName", e.target.value)
                    }
                    className="w-full border-gray-300 focus:border-[var(--orange)] focus:ring-[var(--orange)]"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="lastName"
                    className="text-sm font-medium text-gray-700"
                  >
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    value={editFormData.lastName}
                    onChange={(e) =>
                      handleEditFormChange("lastName", e.target.value)
                    }
                    className="w-full border-gray-300 focus:border-[var(--orange)] focus:ring-[var(--orange)]"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700"
                  >
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={editFormData.email}
                    onChange={(e) =>
                      handleEditFormChange("email", e.target.value)
                    }
                    className="w-full border-gray-300 focus:border-[var(--orange)] focus:ring-[var(--orange)]"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="contactNo"
                    className="text-sm font-medium text-gray-700"
                  >
                    Contact Number
                  </Label>
                  <Input
                    id="contactNo"
                    value={editFormData.contactNo || ""}
                    onChange={(e) =>
                      handleEditFormChange("contactNo", e.target.value)
                    }
                    className="w-full border-gray-300 focus:border-[var(--orange)] focus:ring-[var(--orange)]"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="address"
                    className="text-sm font-medium text-gray-700"
                  >
                    Address
                  </Label>
                  <Input
                    id="address"
                    value={editFormData.address}
                    onChange={(e) =>
                      handleEditFormChange("address", e.target.value)
                    }
                    className="w-full border-gray-300 focus:border-[var(--orange)] focus:ring-[var(--orange)]"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="role"
                    className="text-sm font-medium text-gray-700"
                  >
                    Role
                  </Label>
                  <Input
                    id="role"
                    value={editingUser.role}
                    disabled
                    className="w-full border-gray-300 bg-gray-100 text-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="status"
                    className="text-sm font-medium text-gray-700"
                  >
                    Status
                  </Label>
                  <div className="flex items-center">
                    <Badge
                      className="text-xs"
                      variant={editFormData.verified ? "default" : "secondary"}
                      style={{
                        backgroundColor: editFormData.verified
                          ? "var(--orange)"
                          : "#f1f5f9",
                        color: editFormData.verified ? "white" : "#64748b",
                      }}
                    >
                      {editFormData.verified ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleEditFormChange("verified", !editFormData.verified)
                      }
                      className="ml-2 text-xs text-[var(--orange)] hover:text-[var(--orange)]/80"
                    >
                      {editFormData.verified ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              className="bg-[var(--orange)] hover:bg-[var(--orange)]/90"
            >
              <Save className="mr-2 h-4 w-4" /> Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
