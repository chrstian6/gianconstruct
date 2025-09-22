"use client";

import { motion, useAnimation } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";

// Define the Particle type
interface Particle {
  id: number;
  x: number;
  y: number;
  delay: number;
}

export default function Timeline() {
  const steps = [
    {
      step: 1,
      title: "Browse Catalog Designs",
      description:
        "Explore our comprehensive design catalog featuring various architectural styles and floor plans",
      details:
        "Filter by style, size, and budget. Save your favorites for reference.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="9" y1="3" x2="9" y2="21" />
        </svg>
      ),
      link: "/catalog",
      linkText: "Explore Designs",
    },
    {
      step: 2,
      title: "Schedule Consultation",
      description:
        "Book a free consultation with our design and construction experts",
      details:
        "30-minute virtual or in-person meeting to discuss your project requirements and vision.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      step: 3,
      title: "Project Planning & Quote",
      description:
        "Receive detailed project proposal with timeline and cost breakdown",
      details:
        "Includes 3D renderings, material options, and flexible payment plans with Build Now, Pay Later options.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      step: 4,
      title: "Construction & Updates",
      description:
        "Project execution with regular progress updates and quality assurance",
      details:
        "Weekly progress reports, site visits, and continuous communication throughout the build process.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M16 18v-2a4 4 0 0 0-4-4H8" />
          <path d="M15 2v4a2 2 0 0 0 2 2h4" />
          <circle cx="9" cy="11" r="1" />
        </svg>
      ),
    },
    {
      step: 5,
      title: "Project Completion",
      description: "Final walkthrough and handover of your completed project",
      details:
        "Quality inspection, documentation transfer, and 1-year warranty on all workmanship.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 极 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
  ];

  // State with explicit type for particles
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate particles only on client mount
    const newParticles = Array.from({ length: 30 }, (_, index) => ({
      id: index,
      x: Math.random() * 80, // 0-80% of container width
      y: Math.random() * 80, // 0-80% of container height
      delay: Math.random() * 2,
    }));
    setParticles(newParticles);
  }, []); // Empty dependency array ensures it runs once on mount

  return (
    <div className="mt-20 p-10 relative overflow-hidden">
      {/* Background Animation Layer with fixed container */}
      <div className="absolute inset-0 z-1">
        <div className="top-50 left-20 relative max-w-4xl h-[600px] mx-auto">
          {particles.length > 0 &&
            particles.map((particle) => (
              <motion.div
                key={particle.id}
                className="absolute w-4 h-4 bg-orange-500 rounded-full"
                style={{
                  left: `${particle.x}%`, // Percentage of container
                  top: `${particle.y}%`, // Percentage of container
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1.5, 0.8, 1],
                  opacity: [0, 1, 0.6, 0.3],
                  x: [0, 10, -10, 0], // Reduced movement to stay within bounds
                  y: [0, 5, -5, 0], // Reduced movement to stay within bounds
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: particle.delay,
                  ease: "easeInOut",
                }}
              />
            ))}
        </div>
      </div>

      {/* Content Layer */}
      <motion.h3
        className="text-4xl font-black text-black text-center mb-12 tracking-tight z-10 relative"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        viewport={{ once: true }}
      >
        Simple 5-Step Process
      </motion.h3>

      <div className="relative max-w-4xl mx-auto z-10">
        {/* Minimal timeline line */}
        <div className="absolute left-[-4] top-0 h-full w-0.5 bg-gray-200 transform -translate-x-1/2 ml-4"></div>

        <div className="space-y-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              className="relative flex items-start"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              viewport={{ once: true }}
            >
              {/* Minimal timeline dot */}
              <div className="absolute left-0 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white font-medium text-xs z-10 border-2 border-white shadow-sm">
                {step.step}
              </div>

              {/* Compact card */}
              <div className="ml-12 bg-white p-4 rounded-lg border border-gray-200 flex-1">
                <div className="flex items-start mb-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 mr-3">
                    {step.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-black mb-1 tracking-tight">
                      {step.title}
                    </h4>
                    <p className="text-sm text-gray-700 mb-2 leading-tight">
                      {step.description}
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {step.details}
                    </p>

                    {/* Link for the first step */}
                    {step.link && (
                      <Link
                        href={step.link}
                        className="inline-block mt-3 px-4 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-md hover:bg-orange-600 transition-colors duration-200"
                      >
                        {step.linkText}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Minimal CTA */}
      <motion.div
        className="text-center mt-12 p-6 bg-gray-50 rounded-lg z-10 relative"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        viewport={{ once: true }}
      >
        <h4 className="text-base font-semibold text-black mb-2 tracking-tight">
          Ready to Start Your Project?
        </h4>
        <p className="text-sm text-gray-700 mb-4 max-w-md mx-auto">
          Begin with our catalog or schedule a consultation to discuss your
          needs
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            href="/catalog"
            className="px-5 py-2 bg-orange-500 text-white text-sm font-medium rounded-md hover:bg-orange-600 transition-colors duration-200"
          >
            View Catalog
          </Link>
          <button className="px-5 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-100 transition-all duration-200">
            Contact Us
          </button>
        </div>
      </motion.div>
    </div>
  );
}
