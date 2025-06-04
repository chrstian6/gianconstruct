"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useModalStore } from "@/lib/stores";
import { motion, AnimatePresence } from "framer-motion";

export default function SignUpModal() {
  const { isCreateAccountOpen, setIsCreateAccountOpen } = useModalStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder for sign-up logic (e.g., API call)
    console.log("Sign-up submitted");
    setIsCreateAccountOpen(false);
  };

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers
    e.target.value = e.target.value.replace(/[^0-9]/g, "").slice(0, 11);
  };

  return (
    <AnimatePresence>
      {isCreateAccountOpen && (
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
              <h1 className="text-xl font-bold text-text-secondary mb-5">
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
                    type="text"
                    placeholder="Enter your last name"
                    className="bg-white border-gray-300 text-sm px-3 py-2"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address" className="text-gray-700 text-sm mb-1">
                  Address
                </Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="Enter your address"
                  className="bg-white border-gray-300 text-sm px-3 py-2"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-gray-700 text-sm mb-1">
                  Contact Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+639123456789"
                  className="bg-white border-gray-300 text-sm px-3 py-2"
                  pattern="[0-9]{11}"
                  maxLength={11}
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
                  type="password"
                  placeholder="Confirm your password"
                  className="bg-white border-gray-300 text-sm px-3 py-2"
                  required
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full text-sm py-2 mt-3 border-gray-300"
              >
                Sign up with Google
              </Button>
              <Button
                type="submit"
                className="w-full bg-text-secondary hover:bg-white/90 hover:text-text-secondary cursor-pointer hover:border-1 border-text-secondary text-sm py-2 mt-3"
              >
                Sign Up
              </Button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
