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
import { Eye, EyeOff } from "lucide-react";

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
    // Reset password when switching to password step to clear any autofill
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

      if (result.success && result.user) {
        await setUser(result.user);
        toast.success(`Welcome back, ${result.user.email}!`, {
          className:
            "bg-green-100 text-green-800 border border-green-600 rounded-md shadow-sm py-2 px-4 text-sm font-medium",
          duration: 4000,
          position: "top-right",
        });
        setIsLoginOpen(false);
        console.log("Attempting redirect to /admin/admindashboard");
        router.push("/admin/admindashboard");
        router.refresh();
      } else {
        const errorMessage =
          typeof result.error === "string"
            ? result.error
            : "Invalid email or password";
        toast.error(errorMessage, {
          className:
            "bg-red-50 text-red-700 border border-red-200 rounded-md shadow-sm py-2 px-4 text-sm font-medium",
          duration: 4000,
          position: "top-right",
        });
      }
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("Login failed. Please try again.", {
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
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="bg-white p-4 rounded-lg shadow-lg w-full max-w-sm relative"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <motion.button
                className="absolute top-2 right-3 text-red-600 hover:text-gray-900"
                onClick={() => {
                  setIsLoginOpen(false);
                  console.log("LoginModal closed");
                }}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                ✕
              </motion.button>
              <div className="text-center mb-4">
                <h1 className="text-xl font-bold text-text-secondary mb-5">
                  GianConstruct®
                </h1>
                <h1 className="text-2xl font-bold">Sign In to your Account</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {step === "email"
                    ? "Enter your email to continue."
                    : "Enter your password to sign in."}
                </p>
              </div>
              {step === "email" ? (
                <form
                  onSubmit={handleEmailSubmit}
                  className="space-y-3 px-4 mt-6"
                >
                  <div>
                    <Label
                      htmlFor="email"
                      className="text-gray-700 text-sm mb-1"
                    >
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="bg-white border-gray-300 text-sm px-3 py-2"
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
                    className="w-full bg-text-secondary hover:bg-white/90 hover:text-text-secondary cursor-pointer hover:border-1 border-text-secondary text-sm py-2 mt-3"
                    disabled={isCheckingEmail}
                  >
                    {isCheckingEmail ? "Checking..." : "Continue"}
                  </Button>
                  <div className="text-center mt-2">
                    <p className="text-sm text-gray-600">
                      Don’t have an account?{" "}
                      <button
                        type="button"
                        className="text-primary hover:underline"
                        onClick={() => {
                          setIsLoginOpen(false);
                          setIsCreateAccountOpen(true);
                        }}
                      >
                        Sign Up
                      </button>
                    </p>
                  </div>
                </form>
              ) : (
                <form
                  onSubmit={handlePasswordSubmit}
                  className="space-y-3 px-4 mt-6"
                >
                  <div className="relative">
                    <Label
                      htmlFor="password"
                      className="text-gray-700 text-sm mb-1"
                    >
                      Password
                    </Label>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="bg-white border-gray-300 text-sm px-3 py-2 pr-10"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        console.log("Password input: [hidden]");
                      }}
                      required
                      autoComplete="new-password"
                    />
                    <motion.button
                      type="button"
                      className="absolute right-3 top-8 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowPassword(!showPassword)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      <AnimatePresence mode="wait">
                        {showPassword ? (
                          <motion.div
                            key="eye-off"
                            initial={{ opacity: 0, rotate: -45 }}
                            animate={{ opacity: 1, rotate: 0 }}
                            exit={{ opacity: 0, rotate: 45 }}
                            transition={{ duration: 0.2 }}
                          >
                            <EyeOff className="h-5 w-5" />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="eye"
                            initial={{ opacity: 0, rotate: -45 }}
                            animate={{ opacity: 1, rotate: 0 }}
                            exit={{ opacity: 0, rotate: 45 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Eye className="h-5 w-5" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full text-sm py-2 mt-3 border-gray-300"
                    onClick={() => {
                      setStep("email");
                      setPassword("");
                      console.log("Back to email step");
                    }}
                  >
                    Back to Email
                  </Button>
                  <Button
                    type="submit"
                    className="w-full bg-text-secondary hover:bg-white/90 hover:text-text-secondary cursor-pointer hover:border-1 border-text-secondary text-sm py-2 mt-3"
                  >
                    Sign In
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full text-sm py-2 mt-3 border-gray-300"
                  >
                    Sign in with Google
                  </Button>
                  <div className="text-center mt-2">
                    <p className="text-sm text-gray-600">
                      Don’t have an account?
                      <button
                        type="button"
                        className="text-primary hover:underline"
                        onClick={() => {
                          setIsLoginOpen(false);
                          setIsCreateAccountOpen(true);
                        }}
                      >
                        Sign Up
                      </button>
                    </p>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
