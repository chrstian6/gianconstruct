"use client";

import { motion } from "framer-motion";
import LoginForm from "@/components/auth/LoginForm";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

// Define the AuthPage component
function AuthPageContent() {
  // Router for navigation
  const router = useRouter();

  return (
    // Main container: full-screen height, two-column grid on large screens, plain white background
    <div className="grid min-h-svh lg:grid-cols-2 bg-white">
      {/* Left Column - Form Section */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        {/* Header with Logo and Brand */}
        <div className="flex justify-center gap-2 md:justify-start">
          <a
            href="#"
            className="flex items-center gap-2 font-bold text-xl text-orange-500"
          >
            GianConstruct®
          </a>
        </div>

        {/* Close Button */}
        <button
          onClick={() => router.push("/")}
          className="absolute top-4 right-4 z-50 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>

        {/* Form Container with Login Form */}
        <div className="flex flex-1 items-center justify-center">
          <motion.div
            className="w-full max-w-xs"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Login Form with Animation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <LoginForm />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Right Column - Cover Image */}
      <div className="bg-muted relative hidden lg:block">
        <img
          src="/images/auth-logo.jpg"
          alt="Construction Cover"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </div>
  );
}

// Wrap the main component with Suspense
export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-svh lg:grid-cols-2 bg-white">
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xs">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                <div className="h-10 bg-gray-200 rounded mb-2"></div>
                <div className="h-10 bg-gray-200 rounded mb-2"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
          <div className="bg-muted relative hidden lg:block">
            <div className="absolute inset-0 h-full w-full bg-gray-200"></div>
          </div>
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}
