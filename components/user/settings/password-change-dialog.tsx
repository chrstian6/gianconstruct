// components/ui/password-change-dialog.tsx
"use client";

import * as React from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/stores";
import { initiatePasswordChange } from "@/action/change-password";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PasswordChangeDialogProps {
  trigger?: React.ReactNode;
}

export function PasswordChangeDialog({ trigger }: PasswordChangeDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const [passwordData, setPasswordData] = React.useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const { user } = useAuthStore();

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setErrors({});
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when dialog closes
      setTimeout(resetForm, 300);
    }
  };

  const getDeviceInfo = async (): Promise<any> => {
    try {
      // Get IP address
      const ipResponse = await fetch("https://api.ipify.org?format=json");
      const ipData = await ipResponse.json();

      // Get browser and OS information
      const userAgent = navigator.userAgent;
      let browser = "Unknown Browser";
      let os = "Unknown OS";

      // Detect browser
      if (userAgent.includes("Chrome") && !userAgent.includes("Edg"))
        browser = "Chrome";
      else if (userAgent.includes("Firefox")) browser = "Firefox";
      else if (userAgent.includes("Safari") && !userAgent.includes("Chrome"))
        browser = "Safari";
      else if (userAgent.includes("Edg")) browser = "Edge";

      // Detect OS
      if (userAgent.includes("Windows")) os = "Windows";
      else if (userAgent.includes("Mac")) os = "Mac OS";
      else if (userAgent.includes("Linux")) os = "Linux";
      else if (userAgent.includes("Android")) os = "Android";
      else if (userAgent.includes("iOS")) os = "iOS";

      return {
        ip: ipData.ip || "unknown",
        userAgent: `${browser} on ${os}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Failed to get device info:", error);
      return {
        ip: "unknown",
        userAgent: navigator.userAgent.substring(0, 100), // Limit length
        timestamp: new Date().toISOString(),
      };
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!passwordData.currentPassword.trim()) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!passwordData.newPassword.trim()) {
      newErrors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }

    if (!passwordData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (
      passwordData.currentPassword &&
      passwordData.newPassword &&
      passwordData.currentPassword === passwordData.newPassword
    ) {
      newErrors.newPassword =
        "New password must be different from current password";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to change your password");
      return;
    }

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Get device information
      const deviceInfo = await getDeviceInfo();

      const formData = new FormData();
      formData.append("currentPassword", passwordData.currentPassword);
      formData.append("newPassword", passwordData.newPassword);
      formData.append("confirmPassword", passwordData.confirmPassword);

      const result = await initiatePasswordChange(
        user.user_id,
        formData,
        deviceInfo
      );

      if (result.success) {
        setOpen(false);
        resetForm();
        toast.success(
          result.message || "Verification email sent successfully!"
        );
      } else {
        const flattenedErrors: Record<string, string> = {};
        for (const [key, value] of Object.entries(result.errors || {})) {
          flattenedErrors[key] = Array.isArray(value)
            ? value[0] || "Invalid input"
            : value || "Invalid input";
        }
        setErrors(flattenedErrors);

        if (flattenedErrors.general) {
          toast.error(flattenedErrors.general);
        } else if (flattenedErrors.currentPassword) {
          toast.error(flattenedErrors.currentPassword);
        } else {
          toast.error("Failed to initiate password change");
        }
      }
    } catch (error: any) {
      console.error("Password change error:", error);
      setErrors({ general: error.message || "Failed to change password" });
      toast.error("Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  const PasswordInput = ({
    id,
    label,
    value,
    onChange,
    showPassword,
    onToggleVisibility,
    error,
    placeholder,
    required = true,
  }: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    showPassword: boolean;
    onToggleVisibility: () => void;
    error?: string;
    placeholder?: string;
    required?: boolean;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label} {required && "*"}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={`pr-10 transition-colors ${
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : "border-gray-300"
          }`}
          disabled={isLoading}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-500 hover:text-gray-700"
          onClick={onToggleVisibility}
          disabled={isLoading}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>
      {error && (
        <p className="text-red-500 text-sm flex items-center gap-1">
          <span>•</span>
          {error}
        </p>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full">
            Change Password
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[var(--orange)]">
            Change Password
          </DialogTitle>
          <DialogDescription className="text-base">
            Update your password securely. You'll receive a verification email
            to confirm the change.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Current Password */}
          <PasswordInput
            id="currentPassword"
            label="Current Password"
            value={passwordData.currentPassword}
            onChange={(value) => handlePasswordChange("currentPassword", value)}
            showPassword={showCurrentPassword}
            onToggleVisibility={() =>
              setShowCurrentPassword(!showCurrentPassword)
            }
            error={errors.currentPassword}
            placeholder="Enter your current password"
          />

          {/* New Password */}
          <PasswordInput
            id="newPassword"
            label="New Password"
            value={passwordData.newPassword}
            onChange={(value) => handlePasswordChange("newPassword", value)}
            showPassword={showNewPassword}
            onToggleVisibility={() => setShowNewPassword(!showNewPassword)}
            error={errors.newPassword}
            placeholder="Enter new password (min. 6 characters)"
          />

          {/* Confirm Password */}
          <PasswordInput
            id="confirmPassword"
            label="Confirm New Password"
            value={passwordData.confirmPassword}
            onChange={(value) => handlePasswordChange("confirmPassword", value)}
            showPassword={showConfirmPassword}
            onToggleVisibility={() =>
              setShowConfirmPassword(!showConfirmPassword)
            }
            error={errors.confirmPassword}
            placeholder="Confirm your new password"
          />

          {/* General Error */}
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm flex items-center gap-1">
                <span>•</span>
                {errors.general}
              </p>
            </div>
          )}

          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                <svg
                  className="w-3 h-3 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-800">
                  Security Notice
                </p>
                <p className="text-sm text-blue-700">
                  After submitting, you'll receive a verification email with
                  device and location details. You must click the link in that
                  email to complete the password change. The link expires in 1
                  hour.
                </p>
              </div>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-800 mb-2">
              Password Requirements:
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${passwordData.newPassword.length >= 6 ? "bg-green-500" : "bg-gray-300"}`}
                ></div>
                At least 6 characters long
              </li>
              <li className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${passwordData.newPassword !== passwordData.currentPassword && passwordData.currentPassword ? "bg-green-500" : "bg-gray-300"}`}
                ></div>
                Different from current password
              </li>
              <li className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${passwordData.newPassword === passwordData.confirmPassword && passwordData.confirmPassword ? "bg-green-500" : "bg-gray-300"}`}
                ></div>
                Passwords match
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white disabled:bg-[var(--orange)]/50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending Verification...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
