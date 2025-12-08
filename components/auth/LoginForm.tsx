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
import { getGoogleAuthUrl } from "@/action/google-auth";

export default function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
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

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);

    try {
      // Get current redirect URI
      const redirectUri = searchParams.get("redirect") || "/user/userdashboard";

      // Get Google auth URL with redirect URI as state
      const authUrl = await getGoogleAuthUrl(redirectUri);

      // Redirect to Google auth page
      window.location.href = authUrl;
    } catch (error: any) {
      console.error("Google login error:", error);
      toast.error(error.message || "Failed to initiate Google login");
      setIsGoogleLoading(false);
    }
  };

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

              <Button
                variant="outline"
                className="h-10"
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <div className="w-4 h-4 mr-2 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-4 h-4 mr-2"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                <span className="text-sm">Google</span>
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
