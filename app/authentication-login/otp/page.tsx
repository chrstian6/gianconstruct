"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { verifyOTP, resendOTP, getOTPExpiration } from "@/action/otp-signup";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Mail, CheckCircle, RotateCcw, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function OTPPage() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState("");
  const [verified, setVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpExpiry, setOtpExpiry] = useState<number | null>(null);
  const [isLoadingExpiry, setIsLoadingExpiry] = useState(true);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");
  const userId = searchParams.get("userId");

  // Calculate remaining time based on server expiration
  const calculateRemainingTime = (expirationTime: number) => {
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((expirationTime - now) / 1000));
    return remaining;
  };

  // Load OTP expiration time from server
  useEffect(() => {
    const loadExpirationTime = async () => {
      if (!token) return;

      setIsLoadingExpiry(true);
      const result = await getOTPExpiration(token);

      if (result.success && result.otpExpires) {
        const remainingTime = calculateRemainingTime(result.otpExpires);
        setOtpExpiry(remainingTime);
      } else {
        // If we can't get the expiration, assume it's expired
        setOtpExpiry(0);
      }
      setIsLoadingExpiry(false);
    };

    loadExpirationTime();
  }, [token]);

  useEffect(() => {
    if (!token || !userId) {
      toast.error("Invalid verification link");
      router.push("/authentication-login");
    }
  }, [token, userId, router]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Countdown timer for OTP expiry
  useEffect(() => {
    if (otpExpiry !== null && otpExpiry > 0 && !verified) {
      const timer = setTimeout(() => {
        setOtpExpiry(otpExpiry - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [otpExpiry, verified]);

  const setOtpRef = useCallback(
    (index: number) => (el: HTMLInputElement | null) => {
      otpRefs.current[index] = el;
    },
    []
  );

  const handleOtpChange = (value: string, index: number) => {
    // Only allow numbers
    const numericValue = value.replace(/\D/g, "");
    const newOtp = [...otp];
    newOtp[index] = numericValue;
    setOtp(newOtp);

    if (numericValue && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }

    // Allow pasting OTP
    if (e.key === "v" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "");
    const otpArray = pastedData.slice(0, 6).split("");

    const newOtp = [...otp];
    otpArray.forEach((char, index) => {
      if (index < 6) {
        newOtp[index] = char;
      }
    });

    setOtp(newOtp);

    // Focus on the next empty field or last field
    const nextEmptyIndex = newOtp.findIndex((val) => val === "");
    if (nextEmptyIndex !== -1 && nextEmptyIndex < 6) {
      otpRefs.current[nextEmptyIndex]?.focus();
    } else {
      otpRefs.current[5]?.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || !userId) {
      toast.error("Invalid verification session");
      return;
    }

    if (otpExpiry !== null && otpExpiry <= 0) {
      toast.error("OTP has expired. Please request a new one.");
      return;
    }

    setIsLoading(true);

    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      setIsLoading(false);
      return;
    }

    const result = await verifyOTP(token, otpCode);

    if (result.success) {
      setEmail(result.userEmail!);
      setVerified(true);
      toast.success("Email verified successfully!");

      // Redirect to signup flow after 2 seconds
      setTimeout(() => {
        router.push(`/authentication-login/signup?userId=${result.userId}`);
      }, 2000);
    } else {
      const errorMessage =
        result.errors?.otp?.[0] ||
        result.errors?.general?.[0] ||
        "OTP verification failed";
      toast.error(errorMessage);
    }
    setIsLoading(false);
  };

  const handleResendOTP = async () => {
    if (!token || !userId) {
      toast.error("Invalid verification session");
      return;
    }

    if (resendCooldown > 0) {
      toast.error(`Please wait ${resendCooldown} seconds before resending`);
      return;
    }

    setIsResending(true);

    const result = await resendOTP(token);

    if (result.success) {
      toast.success("New OTP sent to your email");
      setResendCooldown(30); // 30 seconds cooldown
      if (result.otpExpires) {
        const remainingTime = calculateRemainingTime(result.otpExpires);
        setOtpExpiry(remainingTime);
      }
      setOtp(["", "", "", "", "", ""]); // Clear OTP fields
      otpRefs.current[0]?.focus(); // Focus on first input
    } else {
      const errorMessage =
        result.errors?.general?.[0] || "Failed to resend OTP";
      toast.error(errorMessage);
    }

    setIsResending(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (verified) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
              >
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Email Verified!
                </h2>
                <p className="text-gray-600 mt-2">
                  Your email <strong>{email}</strong> has been verified
                  successfully.
                </p>
                <p className="text-sm text-gray-500 mt-4">
                  Redirecting to signup form...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-svh flex items-center justify-center p-4 relative">
      {/* Back Button - Upper Left Corner */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-4 left-4 md:top-6 md:left-6"
        onClick={() => router.push("/authentication-login")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <Card className="w-full max-w-md border-none">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl">Verify Your Email</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Enter the 6-digit code sent to your email address
              </p>

              {/* OTP Expiry Timer */}
              {isLoadingExpiry ? (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400 animate-pulse" />
                  <span className="text-gray-500">Loading timer...</span>
                </div>
              ) : (
                otpExpiry !== null && (
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Clock
                      className={`w-4 h-4 ${
                        otpExpiry <= 30 ? "text-red-500" : "text-orange-500"
                      }`}
                    />
                    <span
                      className={`font-medium ${
                        otpExpiry <= 30 ? "text-red-500" : "text-orange-500"
                      }`}
                    >
                      Expires in: {formatTime(otpExpiry)}
                    </span>
                  </div>
                )
              )}

              {otpExpiry !== null && otpExpiry <= 0 && (
                <p className="text-red-500 text-sm font-medium">
                  OTP has expired. Please request a new one.
                </p>
              )}
            </div>

            <div
              className="flex justify-center space-x-2"
              onPaste={handleOtpPaste}
            >
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={setOtpRef(index)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, index)}
                  onKeyDown={(e) => handleOtpKeyDown(e, index)}
                  className="w-12 h-12 text-center text-lg font-semibold"
                  required
                  disabled={otpExpiry !== null && otpExpiry <= 0}
                />
              ))}
            </div>

            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                disabled={
                  isLoading ||
                  (otpExpiry !== null && otpExpiry <= 0) ||
                  isLoadingExpiry
                }
              >
                {isLoading ? "Verifying..." : "Verify Code"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleResendOTP}
                disabled={
                  isResending ||
                  resendCooldown > 0 ||
                  (otpExpiry !== null && otpExpiry > 0) ||
                  isLoadingExpiry
                }
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {isResending
                  ? "Sending..."
                  : resendCooldown > 0
                    ? `Resend available in ${resendCooldown}s`
                    : otpExpiry !== null && otpExpiry > 0
                      ? "Resend OTP"
                      : "Send New OTP"}
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Didn't receive the code? Check your spam folder or request a new
                OTP.
                {otpExpiry !== null &&
                  otpExpiry <= 0 &&
                  " Your previous OTP has expired."}
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
