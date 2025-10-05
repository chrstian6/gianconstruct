// components/admin/usermanagement/EditUserModal.tsx
"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateUser } from "@/action/userManagement";
import { useState, useEffect } from "react";
import { Save, X } from "lucide-react";
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
import { useModalStore } from "@/lib/stores";

// Define the User type
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

// Define the editable user fields type (excluding role)
interface EditableUserFields {
  firstName: string;
  lastName: string;
  address: string;
  contactNo?: string;
  email: string;
  verified: boolean;
}

interface EditUserModalProps {
  onUpdate: (user: User) => void;
}

export function EditUserModal({ onUpdate }: EditUserModalProps) {
  const { isEditUserOpen, editingUser, setIsEditUserOpen } = useModalStore();
  const [editFormData, setEditFormData] = useState<EditableUserFields>({
    firstName: "",
    lastName: "",
    address: "",
    email: "",
    verified: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form data when editingUser changes
  useEffect(() => {
    if (editingUser) {
      setEditFormData({
        firstName: editingUser.firstName,
        lastName: editingUser.lastName,
        address: editingUser.address,
        contactNo: editingUser.contactNo,
        email: editingUser.email,
        verified: editingUser.verified,
      });
    }
  }, [editingUser]);

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

    setIsLoading(true);
    try {
      const result = await updateUser(editingUser.user_id, editFormData);
      if (result.success && result.user) {
        onUpdate(result.user as User);
        setIsEditUserOpen(false);
        toast.success("User updated successfully");
      } else {
        toast.error(result.error || "Failed to update user");
      }
    } catch (error) {
      toast.error("Failed to update user");
      console.error("Error updating user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsEditUserOpen(false);
  };

  return (
    <Dialog open={isEditUserOpen} onOpenChange={handleClose}>
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
            onClick={handleClose}
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
            disabled={isLoading}
          >
            <X className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <Button
            onClick={handleSaveEdit}
            className="bg-[var(--orange)] hover:bg-[var(--orange)]/90"
            disabled={isLoading}
          >
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
