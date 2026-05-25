import { createContext, useContext, useState, ReactNode } from "react";
import { Product } from "../components/ProductCard";
import { featuredProducts } from "../data/products";

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  
  // Dynamic Product Catalog State
  products: Product[];
  addProduct: (product: Omit<Product, "id">) => void;
  deleteProduct: (id: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  // Watchlist (Cart) state
  const [cart, setCart] = useState<CartItem[]>([]);

  // Product Catalog state (Persisted in LocalStorage)
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem("noirkart_products");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse local products, seeding defaults", e);
      }
    }
    // Seed defaults
    localStorage.setItem("noirkart_products", JSON.stringify(featuredProducts));
    return featuredProducts;
  });

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);
      if (existingItem) {
        return prev; // Already in watchlist, no-op
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity: 1 } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // Add a product to the catalog
  const addProduct = (newProduct: Omit<Product, "id">) => {
    setProducts((prev) => {
      const nextId = prev.length > 0 ? Math.max(...prev.map((p) => p.id)) + 1 : 1;
      const productWithId: Product = { ...newProduct, id: nextId };
      const updated = [productWithId, ...prev];
      localStorage.setItem("noirkart_products", JSON.stringify(updated));
      return updated;
    });
  };

  // Delete a product from the catalog
  const deleteProduct = (id: number) => {
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      localStorage.setItem("noirkart_products", JSON.stringify(updated));
      return updated;
    });
    // Remove from active watchlist if deleted from store catalog
    removeFromCart(id);
  };

  const cartTotal = cart.reduce(
    (total, item) => total + item.price,
    0
  );

  const cartCount = cart.length;

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        products,
        addProduct,
        deleteProduct,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}

