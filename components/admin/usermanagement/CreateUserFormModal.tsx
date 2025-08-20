// components/admin/usermanagement/CreateUserFormModal.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { adminRegisterUser } from "@/action/adminRegister";
import { useModalStore } from "@/lib/stores";

export function CreateUserFormModal() {
  const { isCreateAccountOpen, setIsCreateAccountOpen } = useModalStore();
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "", general: "" }));
  };

  const handleCreateUser = async () => {
    const formData = new FormData();
    formData.append("firstName", newUser.firstName);
    formData.append("lastName", newUser.lastName);
    formData.append("email", newUser.email);
    formData.append("contactNo", newUser.contactNo);
    formData.append("address", newUser.address);
    formData.append("password", newUser.password);
    formData.append("confirmPassword", newUser.confirmPassword);

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
      toast.success("User created successfully");
    } else {
      const flattenedErrors: Record<string, string> = {};
      for (const [key, value] of Object.entries(result.errors || {})) {
        flattenedErrors[key] = Array.isArray(value)
          ? value[0] || "Invalid input"
          : value;
      }
      setErrors(flattenedErrors);
      toast.error(flattenedErrors.general || "Failed to create user");
    }
  };

  return (
    <Dialog open={isCreateAccountOpen} onOpenChange={setIsCreateAccountOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[var(--orange)]">
            Create New User
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              name="firstName"
              placeholder="First Name"
              value={newUser.firstName}
              onChange={handleInputChange}
              className={`border-gray-300 rounded-md ${errors.firstName ? "border-red-500" : ""}`}
            />
            {errors.firstName && (
              <p className="text-red-500 text-sm">{errors.firstName}</p>
            )}
            <Input
              name="lastName"
              placeholder="Last Name"
              value={newUser.lastName}
              onChange={handleInputChange}
              className={`border-gray-300 rounded-md ${errors.lastName ? "border-red-500" : ""}`}
            />
            {errors.lastName && (
              <p className="text-red-500 text-sm">{errors.lastName}</p>
            )}
          </div>
          <Input
            name="email"
            type="email"
            placeholder="Email"
            value={newUser.email}
            onChange={handleInputChange}
            className={`w-full border-gray-300 rounded-md ${errors.email ? "border-red-500" : ""}`}
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email}</p>
          )}
          <Input
            name="contactNo"
            placeholder="Phone Number (10-11 digits)"
            value={newUser.contactNo}
            onChange={handleInputChange}
            className={`w-full border-gray-300 rounded-md ${errors.contactNo ? "border-red-500" : ""}`}
          />
          {errors.contactNo && (
            <p className="text-red-500 text-sm">{errors.contactNo}</p>
          )}
          <Input
            name="address"
            placeholder="Address (Optional)"
            value={newUser.address}
            onChange={handleInputChange}
            className="w-full border-gray-300 rounded-md"
          />
          <Input
            name="password"
            type="password"
            placeholder="Password"
            value={newUser.password}
            onChange={handleInputChange}
            className={`w-full border-gray-300 rounded-md ${errors.password ? "border-red-500" : ""}`}
          />
          {errors.password && (
            <p className="text-red-500 text-sm">{errors.password}</p>
          )}
          <Input
            name="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            value={newUser.confirmPassword}
            onChange={handleInputChange}
            className={`w-full border-gray-300 rounded-md ${errors.confirmPassword ? "border-red-500" : ""}`}
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
          )}
          {errors.general && (
            <p className="text-red-500 text-sm">{errors.general}</p>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsCreateAccountOpen(false)}
            className="hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateUser}
            className="bg-[var(--orange)] text-white hover:bg-[var(--orange)]/90"
          >
            Create User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
