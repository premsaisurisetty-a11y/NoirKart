import { motion } from "motion/react";
import { Trash2, ShoppingBag, ChevronLeft, ExternalLink, Info } from "lucide-react";
import { Button } from "../components/Button";
import { useCart } from "../context/CartContext";
import SEO from "../components/SEO";

interface CartPageProps { onBack: () => void; }

export function CartPage({ onBack }: CartPageProps) {
  const { cart, removeFromCart, cartTotal, clearCart } = useCart();

  const handleOpenAll = () => {
    if (cart.length === 0) return;
    alert(`Opening ${cart.length} verified deals in new browser tabs!`);
    cart.forEach(item => { window.open(item.buyLink || "https://www.amazon.in", "_blank", "noopener,noreferrer"); });
  };

  const handleBuySingle = (url?: string) => { window.open(url || "https://www.amazon.in", "_blank", "noopener,noreferrer"); };

  if (cart.length === 0) {
    return (
      <>
        <SEO 
          title="My Watchlist" 
          description="View your saved premium curated deals on NoirKart."
        />
        <div className="min-h-screen bg-gray-50 pt-44 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-white rounded-2xl shadow-sm p-12 border border-gray-100">
              <ShoppingBag className="mx-auto mb-6 text-gray-300" size={80} />
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Your Watchlist is Empty</h2>
              <p className="text-gray-500 mb-8">Save premium handpicked deals to compare and track them here.</p>
              <Button variant="primary" size="lg" onClick={onBack} className="cursor-pointer">Explore Premium Curations</Button>
            </div>
          </motion.div>
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      <SEO 
        title="My Watchlist" 
        description={`View your ${cart.length} saved premium curated deals on NoirKart.`}
      />
      <div className="min-h-screen bg-gray-50 pt-44 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-[#E23744] mb-6 transition-colors cursor-pointer">
            <ChevronLeft size={20} /> Back to Directory
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">My Saved Deals</h1>
          <p className="text-gray-500 mb-8">Compare and visit official merchant stores to purchase your shortlisted items.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item, index) => (
              <motion.div key={item.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <div className="flex gap-4 items-center w-full sm:w-auto">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                      {item.category}{item.subCategory ? ` • ${item.subCategory}` : ""}
                    </span>
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 text-base">{item.name}</h3>
                    <p className="text-xs text-gray-400">{item.unit || "1 unit"}</p>
                    <span className="text-base font-bold text-gray-900 mt-2 block">₹{item.price}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
                  <button onClick={() => handleBuySingle(item.buyLink)}
                    className="flex items-center gap-1.5 bg-[#E23744] hover:bg-[#CB202D] text-white py-2 px-4 rounded-lg font-semibold text-xs transition-colors cursor-pointer shadow-xs">
                    View Offer <ExternalLink size={14} />
                  </button>
                  <button onClick={() => removeFromCart(item.id)}
                    className="p-2.5 rounded-lg border border-gray-100 hover:border-red-100 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer" title="Remove deal">
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
            <button onClick={clearCart} className="text-xs text-red-500 hover:text-red-600 transition-colors flex items-center gap-1.5 cursor-pointer mt-4">
              <Trash2 size={14} /> Clear Saved Deals Watchlist
            </button>
          </div>

          <div className="lg:col-span-1">
            <motion.div className="bg-white rounded-xl shadow-sm p-6 sticky top-44 border border-gray-100" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Watchlist Summary</h2>
              <div className="space-y-3 mb-6 pb-4 border-b border-gray-100">
                <div className="flex justify-between text-sm text-gray-500"><span>Saved Deals</span><span className="font-semibold text-gray-800">{cart.length} items</span></div>
                <div className="flex justify-between text-sm text-gray-500"><span>Total Est. Value</span><span className="font-semibold text-gray-800">₹{cartTotal.toFixed(0)}</span></div>
              </div>
              <Button variant="primary" size="lg" className="w-full mb-4 font-bold flex items-center justify-center gap-2 cursor-pointer" onClick={handleOpenAll}>Open All Links ↗</Button>
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-xs text-red-800 space-y-2 mb-6">
                <div className="flex gap-2 items-start font-semibold text-red-900"><Info size={16} className="flex-shrink-0 mt-0.5" /><span>External Purchases</span></div>
                <p className="leading-relaxed">noirkart does not take payments or handle delivery. You will complete your purchases securely on the respective merchant store websites.</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-[10px] text-gray-500 leading-relaxed border border-gray-100">
                <span className="font-bold text-gray-700 block mb-1">Affiliate & Commission Notice</span>
                If you purchase a product through one of our curated external deals, we may receive a small affiliate commission from the merchant platform. This is at absolutely no extra cost to you!
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
