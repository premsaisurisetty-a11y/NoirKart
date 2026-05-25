import { motion } from "motion/react";

interface CategoryCardProps {
  name: string;
  image: string;
  onClick?: () => void;
}

export function CategoryCard({ name, image, onClick }: CategoryCardProps) {
  return (
    <motion.div
      className="flex-shrink-0 cursor-pointer"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <div className="w-24 text-center">
        <div className="w-20 h-20 mx-auto mb-2 rounded-full overflow-hidden bg-gray-100 border-2 border-white shadow-md">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
        <p className="text-xs font-semibold text-gray-700 leading-tight">{name}</p>
      </div>
    </motion.div>
  );
}
