"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useModalStore, useAuthStore } from "@/lib/stores";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import { loginUser } from "@/action/login";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, X } from "lucide-react";

export default function LoginModal() {
  const { isLoginOpen, setIsLoginOpen, setIsCreateAccountOpen } =
    useModalStore();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [step, setStep] = useState("email");
  const router = useRouter();

  useEffect(() => {
    console.log("Email state:", email);
    if (step === "password") {
      setPassword("");
    }
  }, [email, step]);

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCheckingEmail(true);

    try {
      const formData = new FormData();
      const normalizedEmail = email.trim().toLowerCase();
      formData.append("email", normalizedEmail);
      console.log("Submitting email:", normalizedEmail);

      const result = await loginUser(formData);
      console.log("Email check result:", result);

      if (result.success) {
        setStep("password");
      } else {
        const errorMessage =
          typeof result.error === "string"
            ? result.error
            : result.error?.email || "Unable to validate email";
        toast.error(errorMessage, {
          className:
            "bg-red-50 text-red-700 border border-red-200 rounded-md shadow-sm py-2 px-4 text-sm font-medium",
          duration: 4000,
          position: "top-right",
        });
      }
    } catch (error) {
      console.error("Email check failed:", error);
      toast.error("Failed to validate email. Please try again.", {
        className:
          "bg-red-50 text-red-700 border border-red-200 rounded-md shadow-sm py-2 px-4 text-sm font-medium",
        duration: 4000,
        position: "top-right",
      });
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("email", email.trim().toLowerCase());
      formData.append("password", password);
      console.log("Submitting login:", {
        email: email.trim().toLowerCase(),
        password: "[hidden]",
      });

      const result = await loginUser(formData);
      console.log("Login result:", JSON.stringify(result, null, 2));

      // Handle case where result is undefined or null
      if (!result || typeof result !== "object") {
        throw new Error(
          "No response from server. Please check your connection and try again."
        );
      }

      if (result.success && result.user) {
        await setUser(result.user);
        toast.success(`Welcome back, ${result.user.email}!`, {
          className:
            "bg-green-100 text-green-800 border border-green-600 rounded-md shadow-sm py-2 px-4 text-sm font-medium",
          duration: 4000,
          position: "top-right",
        });
        setIsLoginOpen(false);
        const redirectPath =
          result.user.role === "admin"
            ? "/admin/admindashboard"
            : "/user/userdashboard";
        console.log(`Attempting redirect to ${redirectPath}`);
        router.replace(redirectPath);
        router.refresh();
      } else {
        const errorMessage = result.error
          ? typeof result.error === "string"
            ? result.error
            : "Invalid email or password"
          : "Login failed. Please try again.";

        toast.error(errorMessage, {
          className:
            "bg-red-50 text-red-700 border border-red-200 rounded-md shadow-sm py-2 px-4 text-sm font-medium",
          duration: 4000,
          position: "top-right",
        });
      }
    } catch (error) {
      console.error("Login failed:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Login failed due to an unexpected error. Please try again.";

      toast.error(errorMessage, {
        className:
          "bg-red-50 text-red-700 border border-red-200 rounded-md shadow-sm py-2 px-4 text-sm font-medium",
        duration: 4000,
        position: "top-right",
      });
    }
  };

  return (
    <>
      <Toaster />
      <AnimatePresence>
        {isLoginOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-xl w-full max-w-md relative overflow-hidden"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {/* Header with orange accent */}
              <div className="bg-[var(--orange)] p-6 text-center">
                <h1 className="text-2xl font-bold text-white">
                  GianConstruct®
                </h1>
                <p className="text-white/90 mt-1">
                  {step === "email"
                    ? "Sign In to Continue"
                    : "Enter Your Password"}
                </p>
              </div>

              {/* Close button */}
              <button
                className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
                onClick={() => {
                  setIsLoginOpen(false);
                  console.log("LoginModal closed");
                }}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-6">
                {step === "email" ? (
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div>
                      <Label
                        htmlFor="email"
                        className="text-gray-700 text-sm font-medium mb-2"
                      >
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        className="border-gray-300 focus:border-[var(--orange)] focus:ring-[var(--orange)]"
                        value={email}
                        onChange={(e) => {
                          const value = e.target.value ?? "";
                          setEmail(value);
                          console.log("Email input:", value);
                        }}
                        required
                        autoComplete="email"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-[var(--orange)] hover:bg-orange-600 text-white font-semibold py-3"
                      disabled={isCheckingEmail}
                    >
                      {isCheckingEmail ? "Checking..." : "Continue with Email"}
                    </Button>

                    <div className="text-center pt-4 border-t border-gray-200 mt-6">
                      <p className="text-sm text-gray-600">
                        Don't have an account?{" "}
                        <button
                          type="button"
                          className="text-[var(--orange)] hover:text-orange-600 font-medium"
                          onClick={() => {
                            setIsLoginOpen(false);
                            setIsCreateAccountOpen(true);
                          }}
                        >
                          Sign up now
                        </button>
                      </p>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div className="relative">
                      <Label
                        htmlFor="password"
                        className="text-gray-700 text-sm font-medium mb-2"
                      >
                        Password
                      </Label>
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="border-gray-300 focus:border-[var(--orange)] focus:ring-[var(--orange)] pr-10"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          console.log("Password input: [hidden]");
                        }}
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowPassword(!showPassword)}
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 border-gray-300 text-gray-700"
                        onClick={() => {
                          setStep("email");
                          setPassword("");
                          console.log("Back to email step");
                        }}
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-[var(--orange)] hover:bg-orange-600 text-white font-semibold"
                      >
                        Sign In
                      </Button>
                    </div>

                    <div className="text-center pt-4 border-t border-gray-200 mt-6">
                      <p className="text-sm text-gray-600">
                        Don't have an account?{" "}
                        <button
                          type="button"
                          className="text-[var(--orange)] hover:text-orange-600 font-medium"
                          onClick={() => {
                            setIsLoginOpen(false);
                            setIsCreateAccountOpen(true);
                          }}
                        >
                          Sign up now
                        </button>
                      </p>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
