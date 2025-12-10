// components/admin/usermanagement/EditUserModal.tsx
"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateUser } from "@/action/userManagement";
import { useState, useEffect } from "react";
import {
  Save,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useModalStore } from "@/lib/stores";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

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

// Define the editable user fields type (excluding role and email)
interface EditableUserFields {
  firstName: string;
  lastName: string;
  address: string;
  contactNo?: string;
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
      // Include email from editingUser since it's not in editFormData
      const result = await updateUser(editingUser.user_id, {
        ...editFormData,
        email: editingUser.email, // Pass the original email
      });
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

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy, hh:mm a");
    } catch {
      return "Invalid date";
    }
  };

  if (!editingUser) return null;

  return (
    <Dialog open={isEditUserOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] bg-card p-0 border-border max-h-[85vh] flex flex-col">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <User className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-foreground">
                Edit User
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Update user information and permissions
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {/* User Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-medium text-foreground">
                  Personal Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="firstName"
                    className="text-sm font-medium text-foreground"
                  >
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    value={editFormData.firstName}
                    onChange={(e) =>
                      handleEditFormChange("firstName", e.target.value)
                    }
                    className="border-border focus:border-foreground"
                    placeholder="Enter first name"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="lastName"
                    className="text-sm font-medium text-foreground"
                  >
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    value={editFormData.lastName}
                    onChange={(e) =>
                      handleEditFormChange("lastName", e.target.value)
                    }
                    className="border-border focus:border-foreground"
                    placeholder="Enter last name"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-muted">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-medium text-foreground">
                  Contact Information
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-foreground"
                  >
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={editingUser.email}
                    disabled
                    className="border-border bg-muted/50 text-muted-foreground"
                    placeholder="Email address (cannot be changed)"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Email address cannot be modified for security reasons
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="contactNo"
                    className="text-sm font-medium text-foreground"
                  >
                    Contact Number
                  </Label>
                  <Input
                    id="contactNo"
                    value={editFormData.contactNo || ""}
                    onChange={(e) =>
                      handleEditFormChange("contactNo", e.target.value)
                    }
                    className="border-border focus:border-foreground"
                    placeholder="Enter contact number"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="address"
                    className="text-sm font-medium text-foreground"
                  >
                    Address
                  </Label>
                  <Input
                    id="address"
                    value={editFormData.address}
                    onChange={(e) =>
                      handleEditFormChange("address", e.target.value)
                    }
                    className="border-border focus:border-foreground"
                    placeholder="Enter full address"
                  />
                </div>
              </div>
            </div>

            {/* Account Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-muted">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-medium text-foreground">
                  Account Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Role Information */}
                <Card className="border-border bg-muted/50">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm font-medium text-foreground">
                          Role
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="text-xs capitalize"
                        >
                          {editingUser.role}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Role cannot be modified
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Status Information */}
                <Card className="border-border bg-muted/50">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-1 rounded ${editFormData.verified ? "bg-emerald-50" : "bg-rose-50"}`}
                          >
                            {editFormData.verified ? (
                              <div className="h-4 w-4 rounded-full bg-emerald-600" />
                            ) : (
                              <div className="h-4 w-4 rounded-full bg-rose-600" />
                            )}
                          </div>
                          <Label className="text-sm font-medium text-foreground">
                            Status
                          </Label>
                        </div>
                        <Switch
                          checked={editFormData.verified}
                          onCheckedChange={(checked) =>
                            handleEditFormChange("verified", checked)
                          }
                          className="data-[state=checked]:bg-emerald-600"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            editFormData.verified ? "default" : "secondary"
                          }
                          className={`text-xs ${
                            editFormData.verified
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                              : "bg-rose-50 text-rose-700 hover:bg-rose-50"
                          }`}
                        >
                          {editFormData.verified ? "Active" : "Inactive"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {editFormData.verified
                            ? "Active account"
                            : "Account disabled"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Read-only Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-muted">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-medium text-foreground">
                  System Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">
                    User ID
                  </Label>
                  <Input
                    value={editingUser.user_id}
                    disabled
                    className="border-border bg-muted/50 text-muted-foreground font-mono text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">
                    Created Date
                  </Label>
                  <Input
                    value={formatDate(editingUser.createdAt)}
                    disabled
                    className="border-border bg-muted/50 text-muted-foreground text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Last Updated
                </Label>
                <Input
                  value={formatDate(editingUser.updatedAt)}
                  disabled
                  className="border-border bg-muted/50 text-muted-foreground text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <DialogFooter className="p-4 sm:p-6 bg-card">
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
            <div className="text-sm text-muted-foreground">
              User ID:{" "}
              <span className="font-mono">
                {editingUser.user_id.slice(0, 8)}...
              </span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 sm:flex-none border-border hover:bg-accent"
                disabled={isLoading}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                className="flex-1 sm:flex-none bg-foreground hover:bg-foreground/90 text-background"
                disabled={isLoading}
              >
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
