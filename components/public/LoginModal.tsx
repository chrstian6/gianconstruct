"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    console.log("Email state:", email);
  }, [email]);

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData();
      const normalizedEmail = email.trim().toLowerCase();
      formData.append("email", normalizedEmail);
      formData.append("password", password);

      console.log("Submitting login:", {
        email: normalizedEmail,
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
    } finally {
      setIsLoading(false);
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
              className="w-full max-w-md relative"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {/* Close button */}
              <button
                className="absolute top-2 right-2 z-50 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors"
                onClick={() => {
                  setIsLoginOpen(false);
                  console.log("LoginModal closed");
                }}
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>

              <Card className="overflow-hidden p-0 border-0 shadow-xl">
                <CardContent className="grid p-0">
                  <form
                    className="p-6 md:p-8 bg-white"
                    onSubmit={handleLoginSubmit}
                  >
                    <div className="flex flex-col gap-6">
                      <div className="flex flex-col items-center text-center">
                        <h1 className="text-2xl font-bold text-black">
                          Welcome back
                        </h1>
                        <p className="text-gray-600 text-balance">
                          Sign in to your GianConstruct® account
                        </p>
                      </div>

                      <div className="grid gap-3">
                        <Label htmlFor="email" className="text-black">
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="m@example.com"
                          required
                          className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                          value={email}
                          onChange={(e) => {
                            const value = e.target.value ?? "";
                            setEmail(value);
                            console.log("Email input:", value);
                          }}
                          autoComplete="email"
                        />
                      </div>

                      <div className="grid gap-3">
                        <div className="flex items-center">
                          <Label htmlFor="password" className="text-black">
                            Password
                          </Label>
                          <a
                            href="#"
                            className="ml-auto text-sm underline-offset-2 hover:underline text-orange-500"
                          >
                            Forgot your password?
                          </a>
                        </div>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            required
                            className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 pr-10"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value);
                              console.log("Password input: [hidden]");
                            }}
                            autoComplete="current-password"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            onClick={() => setShowPassword(!showPassword)}
                            title={
                              showPassword ? "Hide password" : "Show password"
                            }
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                        disabled={isLoading}
                      >
                        {isLoading ? "Signing in..." : "Sign In"}
                      </Button>

                      <div className="text-center text-sm">
                        Don't have an account?{" "}
                        <button
                          type="button"
                          className="text-orange-500 hover:text-orange-600 underline underline-offset-4"
                          onClick={() => {
                            setIsLoginOpen(false);
                            setIsCreateAccountOpen(true);
                          }}
                        >
                          Sign up
                        </button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
