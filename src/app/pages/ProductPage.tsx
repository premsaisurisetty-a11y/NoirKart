import { motion } from "motion/react";
import { Star, ChevronLeft, Heart } from "lucide-react";
import { Button } from "../components/Button";
import { Product, ProductCard } from "../components/ProductCard";
import { useCart } from "../context/CartContext";
import SEO from "../components/SEO";

interface ProductPageProps { 
  product: Product; 
  onBack: () => void; 
  onProductClick?: (product: Product) => void;
}

export function ProductPage({ product, onBack, onProductClick }: ProductPageProps) {
  const { cart, addToCart, removeFromCart, products } = useCart();
  const isSaved = cart.some((item) => item.id === product.id);
  const handleSave = () => { if (isSaved) removeFromCart(product.id); else addToCart(product); };
  const handleBuy = () => { window.open(product.buyLink || "https://www.amazon.in", "_blank", "noopener,noreferrer"); };
  const relatedProducts = products.filter(p => p.id !== product.id && p.category === product.category).slice(0, 6);

  return (
    <>
      <SEO 
        title={`${product.name} - ₹${product.price}`}
        description={`Buy ${product.name} at ₹${product.price}. Premium ${product.category.toLowerCase()} curated by NoirKart. Discover verified deals and official merchant links.`}
        keywords={product.keywords?.join(", ") || `${product.category}, premium deals, noirkart`}
        image={product.image}
      />
      <div className="min-h-screen bg-gray-50 pt-36 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-[#E23744] mb-6 transition-colors cursor-pointer">
            <ChevronLeft size={20} /> Back to Curated Directory
          </button>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8 border border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 md:p-8">
            <div>
              <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 mb-4 border border-gray-100 flex items-center justify-center p-3">
                <img src={product.image} alt={product.name} className="max-w-full max-h-full object-contain" />
              </div>
              {product.discount && (
                <div className="inline-block bg-[#E23744] text-white px-4 py-1.5 rounded-lg font-bold text-sm shadow">{product.discount}</div>
              )}
            </div>
            <div>
              <div className="inline-block px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">{product.category}</div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">{product.name}</h1>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={18} className={i < Math.floor(product.rating) ? "fill-[#E23744] text-[#E23744]" : "fill-gray-200 text-gray-200"} />
                  ))}
                </div>
                <span className="text-gray-500 text-xs">({product.rating}) • Vetted Product Recommendation</span>
              </div>
              <p className="text-sm text-gray-400 mb-6">{product.unit || "1 unit"}</p>
              <div className="flex items-baseline gap-3 mb-8">
                <span className="text-4xl font-bold text-gray-900">₹{product.price}</span>
                {product.originalPrice && <span className="text-xl text-gray-400 line-through">₹{product.originalPrice}</span>}
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 text-[#E23744] font-semibold mb-2">🔗 Verified Merchant Offer</div>
                <p className="text-xs text-red-800 leading-relaxed">
                  This product is handpicked and available via secure external partners. Clicking below takes you directly to the merchant's secure checkout page.
                </p>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <Button variant="primary" size="lg" className="flex-1 flex items-center justify-center gap-2 font-bold cursor-pointer" onClick={handleBuy}>
                  Buy from Official Store ↗
                </Button>
                <button onClick={handleSave}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${isSaved ? "bg-red-50 border-red-200 text-red-500 hover:bg-red-100" : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700"}`}
                  title={isSaved ? "Remove from Watchlist" : "Save to Watchlist"}>
                  <Heart size={22} className={isSaved ? "fill-red-500" : ""} />
                </button>
              </div>

              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-[#E23744] rounded-full" /><span>100% Handpicked & Vetted Deal</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-[#E23744] rounded-full" /><span>Direct Purchase Link — Secure Payments at Merchant Site</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-[#E23744] rounded-full" /><span>Customer Support Provided Directly by Merchant Store</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mb-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Product Details & Curation Notes</h2>
          <p className="text-gray-600 leading-relaxed text-sm">
            Experience premium quality with this exceptional product. Meticulously selected by the noirkart curation team, it represents the perfect fusion of style, functionality, and outstanding user reviews.
          </p>
        </div>

        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Similar Curations</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
              {relatedProducts.map((rp) => (
                <ProductCard 
                  key={rp.id} 
                  product={rp} 
                  onViewDetails={onProductClick ? onProductClick : onBack} 
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
