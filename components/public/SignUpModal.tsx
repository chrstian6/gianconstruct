"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useModalStore, useAuthStore } from "@/lib/stores";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { registerUser } from "@/action/register";
import { Toaster, toast } from "sonner";
import { CheckCircle, X } from "lucide-react";

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
      toast.success(`Registration successful! Check your email to verify.`, {
        className:
          "bg-green-100 text-green-800 border border-green-600 rounded-md shadow-sm py-2 px-4 text-sm font-medium",
        duration: 4000,
        position: "top-right",
      });
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
                <p className="text-white/90 mt-1">Create Your Account</p>
              </div>

              {/* Close button */}
              <button
                className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
                onClick={() => setIsCreateAccountOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-6 max-h-[80vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="firstName"
                        className="text-gray-700 text-sm font-medium mb-2"
                      >
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        placeholder="First name"
                        className="border-gray-300 focus:border-[var(--orange)] focus:ring-[var(--orange)]"
                        required
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="lastName"
                        className="text-gray-700 text-sm font-medium mb-2"
                      >
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        placeholder="Last name"
                        className="border-gray-300 focus:border-[var(--orange)] focus:ring-[var(--orange)]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label
                      htmlFor="address"
                      className="text-gray-700 text-sm font-medium mb-2"
                    >
                      Address
                    </Label>
                    <Input
                      id="address"
                      name="address"
                      type="text"
                      placeholder="Enter your address"
                      className="border-gray-300 focus:border-[var(--orange)] focus:ring-[var(--orange)]"
                      required
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="contactNo"
                      className="text-gray-700 text-sm font-medium mb-2"
                    >
                      Contact Number
                    </Label>
                    <Input
                      id="contactNo"
                      name="contactNo"
                      type="tel"
                      placeholder="+63 912 345 6789"
                      className="border-gray-300 focus:border-[var(--orange)] focus:ring-[var(--orange)]"
                      onInput={handlePhoneInput}
                      required
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="email"
                      className="text-gray-700 text-sm font-medium mb-2"
                    >
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      className="border-gray-300 focus:border-[var(--orange)] focus:ring-[var(--orange)]"
                      required
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="password"
                      className="text-gray-700 text-sm font-medium mb-2"
                    >
                      Password
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Create a password"
                      className="border-gray-300 focus:border-[var(--orange)] focus:ring-[var(--orange)]"
                      required
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="confirmPassword"
                      className="text-gray-700 text-sm font-medium mb-2"
                    >
                      Confirm Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      className="border-gray-300 focus:border-[var(--orange)] focus:ring-[var(--orange)]"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[var(--orange)] hover:bg-orange-600 text-white font-semibold py-3"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating Account..." : "Create Account"}
                  </Button>

                  <div className="text-center pt-4 border-t border-gray-200 mt-6">
                    <p className="text-sm text-gray-600">
                      Already have an account?{" "}
                      <button
                        type="button"
                        className="text-[var(--orange)] hover:text-orange-600 font-medium"
                        onClick={() => {
                          setIsCreateAccountOpen(false);
                          setIsLoginOpen(true);
                        }}
                      >
                        Sign in
                      </button>
                    </p>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showSuccess && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
              >
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              </motion.div>

              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Registration Successful!
              </h2>

              <p className="text-sm text-gray-600 mb-4">
                Check your email to verify your account. You'll be redirected to
                login in {timer} seconds.
              </p>

              <Button
                onClick={() => {
                  setShowSuccess(false);
                  setIsCreateAccountOpen(false);
                  setIsLoginOpen(true);
                }}
                className="bg-[var(--orange)] hover:bg-orange-600 text-white font-semibold"
              >
                Go to Login Now
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
