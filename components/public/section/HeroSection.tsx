"use client";

import Image from "next/image";
import { motion, useAnimation } from "framer-motion";
import { useEffect, useRef, useState } from "react";

// Animation variants
const sectionVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 1.2, ease: "easeOut" },
  },
};

const textContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 1.5,
      delay: 0.3,
      ease: "easeOut",
      staggerChildren: 0.4,
    },
  },
};

const textItemVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 1.2,
      ease: "easeOut",
    },
  },
};

const imageVariants = {
  initial: {
    rotate: 0,
    scale: 1.1,
  },
  animate: {
    rotate: 360,
    transition: {
      rotate: {
        duration: 120,
        ease: "linear",
        repeat: Infinity,
      },
    },
  },
  paused: {
    rotate: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export default function HeroSection() {
  const controls = useAnimation();
  const sectionRef = useRef(null);
  const [isInView, setIsInView] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state after component mounts
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Safe animation control function
  const safeStartAnimation = (animation: string) => {
    if (!isMounted) return;

    try {
      controls.start(animation).catch(() => {
        // Silent catch for animation errors
      });
    } catch (error) {
      // Ignore animation errors
    }
  };

  useEffect(() => {
    if (!isMounted) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          setIsInView(true);
          safeStartAnimation("animate");
        } else {
          setIsInView(false);
          safeStartAnimation("paused");
        }
      },
      {
        threshold: [0, 0.1, 0.5, 0.9, 1],
        rootMargin: "0px",
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, [isMounted]); // Removed controls from dependencies

  return (
    <motion.section
      ref={sectionRef}
      className="relative min-h-screen w-full overflow-hidden"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {/* Fixed container for the rotating image */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <motion.div
          className="w-full h-full"
          variants={imageVariants}
          initial="initial"
          animate={controls}
          style={{
            // This ensures the rotation happens from the center
            transformOrigin: "center center",
          }}
        >
          <Image
            src="/images/vector-hero.png"
            alt="Gian Construction Hero Background"
            fill
            className="object-cover"
            priority
            style={{
              transform: "scale(1.1)",
              // Ensure the image itself doesn't cause layout shifts
              willChange: "transform",
            }}
          />
        </motion.div>
      </div>

      {/* Fade-in text box */}
      <div className="absolute bottom-20 left-8 z-10 max-w-[800px]">
        <motion.div
          className="p-6 backdrop-blur-md bg-white/20 rounded-md border-1 space-y-4"
          variants={textContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.h1
            className="text-3xl md:text-4xl lg:text-6xl font-black text-[var(--orange)] tracking-tight leading-[0.8] "
            variants={textItemVariants}
          >
            Your Single Solution for Building a Home.
          </motion.h1>
          <hr />
          <motion.p
            className="text-lg md:text-1xl text-black font-medium tracking-tight"
            variants={textItemVariants}
          >
            Gian Construction uniquely brings your vision to life. We handle the
            entire journey—from architectural design and expert construction to
            providing top-quality hardware supplies and flexible financing
            options. One firm, one point of contact, one seamless experience.
          </motion.p>
        </motion.div>
      </div>
    </motion.section>
  );
}
