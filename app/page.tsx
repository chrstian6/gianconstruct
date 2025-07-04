// app/page.tsx
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
import { useState, useEffect, Suspense } from "react";
import SearchParamsHandler from "@/components/SearchParamsHandler";

const Home: React.FC = () => {
  const { isLoginOpen, isCreateAccountOpen } = useModalStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasOpenedLoginModal, setHasOpenedLoginModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

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
      <Suspense fallback={null}>
        <SearchParamsHandler
          loading={loading}
          hasOpenedLoginModal={hasOpenedLoginModal}
          setHasOpenedLoginModal={setHasOpenedLoginModal}
        />
      </Suspense>
    </div>
  );
};

export default Home;
