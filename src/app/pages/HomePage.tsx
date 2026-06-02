import { motion } from "motion/react";
import { ChevronRight, Search, X } from "lucide-react";
import { ProductCard, Product } from "../components/ProductCard";
import { CategoryCard } from "../components/CategoryCard";
import { useCart } from "../context/CartContext";
import { categories } from "../data/products";
import { useState } from "react";
import SEO from "../components/SEO";

interface HomePageProps {
  onProductClick: (product: Product) => void;
  onCartClick: () => void;
}

export function HomePage({ onProductClick }: HomePageProps) {
  const { products } = useCart();
  const [searchQuery, setSearchQuery] = useState("");

  const matchesSearch = (product: Product, query: string): boolean => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    const searchTerms = q.split(/\s+/).filter(Boolean);

    // Build a searchable text blob for the product
    const searchFields = [
      product.name,
      product.category,
      product.unit || "",
      product.discount || "",
      ...(Array.isArray(product.keywords) ? product.keywords : typeof product.keywords === 'string' ? [product.keywords] : [])
    ].join(" ").toLowerCase();

    // Highly Lenient OR logic: if ANY search term matches, show the product
    return searchTerms.some(term => {
      const singularTerm = term.endsWith('s') ? term.slice(0, -1) : term;
      return searchFields.includes(term) || searchFields.includes(singularTerm) || searchFields.replace(/\s+/g, '').includes(term.replace(/\s+/g, ''));
    });
  };

  const mappedProducts = products.map(p => {
    const categoryName = p.category?.trim().toLowerCase();
    if (categoryName === "accessories") return { ...p, category: "Bags" };
    if (categoryName === "beverages") return { ...p, category: "Cool Drinks" };
    return p;
  });
  const filteredProducts = mappedProducts.filter(p => matchesSearch(p, searchQuery));

  const populatedCategories = Array.from(new Set(filteredProducts.map(p => p.category)))
    .sort((a, b) => {
      const indexA = categories.findIndex(c => c.name === a);
      const indexB = categories.findIndex(c => c.name === b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

  const scrollToCategory = (categoryName: string) => {
    const targetId = `category-section-${categoryName.toLowerCase()}`;
    const element = document.getElementById(targetId);
    if (element) {
      const offset = 120;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      window.scrollTo({ top: elementPosition - offset, behavior: "smooth" });
    } else {
      alert(`No curated "${categoryName}" deals available yet.`);
    }
  };

  return (
    <>
      <SEO 
        title="Premium Curated Deals" 
        description="Discover the finest premium curated deals on electronics, audio, wearables, and accessories in India. Shop with NoirKart for exclusive offers."
        keywords="premium deals, ecommerce india, electronics deals, audio equipment, wearables, noirkart"
      />
      <div className="min-h-screen bg-gray-50 pt-32 md:pt-28">
        {/* Zomato-Style Hero — Bold Red & White */}
      <section className="relative bg-gradient-to-br from-[#E23744] via-[#CB202D] to-[#a01825] pt-32 pb-20 md:pt-36 md:pb-24 text-white -mt-32 md:-mt-28 mb-12 border-b border-red-200 shadow-md">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center mt-12">
          <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight md:leading-tight mb-6">
            Curated premium gear. Discover best direct <span className="text-black">merchant deals</span>. noirkart it!
          </motion.h1>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="w-full max-w-5xl overflow-x-auto scrollbar-hide mb-6 relative mask-edges">
            <div className="flex gap-2 pb-2 px-4 whitespace-nowrap justify-start md:justify-center">
              {[
                "Apparel & Accessories", "Shoes, Luggage & Bags", "Watches", "Beauty",
                "Kitchen", "Furniture", "Home",
                "Grocery", "Amazon Fresh", "Sports", "Automotive", "Health & Personal Care", "Baby Products",
                "Echo & Alexa Devices", "Fire TV Devices",
                "Pet Products", "Mobile Accessories",
                "Books", "Office Products", "Toys",
                "BISS", "Lawn & Garden", "Video Games",
                "Personal Care Appliances",
                "Personal Computers", "Smart Watches", "Televisions", "Electronics", "Large Appliances",
                "Bicycles & Heavy Gym Equipment", "Tyres & Rims",
                "Jewelry", "Data Storage Devices",
                "Mobile Phones"
              ].map((cat, i) => (
                <button key={i} onClick={() => setSearchQuery(cat)}
                  className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium transition-colors backdrop-blur-sm cursor-pointer whitespace-nowrap shadow-sm">
                  {cat}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full max-w-3xl bg-white rounded-2xl p-2 shadow-xl border border-gray-200 text-gray-800 relative z-50">
            <div className="flex items-center gap-3 px-4 py-3 w-full">
              <Search className="text-gray-400 flex-shrink-0" size={22} />
              <input type="text" placeholder="Search headphones, keyboards, watches, fashion..."
                className="w-full focus:outline-none text-sm bg-transparent placeholder-gray-400 text-gray-800"
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600 cursor-pointer flex-shrink-0">
                  <X size={18} />
                </button>
              )}
            </div>

            {searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden text-left z-50 max-h-96 overflow-y-auto">
                {filteredProducts.length > 0 ? (
                  <div className="py-2">
                    <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/80 border-b border-gray-100">
                      Suggestions
                    </div>
                    {filteredProducts.slice(0, 6).map((p) => (
                      <div key={p.id} onClick={() => onProductClick(p)} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors group">
                        <div className="w-12 h-12 bg-white border border-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 p-1 group-hover:border-gray-200">
                          <img src={p.image} alt={p.name} className="max-w-full max-h-full object-contain mix-blend-multiply" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{p.name}</p>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">{p.category} • <span className="text-[#E23744]">₹{p.price}</span></p>
                        </div>
                        <ChevronRight size={16} className="text-gray-300 group-hover:text-[#E23744]" />
                      </div>
                    ))}
                    {filteredProducts.length > 6 && (
                       <div className="px-4 py-3 text-center text-xs font-bold text-[#E23744] bg-red-50/30 hover:bg-red-50 cursor-pointer transition-colors"
                            onClick={() => { const el = document.getElementById('category-section-' + filteredProducts[0].category.toLowerCase()); if(el) el.scrollIntoView({behavior: 'smooth'}); }}>
                         View all {filteredProducts.length} matching products 👇
                       </div>
                    )}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm flex flex-col items-center">
                    <span className="text-3xl mb-2">🔍</span>
                    No matching items found for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </motion.div>


        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">


        {searchQuery && filteredProducts.length === 0 && (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center mb-8">
            <p className="text-4xl mb-3">🔍</p>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No results for "{searchQuery}"</h3>
            <p className="text-gray-500 text-sm mb-4">Try a different search term or browse categories above.</p>
            <button onClick={() => setSearchQuery("")} className="text-[#E23744] font-semibold text-sm hover:underline cursor-pointer">Clear search</button>
          </div>
        )}

        {populatedCategories.map((categoryName) => {
          const categoryProducts = filteredProducts.filter(p => p.category === categoryName);
          if (categoryProducts.length === 0) return null;
          return (
            <section key={categoryName} id={`category-section-${categoryName.toLowerCase()}`} className="mb-8 scroll-mt-32">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">{categoryName === "Fashion" ? "Fashion & Accessories" : categoryName === "Bags" ? "Bags Under 1000" : categoryName}</h2>
                <button className="flex items-center gap-1 text-[#E23744] font-semibold text-sm hover:gap-2 transition-all">see all <ChevronRight size={16} /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
                {categoryProducts.map((product, index) => (
                  <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                    <ProductCard product={product} onViewDetails={onProductClick} />
                  </motion.div>
                ))}
              </div>
            </section>
          );
        })}

        <section className="mb-8">
          <div className="bg-gradient-to-r from-[#E23744] to-[#CB202D] rounded-2xl p-8 md:p-12 text-white text-center shadow-lg">
            <h2 className="text-2xl md:text-4xl font-bold mb-3">Never Miss a Premium Deal</h2>
            <p className="text-base md:text-lg mb-6 opacity-90">Join our newsletter to receive weekly curations of the web's best offers.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <input type="email" placeholder="Enter your email address"
                className="px-4 py-3 rounded-lg bg-white/95 text-gray-800 focus:outline-none focus:ring-2 focus:ring-white flex-1 text-sm border-none shadow-sm" />
              <button className="bg-white hover:bg-gray-100 text-[#E23744] px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer shadow-sm">Subscribe</button>
            </div>
          </div>
        </section>

        <section className="mb-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Why Trust noirkart?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "🔍", title: "Vetted Recommendations", description: "Every deal is thoroughly verified and handpicked by our expert catalog curators." },
              { icon: "🔗", title: "Verified Merchant Links", description: "All product links point directly to secure official stores and vetted merchants." },
              { icon: "💎", title: "Premium Design Curations", description: "We focus on showcasing high-end, top-tier aesthetic products of exceptional quality." }
            ].map((feature, index) => (
              <motion.div key={index} className="text-center" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
                <div className="text-5xl mb-3">{feature.icon}</div>
                <h3 className="font-bold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
    </>
  );
}
