import { motion } from "motion/react";
import { Plus, Minus } from "lucide-react";
import { useState } from "react";

export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  rating: number;
  category: string;
  unit?: string;
  originalPrice?: number;
  discount?: string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart, onViewDetails }: ProductCardProps) {
  const [quantity, setQuantity] = useState(0);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuantity(1);
    onAddToCart?.(product);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuantity(quantity + 1);
    onAddToCart?.(product);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity > 0) {
      setQuantity(quantity - 1);
    }
  };

  return (
    <motion.div
      className="blinkit-card p-3 cursor-pointer transition-all hover:shadow-lg"
      whileHover={{ y: -2 }}
      onClick={() => onViewDetails?.(product)}
    >
      <div className="relative mb-3">
        <div className="aspect-square rounded-lg overflow-hidden bg-gray-50">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
        {product.discount && (
          <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
            {product.discount}
          </div>
        )}
        <div className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md">
          <span className="text-xs">⚡ 10 min</span>
        </div>
      </div>

      <div className="mb-2">
        <h3 className="text-sm font-semibold text-gray-800 mb-1 line-clamp-2 leading-tight">
          {product.name}
        </h3>
        <p className="text-xs text-gray-500">{product.unit || "1 unit"}</p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-gray-900">₹{product.price}</span>
            {product.originalPrice && (
              <span className="text-xs text-gray-400 line-through">₹{product.originalPrice}</span>
            )}
          </div>
        </div>

        {quantity === 0 ? (
          <motion.button
            onClick={handleAdd}
            className="bg-white border-2 border-[#0c831f] text-[#0c831f] px-4 py-1.5 rounded-lg font-bold text-sm hover:bg-[#0c831f] hover:text-white transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            ADD
          </motion.button>
        ) : (
          <div className="flex items-center gap-2 bg-[#0c831f] rounded-lg px-2 py-1">
            <motion.button
              onClick={handleDecrement}
              className="text-white p-1"
              whileTap={{ scale: 0.9 }}
            >
              <Minus size={14} />
            </motion.button>
            <span className="text-white font-bold min-w-[20px] text-center text-sm">{quantity}</span>
            <motion.button
              onClick={handleIncrement}
              className="text-white p-1"
              whileTap={{ scale: 0.9 }}
            >
              <Plus size={14} />
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
