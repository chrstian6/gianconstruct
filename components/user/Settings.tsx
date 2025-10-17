"use client";

import * as React from "react";
import {
  Bell,
  User,
  Shield,
  Paintbrush,
  Globe,
  Keyboard,
  Link,
  Lock,
  Settings,
  CreditCard,
  HelpCircle,
  Mail,
  Palette,
  Save,
  Loader2,
  Camera,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores";
import { updateUserProfile, getUserData } from "@/action/profile";
import { initiatePasswordChange } from "@/action/change-password";
import { toast } from "sonner";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const data = {
  nav: [
    { name: "Profile", icon: User },
    { name: "Notifications", icon: Bell },
    { name: "Appearance", icon: Paintbrush },
    { name: "Language & Region", icon: Globe },
    { name: "Accessibility", icon: Keyboard },
    { name: "Privacy & Security", icon: Lock },
    { name: "Connected Accounts", icon: Link },
    { name: "Billing", icon: CreditCard },
    { name: "Help & Support", icon: HelpCircle },
  ],
};

// Use environment variable for Supabase URL
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

// All 13 avatars using environment variable
const avatarOptions = Array.from({ length: 13 }, (_, i) => {
  const avatarNumber = i + 1;
  return {
    id: `avatar-${avatarNumber}`,
    url: `${SUPABASE_URL}/storage/v1/object/public/avatars/predefined/avatar${avatarNumber}.png`,
    label: `Avatar ${avatarNumber}`,
  };
});

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Password Input Component
const PasswordInput = React.memo(
  ({
    id,
    label,
    value,
    onChange,
    showPassword,
    onToggleVisibility,
    error,
    placeholder,
    required = true,
    disabled = false,
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
    disabled?: boolean;
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
          disabled={disabled}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-500 hover:text-gray-700"
          onClick={onToggleVisibility}
          disabled={disabled}
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
  )
);

PasswordInput.displayName = "PasswordInput";

// Password Change Dialog Component
function PasswordChangeDialog() {
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  // Use state instead of ref for form data
  const [passwordData, setPasswordData] = React.useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const { user } = useAuthStore();

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear errors when user starts typing
    setErrors((prev) => ({ ...prev, [field]: "", general: "" }));
  };

  const resetForm = React.useCallback(() => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setErrors({});
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  }, []);

  const handleOpenChange = React.useCallback(
    (newOpen: boolean) => {
      setOpen(newOpen);
      if (!newOpen) {
        // Reset form when dialog closes
        setTimeout(resetForm, 300);
      }
    },
    [resetForm]
  );

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
    const { currentPassword, newPassword, confirmPassword } = passwordData;
    const newErrors: Record<string, string> = {};

    if (!currentPassword.trim()) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
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
            : (value ?? "Invalid input");
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

  const { currentPassword, newPassword, confirmPassword } = passwordData;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Change Password
        </Button>
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
            value={currentPassword}
            onChange={(value) => handlePasswordChange("currentPassword", value)}
            showPassword={showCurrentPassword}
            onToggleVisibility={() =>
              setShowCurrentPassword(!showCurrentPassword)
            }
            error={errors.currentPassword}
            placeholder="Enter your current password"
            disabled={isLoading}
          />

          {/* New Password */}
          <PasswordInput
            id="newPassword"
            label="New Password"
            value={newPassword}
            onChange={(value) => handlePasswordChange("newPassword", value)}
            showPassword={showNewPassword}
            onToggleVisibility={() => setShowNewPassword(!showNewPassword)}
            error={errors.newPassword}
            placeholder="Enter new password (min. 6 characters)"
            disabled={isLoading}
          />

          {/* Confirm Password */}
          <PasswordInput
            id="confirmPassword"
            label="Confirm New Password"
            value={confirmPassword}
            onChange={(value) => handlePasswordChange("confirmPassword", value)}
            showPassword={showConfirmPassword}
            onToggleVisibility={() =>
              setShowConfirmPassword(!showConfirmPassword)
            }
            error={errors.confirmPassword}
            placeholder="Confirm your new password"
            disabled={isLoading}
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
                  className={`w-2 h-2 rounded-full ${newPassword.length >= 6 ? "bg-green-500" : "bg-gray-300"}`}
                ></div>
                At least 6 characters long
              </li>
              <li className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${newPassword !== currentPassword && currentPassword ? "bg-green-500" : "bg-gray-300"}`}
                ></div>
                Different from current password
              </li>
              <li className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${newPassword === confirmPassword && confirmPassword ? "bg-green-500" : "bg-gray-300"}`}
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
              className="flex-1 bg-foreground hover:bg-[var(--orange)]/90 text-white disabled:bg-[var(--orange)]/50 disabled:cursor-not-allowed"
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

// Avatar Selection Dialog Component with smaller avatars
function AvatarSelectionDialog({
  currentAvatar,
  onAvatarSelect,
}: {
  currentAvatar: string;
  onAvatarSelect: (avatarUrl: string) => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 px-3">
          <Camera className="h-3 w-3 mr-1" />
          Change Avatar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-10">
        <DialogHeader>
          <DialogTitle>Choose an Avatar</DialogTitle>
          <DialogDescription>
            Select from 13 available avatars for your profile
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-5 gap-2 py-4">
          {avatarOptions.map((avatar) => (
            <button
              key={avatar.id}
              type="button"
              onClick={() => {
                onAvatarSelect(avatar.url);
                setOpen(false);
              }}
              className={`relative aspect-square rounded-lg w-13 h-13 border transition-all hover:scale-105 ${
                currentAvatar === avatar.url
                  ? "border-orange-500 ring-1 ring-orange-300"
                  : "border-gray-300"
              }`}
            >
              <div className="flex aspect-square items-center justify-center rounded-lg overflow-hidden w-12 h-12">
                <img
                  src={avatar.url}
                  alt={avatar.label}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [activeSection, setActiveSection] = React.useState("Profile");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFetchingUser, setIsFetchingUser] = React.useState(false);
  const { user, setUser } = useAuthStore();

  // Form state - use state for proper reactivity
  const [formData, setFormData] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    contactNo: "",
    address: "",
    avatar: "",
  });

  // Fetch user data from database when dialog opens
  React.useEffect(() => {
    const fetchUserData = async () => {
      if (open && user?.user_id) {
        setIsFetchingUser(true);
        try {
          const result = await getUserData(user.user_id);
          if (result.success && result.user) {
            setFormData({
              firstName: result.user.firstName || "",
              lastName: result.user.lastName || "",
              email: result.user.email || "",
              contactNo: result.user.contactNo || "",
              address: result.user.address || "",
              avatar: result.user.avatar || "",
            });
          } else {
            toast.error(result.error || "Failed to load user data");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          toast.error("Failed to load user data");
        } finally {
          setIsFetchingUser(false);
        }
      }
    };

    fetchUserData();
  }, [open, user?.user_id]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAvatarSelect = (avatarUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      avatar: avatarUrl,
    }));
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to update your profile");
      return;
    }

    setIsLoading(true);

    try {
      const result = await updateUserProfile(user.user_id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: formData.address,
        contactNo: formData.contactNo,
        avatar: formData.avatar,
      });

      if (result.success) {
        // Update auth store with new data including avatar
        setUser({
          user_id: user.user_id,
          firstName: formData.firstName,
          email: user.email,
          role: user.role,
          avatar: formData.avatar,
        });

        toast.success("Profile updated successfully!");
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("An error occurred while updating your profile");
    } finally {
      setIsLoading(false);
    }
  };

  const getSectionContent = () => {
    switch (activeSection) {
      case "Profile":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Profile</h2>
              <p className="text-muted-foreground">
                Manage your personal information and account settings
              </p>
            </div>
            <Separator />

            {isFetchingUser ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                <span className="ml-2">Loading profile...</span>
              </div>
            ) : (
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                {/* Current Avatar Display */}
                <div className="space-y-4">
                  <Label>Profile Avatar</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage
                        src={formData.avatar}
                        alt="Profile avatar"
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-orange-500 text-white text-lg font-medium">
                        {formData.firstName?.[0] || user?.firstName?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {formData.avatar
                          ? "Custom avatar selected"
                          : "No avatar selected"}
                      </p>
                      <AvatarSelectionDialog
                        currentAvatar={formData.avatar}
                        onAvatarSelect={handleAvatarSelect}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      placeholder="Enter your first name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      placeholder="Enter your last name"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Enter your email"
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email address cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactNo">Phone Number</Label>
                  <Input
                    id="contactNo"
                    value={formData.contactNo}
                    onChange={(e) =>
                      handleInputChange("contactNo", e.target.value)
                    }
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    placeholder="Enter your address"
                  />
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Profile
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        );

      case "Notifications":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Notifications</h2>
              <p className="text-muted-foreground">
                Configure how you receive notifications
              </p>
            </div>
            <Separator />
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications for important updates
                  </p>
                </div>
                <Switch id="push-notifications" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email updates about your account
                  </p>
                </div>
                <Switch id="email-notifications" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="marketing-emails">Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive emails about new features and products
                  </p>
                </div>
                <Switch id="marketing-emails" />
              </div>
            </div>
          </div>
        );

      case "Appearance":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Appearance</h2>
              <p className="text-muted-foreground">
                Customize the look and feel of the application
              </p>
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select defaultValue="system">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="font-size">Font Size</Label>
                <Select defaultValue="medium">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="compact-mode">Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Use compact spacing for lists and tables
                  </p>
                </div>
                <Switch id="compact-mode" />
              </div>
            </div>
          </div>
        );

      case "Language & Region":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Language & Region</h2>
              <p className="text-muted-foreground">
                Set your preferred language and regional settings
              </p>
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select defaultValue="utc-8">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utc-8">Pacific Time (PT)</SelectItem>
                    <SelectItem value="utc-5">Eastern Time (ET)</SelectItem>
                    <SelectItem value="utc">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-format">Date Format</Label>
                <Select defaultValue="mm-dd-yyyy">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mm-dd-yyyy">MM/DD/YYYY</SelectItem>
                    <SelectItem value="dd-mm-yyyy">DD/MM/YYYY</SelectItem>
                    <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case "Privacy & Security":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Privacy & Security</h2>
              <p className="text-muted-foreground">
                Manage your privacy and security settings
              </p>
            </div>
            <Separator />
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Badge variant="outline">Disabled</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="data-collection">Data Collection</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow anonymous usage data collection
                  </p>
                </div>
                <Switch id="data-collection" />
              </div>

              {/* Password Change Section */}
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label className="text-base font-medium">
                    Password Management
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Change your password securely with email verification
                  </p>
                </div>
                <PasswordChangeDialog />
              </div>

              <div className="p-4 border border-destructive/20 rounded-lg">
                <div className="space-y-2">
                  <Label className="text-base font-medium text-destructive">
                    Danger Zone
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-3 text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">{activeSection}</h2>
              <p className="text-muted-foreground">
                Configure your {activeSection.toLowerCase()} settings
              </p>
            </div>
            <Separator />
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Settings for {activeSection} will be available soon.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 md:max-h-[600px] md:max-w-[900px] lg:max-w-[1000px]">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Customize your settings here.
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {data.nav.map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          asChild
                          isActive={activeSection === item.name}
                          onClick={() => setActiveSection(item.name)}
                          className="cursor-pointer"
                        >
                          <a href="#" onClick={(e) => e.preventDefault()}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.name}</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className="flex h-[580px] flex-1 flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b">
              <div className="flex items-center gap-2 px-6">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#">Settings</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{activeSection}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6 pt-4">
              {getSectionContent()}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  );
}
