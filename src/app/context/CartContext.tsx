import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Product } from "../components/ProductCard";
import { featuredProducts } from "../data/products";
import { db, isFirebaseConfigured } from "../lib/firebase";
import { collection, getDocs, addDoc, deleteDoc, doc, query } from "firebase/firestore";

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

  // Product Catalog state (Persisted in LocalStorage & synced with Firebase if configured)
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

  // Sync with Firebase Firestore on mount if configured
  useEffect(() => {
    if (isFirebaseConfigured && db) {
      const fetchProducts = async () => {
        try {
          const productsCol = collection(db, "products");
          const q = query(productsCol);
          const querySnapshot = await getDocs(q);
          const fetchedProducts: Product[] = [];
          
          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            fetchedProducts.push({
              id: Number(data.id) || docSnap.id,
              name: data.name,
              price: Number(data.price),
              originalPrice: data.originalPrice ? Number(data.originalPrice) : undefined,
              discount: data.discount || undefined,
              rating: Number(data.rating),
              category: data.category,
              unit: data.unit,
              image: data.image,
              buyLink: data.buyLink
            });
          });

          // Sort by ID descending so newest appear first
          fetchedProducts.sort((a, b) => Number(b.id) - Number(a.id));
          
          setProducts(fetchedProducts);
          localStorage.setItem("noirkart_products", JSON.stringify(fetchedProducts));
        } catch (error) {
          console.error("Failed to fetch products from Firebase Firestore:", error);
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

  // Add a product to the catalog (syncs with Firebase if configured)
  const addProduct = async (newProduct: Omit<Product, "id">) => {
    const nextId = products.length > 0 ? Math.max(...products.map((p) => Number(p.id) || 0)) + 1 : 1;
    const productWithId: Product = { ...newProduct, id: nextId };

    if (isFirebaseConfigured && db) {
      try {
        const productsCol = collection(db, "products");
        await addDoc(productsCol, {
          id: nextId,
          name: newProduct.name,
          price: newProduct.price,
          originalPrice: newProduct.originalPrice || null,
          discount: newProduct.discount || null,
          rating: newProduct.rating,
          category: newProduct.category,
          unit: newProduct.unit,
          image: newProduct.image,
          buyLink: newProduct.buyLink
        });
        
        setProducts((prev) => {
          const updated = [productWithId, ...prev];
          localStorage.setItem("noirkart_products", JSON.stringify(updated));
          return updated;
        });
        return;
      } catch (error: any) {
        console.error("Failed to insert product into Firebase:", error);
        alert(`Failed to add product to database: ${error.message}`);
        return;
      }
    }

    // LocalStorage Fallback
    setProducts((prev) => {
      const updated = [productWithId, ...prev];
      localStorage.setItem("noirkart_products", JSON.stringify(updated));
      return updated;
    });
  };

  // Delete a product from the catalog (syncs with Firebase if configured)
  const deleteProduct = async (id: number) => {
    if (isFirebaseConfigured && db) {
      try {
        const productsCol = collection(db, "products");
        const q = query(productsCol);
        const querySnapshot = await getDocs(q);
        
        let docIdToDelete = "";
        querySnapshot.forEach((docSnap) => {
          if (Number(docSnap.data().id) === id) {
            docIdToDelete = docSnap.id;
          }
        });

        if (docIdToDelete) {
          const docRef = doc(db, "products", docIdToDelete);
          await deleteDoc(docRef);
        }
      } catch (error: any) {
        console.error("Failed to delete product from Firebase:", error);
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



