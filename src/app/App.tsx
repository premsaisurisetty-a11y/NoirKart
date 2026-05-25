import { useState } from "react";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { HomePage } from "./pages/HomePage";
import { ProductPage } from "./pages/ProductPage";
import { CartPage } from "./pages/CartPage";
import { CartProvider, useCart } from "./context/CartContext";
import { Product } from "./components/ProductCard";

type Page = "home" | "product" | "cart";

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { cartCount } = useCart();

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setCurrentPage("product");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCartClick = () => {
    setCurrentPage("cart");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToHome = () => {
    setCurrentPage("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar
        cartCount={cartCount}
        onCartClick={handleCartClick}
        onLogoClick={handleBackToHome}
      />

      {currentPage === "home" && (
        <HomePage onProductClick={handleProductClick} onCartClick={handleCartClick} />
      )}

      {currentPage === "product" && selectedProduct && (
        <ProductPage product={selectedProduct} onBack={handleBackToHome} />
      )}

      {currentPage === "cart" && <CartPage onBack={handleBackToHome} />}

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <AppContent />
    </CartProvider>
  );
}