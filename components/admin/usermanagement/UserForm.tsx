// components/admin/usermanagement/UserForm.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { adminRegisterUser } from "@/action/adminRegister";

interface UserFormProps {
  onAddUser: (user: any) => void;
  onCancel?: () => void;
}

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

// Define the error type based on the adminRegisterUser return type
interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  contactNo?: string;
  address?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export function UserForm({ onAddUser }: UserFormProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contactNo: "",
    address: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("firstName", formData.firstName);
      formDataToSend.append("lastName", formData.lastName);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("contactNo", formData.contactNo);
      formDataToSend.append("address", formData.address);
      formDataToSend.append("password", formData.password);
      formDataToSend.append("confirmPassword", formData.confirmPassword);

      const result = await adminRegisterUser(formDataToSend);

      if (result.success) {
        // Create a user object to pass to parent component
        const newUser: User = {
          user_id: result.user?.user_id || "",
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          contactNo: formData.contactNo,
          address: formData.address,
          role: "user", // Default role for new users
          verified: true, // Admin-created users are verified by default
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        onAddUser(newUser);
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          contactNo: "",
          address: "",
          password: "",
          confirmPassword: "",
        });
        toast.success("User created successfully");
      } else {
        // Handle validation errors - convert string arrays to single strings
        if (result.errors) {
          const formattedErrors: FormErrors = {};

          Object.entries(result.errors).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              formattedErrors[key as keyof FormErrors] = value[0]; // Take first error message
            } else if (typeof value === "string") {
              formattedErrors[key as keyof FormErrors] = value;
            }
          });

          setErrors(formattedErrors);

          // Show general error if no specific field errors
          if (Object.keys(formattedErrors).length === 0) {
            toast.error("Failed to create user. Please check your inputs.");
          } else {
            toast.error("Please fix the form errors");
          }
        } else {
          toast.error("Failed to create user");
        }
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-[var(--orange)] mb-6">
        Add New User
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            className="border-gray-300 focus:border-[var(--orange)] focus:ring-[var(--orange)]"
          />
          {errors.firstName && (
            <p className="text-sm text-red-500">{errors.firstName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            className="border-gray-300 focus:border-[var(--orange)] focus:ring-[var(--orange)]"
          />
          {errors.lastName && (
            <p className="text-sm text-red-500">{errors.lastName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="border-gray-300 focus:border-[var(--orange)] focus:ring-[var(--orange)]"
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactNo">Contact Number</Label>
          <Input
            id="contactNo"
            name="contactNo"
            value={formData.contactNo}
            onChange={handleChange}
            className="border-gray-300 focus:border-[var(--orange)] focus:ring-[var(--orange)]"
            placeholder="10-11 digits only"
          />
          {errors.contactNo && (
            <p className="text-sm text-red-500">{errors.contactNo}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="border-gray-300 focus:border-[var(--orange)] focus:ring-[var(--orange)]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password *</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="border-gray-300 focus:border-[var(--orange)] focus:ring-[var(--orange)]"
            placeholder="At least 6 characters"
          />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password *</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="border-gray-300 focus:border-[var(--orange)] focus:ring-[var(--orange)]"
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-500">{errors.confirmPassword}</p>
          )}
        </div>

        {errors.general && (
          <p className="text-sm text-red-500">{errors.general}</p>
        )}

        <Button
          type="submit"
          className="w-full bg-[var(--orange)] hover:bg-[var(--orange)]/90"
          disabled={loading}
        >
          {loading ? "Creating User..." : "Create User"}
        </Button>
      </form>
    </div>
  );
}
