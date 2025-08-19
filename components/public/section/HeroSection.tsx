"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useModalStore } from "@/lib/stores";

// Animation variants
const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};
const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};
const toolVariants = (type: string, delay: number) => {
  if (type === "pen") {
    return {
      animate: {
        x: [0, 200, 200, 0, 0],
        y: [0, 0, 100, 100, 0],
        rotate: [0, 0, 0, 0, 0],
        transition: {
          x: {
            times: [0, 0.25, 0.5, 0.75, 1],
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          },
          y: {
            times: [0, 0.25, 0.5, 0.75, 1],
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          },
          rotate: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          delay,
        },
      },
    };
  }
  return {
    animate: {
      x: [-50, 50],
      y: [0, -15, 0],
      rotate: [0, 5, -5, 0],
      transition: {
        x: { duration: 6, repeat: Infinity, ease: "linear" },
        y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
        rotate: { duration: 2, repeat: Infinity, ease: "easeInOut" },
        delay,
      },
    },
  };
};
const dashLineVariants = {
  animate: {
    strokeDashoffset: [0, -20],
    transition: {
      strokeDashoffset: { duration: 1, repeat: Infinity, ease: "linear" },
    },
  },
};
const textVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.5 } },
};
const designLetterVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, delay: i * 0.1, ease: "easeInOut" },
  }),
};
const buildLetterVariants = {
  hidden: { opacity: 0, y: 20, rotate: -5 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotate: 0,
    transition: { duration: 0.4, delay: i * 0.1, ease: "easeOut" },
  }),
};
const doneLetterVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      delay: i * 0.1,
      type: "spring",
      stiffness: 200,
    },
  }),
};
const checkIconVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.3,
      type: "spring",
      stiffness: 200,
      delay: 0.4,
    },
  },
};

export default function HeroSection() {
  const { setIsLoginOpen, setIsCreateAccountOpen } = useModalStore();
  const [currentWord, setCurrentWord] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const projects = [
    {
      src: "/images/gian.jpg",
      alt: "Residential Villa",
      description:
        "Modern residential villa with sustainable materials and open spaces.",
    },
    {
      src: "/images/gian34.jpg",
      alt: "Commercial Complex",
      description:
        "Innovative office spaces designed for productivity and collaboration.",
    },
    {
      src: "/images/gian556.jpg",
      alt: "Community Center",
      description: "Functional architecture fostering community engagement.",
    },
    {
      src: "/images/gian222.jpg",
      alt: "Luxury Apartment",
      description:
        "Urban living with premium finishes and smart home features.",
    },
  ];

  return (
    <motion.section
      className="relative bg-gradient-to-br from-gray-50 to-gray-200 min-h-[calc(100vh-4rem)] flex justify-center items-center py-8 md:py-12"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <div className="container mx-auto px-4 flex flex-col items-center gap-6 max-w-6xl">
        <motion.div
          className="w-full max-w-2xl text-center bg-[linear-gradient(rgba(30,144,255,0.3)_1px,transparent_1px),linear-gradient(to_right,rgba(30,144,255,0.3)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,black_70%,transparent_100%)] p-6 relative"
          variants={cardVariants}
        >
          {[
            { delay: 0, top: "10%", left: "10%", type: "ruler" },
            { delay: 2, top: "30%", left: "70%", type: "pen" },
            { delay: 4, top: "50%", left: "20%", type: "ruler" },
          ].map((tool, index) => (
            <motion.div
              key={index}
              className="absolute"
              style={{ top: tool.top, left: tool.left }}
              variants={toolVariants(tool.type, tool.delay)}
              animate="animate"
            >
              {tool.type === "ruler" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1e90ff"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-6 h-6 opacity-50"
                >
                  <path d="M21 3L3 13l18 8-18-8" />
                  <path d="M7 5.5v5M11 7v3M15 8.5v5" />
                </svg>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#1e90ff"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-6 h-6 opacity-50"
                  >
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                  <svg
                    className="absolute top-0 left-0 w-[220px] h-[120px] pointer-events-none"
                    style={{ transform: "translate(-10px, 10px)" }}
                  >
                    <motion.path
                      d="M0,0 L200,0 L200,100 L0,100 L0,0"
                      fill="none"
                      stroke="#1e90ff"
                      strokeWidth="1"
                      strokeDasharray="5,5"
                      strokeDashoffset="0"
                      variants={dashLineVariants}
                      animate="animate"
                    />
                  </svg>
                </>
              )}
            </motion.div>
          ))}
          <h1 className="text-5xl font-black md:text-6xl w-full mb-4 text-[var(--orange)] tracking-tight">
            Design with Precision. Build with Strength. Done with Excellence.
          </h1>
          <p className="text-base md:text-md font-semibold text-black mb-4">
            Gian Construction & Supplies delivers top-tier construction services
            for residential and commercial projects, blending quality,
            innovation, and expertise.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto px-8 py-4 border-1 border-[var(--orange)] bg-background border-1 b text-[var(--orange)] hover:bg-[var(--orange)] hover:text-primary-foreground cursor-pointer text-lg transition-colors duration-200 box-border"
              onClick={() => setIsLoginOpen(true)}
            >
              Sign In
            </Button>

            <Button
              size="lg"
              className="w-full sm:w-auto px-8 py-4 bg-[var(--orange)] border-1 border-[var(--orange)] text-text-secondary hover:bg-[var(--orange)] hover:text-[var(--orange)] cursor-pointer hover:bg-text-secondary text-lg transition-colors duration-200 box-border"
              onClick={() => setIsCreateAccountOpen(true)}
            >
              Sign Up
            </Button>
          </div>
          <motion.div className="mt-8 h-8 flex justify-center items-center">
            {currentWord === 0 && (
              <motion.div
                className="flex"
                variants={textVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                key="design"
              >
                {"Design".split("").map((letter, i) => (
                  <motion.span
                    key={i}
                    className="text-lg md:text-xl font-handwritten text-gray-900"
                    variants={designLetterVariants}
                    custom={i}
                  >
                    {letter}
                  </motion.span>
                ))}
              </motion.div>
            )}
            {currentWord === 1 && (
              <motion.div
                className="flex"
                variants={textVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                key="build"
              >
                {"Build".split("").map((letter, i) => (
                  <motion.span
                    key={i}
                    className="text-lg md:text-xl font-semibold text-gray-900"
                    variants={buildLetterVariants}
                    custom={i}
                  >
                    {letter}
                  </motion.span>
                ))}
              </motion.div>
            )}
            {currentWord === 2 && (
              <motion.div
                className="flex items-center"
                variants={textVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                key="done"
              >
                {"Done".split("").map((letter, i) => (
                  <motion.span
                    key={i}
                    className="text-lg md:text-xl font-semibold text-gray-900"
                    variants={doneLetterVariants}
                    custom={i}
                  >
                    {letter}
                  </motion.span>
                ))}
                <motion.div
                  className="ml-2"
                  variants={checkIconVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#22C55E"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
        <motion.div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4">
          {projects.map((project, index) => (
            <motion.div
              key={index}
              className="relative flex flex-col items-center group"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              style={{ transformOrigin: "center" }}
            >
              <motion.div
                className="relative w-full overflow-hidden"
                whileHover={{
                  scale: 1.5,
                  zIndex: 10,
                  transition: { type: "spring", stiffness: 150, damping: 15 },
                }}
                initial={{ width: "100%", height: "auto", aspectRatio: 4 / 2 }}
              >
                <Image
                  src={project.src}
                  alt={project.alt}
                  fill
                  className="object-cover group-hover:object-contain transition-all duration-400"
                  priority={index === 0}
                />
              </motion.div>
              <div className="mt-2 text-center transition-opacity duration-400 group-hover:opacity-0">
                <p className="text-sm font-helvetica text-black">
                  {project.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}
