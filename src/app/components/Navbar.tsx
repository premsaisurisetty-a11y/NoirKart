import { motion } from "motion/react";
import { ShoppingCart, Search, MapPin, User, ChevronDown } from "lucide-react";
import { useState } from "react";

interface NavbarProps {
  cartCount?: number;
  onCartClick?: () => void;
  onLogoClick?: () => void;
}

export function Navbar({ cartCount = 0, onCartClick, onLogoClick }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <motion.div
              className="flex items-center cursor-pointer"
              whileHover={{ scale: 1.02 }}
              onClick={onLogoClick}
            >
              <h1 className="text-2xl font-bold text-[#0c831f]">PREM NEXUS</h1>
            </motion.div>

            <div className="hidden md:flex items-center gap-2 text-sm">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                <MapPin size={18} className="text-[#0c831f]" />
                <div className="text-left">
                  <div className="text-xs text-gray-500">Delivery in 10 minutes</div>
                  <div className="font-semibold text-gray-800 flex items-center gap-1">
                    Select Location <ChevronDown size={14} />
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-xl mx-8 hidden md:block">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder='Search "headphones"'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0c831f] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              <User size={20} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-800">Login</span>
            </button>

            <motion.button
              className="relative p-3 rounded-lg bg-[#0c831f] hover:bg-[#0a6b1a] transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCartClick}
            >
              <ShoppingCart className="text-white" size={22} />
              {cartCount > 0 && (
                <motion.span
                  className="absolute -top-1 -right-1 bg-[#ffd400] text-gray-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  {cartCount}
                </motion.span>
              )}
            </motion.button>
          </div>
        </div>

        <div className="md:hidden pb-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c831f]"
            />
          </div>
        </div>
      </div>

      <div className="bg-gradient-green">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-2 text-white text-sm font-semibold">
            ⚡ Free delivery on orders above ₹99
          </div>
        </div>
      </div>
    </nav>
  );
}
