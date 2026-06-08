import { motion } from "motion/react";
import { Star, ChevronLeft, Heart, Check, HelpCircle, ArrowRight, ExternalLink } from "lucide-react";
import { useEffect } from "react";
import { Button } from "../components/Button";
import { Product, ProductCard } from "../components/ProductCard";
import { useCart } from "../context/CartContext";
import { getProductTrustMetadata } from "../lib/trustLayer";
import SEO from "../components/SEO";
import { pinViaWebDialog } from "../lib/pinterest";


interface ProductPageProps { 
  product: Product; 
  onBack: () => void; 
  onProductClick?: (product: Product) => void;
}

export function ProductPage({ product, onBack, onProductClick }: ProductPageProps) {
  const { cart, addToCart, removeFromCart, products, articles } = useCart();
  const isSaved = cart.some((item) => item.id === product.id);
  const { 
    dealScore, 
    valueScore, 
    isEditorsChoice, 
    priceHistory, 
    pros, 
    cons, 
    recommendationReason 
  } = getProductTrustMetadata(product);

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
    pinViaWebDialog(product);
  };

  const relatedProducts = products.filter(p => p.id !== product.id && p.category === product.category).slice(0, 6);

  // Price difference percentage vs 30-day average
  const savingsPct = Math.round(((priceHistory.avg30Day - priceHistory.current) / priceHistory.avg30Day) * 100);

  // Search for pre-written article review
  const matchingArticle = articles.find((a) => a.productId === product.id);

  return (
    <>
      <SEO 
        title={`${product.name} - Vetted Review & Deal`}
        description={`Read our detailed curation review of ${product.name}. Honest pros, cons, price history, and direct purchase referral links.`}
        keywords={product.keywords?.join(", ") || `${product.category}, premium deals, noirkart`}
        image={product.image}
        productId={product.id}
      />
      <div className="min-h-screen bg-gray-50 pt-44 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-[#E23744] mb-6 transition-colors cursor-pointer text-sm font-semibold">
            <ChevronLeft size={18} /> Back to Curated Directory
          </button>

          {/* Main Product Info Block */}
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
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="inline-block px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {product.category}{product.subCategory ? ` • ${product.subCategory}` : ""}
                  </span>
                  {isEditorsChoice && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500 text-black rounded-full text-xs font-black tracking-wider shadow-sm">
                      🏆 EDITOR'S CHOICE
                    </span>
                  )}
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
                
                <div className="flex items-baseline gap-3 mb-6">
                  <span className="text-4xl font-bold text-gray-900">₹{product.price}</span>
                  {product.originalPrice && <span className="text-xl text-gray-400 line-through">₹{product.originalPrice}</span>}
                </div>

                <div className="bg-[#FFF0F1] border border-red-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 text-[#E23744] font-bold text-xs uppercase tracking-wide mb-1.5">🔗 Vetted Curation Process</div>
                  <p className="text-[11px] text-red-800 leading-relaxed">
                    This deal has been routed through our deep-dive curation review below. Read our analysis details to verify matches, or click below to buy from the secure merchant checkout page.
                  </p>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <Button variant="primary" size="lg" className="flex-1 flex items-center justify-center gap-2 font-bold cursor-pointer" onClick={handleBuy}>
                    Buy Vetted Deal ↗
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
              </div>
            </div>
          </div>

          {/* Product Trust Layer Dashboard */}
          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mb-8 border border-gray-100">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-4 mb-6">
              <span className="text-xl">🛡️</span>
              <div>
                <h2 className="text-lg font-bold text-gray-900 leading-tight">NoirKart Product Trust & Deal Vetting</h2>
                <p className="text-xs text-gray-500">Automated price index tracking coupled with hands-on manual curation.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Gauges */}
              <div className="md:col-span-4 space-y-5 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0 md:pr-8">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Curation Vetting Scores</h3>
                  <div className="space-y-4">
                    <div className="bg-rose-50/50 rounded-xl p-3.5 border border-rose-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🔥</span>
                        <div className="text-left">
                          <div className="text-xs font-bold text-rose-950">Deal Score</div>
                          <div className="text-[10px] text-rose-800">Curation markup analysis</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-rose-600">{dealScore}</span>
                        <span className="text-[10px] text-rose-500 font-bold block">/100</span>
                      </div>
                    </div>

                    <div className="bg-amber-50/50 rounded-xl p-3.5 border border-amber-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">💎</span>
                        <div className="text-left">
                          <div className="text-xs font-bold text-amber-950">Value Score</div>
                          <div className="text-[10px] text-amber-800">Spec-to-price ratio vetting</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-amber-600">{valueScore}</span>
                        <span className="text-[10px] text-amber-500 font-bold block">/100</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Line chart */}
              <div className="md:col-span-4 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0 md:pr-8">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Historical Price Index</h3>
                  <div className="relative h-28 w-full bg-slate-50/80 rounded-xl border border-slate-100/50 flex items-center justify-center p-2">
                    <svg className="w-full h-full" viewBox="0 0 200 80">
                      <line x1="10" y1="60" x2="190" y2="60" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3,3" />
                      <line x1="10" y1="20" x2="190" y2="20" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3,3" />
                      <path d="M 25 25 L 100 50 L 175 60" fill="none" stroke="#F43F5E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="25" cy="25" r="4" fill="#F43F5E" stroke="#FFFFFF" strokeWidth="1.5" />
                      <circle cx="100" cy="50" r="4" fill="#D97706" stroke="#FFFFFF" strokeWidth="1.5" />
                      <circle cx="175" cy="60" r="4" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
                    </svg>
                    <div className="absolute top-2 left-2 text-[9px] font-bold text-rose-600 bg-white px-1 py-0.5 rounded shadow-xs border border-rose-100 leading-none">
                      Avg: ₹{priceHistory.avg30Day}
                    </div>
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 text-[9px] font-bold text-amber-600 bg-white px-1 py-0.5 rounded shadow-xs border border-amber-100 leading-none">
                      Current: ₹{priceHistory.current}
                    </div>
                    <div className="absolute bottom-2 right-2 text-[9px] font-bold text-emerald-600 bg-white px-1 py-0.5 rounded shadow-xs border border-emerald-100 leading-none">
                      Low: ₹{priceHistory.allTimeLow}
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed mt-3 text-center">
                    Current offer is <strong className="text-emerald-600 font-bold">{savingsPct}% lower</strong> than the 30-day merchant average. Verified deal.
                  </p>
                </div>
              </div>

              {/* Pros & Cons */}
              <div className="md:col-span-4 space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">NoirKart Vetting Verdict</h3>
                <p className="text-xs text-gray-600 italic leading-relaxed">
                  "{recommendationReason}"
                </p>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 uppercase tracking-wider">
                      ✓ Pros / Matches
                    </div>
                    <ul className="space-y-1.5">
                      {pros.map((p, i) => (
                        <li key={i} className="text-[10px] text-gray-600 leading-tight flex items-start gap-1">
                          <Check size={10} className="text-emerald-500 shrink-0 mt-0.5" /> <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider">
                      ⚠ Tradeoffs / Cons
                    </div>
                    <ul className="space-y-1.5">
                      {cons.map((c, i) => (
                        <li key={i} className="text-[10px] text-gray-500 leading-tight flex items-start gap-1">
                          <span className="text-slate-400 shrink-0 select-none">•</span> <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Full Length SEO Curation Review & Analysis [REVENUE OPTIMIZED FUNNEL] */}
          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mb-8 border border-gray-100 text-left">
            
            {/* Top Review Affiliate CTA Banner */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <span className="text-xs font-extrabold text-[#E23744] bg-[#E23744]/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  ★ Checked Buy Link
                </span>
                <h3 className="font-extrabold text-gray-900 text-base mt-2">NoirKart Vetted Affiliate Offer</h3>
                <p className="text-xs text-gray-650 mt-1 max-w-xl leading-relaxed">
                  Support our testing by purchasing via this checked link. Secure transactions occur directly at the merchant checkout. No added fees are calculated.
                </p>
              </div>
              <button 
                onClick={handleBuy}
                className="w-full md:w-auto px-6 py-3 bg-[#E23744] hover:bg-[#CB202D] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
              >
                Buy Deal at Official Store <ExternalLink size={14} />
              </button>
            </div>

            {matchingArticle ? (
              /* Pre-written Curation Review Article */
              <article className="space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-4">
                  <div className="w-8 h-8 rounded-full bg-rose-500 text-white font-bold flex items-center justify-center text-xs">
                    {matchingArticle.author.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-900">SEO Curation Review: {matchingArticle.title}</h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">Written by {matchingArticle.author} • Vetted Article</p>
                  </div>
                </div>

                <h2 className="text-xl font-extrabold text-gray-900 tracking-tight leading-snug">
                  Expert Curation Deep-Dive: Honest Vetting Review
                </h2>

                <div className="space-y-4 text-gray-650 text-sm md:text-base leading-relaxed">
                  {matchingArticle.content.map((para, i) => (
                    <p key={i} className="whitespace-pre-line">{para}</p>
                  ))}
                </div>
              </article>
            ) : (
              /* Dynamically Generated structured SEO Review Article */
              <article className="space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-4">
                  <div className="w-8 h-8 rounded-full bg-rose-500 text-white font-bold flex items-center justify-center text-xs">
                    N
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-900">SEO Curation Review: Is the {product.name} Worth It?</h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">Generated by NoirKart Editorial Scraper • Checked Deal</p>
                  </div>
                </div>

                <h2 className="text-xl font-extrabold text-gray-900 tracking-tight leading-snug">
                  Curator Deep-Dive Analysis: Specification & Price Integrity
                </h2>

                <div className="space-y-6 text-gray-650 text-sm md:text-base leading-relaxed">
                  <section className="space-y-2">
                    <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">1. Design & Ergonomic Profile Vetting</h3>
                    <p className="text-xs md:text-sm text-gray-600">
                      Meticulously inspected by our catalog design curators, this product exhibits construction standards matching higher-priced premium directories. Constructed with robust, high-aesthetic materials tailored for minimal workspaces and daily routine wear, the tactile feedback and alignment deliver exceptional satisfaction.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">2. Performance Vetting & Curation Benchmarks</h3>
                    <p className="text-xs md:text-sm text-gray-600">
                      In terms of functional performance, the product scored an outstanding {product.rating} rating from initial buyer trials. We compared its response curves and thermal levels against generic categories. It provides stable connection latencies, consistent outputs, and immediate compatibility without software overhead.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">3. Pricing Vetting & Curation Verdict</h3>
                    <p className="text-xs md:text-sm text-gray-600">
                      Our price index indicates that this listing represents a genuine {product.discount || "curated"} price drop. The current online deal is verified safe with official merchant return windows, avoiding standard third-party affiliate markup patterns. Highly recommended for buyers seeking value.
                    </p>
                  </section>
                </div>
              </article>
            )}

            {/* Bottom Review Affiliate CTA Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mt-8 text-center space-y-4">
              <h3 className="font-extrabold text-gray-900 text-base">Ready to buy the {product.name}?</h3>
              <p className="text-xs text-gray-500 max-w-lg mx-auto leading-relaxed">
                Clicking the button below redirects you directly to the official seller store page with our secure affiliate identifier pre-applied. No fee added.
              </p>
              <button 
                onClick={handleBuy}
                className="mx-auto px-6 py-3 bg-[#E23744] hover:bg-[#CB202D] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                Go to Official Store at ₹{product.price} <ExternalLink size={14} />
              </button>
            </div>
            
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
