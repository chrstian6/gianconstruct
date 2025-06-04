"use client";

import { useModalStore } from "@/lib/stores";
import Loader from "@/components/public/Loader";
import LoginModal from "@/components/public/LoginModal";
import SignUpModal from "@/components/public/SignUpModal";
import { Navbar } from "@/components/public/Navbar";
import HeroSection from "@/components/public/section/HeroSection";
import ServicesSection from "@/components/public/section/ServicesSection";
import AboutSection from "@/components/public/section/AboutSection";
import CTASection from "@/components/public/section/CTASection";
import FooterSection from "@/components/public/section/FooterSection";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function Home() {
  const { isLoginOpen, isCreateAccountOpen, setIsLoginOpen } = useModalStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasOpenedLoginModal, setHasOpenedLoginModal] = useState(false); // Track modal open
  const searchParams = useSearchParams();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Detect verified=true and open LoginModal once after loading
    if (
      !loading &&
      searchParams.get("verified") === "true" &&
      !isLoginOpen &&
      !hasOpenedLoginModal
    ) {
      setIsLoginOpen(true);
      setHasOpenedLoginModal(true); // Prevent re-opening
      console.log("Detected verified=true, opening LoginModal");
    }
  }, [searchParams, setIsLoginOpen, isLoginOpen, loading, hasOpenedLoginModal]);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <HeroSection />
      <ServicesSection />
      <AboutSection />
      <CTASection />
      <FooterSection />
      {isLoginOpen && <LoginModal />}
      {isCreateAccountOpen && <SignUpModal />}
    </div>
  );
}
