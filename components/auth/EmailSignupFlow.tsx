"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  initiateEmailSignup,
  verifyOTP,
  completeUserProfile,
} from "@/action/otp-signup";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  CheckCircle,
  User,
  MapPin,
  Phone,
  Lock,
} from "lucide-react";

type Step = "email" | "otp" | "profile" | "password" | "complete";

interface ServerError {
  email?: string[];
  contactNo?: string[];
  general?: string[];
  otp?: string[];
  [key: string]: string[] | undefined;
}

export default function EmailSignupFlow() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    contactNo: "",
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [user_id, setUser_id] = useState("");

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  const getErrorMessage = (errors: ServerError | undefined): string => {
    if (!errors) return "An error occurred";

    for (const key in errors) {
      if (errors[key]?.[0]) {
        return errors[key]![0];
      }
    }
    return "An error occurred";
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    formData.append("email", email);

    const result = await initiateEmailSignup(formData);

    if (result.success) {
      setUserId(result.userId!);
      setStep("otp");
      toast.success("OTP sent to your email");
    } else {
      toast.error(getErrorMessage(result.errors));
    }
    setIsLoading(false);
  };

  const setOtpRef = useCallback(
    (index: number) => (el: HTMLInputElement | null) => {
      otpRefs.current[index] = el;
    },
    []
  );

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      setIsLoading(false);
      return;
    }

    const result = await verifyOTP(userId, otpCode);

    if (result.success) {
      setUserEmail(result.userEmail!);
      setUser_id(result.user_id!);
      setStep("profile");
      toast.success("Email verified! Please complete your profile");
    } else {
      toast.error(getErrorMessage(result.errors));
    }
    setIsLoading(false);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("password");
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      setIsLoading(false);
      return;
    }

    const result = await completeUserProfile(userId, {
      ...profileData,
      password,
    });

    if (result.success) {
      setStep("complete");
      toast.success("Account created successfully!");

      setTimeout(() => {
        router.push("/auth");
      }, 3000);
    } else {
      toast.error(getErrorMessage(result.errors));
    }
    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Progress Steps */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-4">
          {["email", "otp", "profile", "password", "complete"].map(
            (stepName, index) => (
              <div key={stepName} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === stepName
                      ? "bg-orange-500 text-white"
                      : step === "complete" ||
                          index <
                            [
                              "email",
                              "otp",
                              "profile",
                              "password",
                              "complete",
                            ].indexOf(step)
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step === "complete" ||
                  index <
                    ["email", "otp", "profile", "password", "complete"].indexOf(
                      step
                    ) ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < 4 && (
                  <div
                    className={`w-12 h-1 mx-2 ${
                      step === "complete" ||
                      index <
                        [
                          "email",
                          "otp",
                          "profile",
                          "password",
                          "complete",
                        ].indexOf(step) -
                          1
                        ? "bg-green-500"
                        : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            )
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            {step === "email" && "Sign Up with Email"}
            {step === "otp" && "Verify Your Email"}
            {step === "profile" && "Basic Information"}
            {step === "password" && "Security Settings"}
            {step === "complete" && "Registration Complete"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Step 1: Email Input */}
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-10"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-10"
                disabled={isLoading}
              >
                {isLoading ? "Sending OTP..." : "Send Verification Code"}
              </Button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === "otp" && (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Enter the 6-digit code sent to
                  <br />
                  <strong>{email}</strong>
                </p>
              </div>

              <div className="flex justify-center space-x-2">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={setOtpRef(index)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    className="w-12 h-12 text-center text-lg font-semibold"
                    required
                  />
                ))}
              </div>

              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full h-10"
                  disabled={isLoading}
                >
                  {isLoading ? "Verifying..." : "Verify Code"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10"
                  onClick={() => setStep("email")}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Email
                </Button>
              </div>
            </form>
          )}

          {/* Step 3: Basic Information */}
          {step === "profile" && (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          firstName: e.target.value,
                        })
                      }
                      className="pl-10 h-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        lastName: e.target.value,
                      })
                    }
                    className="h-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="address"
                    value={profileData.address}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        address: e.target.value,
                      })
                    }
                    className="pl-10 h-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactNo">Contact Number (Optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="contactNo"
                    type="tel"
                    placeholder="+63 912 345 6789"
                    value={profileData.contactNo}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        contactNo: e.target.value,
                      })
                    }
                    className="pl-10 h-10"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Button type="submit" className="w-full h-10">
                  Continue to Security
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10"
                  onClick={() => setStep("otp")}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Verification
                </Button>
              </div>
            </form>
          )}

          {/* Step 4: Password Setup */}
          {step === "password" && (
            <form onSubmit={handleCompleteSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-10"
                    required
                    minLength={6}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Must be at least 6 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 h-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full h-10"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Complete Registration"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10"
                  onClick={() => setStep("profile")}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Profile
                </Button>
              </div>
            </form>
          )}

          {/* Step 5: Completion */}
          {step === "complete" && (
            <div className="text-center space-y-4 py-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <div>
                <h3 className="font-semibold text-lg">
                  Registration Successful!
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  Your account has been created successfully.
                  <br />
                  Your User ID is: <strong>{user_id}</strong>
                </p>
              </div>
              <Button
                onClick={() => router.push("/auth")}
                className="w-full h-10"
              >
                Go to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
