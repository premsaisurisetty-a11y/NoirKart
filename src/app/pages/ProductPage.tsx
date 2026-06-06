import { motion } from "motion/react";
import { Star, ChevronLeft, Heart } from "lucide-react";
import { useEffect } from "react";
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
  const handleSave = () => { 
    if (isSaved) {
      removeFromCart(product.id);
    } else {
      addToCart(product);
      const globalWindow = window as any;
      if (globalWindow.pintrk) {
        globalWindow.pintrk('track', 'addtocart', {
          value: product.price,
          currency: 'INR',
          line_items: [
            {
              product_id: product.id.toString(),
              product_name: product.name,
              product_price: product.price,
              product_category: product.category
            }
          ]
        });
      }
    }
  };
  const handleBuy = () => { window.open(product.buyLink || "https://www.amazon.in", "_blank", "noopener,noreferrer"); };
  
  useEffect(() => {
    const globalWindow = window as any;
    if (globalWindow.pintrk) {
      globalWindow.pintrk('track', 'pagevisit', {
        line_items: [
          {
            product_id: product.id.toString(),
            product_name: product.name,
            product_price: product.price,
            product_category: product.category
          }
        ]
      });
    }
  }, [product]);
  const shareToPinterest = () => {
    const shareUrl = encodeURIComponent(`https://noirkart.com/?product=${product.id}`);
    const mediaUrl = encodeURIComponent(product.image);
    const description = encodeURIComponent(`Buy ${product.name} at ₹${product.price} on NoirKart!`);
    const pinUrl = `https://www.pinterest.com/pin/create/button/?url=${shareUrl}&media=${mediaUrl}&description=${description}`;
    window.open(pinUrl, "_blank", "noopener,noreferrer");
  };
  const relatedProducts = products.filter(p => p.id !== product.id && p.category === product.category).slice(0, 6);

  return (
    <>
      <SEO 
        title={`${product.name} - ₹${product.price}`}
        description={`Buy ${product.name} at ₹${product.price}. Premium ${product.category.toLowerCase()} curated by NoirKart. Discover verified deals and official merchant links.`}
        keywords={product.keywords?.join(", ") || `${product.category}, premium deals, noirkart`}
        image={product.image}
      />
      <div className="min-h-screen bg-gray-50 pt-44 pb-16">
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
              <div className="inline-block px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">
                {product.category}{product.subCategory ? ` • ${product.subCategory}` : ""}
              </div>
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
                  This product is handpicked and available via secure external partners. As an Amazon Associate, we may earn commissions from qualifying purchases made through our referral links at no additional cost to you.
                </p>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <Button variant="primary" size="lg" className="flex-1 flex items-center justify-center gap-2 font-bold cursor-pointer" onClick={handleBuy}>
                  Buy from Official Store ↗
                </Button>
                <button onClick={shareToPinterest}
                  className="p-3.5 rounded-xl border border-gray-200 text-gray-500 hover:text-[#BD081C] hover:bg-red-50 hover:border-red-100 transition-all cursor-pointer"
                  title="Pin to Pinterest">
                  <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.08 3.16 9.4 7.63 11.16-.1-.95-.2-2.4.04-3.43.22-.93 1.4-5.93 1.4-5.93s-.36-.72-.36-1.77c0-1.66.96-2.9 2.17-2.9 1.02 0 1.52.77 1.52 1.68 0 1.03-.65 2.57-.99 4c-.28 1.19.6 2.16 1.77 2.16 2.12 0 3.76-2.24 3.76-5.47 0-2.86-2.06-4.86-5-4.86-3.4 0-5.4 2.56-5.4 5.2 0 1.03.4 2.14.9 2.74.1.12.1.23.08.34l-.34 1.4c-.06.24-.18.28-.4.18-1.5-.7-2.43-2.9-2.43-4.66 0-3.8 2.76-7.3 7.97-7.3 4.18 0 7.43 2.98 7.43 6.96 0 4.16-2.62 7.5-6.26 7.5-1.22 0-2.37-.63-2.76-1.38l-.75 2.87c-.27 1.04-1.02 2.34-1.5 3.13C10.74 23.83 11.36 24 12 24c6.63 0 12-5.37 12-12S18.63 0 12 0z"/>
                  </svg>
                </button>
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
