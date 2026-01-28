"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Marquee from "react-fast-marquee";
import { Navbar } from "@/components/public/Navbar";
import HeroSection from "@/components/public/section/HeroSection";
import Squares from "@/components/Squares";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { motion } from "framer-motion";

const services = [
  {
    title: "Design and Build",
    description:
      "Complete architectural design and construction under one roof",
    image: "/images/services/design-build.jpg",
  },
  {
    title: "Building Plan & Permits Processing",
    description:
      "Professional preparation and fast-tracking of all required permits",
    image: "/images/services/permits.jpg",
  },
  {
    title: "General Construction",
    description:
      "Full-range construction services for residential & commercial projects",
    image: "/images/services/general-construction.jpg",
  },
  {
    title: "House Construction",
    description:
      "Custom-built homes with attention to detail, quality, and functionality",
    image: "/images/services/house-construction.jpg",
  },
  {
    title: "Renovation",
    description:
      "Modernization, expansion, and improvement of existing structures",
    image: "/images/services/renovation.jpg",
  },
  {
    title: "Commercial Building Construction",
    description:
      "Office buildings, retail spaces, warehouses & institutional facilities",
    image: "/images/services/commercial.jpg",
  },
  {
    title: "Roofing Installations",
    description:
      "Quality roofing solutions – metal, asphalt, tiles, shingles & more",
    image: "/images/services/roofing.jpg",
  },
  {
    title: "Loan Assistance",
    description:
      "Guidance and support throughout the financing and loan application process",
    image: "/images/services/loan-assistance.jpg",
  },
];

export default function Home() {
  const [heroComplete, setHeroComplete] = useState(false);
  const [introScrollProgress, setIntroScrollProgress] = useState(0);
  const [introAnimationStarted, setIntroAnimationStarted] = useState(false);
  const lenisRef = useRef<any>(null);
  const introSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleHeroComplete = () => {
      setHeroComplete(true);
      if (lenisRef.current) {
        lenisRef.current.start();
        document.body.style.overflow = "auto";
        setTimeout(() => setIntroAnimationStarted(true), 800);
      }
    };
    window.addEventListener("heroComplete", handleHeroComplete);
    return () => window.removeEventListener("heroComplete", handleHeroComplete);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    (async () => {
      const Lenis = (await import("lenis")).default;
      lenisRef.current = new Lenis({ duration: 1.2, smoothWheel: true });
      lenisRef.current.stop();
      document.body.style.overflow = "hidden";

      function raf(time: number) {
        lenisRef.current?.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    })();
    return () => {
      lenisRef.current?.destroy();
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    if (!heroComplete || !introSectionRef.current) return;
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.create({
      trigger: introSectionRef.current,
      start: "top 85%",
      end: "bottom top",
      scrub: true,
      onUpdate: (self) => setIntroScrollProgress(self.progress),
    });
  }, [heroComplete]);

  const getBg = () => {
    const p = Math.min(introScrollProgress * 1.4, 1);
    const from = { r: 194, g: 65, b: 12 };
    const to = { r: 253, g: 255, b: 240 };
    return `rgb(${Math.round(from.r + (to.r - from.r) * p)},${Math.round(from.g + (to.g - from.g) * p)},${Math.round(from.b + (to.b - from.b) * p)})`;
  };

  const getText = (type: "light" | "accent") =>
    type === "light"
      ? `rgb(${Math.round(255 * (1 - introScrollProgress * 1.2))})`
      : `rgb(194,65,12)`;

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: getBg() }}>
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Squares
          speed={0.5}
          squareSize={50}
          direction="diagonal"
          borderColor="rgba(255,255,255,0.12)"
        />
      </div>

      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar introScrollProgress={introScrollProgress} />
      </div>

      <main className="relative z-10">
        <section id="hero">
          <HeroSection />
        </section>

        {heroComplete && (
          <>
            <section
              ref={introSectionRef}
              className="min-h-screen flex items-center justify-center py-20 px-4"
            >
              {introAnimationStarted && (
                <>
                  <div className="text-center max-w-5xl mx-auto space-y-3 md:space-y-6">
                    <TextGenerateEffect
                      words="Raising standards."
                      className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight"
                      style={{ color: getText("light") }}
                    />
                    <TextGenerateEffect
                      words="Winning trust."
                      className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight"
                      style={{ color: getText("light") }}
                    />
                    <TextGenerateEffect
                      words="Building Kabankalan's future."
                      className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight"
                      style={{ color: getText("light") }}
                    />
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.6, duration: 1.2 }}
                    className="mt-16 w-full max-w-5xl mx-auto"
                  >
                    <div
                      className="text-center mb-8 uppercase tracking-widest text-sm font-medium"
                      style={{ color: getText("accent") }}
                    >
                      Trusted Brands We Deliver
                    </div>
                    <div className="py-6 rounded-xl border border-white/10 bg-white/3 backdrop-blur-sm">
                      <Marquee speed={50} pauseOnHover gradient={false}>
                        {[
                          "triton.png",
                          "davies.png",
                          "dewalt.png",
                          "boysen.jpeg",
                          "eagle.png",
                          "Bosch.png",
                        ].map((img, i) => (
                          <img
                            key={i}
                            src={`/images/${img}`}
                            alt=""
                            className="h-16 md:h-20 mx-8 md:mx-12 object-contain"
                          />
                        ))}
                      </Marquee>
                    </div>
                  </motion.div>
                </>
              )}
            </section>

            <section className="py-20 px-4 md:px-8 bg-transparent">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                  <div
                    className="text-sm md:text-base uppercase tracking-widest mb-3"
                    style={{ color: getText("accent") }}
                  >
                    WHAT WE OFFER
                  </div>
                  <h2
                    className="text-4xl md:text-5xl lg:text-6xl font-bold"
                    style={{ color: "#0f172a" }}
                  >
                    Our Expertise
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                  {services.map((s, i) => (
                    <div
                      key={s.title}
                      className="group relative rounded-xl overflow-hidden h-[280px] bg-white/5 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                        style={{ backgroundImage: `url(${s.image})` }}
                      />

                      <div
                        className="absolute inset-0 transition-transform duration-700 ease-out group-hover:translate-x-full"
                        style={{
                          backgroundColor: "rgb(253 255 240 / 0.98)",
                          clipPath:
                            "polygon(0% 0%, 100% 0%, 90% 100%, 0% 100%)",
                          borderRight: "1.5px solid rgba(200, 200, 190, 0.4)",
                        }}
                      />

                      <div className="relative h-full p-6 flex flex-col z-10">
                        <h3 className="text-lg md:text-xl font-medium mb-3 text-slate-900 leading-tight">
                          {s.title}
                        </h3>
                        <p className="text-sm text-slate-700/90 flex-grow leading-relaxed">
                          {s.description}
                        </p>
                        <div className="text-xs uppercase tracking-wider opacity-60 mt-4">
                          Service {i + 1}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
