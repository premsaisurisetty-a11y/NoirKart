import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Product } from "../components/ProductCard";
import { featuredProducts } from "../data/products";
import { db, isFirebaseConfigured, auth } from "../lib/firebase";
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc, query } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

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
  updateProduct: (product: Product) => void;

  // Global Auth State
  isLoggedIn: boolean;
  isAdmin: boolean;
  activeUserEmail: string;
  userName: string;
  loginUser: (email: string, name: string) => void;
  logoutUser: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  // Watchlist (Cart) state
  const [cart, setCart] = useState<CartItem[]>([]);

  // Global Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeUserEmail, setActiveUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // Monitor Authentication state changes (Firebase Auth with Offline Fallback)
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setIsLoggedIn(true);
          const email = user.email || "";
          setActiveUserEmail(email);
          setUserName(user.displayName || (email === "admin@noirkart.com" ? "Admin Manager" : "Premium Member"));
          setIsAdmin(email.toLowerCase() === "admin@noirkart.com");
        } else {
          // If there is an active local admin session in localStorage, do NOT log out!
          const session = localStorage.getItem("noirkart_active_session");
          if (session) {
            try {
              const parsed = JSON.parse(session);
              if (parsed.email.toLowerCase() === "admin@noirkart.com") {
                setIsLoggedIn(true);
                setActiveUserEmail(parsed.email);
                setUserName(parsed.name);
                setIsAdmin(true);
                return;
              }
            } catch (e) {
              console.error("Failed to restore local admin session", e);
            }
          }
          setIsLoggedIn(false);
          setActiveUserEmail("");
          setUserName("");
          setIsAdmin(false);
        }
      });
      return () => unsubscribe();
    } else {
      // Offline/Local session restore
      const session = localStorage.getItem("noirkart_active_session");
      if (session) {
        try {
          const parsed = JSON.parse(session);
          setIsLoggedIn(true);
          setActiveUserEmail(parsed.email);
          setUserName(parsed.name);
          setIsAdmin(parsed.email.toLowerCase() === "admin@noirkart.com");
        } catch (e) {
          console.error("Failed to restore local session", e);
        }
      }
    }
  }, []);

  const loginUser = (email: string, name: string) => {
    setIsLoggedIn(true);
    const lowercaseEmail = email.toLowerCase();
    setActiveUserEmail(lowercaseEmail);
    setUserName(name);
    setIsAdmin(lowercaseEmail === "admin@noirkart.com");
  };

  const logoutUser = () => {
    setIsLoggedIn(false);
    setActiveUserEmail("");
    setUserName("");
    setIsAdmin(false);
    localStorage.removeItem("noirkart_active_session");
  };

  // Product Catalog state (Persisted in LocalStorage & synced with Firebase if configured)
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem("noirkart_products");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration check: If the stored products do not have Grocery or Chocolates categories, reseed to update!
        const hasNewCategories = parsed.some((p: any) => p.category === "Grocery" || p.category === "Chocolates");
        if (hasNewCategories) {
          return parsed;
        }
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
      } catch (error: any) {
        console.error("Failed to insert product into Firebase:", error);
        // Alert but do NOT return so that we still save locally
        alert(
          `Cloud Database Offline/Busy:\n\n` +
          `Failed to sync with Firebase (${error.message}).\n\n` +
          `Your product has been successfully saved to your local browser storage instead!`
        );
      }
    }

    // Always update local state
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
        alert(
          `Cloud Database Offline/Busy:\n\n` +
          `Failed to delete from Firebase (${error.message}).\n\n` +
          `Your product has been successfully removed from local browser storage!`
        );
      }
    }

    // Always update local state
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      localStorage.setItem("noirkart_products", JSON.stringify(updated));
      return updated;
    });
    // Remove from active watchlist if deleted from store catalog
    removeFromCart(id);
  };

  // Update a product in the catalog (syncs with Firebase if configured)
  const updateProduct = async (updatedProduct: Product) => {
    if (isFirebaseConfigured && db) {
      try {
        const productsCol = collection(db, "products");
        const q = query(productsCol);
        const querySnapshot = await getDocs(q);
        
        let docIdToUpdate = "";
        querySnapshot.forEach((docSnap) => {
          if (Number(docSnap.data().id) === updatedProduct.id) {
            docIdToUpdate = docSnap.id;
          }
        });

        if (docIdToUpdate) {
          const docRef = doc(db, "products", docIdToUpdate);
          await updateDoc(docRef, {
            name: updatedProduct.name,
            price: updatedProduct.price,
            originalPrice: updatedProduct.originalPrice || null,
            discount: updatedProduct.discount || null,
            rating: updatedProduct.rating,
            category: updatedProduct.category,
            unit: updatedProduct.unit || null,
            image: updatedProduct.image,
            buyLink: updatedProduct.buyLink
          });
        }
      } catch (error: any) {
        console.error("Failed to update product in Firebase:", error);
        alert(
          `Cloud Database Offline/Busy:\n\n` +
          `Failed to sync update with Firebase (${error.message}).\n\n` +
          `Your changes have been successfully saved to your local browser storage instead!`
        );
      }
    }

    // Always update local state
    setProducts((prev) => {
      const updated = prev.map((p) => p.id === updatedProduct.id ? updatedProduct : p);
      localStorage.setItem("noirkart_products", JSON.stringify(updated));
      return updated;
    });

    // Update watchlist/cart item if saved
    setCart((prev) => 
      prev.map((item) => item.id === updatedProduct.id ? { ...item, ...updatedProduct } : item)
    );
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
        updateProduct,
        isLoggedIn,
        isAdmin,
        activeUserEmail,
        userName,
        loginUser,
        logoutUser,
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



