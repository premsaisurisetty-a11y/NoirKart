import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ChevronLeft, Calendar, User, ArrowRight, Star } from "lucide-react";
import SEO from "../components/SEO";
import { useCart } from "../context/CartContext";
import { Article } from "../data/articles";

export function BlogPage() {
  const { articles } = useCart();
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);

  // Parse query parameter ?article=ID on load and popstate
  useEffect(() => {
    const handleParamCheck = () => {
      const params = new URLSearchParams(window.location.search);
      const articleIdStr = params.get("article");
      if (articleIdStr) {
        setSelectedArticleId(Number(articleIdStr));
      } else {
        setSelectedArticleId(null);
      }
    };
    handleParamCheck();
    window.addEventListener("popstate", handleParamCheck);
    return () => window.removeEventListener("popstate", handleParamCheck);
  }, []);

  const navigateToArticle = (id: number | null) => {
    if (id) {
      window.history.pushState(null, "", `?page=blog&article=${id}`);
    } else {
      window.history.pushState(null, "", "?page=blog");
    }
    // Dispatch popstate event to trigger custom state updates
    window.dispatchEvent(new PopStateEvent("popstate"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectedArticle = articles.find((a) => a.id === selectedArticleId);

  return (
    <>
      <SEO 
        title={selectedArticle ? selectedArticle.title : "Product Review Blog"}
        description="Read in-depth reviews of curated premium lifestyle, audio, tech, and grocery products on the NoirKart blog."
      />
      <div className="min-h-screen bg-gray-50 pt-36 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {selectedArticle ? (
            /* Article Details View */
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100"
            >
              <div className="p-6 md:p-10">
                <button 
                  onClick={() => navigateToArticle(null)}
                  className="flex items-center gap-2 text-gray-500 hover:text-[#E23744] mb-6 transition-colors cursor-pointer text-sm font-semibold"
                >
                  <ChevronLeft size={18} /> Back to Product Reviews
                </button>

                <div className="aspect-video w-full rounded-xl overflow-hidden bg-gray-100 mb-6 border border-gray-100">
                  <img src={selectedArticle.image} alt={selectedArticle.title} className="w-full h-full object-cover" />
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mb-4 font-semibold uppercase tracking-wider">
                  <span className="flex items-center gap-1"><Calendar size={14} /> {selectedArticle.date}</span>
                  <span className="flex items-center gap-1"><User size={14} /> By {selectedArticle.author}</span>
                  <span className="text-[#E23744]">★ Vetted Review ({selectedArticle.rating}/5)</span>
                </div>

                <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">
                  {selectedArticle.title}
                </h1>

                <div className="space-y-6 text-sm md:text-base text-gray-600 leading-relaxed text-left border-t border-gray-50 pt-6">
                  {selectedArticle.content.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>

                <div className="mt-8 pt-8 border-t border-gray-100 bg-red-50/30 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{selectedArticle.productName}</h3>
                    <p className="text-xs text-gray-500 mt-1">Curated Price: <span className="text-[#E23744] font-bold text-sm">₹{selectedArticle.productPrice}</span></p>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                    <a 
                      href={`/?product=${selectedArticle.productId}`}
                      className="flex-1 md:flex-none px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg text-center transition-colors cursor-pointer"
                    >
                      View Details
                    </a>
                    <a 
                      href={selectedArticle.affiliateLink || `/?product=${selectedArticle.productId}`}
                      target={selectedArticle.affiliateLink ? "_blank" : undefined}
                      rel={selectedArticle.affiliateLink ? "noopener noreferrer" : undefined}
                      className="flex-1 md:flex-none px-5 py-2.5 bg-[#E23744] hover:bg-[#CB202D] text-white text-xs font-bold rounded-lg text-center transition-colors cursor-pointer"
                    >
                      Buy Deal ↗
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Articles List Grid */
            <div>
              <a href="/" className="flex items-center gap-2 text-gray-600 hover:text-[#E23744] mb-6 transition-colors cursor-pointer w-fit font-medium text-sm">
                <ChevronLeft size={20} /> Back to Curated Directory
              </a>

              <div className="text-center mb-10">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">Vetted Product Reviews</h1>
                <p className="text-sm text-gray-500 max-w-xl mx-auto leading-relaxed">
                  Honest, deep-dive review articles outlining specifications, pros, cons, and direct secure merchant purchase links.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {articles.map((article) => (
                  <motion.div 
                    key={article.id}
                    whileHover={{ y: -4 }}
                    className="bg-white rounded-2xl shadow-xs overflow-hidden border border-gray-100 flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-video w-full overflow-hidden bg-gray-100 border-b border-gray-50">
                        <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-6">
                        <div className="flex items-center gap-3 text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wider">
                          <span>{article.date}</span>
                          <span>•</span>
                          <span className="text-[#E23744]">★ {article.rating}</span>
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 mb-2 leading-snug line-clamp-2 hover:text-[#E23744] transition-colors">
                          {article.title}
                        </h2>
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                          {article.excerpt}
                        </p>
                      </div>
                    </div>
                    
                    <div className="px-6 pb-6 pt-2">
                      <button 
                        onClick={() => navigateToArticle(article.id)}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-gray-200 hover:border-[#E23744] rounded-xl hover:bg-red-50/30 text-xs font-bold text-gray-700 hover:text-[#E23744] transition-all cursor-pointer"
                      >
                        Read Full Review <ArrowRight size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
