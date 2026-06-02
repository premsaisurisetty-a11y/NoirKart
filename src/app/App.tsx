import { useState, useEffect } from "react";
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
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  const { cartCount, isAdmin, isLoggedIn, setIsLoginOpen } = useCart();

  // Redirect to home if they log out or lose admin privileges while viewing the admin panel
  useEffect(() => {
    if (currentPage === "admin" && !isAdmin) {
      setCurrentPage("home");
    }
  }, [isAdmin, currentPage]);

  // Resume product view if they just logged in
  useEffect(() => {
    if (isLoggedIn && pendingProduct) {
      setSelectedProduct(pendingProduct);
      setCurrentPage("product");
      setPendingProduct(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [isLoggedIn, pendingProduct]);

  const handleProductClick = (product: Product) => {
    if (!isLoggedIn) {
      setPendingProduct(product);
      setIsLoginOpen(true);
    } else {
      setSelectedProduct(product);
      setCurrentPage("product");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
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
    if (isAdmin) {
      setCurrentPage("admin");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      alert("Access Denied: Only administrators can access the Control Center.");
    }
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
        <ProductPage product={selectedProduct} onBack={handleBackToHome} onProductClick={handleProductClick} />
      )}

      {currentPage === "cart" && <CartPage onBack={handleBackToHome} />}

      {currentPage === "admin" && <AdminPage onBack={handleBackToHome} />}

      <Footer />
    </div>
  );
}

import { HelmetProvider } from 'react-helmet-async';

export default function App() {
  return (
    <HelmetProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </HelmetProvider>
  );
}