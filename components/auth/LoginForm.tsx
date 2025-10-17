"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/stores";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { loginUser } from "@/action/login";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { initiateEmailSignup } from "@/action/otp-signup";

export default function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSignup, setIsEmailSignup] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for signup query parameter on component mount
  useEffect(() => {
    const signupParam = searchParams.get("signup");
    if (signupParam === "email") {
      setIsEmailSignup(true);
    }
  }, [searchParams]);

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData();
      const normalizedEmail = email.trim().toLowerCase();
      formData.append("email", normalizedEmail);
      formData.append("password", password);

      const result = await loginUser(formData);

      if (!result || typeof result !== "object") {
        throw new Error(
          "No response from server. Please check your connection and try again."
        );
      }

      if (result.success && result.user) {
        await setUser(result.user);
        toast.success(`Welcome back, ${result.user.email}!`);

        const redirectPath =
          result.user.role === "admin"
            ? "/admin/admindashboard"
            : "/user/userdashboard";
        router.replace(redirectPath);
        router.refresh();
      } else {
        // Simple error handling
        const errorMessage =
          result.error && typeof result.error === "string"
            ? result.error
            : "Invalid email or password";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Login failed:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Login failed due to an unexpected error. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupEmail) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("email", signupEmail);

      const result = await initiateEmailSignup(formData);

      if (result.success) {
        toast.success("OTP sent to your email!");
        // Redirect to OTP page
        router.push(
          `/authentication-login/otp?token=${result.token}&userId=${result.userId}`
        );
      } else {
        // Simple error handling - show first error found
        const errorMessage =
          result.errors?.email?.[0] ||
          result.errors?.general?.[0] ||
          result.errors?.otp?.[0] ||
          "Failed to send OTP";
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error("Failed to initiate signup");
      console.error("Signup error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={isEmailSignup ? handleEmailSignup : handleLoginSubmit}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">
          {isEmailSignup ? "Create your account" : "Login to your account"}
        </h1>
        <p className="text-muted-foreground text-sm text-balance">
          {isEmailSignup
            ? "Enter your email to create your GianConstruct® account"
            : "Enter your email below to login to your account"}
        </p>
      </div>

      <div className="grid gap-4">
        {isEmailSignup ? (
          <div className="grid gap-3">
            <Label htmlFor="signup-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="signup-email"
                type="email"
                placeholder="your.email@example.com"
                required
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                autoComplete="email"
                className="h-10 pl-10 pr-4"
              />
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-3">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="h-10 px-4"
              />
            </div>
            <div className="grid gap-3">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <a
                  href="#"
                  className="ml-auto text-sm underline-offset-4 hover:underline text-muted-foreground"
                >
                  Forgot your password?
                </a>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="h-10 px-4 pr-12"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        <Button
          type="submit"
          className="w-full h-10 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">
                {isEmailSignup ? "Sending OTP..." : "Signing In..."}
              </span>
            </div>
          ) : (
            <span className="text-sm">
              {isEmailSignup ? "Continue with Email" : "Login"}
            </span>
          )}
        </Button>

        {!isEmailSignup && (
          <>
            <div className="relative text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-10"
                type="button"
                onClick={() => setIsEmailSignup(true)}
              >
                <Mail className="w-4 h-4 mr-2" />
                <span className="text-sm">Email</span>
              </Button>

              <Button variant="outline" className="h-10" type="button">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="w-4 h-4 mr-2"
                >
                  <path
                    d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                    fill="currentColor"
                  />
                </svg>
                <span className="text-sm">GitHub</span>
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="text-center text-sm">
        {isEmailSignup ? (
          <>
            Already have an account?{" "}
            <button
              type="button"
              className="underline underline-offset-4 hover:text-orange-600 text-orange-500"
              onClick={() => setIsEmailSignup(false)}
            >
              Sign in
            </button>
          </>
        ) : (
          <>
            Don&apos;t have an account?{" "}
            <button
              type="button"
              className="underline underline-offset-4 hover:text-orange-600 text-orange-500"
              onClick={() => setIsEmailSignup(true)}
            >
              Sign up with email
            </button>
          </>
        )}
      </div>
    </form>
  );
}
