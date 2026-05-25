import { motion } from "motion/react";
import { Star, ShoppingCart, ChevronLeft, Plus, Minus } from "lucide-react";
import { Button } from "../components/Button";
import { Product, ProductCard } from "../components/ProductCard";
import { useCart } from "../context/CartContext";
import { featuredProducts } from "../data/products";
import { useState } from "react";

interface ProductPageProps {
  product: Product;
  onBack: () => void;
}

export function ProductPage({ product, onBack }: ProductPageProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  const relatedProducts = featuredProducts.filter(p => p.id !== product.id && p.category === product.category).slice(0, 6);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-[#0c831f] mb-6 transition-colors"
        >
          <ChevronLeft size={20} />
          Back
        </button>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 md:p-8">
            <div>
              <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 mb-4">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {product.discount && (
                <div className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">
                  {product.discount}
                </div>
              )}
            </div>

            <div>
              <div className="inline-block px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600 mb-3">
                {product.category}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{product.name}</h1>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={18}
                      className={i < Math.floor(product.rating) ? "fill-[#ffd400] text-[#ffd400]" : "fill-gray-200 text-gray-200"}
                    />
                  ))}
                </div>
                <span className="text-gray-600 text-sm">({product.rating}) • 127 reviews</span>
              </div>

              <p className="text-sm text-gray-500 mb-6">{product.unit}</p>

              <div className="flex items-baseline gap-3 mb-8">
                <span className="text-4xl font-bold text-gray-900">₹{product.price}</span>
                {product.originalPrice && (
                  <span className="text-xl text-gray-400 line-through">₹{product.originalPrice}</span>
                )}
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
                  ⚡ Delivery in 10 minutes
                </div>
                <p className="text-sm text-gray-600">Free delivery on orders above ₹99</p>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-3 bg-gray-100 rounded-xl px-4 py-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="text-gray-600 hover:text-[#0c831f]"
                  >
                    <Minus size={20} />
                  </button>
                  <span className="font-bold text-gray-900 min-w-[40px] text-center text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="text-gray-600 hover:text-[#0c831f]"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <Button variant="primary" size="lg" className="flex-1 flex items-center justify-center gap-2" onClick={handleAddToCart}>
                  <ShoppingCart size={20} />
                  Add to Cart
                </Button>
              </div>

              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#0c831f] rounded-full" />
                  <span>100% Quality Assured</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#0c831f] rounded-full" />
                  <span>Easy Returns & Refunds</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#0c831f] rounded-full" />
                  <span>Secure Payments</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Product Details</h2>
          <p className="text-gray-600 leading-relaxed">
            Experience premium quality with this exceptional product. Meticulously crafted with attention
            to every detail, it represents the perfect fusion of style, functionality, and innovation.
            Designed for those who refuse to compromise on quality, this product delivers outstanding
            performance while maintaining an elegant aesthetic.
          </p>
        </div>

        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Similar Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct.id}
                  product={relatedProduct}
                  onAddToCart={addToCart}
                  onViewDetails={() => {}}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
