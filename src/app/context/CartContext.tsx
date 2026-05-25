import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Product } from "../components/ProductCard";
import { featuredProducts } from "../data/products";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

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

  // Product Catalog state (Persisted in LocalStorage & synced with Supabase if configured)
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

  // Sync with Supabase on mount if configured
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      const fetchProducts = async () => {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("id", { ascending: false });

        if (error) {
          console.error("Failed to fetch products from Supabase:", error);
        } else if (data) {
          // Format standard Supabase column names
          const formattedProducts: Product[] = data.map((row: any) => ({
            id: row.id,
            name: row.name,
            price: Number(row.price),
            originalPrice: row.original_price ? Number(row.original_price) : undefined,
            discount: row.discount,
            rating: Number(row.rating),
            category: row.category,
            unit: row.unit,
            image: row.image,
            buyLink: row.buy_link
          }));
          setProducts(formattedProducts);
          localStorage.setItem("noirkart_products", JSON.stringify(formattedProducts));
        }
      };

      fetchProducts();
    }
  }, []);

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

  // Add a product to the catalog (syncs with Supabase if configured)
  const addProduct = async (newProduct: Omit<Product, "id">) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("products")
        .insert([{
          name: newProduct.name,
          price: newProduct.price,
          original_price: newProduct.originalPrice,
          discount: newProduct.discount,
          rating: newProduct.rating,
          category: newProduct.category,
          unit: newProduct.unit,
          image: newProduct.image,
          buy_link: newProduct.buyLink
        }])
        .select();

      if (error) {
        console.error("Failed to insert product into Supabase:", error);
        alert(`Failed to add product to database: ${error.message}`);
        return;
      }
      
      if (data && data[0]) {
        const insertedRow = data[0];
        const productWithId: Product = {
          id: insertedRow.id,
          name: insertedRow.name,
          price: Number(insertedRow.price),
          originalPrice: insertedRow.original_price ? Number(insertedRow.original_price) : undefined,
          discount: insertedRow.discount,
          rating: Number(insertedRow.rating),
          category: insertedRow.category,
          unit: insertedRow.unit,
          image: insertedRow.image,
          buyLink: insertedRow.buy_link
        };
        setProducts((prev) => {
          const updated = [productWithId, ...prev];
          localStorage.setItem("noirkart_products", JSON.stringify(updated));
          return updated;
        });
        return;
      }
    }

    // LocalStorage Fallback
    setProducts((prev) => {
      const nextId = prev.length > 0 ? Math.max(...prev.map((p) => p.id)) + 1 : 1;
      const productWithId: Product = { ...newProduct, id: nextId };
      const updated = [productWithId, ...prev];
      localStorage.setItem("noirkart_products", JSON.stringify(updated));
      return updated;
    });
  };

  // Delete a product from the catalog (syncs with Supabase if configured)
  const deleteProduct = async (id: number) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Failed to delete product from Supabase:", error);
        alert(`Failed to delete product from database: ${error.message}`);
        return;
      }
    }

    // Update local state
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


