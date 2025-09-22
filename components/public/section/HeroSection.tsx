"use client";

import { motion, Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import Image from "next/image";
import { NumberTicker } from "@/components/ui/magicui/number-ticker";
import Link from "next/link";

// Import Geist font (assuming you have it set up in your project)

const sectionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 1.2, ease: "easeOut" },
  },
};

const textContainerVariants: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 1.2,
      delay: 0.3,
      ease: "easeOut",
      staggerChildren: 0.3,
    },
  },
};

const textItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

const carouselVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 1, delay: 0.6, ease: "easeOut" },
  },
};

const carouselImages = [
  "/images/interior_1.jpeg",
  "/images/interior_2.jpeg",
  "/images/interior_3.jpeg",
  "/images/interior_4.jpeg",
];

// Project names mapping
const projectNames = ["Living Room", "Bedroom", "Kitchen", "Bathroom"];

export default function CTASection() {
  return (
    <motion.section
      className={`relative w-full bg-white overflow-hidden py-16 md:py-24`}
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Left Column - Content */}
          <motion.div
            className="space-y-8"
            variants={textContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {/* Best Company Badge */}
            <motion.div variants={textItemVariants}>
              <span className="inline-block bg-gray-100 rounded-full px-5 py-3 text-sm font-bold text-gray-800 leading-tight">
                <Sparkles className="w-6 h-6 inline-block mr-2 text-yellow-500" />
                Best Construction Company in Kabankalan
              </span>
            </motion.div>
            <motion.h2
              className="text-4xl md:text-5xl font-bold text-gray-900"
              variants={textItemVariants}
            >
              Ready to Start Your{" "}
              <span className="text-orange-500">Dream House?</span>
            </motion.h2>

            <motion.p
              className="text-lg text-gray-600 leading-tight font-medium"
              variants={textItemVariants}
            >
              Browse our portfolio of stunning home designs and discover the
              perfect style for your dream home.
            </motion.p>

            <motion.div className="space-y-4" variants={textItemVariants}>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-gray-700">
                  Free consultation and estimate
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-gray-700">
                  Expert guidance and support
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-gray-700">Flexible payment options</span>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col w-full sm:flex-row gap-4"
              variants={textItemVariants}
            >
              <Link href="/catalog">
                <Button className="bg-orange-500 hover:bg-orange-600 rounded-lg py-3 px-6 text-white font-semibold text-base">
                  Explore Our Catalog
                </Button>
              </Link>
            </motion.div>

            {/* Stats Section */}
            <motion.div
              className="grid grid-cols-3 gap-4 pt-6"
              variants={textItemVariants}
            >
              <Card className="text-center p-4 border-1 shadow-none">
                <CardContent className="p-0">
                  <p className="text-xs font-medium text-gray-600 mt-1">
                    Projects Built
                  </p>
                  <div className="text-2xl font-bold text-orange-500">
                    <NumberTicker value={250} />
                    <span className="text-lg">+</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="text-center p-4 border-1 shadow-none">
                <CardContent className="p-0">
                  <p className="text-xs font-medium text-gray-600 mt-1">
                    Designs Created
                  </p>
                  <div className="text-2xl font-bold text-orange-500">
                    <NumberTicker value={120} />
                    <span className="text-lg">+</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="text-center p-4 border-1 shadow-none">
                <CardContent className="p-0">
                  <p className="text-xs font-medium text-gray-600 mt-1">
                    Happy Customers
                  </p>
                  <div className="text-2xl font-bold text-orange-500">
                    <NumberTicker value={180} />
                    <span className="text-lg">+</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Right Column - Carousel with Card Design */}
          <motion.div
            className="flex justify-end lg:justify-end"
            variants={carouselVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="w-full max-w-sm">
              {/* Carousel Header */}
              <div className="mb-6 text-center lg:text-left leading-tight">
                <h3 className="text-2xl font-bold text-orange-500">
                  Check out our latest!
                </h3>
                <p className="text-gray-600 tracking-tight font-semibold text-sm">
                  Explore our latest interior designs
                </p>
              </div>

              <Carousel
                className="w-full"
                opts={{
                  align: "start",
                  loop: true,
                }}
              >
                <CarouselContent className="-ml-4">
                  {carouselImages.map((image, index) => (
                    <CarouselItem key={index} className="pl-4 basis-4/5">
                      <Card className="max-w-sm overflow-hidden transition-all duration-300 border shadow-none p-0 gap-0">
                        <CardContent className="p-0 relative">
                          {/* Image Container */}
                          <div className="relative h-72 w-full overflow-hidden">
                            <Image
                              src={image}
                              alt={`${projectNames[index]} Project`}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 75vw, (max-width: 1200px) 30vw, 35vw"
                              priority={index === 0}
                            />
                          </div>
                        </CardContent>

                        {/* Card Footer with Reduced Padding */}
                        <CardFooter className="bg-white p-4">
                          <div className="flex items-center justify-between w-full">
                            <div>
                              <h3 className="font-semibold text-lg text-foreground">
                                {projectNames[index]}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Modern Luxury Design
                              </p>
                            </div>
                            {/* Arrow Up-Right Icon with color */}
                            <button className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                              <ArrowUpRight className="text-primary w-6 h-6" />
                            </button>
                          </div>
                        </CardFooter>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="flex gap-2 mt-6 justify-start">
                  {/* Previous button with blue color */}
                  <CarouselPrevious className="relative static transform-none bg-orange-500 text-white hover:bg-primary/80 hover:text-white w-7 h-7 cursor-pointer shadow-md" />

                  {/* Next button with blue color */}
                  <CarouselNext className="relative static transform-none bg-orange-500 text-white hover:bg-primary/80 hover:text-white w-7 h-7 cursor-pointer shadow-md" />
                </div>
              </Carousel>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
