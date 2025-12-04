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
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { createUser } from "@/action/userManagement";
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
    role: "user",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showValidationAlert, setShowValidationAlert] = useState(false);

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
          role: "user",
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
          role: "user",
        });
      }
      setErrors({});
      setShowValidationAlert(false);
    }
  }, [isCreateAccountOpen, createAccountData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Special handling for contactNo field
    if (name === "contactNo") {
      // Allow only numbers
      const numericValue = value.replace(/\D/g, "");
      // Limit to 11 characters
      const limitedValue = numericValue.slice(0, 11);
      setNewUser((prev) => ({ ...prev, [name]: limitedValue }));
    } else {
      setNewUser((prev) => ({ ...prev, [name]: value }));
    }

    setErrors((prev) => ({ ...prev, [name]: "", general: "" }));
    // Hide validation alert when user starts typing
    setShowValidationAlert(false);
  };

  const handleRoleChange = (value: string) => {
    setNewUser((prev) => ({ ...prev, role: value }));
    setErrors((prev) => ({ ...prev, role: "", general: "" }));
    setShowValidationAlert(false);
  };

  const validateForm = () => {
    const validationErrors: Record<string, string> = {};

    // Check required fields
    if (!newUser.firstName)
      validationErrors.firstName = "First name is required";
    if (!newUser.lastName) validationErrors.lastName = "Last name is required";
    if (!newUser.email) validationErrors.email = "Email is required";
    if (!newUser.password) validationErrors.password = "Password is required";
    if (!newUser.confirmPassword)
      validationErrors.confirmPassword = "Please confirm password";

    // Validate email format
    if (newUser.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      validationErrors.email = "Please enter a valid email address";
    }

    // Validate password
    if (newUser.password && newUser.password.length < 6) {
      validationErrors.password = "Password must be at least 6 characters";
    }

    // Validate password match
    if (
      newUser.password &&
      newUser.confirmPassword &&
      newUser.password !== newUser.confirmPassword
    ) {
      validationErrors.confirmPassword = "Passwords do not match";
    }

    // Validate phone number (if provided)
    if (newUser.contactNo && newUser.contactNo.length !== 11) {
      validationErrors.contactNo = "Phone number must be 11 digits";
    }

    // Validate phone number format (should start with 09 for Philippine numbers)
    if (
      newUser.contactNo &&
      newUser.contactNo.length === 11 &&
      !newUser.contactNo.startsWith("09")
    ) {
      validationErrors.contactNo =
        "Philippine phone numbers must start with 09";
    }

    return validationErrors;
  };

  const handleCreateUser = async () => {
    // First validate the form
    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setShowValidationAlert(true);

      // Scroll to the first error field
      const firstErrorField = Object.keys(validationErrors)[0];
      const errorElement = document.getElementById(firstErrorField);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
        errorElement.focus();
      }

      return;
    }

    setIsLoading(true);

    try {
      const result = await createUser({
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        contactNo: newUser.contactNo,
        address: newUser.address,
        password: newUser.password,
        role: newUser.role,
      });

      if (result.success && result.user) {
        setIsCreateAccountOpen(false);
        setNewUser({
          firstName: "",
          lastName: "",
          email: "",
          contactNo: "",
          address: "",
          password: "",
          confirmPassword: "",
          role: "user",
        });
        setErrors({});
        setShowValidationAlert(false);

        // Refresh the page to show the new user
        window.location.reload();

        toast.success("User created successfully!");
      } else {
        setErrors({ general: result.error || "Failed to create user" });
        setShowValidationAlert(true);
        toast.error(result.error || "Failed to create user");
      }
    } catch (error: any) {
      setErrors({ general: error.message || "Failed to create user" });
      setShowValidationAlert(true);
      toast.error("Failed to create user");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate form completion percentage
  const calculateCompletion = () => {
    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "password",
      "confirmPassword",
    ];
    const filledFields = requiredFields.filter(
      (field) =>
        newUser[field as keyof typeof newUser]?.toString().trim().length > 0
    ).length;

    return Math.round((filledFields / requiredFields.length) * 100);
  };

  const completionPercentage = calculateCompletion();

  return (
    <Dialog open={isCreateAccountOpen} onOpenChange={setIsCreateAccountOpen}>
      <DialogContent className="sm:max-w-[540px] p-0 gap-0 rounded-lg border border-gray-200 shadow-lg">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {createAccountData
                  ? "Create Account for Guest"
                  : "Create New User"}
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Add a new user to the system
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs font-medium text-gray-500">
                Form completion
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {completionPercentage}%
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-gray-900 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </DialogHeader>

        {/* Form Content */}
        <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Name Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2" id="firstName">
              <Label
                htmlFor="firstName"
                className="text-sm font-medium text-gray-700"
              >
                First name
              </Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="Enter first name"
                value={newUser.firstName}
                onChange={handleInputChange}
                className={`h-10 px-3 text-sm ${errors.firstName ? "border-red-300 focus-visible:ring-red-200" : "border-gray-300 focus-visible:ring-gray-200"}`}
                disabled={isLoading}
              />
              {errors.firstName && (
                <p className="text-xs text-red-500 pt-1">{errors.firstName}</p>
              )}
            </div>
            <div className="space-y-2" id="lastName">
              <Label
                htmlFor="lastName"
                className="text-sm font-medium text-gray-700"
              >
                Last name
              </Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Enter last name"
                value={newUser.lastName}
                onChange={handleInputChange}
                className={`h-10 px-3 text-sm ${errors.lastName ? "border-red-300 focus-visible:ring-red-200" : "border-gray-300 focus-visible:ring-gray-200"}`}
                disabled={isLoading}
              />
              {errors.lastName && (
                <p className="text-xs text-red-500 pt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2" id="email">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-gray-700"
            >
              Email address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="user@example.com"
              value={newUser.email}
              onChange={handleInputChange}
              className={`h-10 px-3 text-sm ${errors.email ? "border-red-300 focus-visible:ring-red-200" : "border-gray-300 focus-visible:ring-gray-200"}`}
              disabled={isLoading || !!createAccountData}
            />
            {errors.email && (
              <p className="text-xs text-red-500 pt-1">{errors.email}</p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role" className="text-sm font-medium text-gray-700">
              User role
            </Label>
            <Select
              value={newUser.role}
              onValueChange={handleRoleChange}
              disabled={isLoading}
            >
              <SelectTrigger
                className={`h-10 px-3 text-sm ${errors.role ? "border-red-300 focus-visible:ring-red-200" : "border-gray-300 focus-visible:ring-gray-200"}`}
              >
                <SelectValue placeholder="Select user role" />
              </SelectTrigger>
              <SelectContent className="text-sm">
                <SelectItem value="user" className="text-sm py-2">
                  User
                </SelectItem>
                <SelectItem value="admin" className="text-sm py-2">
                  Administrator
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-xs text-red-500 pt-1">{errors.role}</p>
            )}
            <p className="text-xs text-gray-500 pt-1">
              Administrators have full system access
            </p>
          </div>

          {/* Contact Number */}
          <div className="space-y-2" id="contactNo">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="contactNo"
                className="text-sm font-medium text-gray-700"
              >
                Phone number
              </Label>
              <span
                className={`text-xs ${newUser.contactNo.length === 11 ? "text-green-600" : "text-gray-500"}`}
              >
                {newUser.contactNo.length}/11
              </span>
            </div>
            <Input
              id="contactNo"
              name="contactNo"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="09XXXXXXXXX"
              value={newUser.contactNo}
              onChange={handleInputChange}
              className={`h-10 px-3 text-sm ${errors.contactNo ? "border-red-300 focus-visible:ring-red-200" : "border-gray-300 focus-visible:ring-gray-200"}`}
              disabled={isLoading}
              maxLength={11}
            />
            {errors.contactNo ? (
              <p className="text-xs text-red-500 pt-1">{errors.contactNo}</p>
            ) : (
              <p className="text-xs text-gray-500 pt-1">
                Enter 11-digit Philippine phone number starting with 09
              </p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label
              htmlFor="address"
              className="text-sm font-medium text-gray-700"
            >
              Address
            </Label>
            <Input
              id="address"
              name="address"
              placeholder="Enter full address (optional)"
              value={newUser.address}
              onChange={handleInputChange}
              className="h-10 px-3 text-sm border-gray-300 focus-visible:ring-gray-200"
              disabled={isLoading}
            />
          </div>

          {/* Password */}
          <div className="space-y-2" id="password">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-gray-700"
            >
              Temporary password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Create a temporary password"
              value={newUser.password}
              onChange={handleInputChange}
              className={`h-10 px-3 text-sm ${errors.password ? "border-red-300 focus-visible:ring-red-200" : "border-gray-300 focus-visible:ring-gray-200"}`}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-xs text-red-500 pt-1">{errors.password}</p>
            )}
            <p className="text-xs text-gray-500 pt-1">
              Minimum 6 characters. User will change on first login.
            </p>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2" id="confirmPassword">
            <Label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-gray-700"
            >
              Confirm password
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter the temporary password"
              value={newUser.confirmPassword}
              onChange={handleInputChange}
              className={`h-10 px-3 text-sm ${errors.confirmPassword ? "border-red-300 focus-visible:ring-red-200" : "border-gray-300 focus-visible:ring-gray-200"}`}
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-500 pt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Validation Alert */}
          {showValidationAlert && Object.keys(errors).length > 0 && (
            <Alert className="border-red-200 bg-red-50 mt-4">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-sm text-red-600">
                <div className="font-medium mb-1">
                  Please fix the following issues:
                </div>
                <ul className="list-disc pl-4 space-y-1">
                  {errors.firstName && <li>First name: {errors.firstName}</li>}
                  {errors.lastName && <li>Last name: {errors.lastName}</li>}
                  {errors.email && <li>Email: {errors.email}</li>}
                  {errors.contactNo && (
                    <li>Phone number: {errors.contactNo}</li>
                  )}
                  {errors.password && <li>Password: {errors.password}</li>}
                  {errors.confirmPassword && (
                    <li>Confirm password: {errors.confirmPassword}</li>
                  )}
                  {errors.role && <li>Role: {errors.role}</li>}
                  {errors.general && <li>{errors.general}</li>}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Information Alert */}
        <div className="px-6 py-3 border-t border-gray-100 bg-blue-50/50">
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs text-blue-600">
              <span className="font-medium">Note:</span> All fields are required
              except address and phone number. Phone number must be 11 digits
              starting with 09. User will receive credentials via email and must
              change password on first login.
            </AlertDescription>
          </Alert>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-gray-500">
              {completionPercentage < 100 ? (
                <span>Complete all required fields to create user</span>
              ) : (
                <span className="text-green-600 font-medium">
                  All required fields completed ✓
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => setIsCreateAccountOpen(false)}
                className="h-9 px-4 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateUser}
                className={`h-9 px-5 text-sm ${completionPercentage < 100 ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-gray-900 text-white hover:bg-gray-800 focus:bg-gray-800"}`}
                disabled={isLoading || completionPercentage < 100}
                title={
                  completionPercentage < 100
                    ? "Complete all required fields"
                    : "Create new user"
                }
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </div>
                ) : (
                  "Create User"
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
