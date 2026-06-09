import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Product } from "../components/ProductCard";
import { featuredProducts } from "../data/products";
import { Article, initialArticles } from "../data/articles";
import { db, isFirebaseConfigured, auth } from "../lib/firebase";
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc, query, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { postProductToPinterest } from "../lib/pinterest";

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

  // Dynamic Blog State
  articles: Article[];
  addArticle: (article: Omit<Article, "id">) => void;
  deleteArticle: (id: number) => void;
  updateArticle: (article: Article) => void;

  // Global Auth State
  isLoggedIn: boolean;
  isAdmin: boolean;
  activeUserEmail: string;
  userName: string;
  loginUser: (email: string, name: string) => void;
  logoutUser: () => void;

  // Login Modal State
  isLoginOpen: boolean;
  setIsLoginOpen: (isOpen: boolean) => void;

  // Analytics State
  analyticsEvents: AnalyticsEvent[];
  trackView: (productId: number) => void;
  trackClick: (productId: number, merchantUrl: string, referrer: string) => void;
}

export interface AnalyticsEvent {
  id: string;
  type: "view" | "click";
  productId: number;
  productName: string;
  productPrice: number;
  category: string;
  timestamp: string;
  merchantUrl?: string;
  referrer?: string;
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
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Analytics Dashboard state (Persisted in LocalStorage & synced with Firebase if configured)
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>(() => {
    const saved = localStorage.getItem("noirkart_analytics");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse local analytics events", e);
      }
    }
    return [];
  });


  // Blog Articles state (Persisted in LocalStorage & synced with Firebase if configured)
  const [articles, setArticles] = useState<Article[]>(() => {
    const saved = localStorage.getItem("noirkart_articles");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse local articles, seeding defaults", e);
      }
    }
    localStorage.setItem("noirkart_articles", JSON.stringify(initialArticles));
    return initialArticles;
  });

  // Monitor Authentication state changes (Firebase Auth with Offline Fallback)
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setIsLoggedIn(true);
          const email = user.email || "";
          setActiveUserEmail(email);
          setUserName(user.displayName || "Premium Member");
          
          if (db) {
            getDoc(doc(db, "admins", email.toLowerCase())).then((docSnap) => {
              setIsAdmin(docSnap.exists() && docSnap.data().role === "admin");
            }).catch((err) => {
              console.error("Firestore admin check failed:", err);
              setIsAdmin(false);
            });
          } else {
            setIsAdmin(false);
          }
        } else {
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
          setIsAdmin(false); // Admin access requires Firebase Firestore verification
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
    
    if (isFirebaseConfigured && db) {
      getDoc(doc(db, "admins", lowercaseEmail)).then((docSnap) => {
        setIsAdmin(docSnap.exists() && docSnap.data().role === "admin");
      }).catch(() => {
        setIsAdmin(false);
      });
    } else {
      setIsAdmin(false); // Admin access requires Firebase Firestore verification
    }
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

        // Non-destructive migration: patch keywords into existing products
        const keywordsMap = new Map<number, string[]>();
        featuredProducts.forEach(fp => {
          if (fp.keywords) keywordsMap.set(fp.id, fp.keywords);
        });

        const patched = parsed.map((p: any) => {
          let updatedP = { ...p };
          if ((!p.keywords || p.keywords.length === 0) && keywordsMap.has(p.id)) {
            updatedP.keywords = keywordsMap.get(p.id);
          }
          if (updatedP.category === "Accessories") {
            updatedP.category = "Bags";
          }
          return updatedP;
        });

        // Always add any missing default products (e.g. newly added Amazon products)
        const existingIds = new Set(patched.map((p: any) => p.id));
        const missing = featuredProducts.filter(fp => !existingIds.has(fp.id));
        const merged = [...patched, ...missing];

        // We check if we modified anything by comparing strings, or just always save to be safe
        if (missing.length > 0 || JSON.stringify(patched) !== JSON.stringify(parsed)) {
          localStorage.setItem("noirkart_products", JSON.stringify(merged));
        }
        return merged;
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
              category: data.category === "Accessories" ? "Bags" : data.category === "Beverages" ? "Cool Drinks" : data.category,
              subCategory: data.subCategory || undefined,
              unit: data.unit,
              image: data.image,
              buyLink: data.buyLink,
              keywords: data.keywords || [],
              description: data.description || ""
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

      const fetchArticles = async () => {
        try {
          const articlesCol = collection(db, "articles");
          const q = query(articlesCol);
          const querySnapshot = await getDocs(q);
          const fetchedArticles: Article[] = [];
          
          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            fetchedArticles.push({
              id: Number(data.id) || docSnap.id,
              title: data.title,
              excerpt: data.excerpt,
              content: data.content || [],
              date: data.date,
              author: data.author,
              productId: Number(data.productId),
              productName: data.productName,
              productPrice: Number(data.productPrice),
              rating: Number(data.rating),
              image: data.image,
              affiliateLink: data.affiliateLink || undefined,
              affiliateLinks: data.affiliateLinks || []
            });
          });

          // Sort by ID descending so newest reviews appear first
          fetchedArticles.sort((a, b) => Number(b.id) - Number(a.id));
          
          setArticles(fetchedArticles);
          localStorage.setItem("noirkart_articles", JSON.stringify(fetchedArticles));
        } catch (error) {
          console.error("Failed to fetch articles from Firebase Firestore:", error);
        }
      };
      
      fetchArticles();

      const fetchAnalytics = async () => {
        try {
          const eventsCol = collection(db, "analytics_events");
          const q = query(eventsCol);
          const querySnapshot = await getDocs(q);
          const fetchedEvents: AnalyticsEvent[] = [];
          
          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            fetchedEvents.push({
              id: docSnap.id,
              type: data.type,
              productId: Number(data.productId),
              productName: data.productName,
              productPrice: Number(data.productPrice),
              category: data.category,
              timestamp: data.timestamp,
              merchantUrl: data.merchantUrl || undefined,
              referrer: data.referrer || undefined
            });
          });
          
          setAnalyticsEvents((prev) => {
            const localMap = new Map(prev.map(e => [e.id, e]));
            fetchedEvents.forEach(e => localMap.set(e.id, e));
            const merged = Array.from(localMap.values());
            merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            localStorage.setItem("noirkart_analytics", JSON.stringify(merged));
            return merged;
          });
        } catch (error) {
          console.error("Failed to fetch analytics events from Firebase Firestore:", error);
        }
      };

      fetchAnalytics();
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
          subCategory: newProduct.subCategory || null,
          unit: newProduct.unit,
          image: newProduct.image,
          buyLink: newProduct.buyLink,
          keywords: newProduct.keywords || [],
          description: newProduct.description || null
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

    // Auto-pin to Pinterest whenever a product is published
    postProductToPinterest(productWithId).catch((err) =>
      console.warn("[NoirKart Pinterest] Auto-pin failed silently:", err)
    );
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
            subCategory: updatedProduct.subCategory || null,
            unit: updatedProduct.unit || null,
            image: updatedProduct.image,
            buyLink: updatedProduct.buyLink,
            keywords: updatedProduct.keywords || [],
            description: updatedProduct.description || null
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

  // Add a review article (syncs with Firebase if configured)
  const addArticle = async (newArticle: Omit<Article, "id">) => {
    const nextId = articles.length > 0 ? Math.max(...articles.map((a) => Number(a.id) || 0)) + 1 : 1;
    const articleWithId: Article = { ...newArticle, id: nextId };

    if (isFirebaseConfigured && db) {
      try {
        const articlesCol = collection(db, "articles");
        await addDoc(articlesCol, {
          id: nextId,
          title: newArticle.title,
          excerpt: newArticle.excerpt,
          content: newArticle.content,
          date: newArticle.date,
          author: newArticle.author,
          productId: newArticle.productId,
          productName: newArticle.productName,
          productPrice: newArticle.productPrice,
          rating: newArticle.rating,
          image: newArticle.image,
          affiliateLink: newArticle.affiliateLink || null,
          affiliateLinks: newArticle.affiliateLinks || []
        });
      } catch (error: any) {
        console.error("Failed to insert article into Firebase:", error);
        alert(
          `Cloud Database Offline/Busy:\n\n` +
          `Failed to sync with Firebase (${error.message}).\n\n` +
          `Your review article has been successfully saved to your local browser storage instead!`
        );
      }
    }

    // Always update local state
    setArticles((prev) => {
      const updated = [articleWithId, ...prev];
      localStorage.setItem("noirkart_articles", JSON.stringify(updated));
      return updated;
    });
  };

  // Delete a review article (syncs with Firebase if configured)
  const deleteArticle = async (id: number) => {
    if (isFirebaseConfigured && db) {
      try {
        const articlesCol = collection(db, "articles");
        const q = query(articlesCol);
        const querySnapshot = await getDocs(q);
        
        let docIdToDelete = "";
        querySnapshot.forEach((docSnap) => {
          if (Number(docSnap.data().id) === id) {
            docIdToDelete = docSnap.id;
          }
        });

        if (docIdToDelete) {
          const docRef = doc(db, "articles", docIdToDelete);
          await deleteDoc(docRef);
        }
      } catch (error: any) {
        console.error("Failed to delete article from Firebase:", error);
        alert(
          `Cloud Database Offline/Busy:\n\n` +
          `Failed to delete from Firebase (${error.message}).\n\n` +
          `Your review article has been successfully removed from local browser storage!`
        );
      }
    }

    // Always update local state
    setArticles((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      localStorage.setItem("noirkart_articles", JSON.stringify(updated));
      return updated;
    });
  };

  // Update a review article (syncs with Firebase if configured)
  const updateArticle = async (updatedArticle: Article) => {
    if (isFirebaseConfigured && db) {
      try {
        const articlesCol = collection(db, "articles");
        const q = query(articlesCol);
        const querySnapshot = await getDocs(q);
        
        let docIdToUpdate = "";
        querySnapshot.forEach((docSnap) => {
          if (Number(docSnap.data().id) === updatedArticle.id) {
            docIdToUpdate = docSnap.id;
          }
        });

        if (docIdToUpdate) {
          const docRef = doc(db, "articles", docIdToUpdate);
          await updateDoc(docRef, {
            title: updatedArticle.title,
            excerpt: updatedArticle.excerpt,
            content: updatedArticle.content,
            date: updatedArticle.date,
            author: updatedArticle.author,
            productId: updatedArticle.productId,
            productName: updatedArticle.productName,
            productPrice: updatedArticle.productPrice,
            rating: updatedArticle.rating,
            image: updatedArticle.image,
            affiliateLink: updatedArticle.affiliateLink || null,
            affiliateLinks: updatedArticle.affiliateLinks || []
          });
        }
      } catch (error: any) {
        console.error("Failed to update article in Firebase:", error);
        alert(
          `Cloud Database Offline/Busy:\n\n` +
          `Failed to sync update with Firebase (${error.message}).\n\n` +
          `Your changes have been successfully saved to your local browser storage instead!`
        );
      }
    }

    // Always update local state
    setArticles((prev) => {
      const updated = prev.map((a) => a.id === updatedArticle.id ? updatedArticle : a);
      localStorage.setItem("noirkart_articles", JSON.stringify(updated));
      return updated;
    });
  };

  const trackView = async (productId: number) => {
    const product = products.find(p => p.id === productId);
    
    const productName = product ? product.name : "Product Page Reference";
    const productPrice = product ? product.price : 0;
    const category = product ? product.category : "Directory Views";

    const newEvent: AnalyticsEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "view",
      productId,
      productName,
      productPrice,
      category,
      timestamp: new Date().toISOString()
    };

    setAnalyticsEvents((prev) => {
      const updated = [newEvent, ...prev].slice(0, 5000);
      localStorage.setItem("noirkart_analytics", JSON.stringify(updated));
      return updated;
    });

    if (isFirebaseConfigured && db) {
      try {
        await addDoc(collection(db, "analytics_events"), {
          type: "view",
          productId,
          productName,
          productPrice,
          category,
          timestamp: newEvent.timestamp
        });
      } catch (err) {
        console.error("Failed to upload view event to Firebase:", err);
      }
    }
  };

  const trackClick = async (productId: number, merchantUrl: string, referrer: string) => {
    const product = products.find(p => p.id === productId);
    
    const productName = product ? product.name : "Vetted Deal Reference Link";
    const productPrice = product ? product.price : 0;
    const category = product ? product.category : "Blog Guide Links";

    const newEvent: AnalyticsEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "click",
      productId,
      productName,
      productPrice,
      category,
      timestamp: new Date().toISOString(),
      merchantUrl,
      referrer
    };

    setAnalyticsEvents((prev) => {
      const updated = [newEvent, ...prev].slice(0, 5000);
      localStorage.setItem("noirkart_analytics", JSON.stringify(updated));
      return updated;
    });

    if (isFirebaseConfigured && db) {
      try {
        await addDoc(collection(db, "analytics_events"), {
          type: "click",
          productId,
          productName,
          productPrice,
          category,
          timestamp: newEvent.timestamp,
          merchantUrl,
          referrer
        });
      } catch (err) {
        console.error("Failed to upload click event to Firebase:", err);
      }
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("data_purged_v2")) {
      setAnalyticsEvents([]);
      localStorage.removeItem("noirkart_analytics");
      if (isFirebaseConfigured && db) {
        const clearDb = async () => {
          try {
            const eventsCol = collection(db, "analytics_events");
            const querySnapshot = await getDocs(eventsCol);
            const deletePromises = querySnapshot.docs.map((docSnap) =>
              deleteDoc(doc(db, "analytics_events", docSnap.id))
            );
            await Promise.all(deletePromises);
          } catch (e) {
            console.error("Failed to purge Firestore events:", e);
          }
        };
        clearDb();
      }
      localStorage.setItem("data_purged_v2", "true");
    }
  }, [isFirebaseConfigured]);

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
        articles,
        addArticle,
        deleteArticle,
        updateArticle,
        isLoggedIn,
        isAdmin,
        activeUserEmail,
        userName,
        loginUser,
        logoutUser,
        isLoginOpen,
        setIsLoginOpen,
        analyticsEvents,
        trackView,
        trackClick,
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



