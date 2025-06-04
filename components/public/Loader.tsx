"use client";

import { useState, useEffect } from "react";
import Lottie from "lottie-react";
import { motion } from "framer-motion";

const captionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2 } },
};

export default function Loader() {
  const [animationData, setAnimationData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/animations/loader.json")
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load loader.json");
        return response.json();
      })
      .then((data) => setAnimationData(data))
      .catch((err) => {
        console.error("Error loading Lottie animation:", err);
        setError(err.message);
      });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      {error ? (
        <div className="text-red-500 text-lg">Error: {error}</div>
      ) : animationData ? (
        <Lottie
          animationData={animationData}
          loop={true}
          style={{ width: 80, height: 80 }}
          rendererSettings={{
            preserveAspectRatio: "xMidYMid slice",
          }}
        />
      ) : (
        <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      )}
      <motion.p
        className="mt-4 text-lg font-helvetica font-semibold text-black"
        variants={captionVariants}
        initial="hidden"
        animate="visible"
      >
        Hang tight, we&apos;re wrestling pixels into place!
      </motion.p>
    </div>
  );
}
