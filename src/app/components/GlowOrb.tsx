import { motion } from "motion/react";

interface GlowOrbProps {
  size?: number;
  color?: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  delay?: number;
}

export function GlowOrb({
  size = 400,
  color = "#FFD400",
  top,
  left,
  right,
  bottom,
  delay = 0
}: GlowOrbProps) {
  const position: Record<string, string> = {};
  if (top) position.top = top;
  if (left) position.left = left;
  if (right) position.right = right;
  if (bottom) position.bottom = bottom;

  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`,
        filter: "blur(60px)",
        ...position
      }}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        delay,
        ease: "easeInOut"
      }}
    />
  );
}
