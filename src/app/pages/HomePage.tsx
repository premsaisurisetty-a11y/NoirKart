import { motion } from "motion/react";
import { ChevronRight, MapPin, Search } from "lucide-react";
import { ProductCard, Product } from "../components/ProductCard";
import { CategoryCard } from "../components/CategoryCard";
import { useCart } from "../context/CartContext";
import { categories } from "../data/products";
import { useState } from "react";

interface HomePageProps {
  onProductClick: (product: Product) => void;
  onCartClick: () => void;
}

export function HomePage({ onProductClick }: HomePageProps) {
  const { products, addToCart } = useCart();
  const [searchQuery, setSearchQuery] = useState("");

  const handleAddToCart = (product: Product) => { addToCart(product); };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    <div className="min-h-screen bg-gray-50 pt-32 md:pt-28">
      {/* Zomato-Style Hero — Bold Red & White */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#E23744] via-[#CB202D] to-[#a01825] py-20 md:py-24 text-white -mt-32 md:-mt-28 mb-12 border-b border-red-200 shadow-md">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center mt-6">
          <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight md:leading-tight mb-8">
            Curated premium gear. Discover best direct <span className="text-yellow-300">merchant deals</span>. noirkart it!
          </motion.h1>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full max-w-3xl bg-white rounded-2xl p-2 shadow-xl flex flex-col md:flex-row items-center gap-2 border border-gray-200 text-gray-800">
            <div className="flex items-center gap-2.5 px-4 py-2 border-b md:border-b-0 md:border-r border-gray-100 w-full md:w-1/3 text-left relative cursor-pointer group select-none">
              <MapPin className="text-[#E23744] flex-shrink-0" size={20} />
              <div className="flex-1 truncate">
                <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Curation Hub</div>
                <div className="text-sm font-bold text-gray-700 flex items-center gap-1">Delhi NCR, India <span className="text-gray-400 text-[10px]">▼</span></div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 w-full md:w-2/3">
              <Search className="text-gray-400 flex-shrink-0" size={20} />
              <input type="text" placeholder="Search studio headphones, mechanical keyboards, premium watches..."
                className="w-full focus:outline-none text-sm bg-transparent placeholder-gray-400 text-gray-800"
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-16 max-w-5xl">
            {[
              { title: "TECH SHOWCASE", subtitle: "CURATED AUDIO & SHACK", badge: "UP TO 40% OFF", image: "https://images.unsplash.com/photo-1567928513899-997d98489fbd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400", cat: "Electronics" },
              { title: "LUXURY DESIGNS", subtitle: "CHRONOGRAPHS & GEAR", badge: "UP TO 35% OFF", image: "https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400", cat: "Fashion" },
              { title: "WORKSPACE RIGS", subtitle: "DESK & RIG ACCESSORIES", badge: "UP TO 30% OFF", image: "https://images.unsplash.com/photo-1496664444929-8c75efb9546f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400", cat: "Workspace" }
            ].map((card, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }} onClick={() => scrollToCategory(card.cat)}
                className="bg-white rounded-3xl p-5 border border-gray-200 flex items-center justify-between shadow-md hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group text-gray-800">
                <div className="text-left flex-1 pr-3 flex flex-col justify-between h-full">
                  <div>
                    <span className="text-[9px] bg-red-50 text-[#E23744] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider inline-block mb-1.5">{card.badge}</span>
                    <h3 className="text-base font-black text-gray-900 tracking-tight leading-tight uppercase">{card.title}</h3>
                    <p className="text-[10px] text-gray-400 font-bold tracking-wide mt-0.5 leading-snug">{card.subtitle}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#E23744] group-hover:bg-[#CB202D] text-white flex items-center justify-center transition-colors shadow-sm mt-4">
                    <ChevronRight size={16} />
                  </div>
                </div>
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                  <img src={card.image} alt={card.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="mb-8">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Shop by Category</h2>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((category) => (
                <CategoryCard key={category.id} name={category.name} image={category.image} onClick={() => scrollToCategory(category.name)} />
              ))}
            </div>
          </div>
        </section>

        {populatedCategories.map((categoryName) => {
          const categoryProducts = products.filter(p => p.category === categoryName);
          if (categoryProducts.length === 0) return null;
          return (
            <section key={categoryName} id={`category-section-${categoryName.toLowerCase()}`} className="mb-8 scroll-mt-32">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">{categoryName === "Fashion" ? "Fashion & Accessories" : categoryName}</h2>
                <button className="flex items-center gap-1 text-[#E23744] font-semibold text-sm hover:gap-2 transition-all">see all <ChevronRight size={16} /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
                {categoryProducts.map((product, index) => (
                  <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                    <ProductCard product={product} onAddToCart={handleAddToCart} onViewDetails={onProductClick} />
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
  );
}
