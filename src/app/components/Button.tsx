import { motion } from "motion/react";
import { type ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  onClick,
  className = "",
  type = "button"
}: ButtonProps) {
  const baseStyles = "font-semibold transition-all duration-200 rounded-lg";

  const variants = {
    primary: "bg-[#0c831f] text-white hover:bg-[#0a6b1a]",
    secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    outline: "bg-white border-2 border-[#0c831f] text-[#0c831f] hover:bg-green-50"
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-2.5 text-base",
    lg: "px-8 py-3 text-base"
  };

  return (
    <motion.button
      type={type}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </motion.button>
  );
}
