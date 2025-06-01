import { Button } from "@/components/ui/button";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";

// Animation variants for scroll reveal
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

export default function AboutSection() {
  return (
    <motion.section
      id="about"
      className="py-6 bg-gray-50 flex justify-center sm:py-16"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-6 sm:flex-row">
          <motion.div
            className="w-full md:w-1/2 order-2 sm:order-1 mb-6 sm:mb-0"
            variants={cardVariants}
          >
            <h2 className="text-xl md:text-2xl font-semibold text-center mb-4 sm:text-left sm:mb-6 text-gray-900">
              About Gian Lorenzo Construction
            </h2>
            <p className="text-gray-500/90 mb-1 text-sm text-center sm:text-md sm:text-left">
              Since 2010, Gian Lorenzo Construction & Supplies has been a
              cornerstone in the industry, delivering exceptional projects with
              a focus on quality and client satisfaction.
            </p>
            <p className="text-gray-500/90 mb-4 text-center sm:text-md sm:text-left sm:mb-6">
              Our experienced team ensures every project meets the highest
              standards, delivering from concept to completion, with a
              commitment to safety and innovation.
            </p>
            <div className="space-y-2 sm:space-y-4">
              {[
                { highlight: "High", text: "High quality service" },
                { highlight: "Projects", text: "Multiple projects delivered" },
                {
                  highlight: "Certified",
                  text: "Certified team of professionals",
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="flex items-start sm:flex-row"
                  variants={cardVariants}
                  transition={{ duration: index * 0.1 }}
                >
                  <svg
                    className="w-4 h-4 sm:h-5 sm:w-5 h-4 text-blue-600 mr-2 sm:mr-3 mt-0.5 sm:mt-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <p className="text-gray-600 text-sm sm:text-md">
                    <span className="font-semibold text-gray-800">
                      {item.highlight}
                    </span>{" "}
                    {item.text}
                  </p>
                </motion.div>
              ))}
            </div>
            <Button
              asChild
              size="sm"
              className="mt-4 bg-blue-600 hover:bg-blue-800 rounded-md mx-auto sm:mx-0 sm:mt-6"
            >
              <Link href="/about">Learn More</Link>
            </Button>
          </motion.div>
          <motion.div
            className="w-full sm:w-full md:w-1/2 order-1 sm:order-2 flex justify-center"
            variants={cardVariants}
          >
            <div className="relative w-full max-w-md h-20 rounded-xl overflow-hidden shadow-md sm:h-80">
              <Image
                src="/images/about-team.jpg"
                alt="Our Team"
                fill
                className="object-cover"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
