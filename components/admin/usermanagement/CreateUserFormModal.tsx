// components/admin/usermanagement/CreateUserFormModal.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { adminRegisterUser } from "@/action/adminRegister";
import { useModalStore } from "@/lib/stores";

export function CreateUserFormModal() {
  const { isCreateAccountOpen, setIsCreateAccountOpen, createAccountData } =
    useModalStore();

  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contactNo: "",
    address: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens with new data
  useEffect(() => {
    if (isCreateAccountOpen) {
      if (createAccountData) {
        setNewUser({
          firstName: createAccountData.firstName,
          lastName: createAccountData.lastName,
          email: createAccountData.email,
          contactNo: createAccountData.phone,
          address: "",
          password: "",
          confirmPassword: "",
        });
      } else {
        setNewUser({
          firstName: "",
          lastName: "",
          email: "",
          contactNo: "",
          address: "",
          password: "",
          confirmPassword: "",
        });
      }
      setErrors({});
    }
  }, [isCreateAccountOpen, createAccountData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "", general: "" }));
  };

  const handleCreateUser = async () => {
    setIsLoading(true);

    // Basic validation
    if (!newUser.firstName || !newUser.lastName || !newUser.email) {
      setErrors({ general: "Please fill in all required fields" });
      setIsLoading(false);
      return;
    }

    if (newUser.password !== newUser.confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      setIsLoading(false);
      return;
    }

    if (newUser.password.length < 6) {
      setErrors({ password: "Password must be at least 6 characters" });
      setIsLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("firstName", newUser.firstName);
      formData.append("lastName", newUser.lastName);
      formData.append("email", newUser.email);
      formData.append("contactNo", newUser.contactNo);
      formData.append("address", newUser.address);
      formData.append("password", newUser.password);
      formData.append("confirmPassword", newUser.confirmPassword);
      formData.append("sendMagicLink", "true"); // Flag to send magic link

      const result = await adminRegisterUser(formData);

      if (result.success) {
        setIsCreateAccountOpen(false);
        setNewUser({
          firstName: "",
          lastName: "",
          email: "",
          contactNo: "",
          address: "",
          password: "",
          confirmPassword: "",
        });
        setErrors({});
        toast.success(
          "User created successfully! Magic link sent to user's email."
        );
      } else {
        const flattenedErrors: Record<string, string> = {};
        for (const [key, value] of Object.entries(result.errors || {})) {
          flattenedErrors[key] = Array.isArray(value)
            ? (value[0] ?? "Invalid input")
            : (value ?? "Invalid input");
        }
        setErrors(flattenedErrors);
        toast.error(flattenedErrors.general || "Failed to create user");
      }
    } catch (error: any) {
      setErrors({ general: error.message || "Failed to create user" });
      toast.error("Failed to create user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isCreateAccountOpen} onOpenChange={setIsCreateAccountOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[var(--orange)]">
            {createAccountData ? "Create Account for Guest" : "Create New User"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium">
                First Name *
              </Label>
              <Input
                name="firstName"
                placeholder="John"
                value={newUser.firstName}
                onChange={handleInputChange}
                className={`border-gray-300 rounded-md ${errors.firstName ? "border-red-500" : ""}`}
                disabled={isLoading}
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm">{errors.firstName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium">
                Last Name *
              </Label>
              <Input
                name="lastName"
                placeholder="Doe"
                value={newUser.lastName}
                onChange={handleInputChange}
                className={`border-gray-300 rounded-md ${errors.lastName ? "border-red-500" : ""}`}
                disabled={isLoading}
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email *
            </Label>
            <Input
              name="email"
              type="email"
              placeholder="user@example.com"
              value={newUser.email}
              onChange={handleInputChange}
              className={`w-full border-gray-300 rounded-md ${errors.email ? "border-red-500" : ""}`}
              disabled={isLoading || !!createAccountData}
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactNo" className="text-sm font-medium">
              Phone Number
            </Label>
            <Input
              name="contactNo"
              placeholder="09XX XXX XXXX"
              value={newUser.contactNo}
              onChange={handleInputChange}
              className={`w-full border-gray-300 rounded-md ${errors.contactNo ? "border-red-500" : ""}`}
              disabled={isLoading}
            />
            {errors.contactNo && (
              <p className="text-red-500 text-sm">{errors.contactNo}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium">
              Address
            </Label>
            <Input
              name="address"
              placeholder="Enter address (optional)"
              value={newUser.address}
              onChange={handleInputChange}
              className="w-full border-gray-300 rounded-md"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Temporary Password *
            </Label>
            <Input
              name="password"
              type="password"
              placeholder="Create temporary password"
              value={newUser.password}
              onChange={handleInputChange}
              className={`w-full border-gray-300 rounded-md ${errors.password ? "border-red-500" : ""}`}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password}</p>
            )}
            <p className="text-xs text-gray-500">
              User will be asked to change this password after first login
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password *
            </Label>
            <Input
              name="confirmPassword"
              type="password"
              placeholder="Confirm temporary password"
              value={newUser.confirmPassword}
              onChange={handleInputChange}
              className={`w-full border-gray-300 rounded-md ${errors.confirmPassword ? "border-red-500" : ""}`}
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
            )}
          </div>

          {errors.general && (
            <p className="text-red-500 text-sm">{errors.general}</p>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsCreateAccountOpen(false)}
            className="hover:bg-gray-100"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateUser}
            className="bg-[var(--orange)] text-white hover:bg-[var(--orange)]/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Creating User...
              </>
            ) : (
              "Create User"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
