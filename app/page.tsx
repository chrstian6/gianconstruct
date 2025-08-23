"use client";

import { useModalStore } from "@/lib/stores";
import LoginModal from "@/components/public/LoginModal";
import SignUpModal from "@/components/public/SignUpModal";
import HeroSection from "@/components/public/section/HeroSection";
import ServicesSection from "@/components/public/section/ServicesSection";
import AboutSection from "@/components/public/section/AboutSection";
import CTASection from "@/components/public/section/CTASection";
import FooterSection from "@/components/public/section/FooterSection";
import { useState, useEffect, Suspense } from "react";
import SearchParamsHandler from "@/components/SearchParamsHandler";
import { Navbar } from "@/components/public/Navbar";
import Confetti from "react-confetti"; // Ensure this is imported if still needed

const Home: React.FC = () => {
  const { isLoginOpen, isCreateAccountOpen } = useModalStore();
  const [loading, setLoading] = useState(true);
  const [hasOpenedLoginModal, setHasOpenedLoginModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false); // Manage confetti state here if needed

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Confetti logic (if still relevant from PublicCatalog)
  useEffect(() => {
    if (showConfetti) {
      const timeout = setTimeout(() => setShowConfetti(false), 5000); // 5 seconds
      return () => clearTimeout(timeout);
    }
  }, [showConfetti]);

  return (
    <>
      <Navbar />
      <HeroSection />
      <ServicesSection />
      <AboutSection />
      <CTASection />
      <FooterSection />
      {isLoginOpen && <LoginModal />}
      {isCreateAccountOpen && <SignUpModal />}
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          numberOfPieces={100}
          gravity={0.1}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            pointerEvents: "none",
          }}
        />
      )}
      <Suspense fallback={null}>
        <SearchParamsHandler
          loading={loading}
          hasOpenedLoginModal={hasOpenedLoginModal}
          setHasOpenedLoginModal={setHasOpenedLoginModal}
        />
      </Suspense>
    </>
  );
};

export default Home;
