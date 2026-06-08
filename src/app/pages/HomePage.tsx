import { motion } from "motion/react";
import { ChevronRight, ChevronDown, Search, X, Shield, Sparkles, TrendingUp, Calendar, User, Heart } from "lucide-react";
import { ProductCard, Product } from "../components/ProductCard";
import { useCart } from "../context/CartContext";
import { categories } from "../data/products";
import { useState } from "react";
import { getProductTrustMetadata } from "../lib/trustLayer";
import SEO from "../components/SEO";

interface HomePageProps {
  onProductClick: (product: Product) => void;
  onCartClick: () => void;
}

export function HomePage({ onProductClick }: HomePageProps) {
  const { products, articles } = useCart();
  const [searchQuery, setSearchQuery] = useState("");

  const matchesSearch = (product: Product, query: string): boolean => {
    if (!query.trim()) return true;
    
    const matchedCategory = categories.find(c => c.name.toLowerCase() === query.toLowerCase().trim());
    let searchTerms: string[] = [];

    if (matchedCategory && matchedCategory.keywords) {
      searchTerms = matchedCategory.keywords.map(k => k.toLowerCase());
    } else {
      const q = query.toLowerCase().trim();
      searchTerms = q.split(/\s+/).filter(t => t !== '&' && t !== '|' && t !== 'and');
    }

    const searchFields = [
      product.name,
      product.category,
      product.subCategory || "",
      product.unit || "",
      product.discount || "",
      product.description || "",
      ...(Array.isArray(product.keywords) ? product.keywords : typeof product.keywords === 'string' ? [product.keywords] : [])
    ].join(" ").toLowerCase();

    return searchTerms.some(term => {
      const lowerTerm = term.toLowerCase();
      const singularTerm = lowerTerm.endsWith('s') ? lowerTerm.slice(0, -1) : lowerTerm;
      
      const normalizedSearchFields = searchFields.replace(/[^a-z0-9]/g, '');
      const normalizedLowerTerm = lowerTerm.replace(/[^a-z0-9]/g, '');
      const normalizedSingularTerm = singularTerm.replace(/[^a-z0-9]/g, '');

      try {
        const termRegex = new RegExp(`\\b${lowerTerm}\\b`, 'i');
        const singularRegex = new RegExp(`\\b${singularTerm}\\b`, 'i');
        return (
          termRegex.test(searchFields) ||
          singularRegex.test(searchFields) ||
          normalizedSearchFields.includes(normalizedLowerTerm) ||
          normalizedSearchFields.includes(normalizedSingularTerm)
        );
      } catch (e) {
        return (
          searchFields.includes(lowerTerm) ||
          searchFields.includes(singularTerm) ||
          normalizedSearchFields.includes(normalizedLowerTerm) ||
          normalizedSearchFields.includes(normalizedSingularTerm)
        );
      }
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

  // Authority lists selection
  const featuredDeals = [...mappedProducts]
    .filter(p => p.rating >= 4.8 && p.discount)
    .slice(0, 3);

  const trendingDeals = [...mappedProducts]
    .filter(p => p.rating >= 4.7)
    .slice(3, 7);

  const editorPicks = [...mappedProducts]
    .filter(p => p.rating >= 4.8)
    .slice(5, 9);



  const latestArticles = articles.slice(0, 3);

  const handleReadArticle = (articleId: number) => {
    window.history.pushState(null, "", `?page=blog&article=${articleId}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <SEO 
        title="Premium Curated Deals" 
        description="Discover the finest premium curated deals on electronics, audio, wearables, and accessories in India. Shop with NoirKart for exclusive offers."
        keywords="premium deals, ecommerce india, electronics deals, audio equipment, wearables, noirkart"
      />
      <div className="min-h-screen bg-gray-50 pt-40 md:pt-36">
        {/* Zomato-Style Hero — Bold Red & White */}
        <section className="relative bg-gradient-to-br from-[#E23744] via-[#CB202D] to-[#a01825] pt-40 pb-20 md:pt-44 md:pb-24 text-white -mt-40 md:-mt-36 mb-12 border-b border-red-200 shadow-md">
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
              className="w-full max-w-6xl mb-6 relative px-4 flex items-center gap-2">
              
              {/* Categories Dropdown */}
              <div className="relative group shrink-0 z-50">
                <button className="px-4 py-1.5 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 text-white text-sm font-bold transition-colors backdrop-blur-sm cursor-pointer whitespace-nowrap shadow-sm flex items-center gap-1">
                  Categories <ChevronDown size={14} />
                </button>
                <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 hidden group-hover:block max-h-96 overflow-y-auto text-left z-[100] py-1">
                  {categories.map((cat) => (
                    <button key={cat.id} onClick={() => setSearchQuery(cat.name)} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#E23744] border-b border-gray-50 last:border-none transition-colors cursor-pointer font-medium">
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable Pills */}
              <div className="flex-1 overflow-x-auto scrollbar-hide mask-edges ml-2">
                <div className="flex gap-2 pb-2 px-6 whitespace-nowrap">
                  {categories.filter(c => c.name !== "Bill Payment & Recharges" && c.name !== "All Other Categories").map((cat, i) => (
                    <button key={i} onClick={() => setSearchQuery(cat.name)}
                      className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium transition-colors backdrop-blur-sm cursor-pointer whitespace-nowrap shadow-sm">
                      {cat.name}
                    </button>
                  ))}
                </div>
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

        {/* Main Content Body */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {searchQuery && filteredProducts.length === 0 && (
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center mb-8">
              <p className="text-4xl mb-3">🔍</p>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No results for "{searchQuery}"</h3>
              <p className="text-gray-500 text-sm mb-4">Try a different search term or browse categories above.</p>
              <button onClick={() => setSearchQuery("")} className="text-[#E23744] font-semibold text-sm hover:underline cursor-pointer">Clear search</button>
            </div>
          )}

          {/* Section 1: Featured Deals Showcase [NEW] */}
          {!searchQuery && featuredDeals.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl">🔥</span>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">NoirKart Featured Curation Deals</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {featuredDeals.map((p) => {
                  const { dealScore, recommendationReason } = getProductTrustMetadata(p);
                  return (
                    <div 
                      key={p.id} 
                      onClick={() => onProductClick(p)} 
                      className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                    >
                      <div>
                        <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center p-4 border border-gray-100 mb-4 relative">
                          <img src={p.image} alt={p.name} className="max-w-full max-h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105" />
                          <div className="absolute top-3 left-3 bg-rose-500 text-white font-black text-[9px] px-2.5 py-1 rounded shadow-xs tracking-wider uppercase z-10">
                            ★ Featured Curation
                          </div>
                          <div className="absolute top-3 right-3 bg-white/95 text-rose-600 font-extrabold text-[10px] px-2.5 py-1 rounded-full border border-gray-100 shadow-sm flex items-center gap-1 z-10">
                            🔥 Score: {dealScore}
                          </div>
                        </div>

                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{p.category}</div>
                        <h3 className="font-extrabold text-gray-800 text-base leading-snug tracking-tight mt-1 group-hover:text-[#E23744] transition-colors">{p.name}</h3>
                        
                        <p className="text-xs text-gray-500 italic leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100/50 mt-3">
                          "{recommendationReason}"
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-black text-gray-900">₹{p.price}</span>
                          {p.originalPrice && <span className="text-sm text-gray-400 line-through">₹{p.originalPrice}</span>}
                        </div>
                        <span className="text-[11px] text-[#E23744] font-bold flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                          Inspect Deal <ChevronRight size={14} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Section 2: Trending Today (Flash Vetting) [NEW] */}
          {!searchQuery && trendingDeals.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl">⚡</span>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Trending Deals Today</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {trendingDeals.map((p) => (
                  <ProductCard key={p.id} product={p} onViewDetails={onProductClick} />
                ))}
              </div>
            </section>
          )}

          {/* Section 3: Editor Picks [NEW] */}
          {!searchQuery && editorPicks.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl">🏆</span>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Editor Picks Selection</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {editorPicks.map((p) => (
                  <ProductCard key={p.id} product={p} onViewDetails={onProductClick} />
                ))}
              </div>
            </section>
          )}



          {/* Section 5: Curated Catalog Categories (Existing list) */}
          <div className="border-t border-gray-100 pt-8 mt-4">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-8">Browse Vetted Categories</h2>
            {populatedCategories.map((categoryName) => {
              const categoryProducts = filteredProducts.filter(p => p.category === categoryName);
              if (categoryProducts.length === 0) return null;
              return (
                <section key={categoryName} id={`category-section-${categoryName.toLowerCase()}`} className="mb-12 scroll-mt-44">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800">{categoryName === "Fashion" ? "Fashion & Accessories" : categoryName === "Bags" ? "Bags Under 1000" : categoryName}</h3>
                    <button className="flex items-center gap-1 text-[#E23744] font-semibold text-sm hover:gap-2 transition-all">see all <ChevronRight size={16} /></button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
                    {categoryProducts.slice(0, 6).map((product, index) => (
                      <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                        <ProductCard product={product} onViewDetails={onProductClick} />
                      </motion.div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          {/* Section 6: Latest Blog Curation Reviews [NEW] */}
          {!searchQuery && latestArticles.length > 0 && (
            <section className="mb-12 border-t border-gray-100 pt-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📝</span>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Latest Buying Guides & Reviews</h2>
                </div>
                <button 
                  onClick={() => {
                    window.history.pushState(null, "", "?page=blog");
                    window.dispatchEvent(new PopStateEvent("popstate"));
                  }} 
                  className="text-sm font-bold text-[#E23744] hover:underline cursor-pointer"
                >
                  View All Guides
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {latestArticles.map((article) => (
                  <div 
                    key={article.id} 
                    className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-video w-full bg-gray-100 overflow-hidden border-b border-gray-50">
                        <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-5">
                        <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                          <span className="flex items-center gap-0.5"><Calendar size={12} /> {article.date}</span>
                          <span className="flex items-center gap-0.5"><User size={12} /> {article.author}</span>
                        </div>
                        <h3 className="font-extrabold text-gray-800 text-sm leading-snug line-clamp-2 mb-2 hover:text-[#E23744] transition-colors cursor-pointer"
                            onClick={() => handleReadArticle(article.id)}>
                          {article.title}
                        </h3>
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{article.excerpt}</p>
                      </div>
                    </div>
                    <div className="p-5 pt-0">
                      <button 
                        onClick={() => handleReadArticle(article.id)}
                        className="w-full text-center py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-bold text-gray-700 rounded-xl transition-all cursor-pointer"
                      >
                        Read Full Curation Review →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section 7: Newsletter subscription */}
          <section className="mb-12">
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

          {/* Section 8: Trust cards */}
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
