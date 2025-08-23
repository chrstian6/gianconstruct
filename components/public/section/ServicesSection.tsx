"use client";

import { motion } from "framer-motion";
import ProjectTimeline from "./Timeline";

// Animation variants for scroll reveal
const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const listItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const financingCardVariants = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: "easeOut" },
  },
};

export default function ServicesSection() {
  const services = [
    "Design Floor Plan & 3D Rendering",
    "Build",
    "Renovation",
    "Building Permits",
    "General Constructions",
    "Loan Assistance Thru Pag-Ibig & Bank",
  ];

  return (
    <motion.section
      id="services"
      className="flex justify-center py-16 bg-gray-50"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Header Section */}
        <motion.div className="md:text-left text-center mb-12">
          <h2 className="text-3xl font-black text-[var(--orange)] sm:text-4xl md:text-6xl mb-4 tracking-tight">
            What Can We Build For You?
          </h2>
          <p className="text-gray-600 text-lg md:text-xl max-w-2xl">
            We offer
            <span className="font-semibold text-[var(--orange)]">
              {" "}
              "Build Now, Pay Later"{" "}
            </span>
            financing options
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Financing Highlight Card - Left Side */}
          <motion.div
            className="bg-gradient-to-br from-[var(--orange)] to-orange-600 p-8 rounded-md shadow-lg text-white lg:sticky lg:top-24"
            variants={financingCardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Build Now, Pay Later</h3>
              <p className="text-white/90">
                Start your project today with our flexible payment plans.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  stroke-in="round"
                  className="mr-3"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Flexible payment terms</span>
              </div>
              <div className="flex items-center">
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
                  className="mr-3"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>No hidden fees</span>
              </div>
              <div className="flex items-center">
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
                  className="mr-3"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Quick approval process</span>
              </div>
              <div className="flex items-center">
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
                  className="mr-3"
                >
                  <polyline points="20 6 9 17 4 极" />
                </svg>
                <span>Customizable ₱ payment plans</span>
              </div>
            </div>

            <button className="w-full mt-6 bg-white text-[var(--orange)] font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              Learn More About Financing
            </button>
          </motion.div>

          {/* Services List - Right Side */}
          <div className="lg:col-span-2 bg-white border-1 p-8">
            <h3 className="text-2xl font-bold text-[var(--orange)] mb-6 text-center lg:text-left">
              What we offer:
            </h3>

            <div className="space-y-4">
              {services.map((service, index) => (
                <motion.div
                  key={index}
                  className="flex items-start p-4 rounded-lg border border-gray-200 hover:border-[var(--orange)] hover:bg-orange-50 transition-all duration-200"
                  variants={listItemVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 5 }}
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-[var(--orange)] rounded-full flex items-center justify-center mr-4 mt-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span className="text-lg font-medium text-gray-900">
                    {service}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Additional Info */}
            <motion.div
              className="mt-8 p-6 bg-gray-50 rounded-lg border-l-4 border-[var(--orange)]"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              viewport={{ once: true }}
            >
              <p className="text-gray-700 italic">
                "All services come with our comprehensive support and guidance
                through every step of your construction journey."
              </p>
            </motion.div>
          </div>
        </div>

        {/* Project Timeline Component */}
        <ProjectTimeline />
      </div>
    </motion.section>
  );
}
