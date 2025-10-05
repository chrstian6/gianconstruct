"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/stores";
import { useState } from "react";
import { registerUser } from "@/action/register";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function SignUpForm() {
  const { setUser } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [timer, setTimer] = useState(5);

  // Handle timer for success modal
  useState(() => {
    if (showSuccess && timer > 0) {
      const countdown = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(countdown);
    } else if (timer === 0) {
      setShowSuccess(false);
    }
  });

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

    if (result.user) {
      await setUser(result.user);
      toast.success(`Registration successful! Check your email to verify.`, {
        className:
          "bg-green-100 text-green-800 border border-green-600 rounded-md shadow-sm py-2 px-4 text-sm font-medium",
        duration: 4000,
        position: "top-right",
      });
    }

    setShowSuccess(true);
    setIsSubmitting(false);
  };

  if (showSuccess) {
    return (
      <div className="text-center py-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
        >
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        </motion.div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Registration Successful!
        </h2>

        <p className="text-gray-600 mb-6">
          Check your email to verify your account. Redirecting to login in{" "}
          {timer} seconds...
        </p>

        <Button
          onClick={() => (window.location.href = "/auth?tab=login")}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold"
        >
          Go to Login Now
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
        <p className="text-gray-600 mt-2">Join GianConstruct® today</p>
      </div>

      {/* Name Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-gray-700 font-medium">
            First Name
          </Label>
          <Input
            id="firstName"
            name="firstName"
            type="text"
            placeholder="First name"
            className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-gray-700 font-medium">
            Last Name
          </Label>
          <Input
            id="lastName"
            name="lastName"
            type="text"
            placeholder="Last name"
            className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
            required
          />
        </div>
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="address" className="text-gray-700 font-medium">
          Address
        </Label>
        <Input
          id="address"
          name="address"
          type="text"
          placeholder="Enter your address"
          className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
          required
        />
      </div>

      {/* Contact Number */}
      <div className="space-y-2">
        <Label htmlFor="contactNo" className="text-gray-700 font-medium">
          Contact Number
        </Label>
        <Input
          id="contactNo"
          name="contactNo"
          type="tel"
          placeholder="+63 912 345 6789"
          className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
          onInput={handlePhoneInput}
          required
        />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-gray-700 font-medium">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Enter your email"
          className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
          required
        />
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-gray-700 font-medium">
          Password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Create a password"
          className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
          required
        />
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
          Confirm Password
        </Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Confirm your password"
          className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
          required
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-base"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Creating Account...</span>
          </div>
        ) : (
          "Create Account"
        )}
      </Button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">
            Already have an account?
          </span>
        </div>
      </div>

      {/* Alternative Action */}
      <div className="text-center">
        <p className="text-gray-600">
          Welcome back!{" "}
          <button
            type="button"
            className="text-orange-500 hover:text-orange-600 font-semibold"
            onClick={() => (window.location.href = "/auth?tab=login")}
          >
            Sign in to your account
          </button>
        </p>
      </div>
    </form>
  );
}
