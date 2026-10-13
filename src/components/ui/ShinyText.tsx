"use client";

import { motion } from "framer-motion";

interface ShinyTextProps {
  text: string;
  className?: string;
  speed?: number;
}

export function ShinyText({ text, className = "", speed = 3 }: ShinyTextProps) {
  return (
    <motion.span
      className={`inline-block relative overflow-hidden ${className}`}
      style={{
        background: "linear-gradient(120deg, transparent 0%, #fff 20%, transparent 40%)",
        backgroundSize: "200% auto",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}
      animate={{
        backgroundPosition: ["200% center", "-200% center"],
      }}
      transition={{
        repeat: Infinity,
        duration: speed,
        ease: "linear",
      }}
    >
      {text}
    </motion.span>
  );
}
