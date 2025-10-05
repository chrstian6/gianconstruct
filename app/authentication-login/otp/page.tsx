"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { verifyOTP } from "@/action/otp-signup";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function OTPPage() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [verified, setVerified] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");
  const userId = searchParams.get("userId");

  useEffect(() => {
    if (!token || !userId) {
      toast.error("Invalid verification link");
      router.push("/authentication-login");
    }
  }, [token, userId, router]);

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

    if (!token || !userId) {
      toast.error("Invalid verification session");
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
    <div className="min-h-svh flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Verify Your Email</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Enter the 6-digit code sent to your email address
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
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify Code"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => router.push("/authentication-login")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
