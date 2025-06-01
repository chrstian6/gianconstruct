import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

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

export default function CTASection() {
  return (
    <motion.section
      className="py-6 bg-blue-50 flex justify-center sm:py-16"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <div className="container mx-auto px-4 text-center sm:max-w-6xl">
        <motion.h2
          className="text-xl font-bold mb-4 text-gray-900 sm:text-2xl sm:mb-6 md:text-3xl"
          variants={cardVariants}
        >
          Start Your Project Today
        </motion.h2>
        <motion.p
          className="text-gray-500/90 mb-6 max-w-md mx-auto sm:text-md sm:mb-8 md:max-w-xl"
          variants={cardVariants}
        >
          Get a free consultation and estimate. Let’s bring your vision to life
          with our expert team.
        </motion.p>
        <motion.form
          className="flex flex-col gap-3 justify-center max-w-md mx-auto sm:flex-row sm:gap-4"
          variants={cardVariants}
        >
          <Input
            type="email"
            placeholder="Enter your email"
            className="bg-white border-gray-300 rounded-md"
          />
          <Button className="bg-blue-600 hover:bg-blue-800 rounded-md">
            Get Started
          </Button>
        </motion.form>
      </div>
    </motion.section>
  );
}
