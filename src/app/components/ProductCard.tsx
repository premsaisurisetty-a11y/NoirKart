import { motion } from "motion/react";
import { Heart } from "lucide-react";
import { useCart } from "../context/CartContext";
import { getProductTrustMetadata } from "../lib/trustLayer";

export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  rating: number;
  category: string;
  subCategory?: string;
  unit?: string;
  originalPrice?: number;
  discount?: string;
  buyLink?: string;
  keywords?: string[];
  description?: string;
}

interface ProductCardProps {
  product: Product;
  onViewDetails?: (product: Product) => void;
}

export function ProductCard({ product, onViewDetails }: ProductCardProps) {
  const { cart, addToCart, removeFromCart } = useCart();
  const isSaved = cart.some((item) => item.id === product.id);
  const { dealScore, isEditorsChoice } = getProductTrustMetadata(product);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaved) { removeFromCart(product.id); } else { addToCart(product); }
  };

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewDetails?.(product);
  };

  return (
    <motion.div
      className="bg-white p-3 cursor-pointer transition-all hover:shadow-lg flex flex-col justify-between h-full rounded-xl border border-gray-100 relative"
      whileHover={{ y: -4 }}
      onClick={() => onViewDetails?.(product)}
    >
      <div>
        <div className="relative mb-3">
          <div className="aspect-square rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center p-1.5">
            <img src={product.image} alt={product.name} className="max-w-full max-h-full object-contain transition-transform duration-500 hover:scale-105" />
          </div>
          {isEditorsChoice ? (
            <div className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black text-[9px] font-black px-2 py-0.5 rounded shadow-sm z-10">
              🏆 EDITOR'S CHOICE
            </div>
          ) : product.discount ? (
            <div className="absolute top-2 left-2 bg-[#E23744] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
              {product.discount}
            </div>
          ) : null}

          {isEditorsChoice && product.discount && (
            <div className="absolute bottom-2 left-2 bg-[#E23744] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow z-10">
              {product.discount}
            </div>
          )}

          <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-xs rounded-full px-2 py-0.5 shadow-sm border border-gray-100">
            <span className="text-[10px] font-semibold text-gray-700 flex items-center gap-1">🔗 Deal</span>
          </div>
        </div>
        <div className="mb-2">
          <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-gray-400">
            <span>{product.category}{product.subCategory ? ` • ${product.subCategory}` : ""}</span>
          </div>
          <h3 className="text-sm font-semibold text-gray-800 mt-0.5 mb-1 line-clamp-2 leading-snug min-h-[40px]">{product.name}</h3>
          
          <div className="flex items-center justify-between mt-1 text-[11px] font-semibold text-gray-500">
            <span className="flex items-center gap-0.5 text-amber-500 font-bold">★ {product.rating}</span>
            <span className="text-rose-600 flex items-center gap-0.5 font-bold">🔥 Deal: {dealScore}/100</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">{product.unit || "1 unit"}</p>
        </div>
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-gray-900">₹{product.price}</span>
            {product.originalPrice && <span className="text-xs text-gray-400 line-through">₹{product.originalPrice}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleBuy}
            className="flex-1 bg-[#E23744] hover:bg-[#CB202D] text-white py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-xs hover:shadow-md cursor-pointer">
            Read Review & Buy →
          </button>
          <button onClick={handleSave}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${isSaved ? "bg-red-50 border-red-200 text-red-500 hover:bg-red-100" : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700"}`}
            title={isSaved ? "Remove from Watchlist" : "Save Deal"}>
            <Heart size={16} className={isSaved ? "fill-red-500" : ""} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
