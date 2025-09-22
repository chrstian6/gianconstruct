"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { completeUserProfile } from "@/action/otp-signup";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function SignupFlowPage() {
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    contactNo: "",
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<"profile" | "password">(
    "profile"
  );

  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");

  useEffect(() => {
    if (!userId) {
      toast.error("Invalid user session");
      router.push("/authentication-login");
    }
  }, [userId, router]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !profileData.firstName ||
      !profileData.lastName ||
      !profileData.address
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    setCurrentStep("password");
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast.error("Invalid user session");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);

    const result = await completeUserProfile(userId, {
      ...profileData,
      password,
    });

    if (result.success) {
      toast.success("Welcome to GianConstruct! 🎉");
      router.push("/authentication-login");
    } else {
      const errorMessage =
        Object.values(result.errors || {}).flat()[0] || "Registration failed";
      toast.error(errorMessage);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-svh flex items-center justify-center bg-white p-4">
      {currentStep === "profile" ? (
        <form
          onSubmit={handleProfileSubmit}
          className="w-full max-w-sm space-y-4"
        >
          <div className="mb-5 p-4 text-center">
            <h1 className="text-2xl font-bold tracking-tight">
              We would like to know you more, tell us something about you?
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium">
                First Name
              </Label>
              <Input
                id="firstName"
                placeholder="John"
                value={profileData.firstName}
                onChange={(e) =>
                  setProfileData({
                    ...profileData,
                    firstName: e.target.value,
                  })
                }
                className="h-10"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium">
                Last Name
              </Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={profileData.lastName}
                onChange={(e) =>
                  setProfileData({
                    ...profileData,
                    lastName: e.target.value,
                  })
                }
                className="h-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium">
              Address
            </Label>
            <Input
              id="address"
              placeholder="Where do you live?"
              value={profileData.address}
              onChange={(e) =>
                setProfileData({ ...profileData, address: e.target.value })
              }
              className="h-10"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactNo" className="text-sm font-medium">
              Phone (Optional)
            </Label>
            <Input
              id="contactNo"
              type="tel"
              placeholder="+63 912 345 6789"
              value={profileData.contactNo}
              onChange={(e) =>
                setProfileData({
                  ...profileData,
                  contactNo: e.target.value,
                })
              }
              className="h-10"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-10 bg-orange-500 hover:bg-orange-600"
          >
            Next <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>
      ) : (
        <form
          onSubmit={handleCompleteSubmit}
          className="w-full max-w-md space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Create Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Make it strong 💪"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10"
              required
              minLength={6}
            />
            <p className="text-xs text-gray-500">At least 6 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Type it again"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-10"
              required
            />
          </div>

          <div className="space-y-2">
            <Button
              type="submit"
              className="w-full h-10 bg-orange-500 hover:bg-orange-600"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating your space...
                </>
              ) : (
                "Join GianConstruct 🎉"
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full h-10 text-gray-600 hover:text-gray-800"
              onClick={() => setCurrentStep("profile")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to profile
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
