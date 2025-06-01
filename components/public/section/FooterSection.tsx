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

export default function FooterSection() {
  return (
    <motion.footer
      className="bg-gray-900 text-white py-6 flex justify-center sm:py-12"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <div className="container mx-auto px-4 sm:max-w-6xl">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 md:grid-cols-4">
          <motion.div variants={cardVariants}>
            <Image
              src="/logo-white.png"
              alt="Gian Lorenzo Construction"
              width={140}
              height={50}
              className="h-8 w-auto mb-3 mx-auto sm:h-10 sm:mb-4 sm:mx-auto md:mx-0"
            />
            <p className="text-gray-100/70 text-xs text-center sm:text-sm sm:text-left md sm:text-left">
              Building excellence since 2010. Quality construction and supplies
              for all your needs.
            </p>
          </motion.div>
          <motion.div variants={cardVariants}>
            <h4 className="font-semibold text-md mb-3 text-center sm:text-left sm:mb-4 sm:text-lg">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {[
                { href: "/", label: "Home" },
                { href: "/#about", label: "About" },
                { href: "/#services", label: "Services" },
                { href: "/projects", label: "Projects" },
                { href: "/supplies", label: "Supplies" },
              ].map((link, index) => (
                <motion.li
                  key={index}
                  variants={cardVariants}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={link.href}
                    className="text-gray-100/70 hover:text-white text-xs sm:text-sm block text-center transition-colors duration-200 sm:text-left"
                  >
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>
          <motion.div variants={cardVariants}>
            <h4 className="font-semibold text-md mb-3 text-center sm:text-left sm:mb-4 sm:text-lg">
              Services
            </h4>
            <ul className="space-y-2">
              {[
                {
                  href: "/services/residential",
                  label: "Residential Construction",
                },
                {
                  href: "/services/commercial",
                  label: "Commercial Construction",
                },
                { href: "/services/renovation", label: "Renovation" },
                { href: "/services/design", label: "Design Services" },
              ].map((link, index) => (
                <motion.li
                  key={index}
                  variants={cardVariants}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={link.href}
                    className="text-gray-100/70 hover:text-white text-xs sm:text-sm block text-center sm:text-left transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>
          <motion.div variants={cardVariants}>
            <h4 className="font-semibold text-md mb-3 text-center sm:text-left sm:mb-4 sm:text-lg">
              Contact Us
            </h4>
            <address className="not-italic text-gray-100/70 text-xs text-center sm:text-left sm:text-sm">
              <p className="mb-1 sm:mb-2">Sola St. Barangay 2</p>
              <p className="mb-1 sm:mb-2">
                Kabankalan City, Negros Occidental 6111
              </p>
              <p className="mb-1 sm:mb-2">Phone: (+63) 945-123-4567</p>
              <p className="mb-1 sm:mb-2">
                Email: info@gianlorenzoconstruction.com
              </p>
            </address>
          </motion.div>
        </div>
        <motion.div
          className="border-t border-gray-800/50 mt-6 pt-6 text-center text-gray-100/50 sm:mt-12 sm:pt-8 sm:text-sm"
          variants={cardVariants}
        >
          <p>
            © 2025 Gian Lorenzo Construction & Supplies. All rights reserved.
          </p>
        </motion.div>
      </div>
    </motion.footer>
  );
}
