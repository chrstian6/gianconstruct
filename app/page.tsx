"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import Marquee from "react-fast-marquee";
import { Navbar } from "@/components/public/Navbar";
import HeroSection from "@/components/public/section/HeroSection";
import Squares from "@/components/Squares";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { motion } from "framer-motion";

export default function Home() {
  const panelsContainerRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const [heroComplete, setHeroComplete] = useState(false);
  const [isScrollingAllowed, setIsScrollingAllowed] = useState(false);
  const [introScrollProgress, setIntroScrollProgress] = useState(0);
  const [introAnimationStarted, setIntroAnimationStarted] = useState(false);
  const lenisRef = useRef<any>(null);
  const introSectionRef = useRef<HTMLDivElement>(null);
  const [section1ScrollProgress, setSection1ScrollProgress] = useState(0);
  const section1Ref = useRef<HTMLDivElement>(null);

  // New refs for section 1 text animation
  const section1TextContainerRef = useRef<HTMLDivElement>(null);
  const textWordsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const [textAnimationReady, setTextAnimationReady] = useState(false);
  const textAnimationTriggeredRef = useRef(false);
  const animationTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const textScrollTriggerRef = useRef<any>(null);

  // Track if we're in the horizontal scroll section
  const [isInHorizontalSection, setIsInHorizontalSection] = useState(false);

  // Text content for section 1 - split into words - COMPRESSED VERSION
  const section1Text = [
    "Every journey needs a starting point.",
    "This is yours.",
    "Where the ground is prepared for something greater,",
    "every foundation marks the beginning of progress,",
    "and the future stands as proof of what vision can build.",
  ];

  // Split each line into words for word-by-word animation
  const section1Words = section1Text.flatMap((line, lineIndex) =>
    line.split(" ").map((word, wordIndex) => ({
      word: word + (wordIndex < line.split(" ").length - 1 ? " " : ""),
      lineIndex,
      wordIndex,
      totalWordsInLine: line.split(" ").length,
    }))
  );

  // Listen for hero completion event
  useEffect(() => {
    const handleHeroComplete = () => {
      console.log("Hero section complete - enabling main page scroll");
      setHeroComplete(true);
      setIsScrollingAllowed(true);

      // Start Lenis for main page scroll
      if (lenisRef.current) {
        lenisRef.current.start();
        document.body.style.overflow = "auto";

        // Smoothly scroll to the intro section of horizontal story
        setTimeout(() => {
          if (lenisRef.current) {
            const heroSection = document.querySelector("#hero-section");
            if (heroSection) {
              const heroHeight = heroSection.clientHeight;

              // Scroll to make sure intro section is fully visible
              lenisRef.current.scrollTo(heroHeight - 100, {
                duration: 1.8,
                easing: (t: number) => t,
                onComplete: () => {
                  // Start intro animation after scroll completes
                  setTimeout(() => {
                    setIntroAnimationStarted(true);
                  }, 300);
                },
              });
            }
          }
        }, 300);
      }
    };

    window.addEventListener("heroComplete", handleHeroComplete);

    return () => {
      window.removeEventListener("heroComplete", handleHeroComplete);
    };
  }, []);

  // Initialize Lenis for smooth scrolling (but paused initially)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const initLenis = async () => {
      const Lenis = (await import("lenis")).default;

      lenisRef.current = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
        infinite: false,
      });

      // Initially stop Lenis - wait for hero section to complete
      lenisRef.current.stop();
      document.body.style.overflow = "hidden";

      function raf(time: number) {
        if (lenisRef.current) {
          lenisRef.current.raf(time);
        }
        requestAnimationFrame(raf);
      }

      requestAnimationFrame(raf);
    };

    initLenis();

    return () => {
      if (lenisRef.current) {
        lenisRef.current.destroy();
      }
      document.body.style.overflow = "auto";
    };
  }, []);

  // In your useEffect for intro section scroll progress:
  useEffect(() => {
    if (!heroComplete || !introSectionRef.current) return;

    gsap.registerPlugin(ScrollTrigger);

    // Create an observer to detect when intro section is 30% visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Trigger when 30% visible
          if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
            if (!introAnimationStarted) {
              console.log("Intro section is 30% visible - starting animation");
              setIntroAnimationStarted(true);
            }
          }
        });
      },
      {
        threshold: [0.4, 0.85, 1.0],
        rootMargin: "0px 0px -100px 0px",
      }
    );

    observer.observe(introSectionRef.current);

    // Track scroll progress for background color changes - start earlier too
    ScrollTrigger.create({
      trigger: introSectionRef.current,
      start: "top 90%",
      end: "top 20%",
      scrub: true,
      onUpdate: (self) => {
        const easedProgress = Math.pow(self.progress, 0.7);
        setIntroScrollProgress(easedProgress);
      },
    });

    return () => {
      observer.disconnect();
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.trigger === introSectionRef.current) {
          trigger.kill();
        }
      });
    };
  }, [heroComplete, introAnimationStarted]);

  // Track Section 1 scroll progress for main page background transition - FASTER
  useEffect(() => {
    if (!heroComplete || !section1Ref.current) return;

    gsap.registerPlugin(ScrollTrigger);

    ScrollTrigger.create({
      trigger: section1Ref.current,
      start: "top 60%", // Start transition when section 1 reaches 60% of viewport (earlier)
      end: "top 20%", // Complete transition when section 1 reaches 20% of viewport (shorter distance)
      scrub: true,
      onUpdate: (self) => {
        // Use exponential easing for faster transition at the beginning
        const easedProgress = Math.pow(self.progress, 0.6); // Changed from 0.8 to 0.6 for faster
        setSection1ScrollProgress(easedProgress);
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.trigger === section1Ref.current) {
          trigger.kill();
        }
      });
    };
  }, [heroComplete]);

  // NEW: Track when we enter the horizontal section
  useEffect(() => {
    if (!heroComplete || !panelsContainerRef.current) return;

    gsap.registerPlugin(ScrollTrigger);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInHorizontalSection(entry.isIntersecting);
        });
      },
      {
        threshold: 0.1,
        rootMargin: "-100px 0px -100px 0px",
      }
    );

    if (panelsContainerRef.current) {
      observer.observe(panelsContainerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [heroComplete]);

  // Setup Section 1 text animation - IMPROVED VERSION WITH BETTER TRIGGER TIMING
  useEffect(() => {
    if (
      !heroComplete ||
      !section1Ref.current ||
      !section1TextContainerRef.current
    )
      return;

    gsap.registerPlugin(ScrollTrigger);

    console.log("Setting up section 1 scroll-integrated animation");

    // Reset animation trigger
    textAnimationTriggeredRef.current = false;

    // Kill any existing timeline and scroll trigger
    if (animationTimelineRef.current) {
      animationTimelineRef.current.kill();
      animationTimelineRef.current = null;
    }

    if (textScrollTriggerRef.current) {
      textScrollTriggerRef.current.kill();
      textScrollTriggerRef.current = null;
    }

    // Initialize all words with hidden state
    textWordsRef.current.forEach((wordElement) => {
      if (wordElement) {
        gsap.set(wordElement, {
          opacity: 0,
          x: 100,
          filter: "blur(10px)",
          display: "inline-block",
          willChange: "transform, opacity, filter",
        });
      }
    });

    // Wait for horizontal section to be active before setting up the trigger
    const setupTextAnimation = () => {
      // Calculate total animation duration based on number of words
      const totalWords = textWordsRef.current.length;
      const wordDuration = 0.8; // Duration for each word animation
      const wordDelay = 0.15; // Delay between words
      const totalAnimationTime = totalWords * wordDelay + wordDuration;

      // Convert time to scroll distance (assuming 60px per second of animation)
      const scrollDistance = totalAnimationTime * 60;

      // Create a ScrollTrigger for the text animation that integrates with the scroll flow
      // KEY FIX: Start the animation later - when text container is at center of viewport
      textScrollTriggerRef.current = ScrollTrigger.create({
        trigger: section1TextContainerRef.current,
        start: "top 70%", // Start when container top reaches 70% down the viewport (much later)
        end: `+=${scrollDistance}`, // End after scrolling the calculated distance
        scrub: true, // Smooth scrubbing
        markers: false, // Set to true for debugging
        onEnter: () => {
          console.log("Entering text animation zone");
          textAnimationTriggeredRef.current = true;
        },
        onEnterBack: () => {
          console.log("Entering back into text animation zone");
          textAnimationTriggeredRef.current = true;
        },
        onLeave: () => {
          console.log("Leaving text animation zone");
        },
        onLeaveBack: () => {
          console.log("Leaving back from text animation zone");
        },
        onUpdate: (self) => {
          // Animate each word based on scroll progress with staggered timing
          const progress = self.progress;

          textWordsRef.current.forEach((wordElement, index) => {
            if (wordElement) {
              // Calculate when this word should start animating (staggered)
              const wordStart = (index * wordDelay) / totalAnimationTime;
              const wordEnd = wordStart + wordDuration / totalAnimationTime;

              // Calculate word's individual progress
              let wordProgress = 0;
              if (progress >= wordStart && progress <= wordEnd) {
                wordProgress = (progress - wordStart) / (wordEnd - wordStart);
              } else if (progress > wordEnd) {
                wordProgress = 1;
              }

              // Apply animation based on word progress
              gsap.to(wordElement, {
                opacity: wordProgress,
                x: (1 - wordProgress) * 100,
                filter: `blur(${10 * (1 - wordProgress)}px)`,
                duration: 0.1,
                overwrite: true,
              });
            }
          });
        },
      });
    };

    // Only setup the animation when we're in the horizontal section
    if (isInHorizontalSection) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        setupTextAnimation();
      }, 100);
    }

    return () => {
      if (textScrollTriggerRef.current) {
        textScrollTriggerRef.current.kill();
      }

      if (animationTimelineRef.current) {
        animationTimelineRef.current.kill();
      }

      // Reset all words to hidden state
      textWordsRef.current.forEach((wordElement) => {
        if (wordElement) {
          gsap.set(wordElement, {
            opacity: 0,
            x: 100,
            filter: "blur(10px)",
          });
        }
      });
    };
  }, [heroComplete, isInHorizontalSection]); // Added isInHorizontalSection dependency

  // Initialize GSAP and ScrollTrigger for horizontal scrolling
  useEffect(() => {
    gsap.registerPlugin(ScrollToPlugin, ScrollTrigger);

    // Initialize main navigation - only after hero is complete
    const initNavigation = () => {
      document.querySelectorAll(".anchor").forEach((anchor) => {
        anchor.addEventListener("click", function (e) {
          e.preventDefault();
          const targetHref = (e.target as HTMLAnchorElement).getAttribute(
            "href"
          );
          if (!targetHref) return;

          const targetElem = document.querySelector(targetHref);
          if (!targetElem) return;

          let y: number | Element = targetElem;

          // Handle panel navigation
          if (
            targetElem &&
            panelsContainerRef.current &&
            panelsContainerRef.current.contains(targetElem)
          ) {
            const panels = gsap.utils.toArray("#panels-container .panel");
            const tween = tweenRef.current;

            if (tween && tween.scrollTrigger) {
              const totalScroll =
                tween.scrollTrigger.end - tween.scrollTrigger.start;
              const targetIndex = panels.indexOf(targetElem);
              const totalMovement = (panels.length - 1) * 100;
              y = Math.round(
                tween.scrollTrigger.start +
                  (targetIndex / (panels.length - 1)) * totalScroll
              );
            }
          }

          gsap.to(window, {
            scrollTo: {
              y: y,
              autoKill: false,
            },
            duration: 1,
          });
        });
      });
    };

    // Calculate container width based on content
    const calculateContainerWidth = () => {
      if (!panelsContainerRef.current) return "400%";

      const panels = gsap.utils.toArray("#panels-container .panel");
      return `${panels.length * 100}%`;
    };

    // Set initial container width
    setTimeout(() => {
      if (panelsContainerRef.current) {
        panelsContainerRef.current.style.width = calculateContainerWidth();
      }
    }, 100);

    // Panels horizontal scroll - only set up if hero is complete
    if (heroComplete) {
      const panels = gsap.utils.toArray("#panels-container .panel");

      // Create the main horizontal scroll tween
      tweenRef.current = gsap.to(panels, {
        xPercent: -100 * (panels.length - 1),
        ease: "none",
        scrollTrigger: {
          trigger: "#panels-container",
          pin: true,
          start: "top top",
          scrub: 1,
          snap: {
            snapTo: 1 / (panels.length - 1),
            inertia: false,
            duration: { min: 0.1, max: 0.1 },
          },
          end: () => {
            if (!panelsContainerRef.current) return 0;
            return (
              "+=" +
              (panelsContainerRef.current.offsetWidth - window.innerWidth)
            );
          },
          onEnter: () => {
            console.log("Entering horizontal scroll section");
          },
          onLeave: () => {
            console.log("Leaving horizontal scroll section");
          },
        },
      });

      // Initialize navigation after horizontal scroll is set up
      initNavigation();
    }

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      if (tweenRef.current) {
        tweenRef.current.kill();
      }
    };
  }, [heroComplete]);

  // Main page background color - transitions from white to black when scrolling to Section 1 - FASTER
  const getMainBackgroundColor = () => {
    // First get the base color from intro section (orange to white)
    const introColor = getBackgroundColor();

    // Parse the intro color
    const introMatch = introColor.match(/\d+/g);
    if (!introMatch) return introColor;

    const introR = parseInt(introMatch[0]);
    const introG = parseInt(introMatch[1]);
    const introB = parseInt(introMatch[2]);

    // Black target color
    const black = { r: 0, g: 0, b: 0 };

    // Apply Section 1 scroll progress with faster curve
    // Use cubic easing for faster transition
    const progress = Math.min(section1ScrollProgress * 1.8, 1); // Increased from 1.2 to 1.8 for faster

    // Use exponential curve for even faster transition
    const fastProgress = Math.pow(progress, 0.7); // Exponential curve for faster start

    const r = Math.round(introR + (black.r - introR) * fastProgress);
    const g = Math.round(introG + (black.g - introG) * fastProgress);
    const b = Math.round(introB + (black.b - introB) * fastProgress);

    return `rgb(${r}, ${g}, ${b})`;
  };

  // Calculate color values based on scroll progress with faster transition
  const getBackgroundColor = () => {
    const orange = { r: 194, g: 65, b: 12 };
    const white = { r: 255, g: 255, b: 255 };

    const progress = Math.min(introScrollProgress * 1.3, 1);

    const r = Math.round(orange.r + (white.r - orange.r) * progress);
    const g = Math.round(orange.g + (white.g - orange.g) * progress);
    const b = Math.round(orange.b + (white.b - orange.b) * progress);

    return `rgb(${r}, ${g}, ${b})`;
  };

  // Section 1 text color (white text for dark background)
  const getSection1TextColor = () => {
    // White text: rgb(255, 255, 255)
    return "rgb(255, 255, 255)";
  };

  // Section 1 secondary text color (orange-200 for contrast)
  const getSection1SecondaryTextColor = () => {
    // Orange-200: rgb(253, 186, 116)
    return "rgb(253, 186, 116)";
  };

  // Section 1 gradient colors (white to orange for dark background)
  const getSection1GradientFromColor = () => {
    return "rgb(255, 255, 255)";
  };

  const getSection1GradientToColor = () => {
    // Orange-500: rgb(249, 115, 22)
    return "rgb(249, 115, 22)";
  };

  const getGridColor = () => {
    // Adjust grid color based on main background
    const bgColor = getMainBackgroundColor();
    const bgMatch = bgColor.match(/\d+/g);

    if (!bgMatch) return "rgba(255, 255, 255, 0.6)";

    const r = parseInt(bgMatch[0]);
    const g = parseInt(bgMatch[1]);
    const b = parseInt(bgMatch[2]);

    // Calculate brightness to determine if we need white or black grid
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    if (brightness > 128) {
      // Light background, use dark grid
      return "rgba(0, 0, 0, 0.6)";
    } else {
      // Dark background, use light grid
      return "rgba(255, 255, 255, 0.6)";
    }
  };

  const getHoverColor = () => {
    const bgColor = getMainBackgroundColor();
    const bgMatch = bgColor.match(/\d+/g);

    if (!bgMatch) return "rgba(255, 255, 255, 0.1)";

    const r = parseInt(bgMatch[0]);
    const g = parseInt(bgMatch[1]);
    const b = parseInt(bgMatch[2]);

    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    if (brightness > 128) {
      // Light background, use dark hover
      return "rgba(0, 0, 0, 0.1)";
    } else {
      // Dark background, use light hover
      return "rgba(255, 255, 255, 0.1)";
    }
  };

  const getTextColor = (baseColor: "white" | "orange") => {
    const progress = Math.min(introScrollProgress * 1.2, 1);

    if (baseColor === "white") {
      const whiteAmount = 1 - progress;
      const blackAmount = progress;

      const r = Math.round(255 * whiteAmount + 0 * blackAmount);
      const g = Math.round(255 * whiteAmount + 0 * blackAmount);
      const b = Math.round(255 * whiteAmount + 0 * blackAmount);

      return `rgb(${r}, ${g}, ${b})`;
    } else {
      const orange = { r: 255, g: 237, b: 213 };
      const gray = { r: 55, g: 65, b: 81 };

      const r = Math.round(orange.r + (gray.r - orange.r) * progress);
      const g = Math.round(orange.g + (gray.g - orange.g) * progress);
      const b = Math.round(orange.b + (gray.b - orange.b) * progress);

      return `rgb(${r}, ${g}, ${b})`;
    }
  };

  const getGradientFromColor = () => {
    const progress = Math.min(introScrollProgress * 1.3, 1);

    const whiteAmount = 1 - progress;
    const blackAmount = progress;

    const r = Math.round(255 * whiteAmount + 0 * blackAmount);
    const g = Math.round(255 * whiteAmount + 0 * blackAmount);
    const b = Math.round(255 * whiteAmount + 0 * blackAmount);

    return `rgb(${r}, ${g}, ${b})`;
  };

  const getGradientToColor = () => {
    const orange = { r: 253, g: 186, b: 116 };
    const gray = { r: 55, g: 65, b: 81 };

    const progress = Math.min(introScrollProgress * 1.3, 1);

    const r = Math.round(orange.r + (gray.r - orange.r) * progress);
    const g = Math.round(orange.g + (gray.g - orange.g) * progress);
    const b = Math.round(orange.b + (gray.b - orange.b) * progress);

    return `rgb(${r}, ${g}, ${b})`;
  };

  // Brand data for the marquee - MODIFIED: Only images needed
  const brands = [
    {
      name: "Triton",
      image: "/images/triton.png",
    },
    {
      name: "Knauf",
      image: "/images/davies.png",
    },
    {
      name: "Philko",
      image: "/images/dewalt.png",
    },
    {
      name: "Boysen",
      image: "/images/boysen.jpeg",
    },
    {
      name: "Fuji",
      image: "/images/eagle.png",
    },
    {
      name: "Armstrong",
      image: "/images/Bosch.png",
    },
  ];

  return (
    <div
      className="min-h-screen relative overflow-hidden transition-colors duration-200"
      style={{ backgroundColor: getMainBackgroundColor() }}
    >
      {/* Squares Background with dynamic colors */}
      <div className="fixed inset-0 z-0">
        <Squares
          speed={0.5}
          squareSize={50}
          direction="diagonal"
          borderColor={getGridColor()}
          hoverFillColor={getHoverColor()}
          lineWidth={0.1}
        />
      </div>

      {/* Always transparent navbar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar introScrollProgress={introScrollProgress} />
      </div>

      <main className="relative z-10">
        {/* Hero Section - Blocks scroll until completed */}
        <section id="hero-section" className="bg-transparent">
          <HeroSection />
        </section>

        {/* Continuous Horizontal Story - Only visible after hero is complete */}
        {heroComplete && (
          <>
            <section
              id="intro"
              ref={introSectionRef}
              className="h-screen sticky flex items-center justify-center bg-transparent relative"
            >
              {/* Orange Square Background for Text Animation */}
              {introAnimationStarted && (
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
                  style={{ animationDelay: "0.5s" }}
                >
                  {/* Animated Orange Square */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.15, scale: 1 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="relative"
                    style={{
                      width: "90vw",
                      height: "50vh",
                      maxWidth: "1200px",
                    }}
                  >
                    {/* Main Orange Square */}
                    <div
                      className="absolute inset-0 rounded-lg"
                      style={{
                        backgroundColor: "rgb(249, 115, 22)",
                        opacity: 0.25,
                        filter: "blur(0px)",
                      }}
                    />

                    {/* Glow Effect */}
                    <div
                      className="absolute inset-0 rounded-lg"
                      style={{
                        backgroundColor: "rgb(249, 115, 22)",
                        opacity: 0.1,
                        filter: "blur(20px)",
                      }}
                    />
                  </motion.div>
                </div>
              )}

              {/* Main content container */}
              <div className="text-center px-4 max-w-6xl mx-auto relative z-10 pb-20 pt-20">
                {/* Main content container with compressed spacing */}
                <div className="space-y-0 md:space-y-0 leading-tight">
                  {/* Line 1 */}
                  {introAnimationStarted && (
                    <div className="relative">
                      <TextGenerateEffect
                        words="Raising standards."
                        className="text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-bold tracking-tight mb-0"
                        style={{
                          color: getTextColor("white"),
                          lineHeight: "0.85",
                        }}
                        duration={1}
                        staggerDelay={0.25}
                      />
                    </div>
                  )}

                  {/* Line 2 */}
                  {introAnimationStarted && (
                    <div className="mt-0 relative">
                      <TextGenerateEffect
                        words="Winning trust."
                        className="text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-bold tracking-tight mb-0"
                        style={{
                          color: getTextColor("white"),
                          lineHeight: "0.85",
                        }}
                        duration={1.2}
                        staggerDelay={0.25}
                      />
                    </div>
                  )}

                  {/* Line 3 */}
                  {introAnimationStarted && (
                    <div className="mt-0 relative">
                      <TextGenerateEffect
                        words="Building Kabankalan's future."
                        className="text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-bold tracking-tight mb-0"
                        style={{
                          color: getTextColor("white"),
                          lineHeight: "0.85",
                        }}
                        duration={1.2}
                        staggerDelay={0.25}
                      />
                    </div>
                  )}
                </div>

                {/* Premium Brands Marquee - IMAGES ONLY */}
                {introAnimationStarted && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, delay: 1.5, ease: "easeOut" }}
                    className="mt-8 md:mt-12 max-w-6xl mx-auto"
                  >
                    {/* Title */}
                    <div
                      className="text-center mb-8 md:mb-10 text-sm md:text-base font-medium tracking-wider transition-colors duration-200"
                      style={{ color: getTextColor("orange") }}
                    >
                      TRUSTED BRANDS WE DELIVER
                    </div>

                    {/* Marquee Container */}
                    <div
                      className="relative overflow-hidden py-8 md:py-10 rounded-xl bg-transparent"
                      style={{
                        backgroundColor: `rgba(255, 255, 255, ${0.05 - introScrollProgress * 0.04})`,
                        borderColor: `rgba(255, 255, 255, ${0.1 - introScrollProgress * 0.08})`,
                        borderWidth: "1px",
                      }}
                    >
                      <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 z-10 pointer-events-none" />

                      {/* React Fast Marquee - Images Only */}
                      <Marquee
                        speed={40}
                        gradient={false}
                        pauseOnHover={true}
                        className="py-2"
                      >
                        {brands.map((brand, index) => (
                          <div
                            key={`brand-${index}`}
                            className="inline-flex items-center justify-center mx-6 md:mx-10"
                          >
                            <div className="relative group transition-all duration-300 hover:scale-105">
                              {/* Brand Logo Container - Transparent Background */}
                              <div className="relative w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28">
                                {/* Image Container */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <img
                                    src={brand.image}
                                    alt={brand.name}
                                    className="w-full h-full object-contain p-2 transition-opacity duration-300"
                                    onError={(e) => {
                                      e.currentTarget.classList.add(
                                        "opacity-0"
                                      );
                                      // Create a simple text fallback if image fails
                                      const container =
                                        e.currentTarget.parentElement;
                                      if (container) {
                                        const fallback =
                                          document.createElement("div");
                                        fallback.className =
                                          "absolute inset-0 flex items-center justify-center";
                                        fallback.innerHTML = `<span class="text-gray-400 font-semibold text-lg">${brand.name}</span>`;
                                        container.appendChild(fallback);
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </Marquee>
                    </div>
                  </motion.div>
                )}
              </div>
            </section>

            {/* Continuous Horizontal Story - Sections 1-4 as one connected flow */}
            <section id="panels" className="relative bg-transparent">
              <div
                id="panels-container"
                ref={panelsContainerRef}
                className="flex"
                style={{ width: "400%" }}
              >
                {/* Section 1 - Beginning - TRANSPARENT BACKGROUND */}
                <article
                  id="section-1"
                  ref={section1Ref}
                  className="panel w-screen h-screen flex-shrink-0 bg-transparent"
                >
                  <div className="relative h-full w-full">
                    {/* Connecting line to next section */}
                    <div
                      className="absolute right-0 top-1/2 transform -translate-y-1/2 w-32 h-0.5 z-20 transition-colors duration-200"
                      style={{
                        background: `linear-gradient(to left, ${getSection1GradientFromColor()}, transparent)`,
                      }}
                    ></div>

                    <div className="container mx-auto h-full flex items-center relative z-10 px-4 md:px-8">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 w-full items-center">
                        {/* Left side - Text Animation Container - COMPRESSED TEXT */}
                        <div
                          ref={section1TextContainerRef}
                          className="space-y-2 md:space-y-3 lg:space-y-4 max-w-3xl mx-auto lg:mx-0"
                        >
                          {/* Animated Text Lines - WORD BY WORD - COMPRESSED */}
                          {section1Text.map((line, lineIndex) => (
                            <div
                              key={lineIndex}
                              className={`font-bold tracking-tight ${
                                lineIndex === 1 ? "italic" : ""
                              } ${
                                lineIndex === 1
                                  ? "text-2xl md:text-3xl lg:text-4xl xl:text-5xl"
                                  : "text-xl md:text-2xl lg:text-3xl xl:text-4xl"
                              }`}
                              style={{
                                color:
                                  lineIndex === 1
                                    ? getSection1SecondaryTextColor()
                                    : getSection1TextColor(),
                                lineHeight: lineIndex === 1 ? "1.05" : "1.1", // REDUCED LINE-HEIGHT
                                marginBottom:
                                  lineIndex === 1 ? "0.5rem" : "0.75rem", // COMPRESSED MARGINS
                              }}
                            >
                              {line.split(" ").map((word, wordIndex) => {
                                const globalIndex =
                                  section1Text
                                    .slice(0, lineIndex)
                                    .reduce(
                                      (acc, curr, idx) =>
                                        acc + curr.split(" ").length,
                                      0
                                    ) + wordIndex;

                                return (
                                  <span
                                    key={`${lineIndex}-${wordIndex}`}
                                    ref={(el) => {
                                      textWordsRef.current[globalIndex] = el;
                                    }}
                                    className="inline-block opacity-0 mr-1"
                                    style={{
                                      willChange: "transform, opacity, filter",
                                    }}
                                  >
                                    {word}
                                  </span>
                                );
                              })}
                            </div>
                          ))}
                        </div>

                        {/* Right side - Visual and navigation */}
                        <div className="flex flex-col items-center lg:items-end justify-between h-full py-8 lg:py-16">
                          <div className="text-center lg:text-right mb-8 lg:mb-0">
                            <div
                              className="text-6xl md:text-7xl lg:text-8xl font-bold mb-2 opacity-10 transition-colors duration-200"
                              style={{
                                color: getSection1TextColor(),
                                fontFamily: "inherit",
                              }}
                            >
                              01
                            </div>
                            <div
                              className="text-sm font-mono transition-colors duration-200"
                              style={{
                                color: getSection1TextColor(),
                                letterSpacing: "0.05em",
                              }}
                            >
                              CONTINUES →
                            </div>
                          </div>

                          <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-end space-y-4 lg:space-y-0 lg:space-x-4 w-full">
                            <div
                              className="w-32 h-1 rounded-full overflow-hidden opacity-50 transition-colors duration-200 hidden lg:block"
                              style={{
                                backgroundColor: `rgba(255, 255, 255, 0.5)`,
                              }}
                            >
                              <div
                                className="h-full transition-colors duration-200"
                                style={{
                                  width: "100%",
                                  background: `linear-gradient(to right, ${getSection1GradientFromColor()}, ${getSection1GradientToColor()})`,
                                }}
                              ></div>
                            </div>
                            <a
                              href="#section-2"
                              className="anchor text-lg flex items-center group transition-colors duration-200 px-6 py-3 border border-white/20 hover:border-white/40 rounded-full font-medium"
                              style={{
                                color: getSection1TextColor(),
                                letterSpacing: "0.025em",
                              }}
                            >
                              Continue Story
                              <span className="ml-2 group-hover:translate-x-2 transition-transform duration-200">
                                →
                              </span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>

                {/* Section 2 - Development */}
                <article
                  id="section-2"
                  className="panel w-screen h-screen flex-shrink-0 bg-transparent"
                >
                  <div className="relative h-full w-full">
                    {/* Connecting lines */}
                    <div
                      className="absolute left-0 top-1/2 transform -translate-y-1/2 w-32 h-0.5 z-20 transition-colors duration-200"
                      style={{
                        background: `linear-gradient(to right, ${getGradientFromColor()}, transparent)`,
                      }}
                    ></div>
                    <div
                      className="absolute right-0 top-1/2 transform -translate-y-1/2 w-32 h-0.5 z-20 transition-colors duration-200"
                      style={{
                        background: `linear-gradient(to left, ${getGradientToColor()}, transparent)`,
                      }}
                    ></div>

                    <div className="container mx-auto h-full flex items-center relative z-10">
                      <div className="grid grid-cols-2 gap-16 w-full items-center">
                        {/* Left side - Story content */}
                        <div className="space-y-8">
                          <div className="inline-block">
                            <span
                              className="font-mono text-sm tracking-widest transition-colors duration-200"
                              style={{ color: getGradientToColor() }}
                            >
                              PART 2
                            </span>
                            <h2
                              className="text-5xl font-bold mt-2 transition-colors duration-200"
                              style={{ color: getTextColor("white") }}
                            >
                              The Development
                            </h2>
                          </div>

                          <div className="space-y-6">
                            <p
                              className="text-xl leading-relaxed transition-colors duration-200"
                              style={{ color: getTextColor("orange") }}
                            >
                              Building upon the foundation, we now expand and
                              develop the core concepts. The connections grow
                              stronger, the narrative deepens.
                            </p>
                            <p
                              className="text-lg leading-relaxed opacity-90 transition-colors duration-200"
                              style={{ color: getTextColor("orange") }}
                            >
                              Each element carefully crafted to flow into the
                              next, creating a seamless experience that feels
                              both expansive and connected.
                            </p>
                          </div>
                        </div>

                        {/* Right side - Visual and navigation */}
                        <div className="flex flex-col items-end justify-between h-full py-16">
                          <div className="text-right">
                            <div
                              className="text-8xl font-bold mb-4 opacity-10 transition-colors duration-200"
                              style={{ color: getTextColor("white") }}
                            >
                              02
                            </div>
                            <div
                              className="text-sm font-mono transition-colors duration-200"
                              style={{ color: getGradientToColor() }}
                            >
                              CONTINUES →
                            </div>
                          </div>

                          <div className="flex items-center justify-between w-full">
                            <a
                              href="#section-1"
                              className="anchor text-lg flex items-center group transition-colors duration-200"
                              style={{
                                color: getTextColor("white"),
                              }}
                            >
                              <span className="mr-2 group-hover:-translate-x-2 transition-transform duration-200">
                                ←
                              </span>
                              Back
                            </a>

                            <div className="flex items-center space-x-4">
                              <div
                                className="w-32 h-1 rounded-full overflow-hidden opacity-50 transition-colors duration-200"
                                style={{
                                  backgroundColor: `rgba(${getGradientToColor()
                                    .match(/\d+/g)
                                    ?.slice(0, 3)
                                    .join(", ")}, 0.5)`,
                                }}
                              >
                                <div
                                  className="h-full transition-colors duration-200"
                                  style={{
                                    width: "100%",
                                    background: `linear-gradient(to right, ${getGradientToColor()}, ${getGradientToColor()})`,
                                  }}
                                ></div>
                              </div>
                              <a
                                href="#section-3"
                                className="anchor text-lg flex items-center group transition-colors duration-200"
                                style={{
                                  color: getTextColor("white"),
                                }}
                              >
                                Continue
                                <span className="ml-2 group-hover:translate-x-2 transition-transform duration-200">
                                  →
                                </span>
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>

                {/* Section 3 - Climax */}
                <article
                  id="section-3"
                  className="panel w-screen h-screen flex-shrink-0 bg-transparent"
                >
                  <div className="container mx-auto h-full flex items-center">
                    <div className="text-center w-full">
                      <h2
                        className="text-5xl font-bold mb-8 transition-colors duration-200"
                        style={{ color: getTextColor("white") }}
                      >
                        Section 3 - Climax
                      </h2>
                      <p
                        className="text-xl transition-colors duration-200"
                        style={{ color: getTextColor("orange") }}
                      >
                        Content for Section 3
                      </p>
                    </div>
                  </div>
                </article>

                {/* Section 4 - Resolution */}
                <article
                  id="section-4"
                  className="panel w-screen h-screen flex-shrink-0 bg-transparent"
                >
                  <div className="container mx-auto h-full flex items-center">
                    <div className="text-center w-full">
                      <h2
                        className="text-5xl font-bold mb-8 transition-colors duration-200"
                        style={{ color: getTextColor("white") }}
                      >
                        Section 4 - Resolution
                      </h2>
                      <p
                        className="text-xl transition-colors duration-200"
                        style={{ color: getTextColor("orange") }}
                      >
                        Content for Section 4
                      </p>
                    </div>
                  </div>
                </article>
              </div>
            </section>

            {/* Section 5 - Simple Plain Container */}
            <section id="section-5" className="min-h-screen bg-transparent">
              <div className="container mx-auto py-20 px-4">
                <div className="max-w-4xl mx-auto">
                  <div className="text-center mb-12">
                    <span
                      className="font-mono text-sm tracking-widest transition-colors duration-200"
                      style={{ color: getTextColor("white") }}
                    >
                      PART 5
                    </span>
                    <h2
                      className="text-5xl font-bold mt-4 mb-6 transition-colors duration-200"
                      style={{ color: getTextColor("white") }}
                    >
                      Simple Container
                    </h2>
                    <p
                      className="text-lg transition-colors duration-200"
                      style={{ color: getTextColor("orange") }}
                    >
                      This is a plain container with simple content.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
