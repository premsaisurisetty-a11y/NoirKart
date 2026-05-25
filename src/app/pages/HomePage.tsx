import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { ProductCard, Product } from "../components/ProductCard";
import { CategoryCard } from "../components/CategoryCard";
import { useCart } from "../context/CartContext";
import { categories, banners } from "../data/products";
import { useState } from "react";

interface HomePageProps {
  onProductClick: (product: Product) => void;
  onCartClick: () => void;
}

export function HomePage({ onProductClick }: HomePageProps) {
  const { products, addToCart } = useCart();
  const [currentBanner, setCurrentBanner] = useState(0);

  const handleAddToCart = (product: Product) => {
    addToCart(product);
  };

  // Sort populated categories according to their default index in products data,
  // and put any new/custom categories at the end.
  const populatedCategories = Array.from(new Set(products.map(p => p.category)))
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
      // Find dynamic scroll position with navbar offset safety
      const offset = 120; // safe pixel height matching sticky top navigation
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    } else {
      alert(`There are currently no curated "${categoryName}" deals available. Admins can add them from the Control Panel!`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-32 md:pt-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="mb-6">
          <div className="relative rounded-2xl overflow-hidden h-48 md:h-64 bg-gradient-to-r from-blue-500 to-purple-600">
            <motion.div
              key={currentBanner}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <img
                src={banners[currentBanner].image}
                alt={banners[currentBanner].title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
              <div className="absolute inset-0 flex items-center px-8 md:px-12">
                <div className="text-white">
                  <h2 className="text-3xl md:text-5xl font-bold mb-2">{banners[currentBanner].title}</h2>
                  <p className="text-lg md:text-2xl">{banners[currentBanner].subtitle}</p>
                </div>
              </div>
            </motion.div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBanner(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentBanner ? "bg-white w-6" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="mb-8">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Shop by Category</h2>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  name={category.name}
                  image={category.image}
                  onClick={() => scrollToCategory(category.name)}
                />
              ))}
            </div>
          </div>
        </section>

        {populatedCategories.map((categoryName) => {
          const categoryProducts = products.filter(p => p.category === categoryName);
          if (categoryProducts.length === 0) return null;

          return (
            <section 
              key={categoryName} 
              id={`category-section-${categoryName.toLowerCase()}`}
              className="mb-8 scroll-mt-32"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  {categoryName === "Fashion" ? "Fashion & Accessories" : categoryName}
                </h2>
                <button className="flex items-center gap-1 text-[#0c831f] font-semibold text-sm hover:gap-2 transition-all">
                  see all <ChevronRight size={16} />
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
                {categoryProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ProductCard
                      product={product}
                      onAddToCart={handleAddToCart}
                      onViewDetails={onProductClick}
                    />
                  </motion.div>
                ))}
              </div>
            </section>
          );
        })}

        <section className="mb-8">
          <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl p-8 md:p-12 text-white text-center shadow-lg">
            <h2 className="text-2xl md:text-4xl font-bold mb-3">Never Miss a Premium Deal</h2>
            <p className="text-base md:text-lg mb-6 opacity-90">Join our newsletter to receive weekly curations of the web's best offers.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email address"
                className="px-4 py-3 rounded-lg bg-white/95 text-gray-800 focus:outline-none focus:ring-2 focus:ring-white flex-1 text-sm border-none shadow-sm"
              />
              <button className="bg-[#0c831f] hover:bg-[#0a6b1a] text-white px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer shadow-sm">
                Subscribe
              </button>
            </div>
          </div>
        </section>

        <section className="mb-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Why Trust noirkart?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: "🔍",
                title: "Vetted Recommendations",
                description: "Every deal is thoroughly verified and handpicked by our expert catalog curators."
              },
              {
                icon: "🔗",
                title: "Verified Merchant Links",
                description: "All product links point directly to secure official stores and vetted merchants."
              },
              {
                icon: "💎",
                title: "Premium Design Curations",
                description: "We focus on showcasing high-end, top-tier aesthetic products of exceptional quality."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
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
