"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useModalStore } from "@/lib/stores";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginModal() {
  const { isLoginOpen, setIsLoginOpen, setIsCreateAccountOpen } =
    useModalStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder for login logic (e.g., API call)
    console.log("Login submitted");
    setIsLoginOpen(false);
  };

  return (
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
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
              onClick={() => setIsLoginOpen(false)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            >
              ✕
            </motion.button>
            <div className="text-center mb-4">
              <h1 className="text-xl font-bold text-gray-900">
                GianConstruct®
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome back! Sign in to continue.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
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
              <Button
                type="button"
                variant="outline"
                className="w-full text-sm py-2 mt-3 border-gray-300"
              >
                Sign in with Google
              </Button>
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-sm py-2 mt-3"
              >
                Sign In
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
