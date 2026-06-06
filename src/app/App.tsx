import { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { HomePage } from "./pages/HomePage";
import { ProductPage } from "./pages/ProductPage";
import { CartPage } from "./pages/CartPage";
import { AdminPage } from "./pages/AdminPage";
import { AboutPage } from "./pages/AboutPage";
import { ContactPage } from "./pages/ContactPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { TermsPage } from "./pages/TermsPage";
import { AffiliatePage } from "./pages/AffiliatePage";
import { BlogPage } from "./pages/BlogPage";
import { CartProvider, useCart } from "./context/CartContext";
import { Product } from "./components/ProductCard";

type Page = "home" | "product" | "cart" | "admin" | "about" | "contact" | "privacy" | "terms" | "affiliate" | "blog";

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  const { cartCount, isAdmin, isLoggedIn, setIsLoginOpen, products } = useCart();

  // Initialize Pinterest Tag & Google Analytics dynamically if IDs are provided
  useEffect(() => {
    const tagId = import.meta.env.VITE_PINTEREST_TAG_ID;
    if (tagId) {
      const globalWindow = window as any;
      if (!globalWindow.pintrk) {
        globalWindow.pintrk = function () {
          globalWindow.pintrk.queue.push(Array.prototype.slice.call(arguments));
        };
        const n = globalWindow.pintrk;
        n.queue = [];
        n.version = "3.0";
        const t = document.createElement("script");
        t.async = true;
        t.src = "https://s.pinterest.com/js/pintrk.js";
        const r = document.getElementsByTagName("script")[0];
        r.parentNode?.insertBefore(t, r);
      }
      globalWindow.pintrk('load', tagId);
      globalWindow.pintrk('page');
    }

    const gaId = import.meta.env.VITE_GOOGLE_ANALYTICS_ID;
    if (gaId) {
      const globalWindow = window as any;
      if (!globalWindow.gtag) {
        const s = document.createElement("script");
        s.async = true;
        s.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
        const r = document.getElementsByTagName("script")[0];
        r.parentNode?.insertBefore(s, r);

        globalWindow.dataLayer = globalWindow.dataLayer || [];
        globalWindow.gtag = function () {
          globalWindow.dataLayer.push(arguments);
        };
        globalWindow.gtag("js", new Date());
        globalWindow.gtag("config", gaId);
      }
    }
  }, []);

  // Intercept local page links (?page=) to do client-side SPA routing
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (anchor) {
        const href = anchor.getAttribute("href");
        if (href && (href.startsWith("?page=") || href === "/")) {
          e.preventDefault();
          window.history.pushState(null, "", href);
          // Dispatch popstate event to trigger custom routing
          window.dispatchEvent(new PopStateEvent("popstate"));
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    };
    document.addEventListener("click", handleAnchorClick);
    return () => document.removeEventListener("click", handleAnchorClick);
  }, []);

  // Load page or product from URL query param if present (e.g. ?product=1 or ?page=about)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const productIdStr = params.get("product");
    const pageParam = params.get("page");
    
    if (productIdStr && products.length > 0) {
      const productId = Number(productIdStr);
      const foundProduct = products.find((p) => p.id === productId);
      if (foundProduct) {
        setSelectedProduct(foundProduct);
        setCurrentPage("product");
        return;
      }
    }

    if (pageParam) {
      const validPages: Page[] = ["home", "product", "cart", "admin", "about", "contact", "privacy", "terms", "affiliate", "blog"];
      if (validPages.includes(pageParam as Page)) {
        setCurrentPage(pageParam as Page);
        setSelectedProduct(null);
      }
    }
  }, [products]);

  // Listen for browser Back/Forward navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const productIdStr = params.get("product");
      const pageParam = params.get("page");
      
      if (productIdStr && products.length > 0) {
        const productId = Number(productIdStr);
        const foundProduct = products.find((p) => p.id === productId);
        if (foundProduct) {
          setSelectedProduct(foundProduct);
          setCurrentPage("product");
          return;
        }
      }
      
      if (pageParam) {
        const validPages: Page[] = ["home", "product", "cart", "admin", "about", "contact", "privacy", "terms", "affiliate", "blog"];
        if (validPages.includes(pageParam as Page)) {
          setCurrentPage(pageParam as Page);
          setSelectedProduct(null);
          return;
        }
      }

      setCurrentPage("home");
      setSelectedProduct(null);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [products]);

  // Redirect to home if they log out or lose admin privileges while viewing the admin panel
  useEffect(() => {
    if (currentPage === "admin" && !isAdmin) {
      setCurrentPage("home");
      window.history.pushState(null, "", "/");
    }
  }, [isAdmin, currentPage]);

  // Resume product view if they just logged in
  useEffect(() => {
    if (isLoggedIn && pendingProduct) {
      setSelectedProduct(pendingProduct);
      setCurrentPage("product");
      window.history.pushState(null, "", `?product=${pendingProduct.id}`);
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
      window.history.pushState(null, "", `?product=${product.id}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleCartClick = () => {
    setCurrentPage("cart");
    window.history.pushState(null, "", "/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToHome = () => {
    setCurrentPage("home");
    setSelectedProduct(null);
    window.history.pushState(null, "", "/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAdminClick = () => {
    if (isAdmin) {
      setCurrentPage("admin");
      window.history.pushState(null, "", "/");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      alert("Access Denied: Only administrators can access the Control Center.");
    }
  };

  const handleBlogClick = () => {
    setCurrentPage("blog");
    window.history.pushState(null, "", "?page=blog");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAboutClick = () => {
    setCurrentPage("about");
    window.history.pushState(null, "", "?page=about");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleContactClick = () => {
    setCurrentPage("contact");
    window.history.pushState(null, "", "?page=contact");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar
        cartCount={cartCount}
        onCartClick={handleCartClick}
        onLogoClick={handleBackToHome}
        onAdminClick={handleAdminClick}
        onBlogClick={handleBlogClick}
        onAboutClick={handleAboutClick}
        onContactClick={handleContactClick}
        activePage={currentPage}
      />

      {currentPage === "home" && (
        <HomePage onProductClick={handleProductClick} onCartClick={handleCartClick} />
      )}

      {currentPage === "product" && selectedProduct && (
        <ProductPage product={selectedProduct} onBack={handleBackToHome} onProductClick={handleProductClick} />
      )}

      {currentPage === "cart" && <CartPage onBack={handleBackToHome} />}

      {currentPage === "admin" && <AdminPage onBack={handleBackToHome} />}

      {currentPage === "about" && <AboutPage />}
      {currentPage === "contact" && <ContactPage />}
      {currentPage === "privacy" && <PrivacyPage />}
      {currentPage === "terms" && <TermsPage />}
      {currentPage === "affiliate" && <AffiliatePage />}
      {currentPage === "blog" && <BlogPage />}

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