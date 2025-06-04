"use client"; // Client-side component

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useModalStore, useAuthStore } from "@/lib/stores";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { registerUser } from "@/action/register";
import { Toaster, toast } from "sonner";
import { CheckCircle } from "lucide-react";

export default function SignUpModal() {
  const { isCreateAccountOpen, setIsCreateAccountOpen, setIsLoginOpen } =
    useModalStore();
  const { setUser, initialize } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [timer, setTimer] = useState(5);

  // Initialize session from Redis on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Handle timer for success modal
  useEffect(() => {
    if (showSuccess && timer > 0) {
      const countdown = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(countdown);
    } else if (timer === 0) {
      setShowSuccess(false);
      setIsCreateAccountOpen(false);
      setIsLoginOpen(true);
    }
  }, [showSuccess, timer, setIsCreateAccountOpen, setIsLoginOpen]);

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, "").slice(0, 11);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await registerUser(formData);

    if (!result.success) {
      const errors = result.errors
        ? Object.fromEntries(
            Object.entries(result.errors).map(([key, value]) => [
              key,
              Array.isArray(value) ? value[0] : value,
            ])
          )
        : { general: "Registration failed" };

      // Display toasts for each error
      Object.entries(errors).forEach(([, message]) => {
        toast.error(message as string, {
          className:
            "bg-red-50 text-red-700 border border-red-200 rounded-md shadow-sm py-2 px-4 text-sm font-medium",
          duration: 4000,
          position: "top-right",
        });
      });

      setIsSubmitting(false);
      return;
    }

    // Set user in AuthStore
    if (result.user) {
      await setUser(result.user);
      toast.success(
        `Registration successful! Check your email to verify. User ID: ${result.user.user_id}`,
        {
          className:
            "bg-green-100 text-green-800 border border-green-600 rounded-md shadow-sm py-2 px-4 text-sm font-medium",
          duration: 4000,
          position: "top-right",
        }
      );
    }

    // Show success modal
    setShowSuccess(true);
    setIsSubmitting(false);
  };

  return (
    <>
      <Toaster />
      <AnimatePresence>
        {isCreateAccountOpen && !showSuccess && (
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
                onClick={() => setIsCreateAccountOpen(false)}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                ✕
              </motion.button>
              <div className="text-center mb-4">
                <h1 className="text-xl font-bold text-text-primary mb-5">
                  GianConstruct®
                </h1>
                <h1 className="text-2xl font-bold">Create your Account</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Create an account to get started.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3 px-4 mt-6">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label
                      htmlFor="firstName"
                      className="text-gray-700 text-sm mb-1"
                    >
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="Enter your first name"
                      className="bg-white border-gray-300 text-sm px-3 py-2"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <Label
                      htmlFor="lastName"
                      className="text-gray-700 text-sm mb-1"
                    >
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Last name"
                      className="bg-white border-gray-300 text-sm px-3 py-2"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label
                    htmlFor="address"
                    className="text-gray-700 text-sm mb-1"
                  >
                    Address
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    type="text"
                    placeholder="Enter your address"
                    className="bg-white border-gray-300 text-sm px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <Label
                    htmlFor="contactNo"
                    className="text-gray-700 text-sm mb-1"
                  >
                    Contact Number
                  </Label>
                  <Input
                    id="contactNo"
                    name="contactNo"
                    type="tel"
                    placeholder="+639123456789"
                    className="bg-white border-gray-300 text-sm px-3 py-2"
                    onInput={handlePhoneInput}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-gray-700 text-sm mb-1">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    className="bg-white border-gray-300 text-sm px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <Label
                    htmlFor="password"
                    className="text-gray-700 text-sm mb-1"
                  >
                    Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    className="bg-white border-gray-300 text-sm px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <Label
                    htmlFor="confirmPassword"
                    className="text-gray-700 text-sm mb-1"
                  >
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    className="bg-white border-gray-300 text-sm px-3 py-2"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-text-secondary hover:bg-white/90 hover:text-text-primary cursor-pointer hover:border-1 border-text-primary text-sm py-2 mt-3"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Signing Up..." : "Sign Up"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-sm py-2 mt-3 border-gray-300"
                >
                  Sign up with Google
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
        {showSuccess && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm text-center"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
              >
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Registration Successful!
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Check your email to verify your account. You’ll be redirected to
                the login page in {timer} seconds.
              </p>
              <Button
                onClick={() => {
                  setShowSuccess(false);
                  setIsCreateAccountOpen(false);
                  setIsLoginOpen(true);
                }}
                className="bg-text-primary text-white hover:bg-white/90 hover:text-text-primary hover:border-1 border-text-primary"
              >
                Go to Login
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
