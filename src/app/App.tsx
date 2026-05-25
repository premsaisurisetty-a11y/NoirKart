import { useState } from "react";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { HomePage } from "./pages/HomePage";
import { ProductPage } from "./pages/ProductPage";
import { CartPage } from "./pages/CartPage";
import { AdminPage } from "./pages/AdminPage";
import { CartProvider, useCart } from "./context/CartContext";
import { Product } from "./components/ProductCard";

type Page = "home" | "product" | "cart" | "admin";

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

  const handleAdminClick = () => {
    setCurrentPage("admin");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar
        cartCount={cartCount}
        onCartClick={handleCartClick}
        onLogoClick={handleBackToHome}
        onAdminClick={handleAdminClick}
      />

      {currentPage === "home" && (
        <HomePage onProductClick={handleProductClick} onCartClick={handleCartClick} />
      )}

      {currentPage === "product" && selectedProduct && (
        <ProductPage product={selectedProduct} onBack={handleBackToHome} />
      )}

      {currentPage === "cart" && <CartPage onBack={handleBackToHome} />}

      {currentPage === "admin" && <AdminPage onBack={handleBackToHome} />}

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