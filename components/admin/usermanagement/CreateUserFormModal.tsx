// components/admin/usermanagement/CreateUserFormModal.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertCircle,
  Info,
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  UserPlus,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { createUser, checkEmailAvailability } from "@/action/userManagement";
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
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [showValidationAlert, setShowValidationAlert] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Define valid roles and display names inline - UPDATED WITH CASHIER
  const userRoles = {
    user: "User",
    project_manager: "Project Manager",
    cashier: "Cashier",
    admin: "Administrator",
  };

  const availableRoles = Object.keys(userRoles);
  const formatRoleDisplay = (role: string): string =>
    userRoles[role as keyof typeof userRoles] || role;

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return Shield;
      case "project_manager":
        return User;
      case "cashier":
        return Receipt;
      default:
        return User;
    }
  };

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
      setEmailAvailable(null);
      setShowValidationAlert(false);
    }
  }, [isCreateAccountOpen, createAccountData]);

  // Check email availability using server action
  const checkEmail = useCallback(async (email: string) => {
    if (!email) {
      setEmailAvailable(null);
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailAvailable(null);
      setErrors((prev) => ({
        ...prev,
        email: "Please enter a valid email address",
      }));
      return;
    }

    setIsCheckingEmail(true);
    try {
      const result = await checkEmailAvailability(email);

      if (result.error) {
        // Handle validation errors
        setEmailAvailable(null);
        if (result.error === "Invalid email format") {
          setErrors((prev) => ({
            ...prev,
            email: "Please enter a valid email address",
          }));
        } else {
          setErrors((prev) => ({ ...prev, email: "" }));
        }
      } else {
        setEmailAvailable(result.available);

        if (!result.available) {
          setErrors((prev) => ({ ...prev, email: "Email already in use" }));
        } else {
          setErrors((prev) => ({ ...prev, email: "" }));
        }
      }
    } catch (error) {
      console.error("Error checking email:", error);
      // Don't block on network errors, just show unknown status
      setEmailAvailable(null);
      setErrors((prev) => ({ ...prev, email: "" }));
    } finally {
      setIsCheckingEmail(false);
    }
  }, []);

  // Debounced email check
  const debouncedCheckEmail = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;

      return (email: string) => {
        clearTimeout(timeoutId);

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          setEmailAvailable(null);
          if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setErrors((prev) => ({
              ...prev,
              email: "Please enter a valid email address",
            }));
          } else {
            setErrors((prev) => ({ ...prev, email: "" }));
          }
          return;
        }

        timeoutId = setTimeout(() => {
          checkEmail(email);
        }, 500);
      };
    })(),
    [checkEmail]
  );

  // Check email on change
  useEffect(() => {
    debouncedCheckEmail(newUser.email);
  }, [newUser.email, debouncedCheckEmail]);

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

    // Clear validation errors when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Clear general errors
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: "" }));
    }

    // Hide validation alert when user starts typing
    setShowValidationAlert(false);
  };

  const handleRoleChange = (value: string) => {
    setNewUser((prev) => ({ ...prev, role: value }));
    setErrors((prev) => ({ ...prev, role: "", general: "" }));
    setShowValidationAlert(false);
  };

  // Real-time password validation
  useEffect(() => {
    if (newUser.password && newUser.confirmPassword) {
      if (newUser.password !== newUser.confirmPassword) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: "Passwords do not match",
        }));
      } else {
        setErrors((prev) => ({ ...prev, confirmPassword: "" }));
      }
    }
  }, [newUser.password, newUser.confirmPassword]);

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

    // Check email availability - only if we know it's taken
    if (newUser.email && emailAvailable === false) {
      validationErrors.email = "Email already in use";
    }

    // Don't block submission if email check is still loading or failed
    // Server-side validation in createUser will catch duplicates

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
      // Convert role to lowercase to match enum values in User model
      const roleToSend = newUser.role.toLowerCase();

      const result = await createUser({
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        contactNo: newUser.contactNo,
        address: newUser.address,
        password: newUser.password,
        role: roleToSend as any, // Send lowercase role
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
        setEmailAvailable(null);
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

  const isFormValid = () => {
    const validationErrors = validateForm();
    return Object.keys(validationErrors).length === 0;
  };

  return (
    <Dialog open={isCreateAccountOpen} onOpenChange={setIsCreateAccountOpen}>
      <DialogContent className="sm:max-w-[550px] bg-card p-0 border-border max-h-[85vh] flex flex-col">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <UserPlus className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-foreground">
                {createAccountData
                  ? "Create Account for Guest"
                  : "Create New User"}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Add a new user to the system
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
                    name="firstName"
                    value={newUser.firstName}
                    onChange={handleInputChange}
                    className={`border-border focus:border-foreground ${errors.firstName ? "border-red-500" : ""}`}
                    placeholder="Enter first name"
                    disabled={isLoading}
                  />
                  {errors.firstName && (
                    <p className="text-xs text-red-500 pt-1">
                      {errors.firstName}
                    </p>
                  )}
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
                    name="lastName"
                    value={newUser.lastName}
                    onChange={handleInputChange}
                    className={`border-border focus:border-foreground ${errors.lastName ? "border-red-500" : ""}`}
                    placeholder="Enter last name"
                    disabled={isLoading}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-red-500 pt-1">
                      {errors.lastName}
                    </p>
                  )}
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
                  <div className="relative">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={newUser.email}
                      onChange={handleInputChange}
                      className={`border-border focus:border-foreground pr-10 ${errors.email ? "border-red-500" : emailAvailable === true ? "border-emerald-500" : emailAvailable === false ? "border-red-500" : ""}`}
                      placeholder="Enter email address"
                      disabled={isLoading || !!createAccountData}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {isCheckingEmail ? (
                        <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                      ) : emailAvailable === true ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      ) : emailAvailable === false ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : null}
                    </div>
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-500 pt-1">{errors.email}</p>
                  )}
                  {emailAvailable === true && (
                    <p className="text-xs text-emerald-600 pt-1 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Email is available
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="contactNo"
                    className="text-sm font-medium text-foreground"
                  >
                    Contact Number
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="contactNo"
                      name="contactNo"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={newUser.contactNo}
                      onChange={handleInputChange}
                      className={`border-border focus:border-foreground flex-1 ${errors.contactNo ? "border-red-500" : ""}`}
                      placeholder="09XXXXXXXXX"
                      disabled={isLoading}
                      maxLength={11}
                    />
                    <div className="text-xs text-muted-foreground min-w-[60px] text-right">
                      {newUser.contactNo.length}/11
                    </div>
                  </div>
                  {errors.contactNo && (
                    <p className="text-xs text-red-500 pt-1">
                      {errors.contactNo}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Enter 11-digit Philippine phone number starting with 09
                  </p>
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
                    name="address"
                    value={newUser.address}
                    onChange={handleInputChange}
                    className="border-border focus:border-foreground"
                    placeholder="Enter full address (optional)"
                    disabled={isLoading}
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
                {/* Role Selection Card */}
                <Card className="border-border bg-muted/50">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm font-medium text-foreground">
                          Role
                        </Label>
                      </div>
                      <Select
                        value={newUser.role}
                        onValueChange={handleRoleChange}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="border-border">
                          <SelectValue placeholder="Select user role">
                            <div className="flex items-center gap-2">
                              {(() => {
                                const Icon = getRoleIcon(newUser.role);
                                return <Icon className="h-4 w-4" />;
                              })()}
                              {formatRoleDisplay(newUser.role)}
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {availableRoles.map((role) => {
                            const Icon = getRoleIcon(role);
                            return (
                              <SelectItem key={role} value={role}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  {formatRoleDisplay(role)}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      {errors.role && (
                        <p className="text-xs text-red-500 pt-1">
                          {errors.role}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Password Requirements Card */}
                <Card className="border-border bg-muted/50">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-blue-50">
                          <div className="h-4 w-4 rounded-full bg-blue-600" />
                        </div>
                        <Label className="text-sm font-medium text-foreground">
                          Password Requirements
                        </Label>
                      </div>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        <li
                          className={`flex items-center gap-1 ${newUser.password.length >= 6 ? "text-emerald-600" : ""}`}
                        >
                          {newUser.password.length >= 6 ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <div className="h-3 w-3 rounded-full border border-muted-foreground" />
                          )}
                          At least 6 characters
                        </li>
                        <li
                          className={`flex items-center gap-1 ${newUser.password === newUser.confirmPassword && newUser.confirmPassword ? "text-emerald-600" : ""}`}
                        >
                          {newUser.password === newUser.confirmPassword &&
                          newUser.confirmPassword ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <div className="h-3 w-3 rounded-full border border-muted-foreground" />
                          )}
                          Passwords match
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Password Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-foreground"
                  >
                    Temporary Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={newUser.password}
                      onChange={handleInputChange}
                      className={`border-border focus:border-foreground pr-10 ${errors.password ? "border-red-500" : ""}`}
                      placeholder="Create temporary password"
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-500 pt-1">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium text-foreground"
                  >
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={newUser.confirmPassword}
                      onChange={handleInputChange}
                      className={`border-border focus:border-foreground pr-10 ${errors.confirmPassword ? "border-red-500" : newUser.password === newUser.confirmPassword && newUser.confirmPassword ? "border-emerald-500" : ""}`}
                      placeholder="Re-enter password"
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-500 pt-1">
                      {errors.confirmPassword}
                    </p>
                  )}
                  {newUser.password === newUser.confirmPassword &&
                    newUser.confirmPassword && (
                      <p className="text-xs text-emerald-600 pt-1 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Passwords match
                      </p>
                    )}
                </div>
              </div>
            </div>

            {/* Information Alert */}
            <div className="space-y-4">
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-700">
                  <div className="font-medium mb-1">Important Information:</div>
                  <ul className="list-disc pl-4 space-y-1 text-xs">
                    <li>All fields except address are required</li>
                    <li>Phone number must be 11 digits starting with 09</li>
                    <li>User will receive credentials via email</li>
                    <li>Password must be changed on first login</li>
                    <li>Account will be automatically verified</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* Validation Alert */}
              {showValidationAlert && Object.keys(errors).length > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-sm text-red-600">
                    <div className="font-medium mb-1">
                      Please fix the following issues:
                    </div>
                    <ul className="list-disc pl-4 space-y-1 text-xs">
                      {errors.firstName && (
                        <li>First name: {errors.firstName}</li>
                      )}
                      {errors.lastName && <li>Last name: {errors.lastName}</li>}
                      {errors.email && <li>Email: {errors.email}</li>}
                      {errors.contactNo && (
                        <li>Phone number: {errors.contactNo}</li>
                      )}
                      {errors.password && <li>Password: {errors.password}</li>}
                      {errors.confirmPassword && (
                        <li>Confirm password: {errors.confirmPassword}</li>
                      )}
                      {errors.general && <li>{errors.general}</li>}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>

        <Separator />

        <DialogFooter className="p-4 sm:p-6 bg-card">
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
            <div className="text-sm text-muted-foreground">
              {isFormValid() ? (
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="h-4 w-4" />
                  All requirements met
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  Complete all required fields
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => setIsCreateAccountOpen(false)}
                className="flex-1 sm:flex-none border-border hover:bg-accent"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateUser}
                className="flex-1 sm:flex-none bg-foreground hover:bg-foreground/90 text-background"
                disabled={isLoading || !isFormValid()}
                title={
                  !isFormValid()
                    ? "Complete all required fields"
                    : "Create new user"
                }
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-background border-t-transparent rounded-full animate-spin" />
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
