import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Trash2, Edit, PlusCircle, ShoppingBag, DollarSign, List, ShieldCheck, CheckCircle2, UploadCloud, X, Loader2, Sparkles, Wand2, AlertCircle, Zap, ChevronDown, ChevronUp, Link as LinkIcon, FileText, CheckCheck, XCircle, Eye, Coins, Users, Settings, AlertTriangle } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { AnalyticsDashboard } from "../components/AnalyticsDashboard";
import { storage, isFirebaseConfigured } from "../lib/firebase";
import { generateProductWithAI, generateProductFromAmazonLink, isAmazonUrl, isGeminiConfigured, bulkGenerateProducts, BulkItem } from "../lib/gemini";
import { sanitizeText, sanitizeUrl, validateUrl, validatePrice } from "../lib/sanitize";

// Helper function to compress images before uploading to prevent cloud errors and large Base64 Firestore payloads
const compressImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

interface AdminPageProps {
  onBack: () => void;
}

export function AdminPage({ onBack }: AdminPageProps) {
  const { 
    products, 
    addProduct, 
    deleteProduct, 
    updateProduct, 
    cart,
    articles,
    addArticle,
    deleteArticle,
    updateArticle,
    analyticsEvents,
    adminApproveClaim,
    adminRejectClaim,
    adminApproveRedemption,
    adminRejectRedemption,
    adminAdjustBalance,
    adminToggleFreeze,
    adminSetRules,
    adminGetAllData
  } = useCart();

  // Form State
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [category, setCategory] = useState("Electronics");
  const [subCategory, setSubCategory] = useState("");
  const [unit, setUnit] = useState("1 piece");
  const [rating, setRating] = useState("4.8");
  const [image, setImage] = useState("");
  const [buyLink, setBuyLink] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Blog Form State
  const [activeTab, setActiveTab] = useState<"products" | "blog" | "analytics" | "rewards">("products");
  const [editingArticleId, setEditingArticleId] = useState<number | null>(null);
  const [articleTitle, setArticleTitle] = useState("");
  const [articleExcerpt, setArticleExcerpt] = useState("");
  const [articleContent, setArticleContent] = useState("");
  const [articleDate, setArticleDate] = useState(() => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  });
  const [articleAuthor, setArticleAuthor] = useState("Admin Manager");
  const [articleProductId, setArticleProductId] = useState<number>(0);
  const [articleAffiliateLink, setArticleAffiliateLink] = useState("");
  const [articleAffiliateLinks, setArticleAffiliateLinks] = useState<{ label: string; url: string; }[]>([]);
  const [articleImage, setArticleImage] = useState("");
  const [articlePrice, setArticlePrice] = useState("");
  const [articleRating, setArticleRating] = useState("4.8");
  const [articlePreviewUrl, setArticlePreviewUrl] = useState("");
  const [articleUploading, setArticleUploading] = useState(false);
  const [articleUploadProgress, setArticleUploadProgress] = useState(0);

  const handleProductSelectionChange = (prodId: number) => {
    setArticleProductId(prodId);
    const selectedProd = products.find(p => p.id === prodId);
    if (selectedProd) {
      setArticlePrice(selectedProd.price.toString());
      setArticleRating(selectedProd.rating.toString());
      setArticleImage(selectedProd.image);
      setArticlePreviewUrl(selectedProd.image);
      setArticleAffiliateLink(selectedProd.buyLink || "");
    }
  };

  const handleBlogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleTitle || !articleExcerpt || !articleContent) {
      alert("Please fill in all required fields (Title, Excerpt, Content).");
      return;
    }

    const selectedProd = products.find(p => p.id === articleProductId);
    const productName = selectedProd ? selectedProd.name : "";
    const finalPrice = articlePrice ? parseFloat(articlePrice) : (selectedProd ? selectedProd.price : 0);
    const finalRating = articleRating ? parseFloat(articleRating) : (selectedProd ? selectedProd.rating : 4.8);
    const finalImage = articleImage || (selectedProd ? selectedProd.image : "");

    // Clean and filter multiple affiliate links
    const finalAffiliateLinks = articleAffiliateLinks
      .filter(l => l.url.trim().length > 0)
      .map(l => ({ label: l.label.trim() || "Buy Deal", url: l.url.trim() }));

    const primaryAffiliateLink = finalAffiliateLinks.length > 0 
      ? finalAffiliateLinks[0].url 
      : (articleAffiliateLink.trim() || undefined);

    // Split content by paragraphs (double newlines)
    const contentParagraphs = articleContent
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    if (editingArticleId !== null) {
      updateArticle({
        id: editingArticleId,
        title: articleTitle,
        excerpt: articleExcerpt,
        content: contentParagraphs,
        date: articleDate,
        author: articleAuthor,
        productId: articleProductId,
        productName,
        productPrice: finalPrice,
        rating: finalRating,
        image: finalImage,
        affiliateLink: primaryAffiliateLink,
        affiliateLinks: finalAffiliateLinks
      });
      triggerToast(`Review article "${articleTitle}" updated successfully!`);
      setEditingArticleId(null);
    } else {
      addArticle({
        title: articleTitle,
        excerpt: articleExcerpt,
        content: contentParagraphs,
        date: articleDate,
        author: articleAuthor,
        productId: articleProductId,
        productName,
        productPrice: finalPrice,
        rating: finalRating,
        image: finalImage,
        affiliateLink: primaryAffiliateLink,
        affiliateLinks: finalAffiliateLinks
      });
      triggerToast(`Review article "${articleTitle}" published successfully!`);
    }

    // Reset Form
    setArticleTitle("");
    setArticleExcerpt("");
    setArticleContent("");
    setArticleProductId(0);
    setArticleAffiliateLink("");
    setArticleAffiliateLinks([]);
    setArticleImage("");
    setArticlePreviewUrl("");
    setArticlePrice("");
    setArticleRating("4.8");
    setArticleDate(() => {
      const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date().toLocaleDateString('en-US', options);
    });
  };

  const handleEditArticle = (art: any) => {
    setEditingArticleId(art.id);
    setArticleTitle(art.title);
    setArticleExcerpt(art.excerpt);
    setArticleContent(art.content.join("\n\n"));
    setArticleDate(art.date);
    setArticleAuthor(art.author);
    setArticleProductId(art.productId);
    setArticleAffiliateLink(art.affiliateLink || "");
    setArticleAffiliateLinks(art.affiliateLinks || (art.affiliateLink ? [{ label: "Buy Deal", url: art.affiliateLink }] : []));
    setArticleImage(art.image);
    setArticlePreviewUrl(art.image);
    setArticlePrice(art.productPrice.toString());
    setArticleRating(art.rating.toString());
    
    // Smooth scroll up to the form
    window.scrollTo({ top: 180, behavior: "smooth" });
  };

  const handleCancelEditArticle = () => {
    setEditingArticleId(null);
    setArticleTitle("");
    setArticleExcerpt("");
    setArticleContent("");
    setArticleProductId(0);
    setArticleAffiliateLink("");
    setArticleAffiliateLinks([]);
    setArticleImage("");
    setArticlePreviewUrl("");
    setArticlePrice("");
    setArticleRating("4.8");
  };

  const handleDeleteArticle = (id: number, title: string) => {
    if (confirm(`Are you sure you want to delete the review article "${title}"?`)) {
      if (editingArticleId === id) {
        handleCancelEditArticle();
      }
      deleteArticle(id);
      triggerToast(`Review article "${title}" removed.`);
    }
  };

  const handleArticleImageUpload = async (rawFile: File) => {
    if (!rawFile.type.startsWith("image/")) {
      alert("Invalid file format. Please upload an image file.");
      return;
    }
    setArticleUploading(true);
    setArticleUploadProgress(0);

    const localUrl = URL.createObjectURL(rawFile);
    setArticlePreviewUrl(localUrl);
    setArticleImage(localUrl);

    const handleBase64Fallback = async () => {
      try {
        const compressedFile = await compressImage(rawFile, 1600, 1600, 0.85);
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setArticleImage(base64data);
          setArticlePreviewUrl(base64data);
          setArticleUploading(false);
        };
      } catch (err) {
        setArticleUploading(false);
      }
    };

    if (isFirebaseConfigured && storage) {
      try {
        const storageRef = ref(storage, `articles/${Date.now()}_${rawFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, rawFile);
        
        uploadTask.on("state_changed", 
          (snap) => {
            const progress = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
            setArticleUploadProgress(progress);
          },
          () => {
            handleBase64Fallback();
          },
          async () => {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            setArticleImage(downloadUrl);
            setArticlePreviewUrl(downloadUrl);
            setArticleUploading(false);
          }
        );
      } catch (err) {
        handleBase64Fallback();
      }
    } else {
      handleBase64Fallback();
    }
  };

  // File Uploader state
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // AI Generation state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiFieldsJustFilled, setAiFieldsJustFilled] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  // ── Bulk Upload State ──────────────────────────────────────────────────────
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkInput, setBulkInput] = useState("");
  const [bulkItems, setBulkItems] = useState<BulkItem[]>([]);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkDone, setBulkDone] = useState(false);
  const [bulkSuccessCount, setBulkSuccessCount] = useState(0);
  const [bulkFailCount, setBulkFailCount] = useState(0);

  /** Parse the textarea into an array of non-empty trimmed lines */
  const parseBulkInputs = (raw: string): string[] =>
    raw
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

  const handleBulkUpload = useCallback(async () => {
    const inputs = parseBulkInputs(bulkInput);
    if (inputs.length === 0) return;

    // Initialise status chips to "pending"
    const initial: BulkItem[] = inputs.map((input, i) => ({
      id: `bulk-${i}`,
      input,
      status: "pending" as const,
    }));
    setBulkItems(initial);
    setBulkRunning(true);
    setBulkDone(false);
    setBulkSuccessCount(0);
    setBulkFailCount(0);

    try {
      const { succeeded, failed } = await bulkGenerateProducts(
        inputs,
        (index, item) => {
          // Real-time update for the status chip
          setBulkItems((prev) => {
            const next = [...prev];
            next[index] = item;
            return next;
          });
          // Stream-add successful products to the catalog immediately
          if (item.status === "success" && item.product) {
            addProduct(item.product);
            setBulkSuccessCount((c) => c + 1);
          } else if (item.status === "failed") {
            setBulkFailCount((c) => c + 1);
          }
        },
        3 // max 3 parallel calls
      );

      setBulkSuccessCount(succeeded.length);
      setBulkFailCount(failed.length);
    } catch (err: any) {
      triggerToast(err.message || "Bulk upload failed.");
    } finally {
      setBulkRunning(false);
      setBulkDone(true);
    }
  }, [bulkInput, addProduct]);

  const handleBulkReset = () => {
    setBulkInput("");
    setBulkItems([]);
    setBulkDone(false);
    setBulkRunning(false);
    setBulkSuccessCount(0);
    setBulkFailCount(0);
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop events
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  // Handle file select
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await handleImageUpload(e.target.files[0]);
    }
  };

  // Handle image upload logic (Firebase Storage or Base64 FileReader Fallback)
  const handleImageUpload = async (rawFile: File) => {
    // 1. Validation
    if (!rawFile.type.startsWith("image/")) {
      alert("Invalid file format. Please upload an image file (PNG, JPG, JPEG, WEBP, SVG, etc.).");
      return;
    }
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (rawFile.size > maxSize) {
      alert("File size exceeds 25MB limit. Please upload a smaller image.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    // Set local preview instantly with the original full-size, high-quality image
    const localUrl = URL.createObjectURL(rawFile);
    setPreviewUrl(localUrl);
    setImage(localUrl); // Temporarily set preview url to satisfy form submit check

    // Helper function to compress and encode image to Base64 in case of fallback
    const handleBase64Fallback = async () => {
      try {
        // Compress to high-quality but web-friendly size (1600px max, 0.85 quality) to ensure Base64 fits within 1MB Firestore limit
        const compressedFile = await compressImage(rawFile, 1600, 1600, 0.85);
        encodeAsBase64(compressedFile);
      } catch (err) {
        console.error("Compression fallback failed, using original file:", err);
        encodeAsBase64(rawFile);
      }
    };

    if (isFirebaseConfigured && storage) {
      try {
        // Upload the ORIGINAL full-size, high-quality file to Firebase Storage
        const storageRef = ref(storage, `products/${Date.now()}_${rawFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, rawFile);

        // Watchdog timer: if upload is stuck at 0% for 8 seconds, fall back
        let hasProgressed = false;
        const timeoutId = setTimeout(() => {
          if (!hasProgressed) {
            console.warn(
              "Firebase Storage upload timed out.\n" +
              "Troubleshooting steps:\n" +
              "1. Verify that 'Storage' is activated in your Firebase Console (https://console.firebase.google.com).\n" +
              "2. Confirm your Firebase Storage Rules allow public access."
            );
            uploadTask.cancel();
            handleBase64Fallback();
            triggerToast("Cloud upload timed out. Switched to optimized local fallback! ⚡");
          }
        }, 8000);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            if (progress > 0) {
              hasProgressed = true;
              clearTimeout(timeoutId);
            }
            setUploadProgress(progress);
          },
          (error) => {
            clearTimeout(timeoutId);
            if (error.code === "storage/canceled") {
              // Aborted by watchdog timer, ignore secondary error handler
              return;
            }
            console.error("Firebase Storage Upload Error:", error);
            triggerToast("Cloud upload failed. Switched to local fallback.");
            handleBase64Fallback();
          },
          async () => {
            clearTimeout(timeoutId);
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              setImage(downloadUrl);
              setPreviewUrl(downloadUrl);
              setUploading(false);
              triggerToast("Original high-quality image uploaded to Firebase successfully! 📸");
            } catch (err: any) {
              console.error("Failed to get download URL:", err);
              handleBase64Fallback();
            }
          }
        );
      } catch (err: any) {
        console.error("Cloud storage upload setup failed:", err);
        handleBase64Fallback();
      }
    } else {
      handleBase64Fallback();
    }
  };

  // Convert image to Base64 data URL
  const encodeAsBase64 = (file: File) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const base64data = reader.result as string;
      setImage(base64data);
      setPreviewUrl(base64data);
      setUploading(false);
      triggerToast("Image encoded locally successfully (Offline Fallback).");
    };
    reader.onerror = (error) => {
      console.error("Error reading file as Base64:", error);
      alert("Failed to read image file locally.");
      setUploading(false);
      setPreviewUrl("");
      setImage("");
    };
  };

  const handleResetImage = () => {
    setImage("");
    setPreviewUrl("");
    setUploadProgress(0);
    setUploading(false);
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !buyLink) {
      alert("Please fill in all required fields (Name, Price, Buy Link).");
      return;
    }

    // Security: Validate buy link is a safe http/https URL
    if (!validateUrl(buyLink)) {
      alert("Buy Link must be a valid URL starting with http:// or https://");
      return;
    }

    // Security: Validate prices are positive numbers
    if (!validatePrice(price)) {
      alert("Price must be a positive number.");
      return;
    }
    if (originalPrice && !validatePrice(originalPrice)) {
      alert("Original Price must be a positive number.");
      return;
    }

    // Security: Validate name length
    if (name.trim().length > 200) {
      alert("Product name must be under 200 characters.");
      return;
    }

    // Security: Sanitize text fields to strip any HTML/script injection
    const safeName = sanitizeText(name, 200);
    const safeSubCategory = subCategory ? sanitizeText(subCategory, 100) : undefined;
    const safeUnit = sanitizeText(unit, 50) || "1 piece";
    const safeDiscount = discount ? sanitizeText(discount, 20) : undefined;
    const safeBuyLink = sanitizeUrl(buyLink);
    const safeDescription = description ? sanitizeText(description, 1000) : "";

    // Default Images based on category if empty
    let finalImage = image;
    if (!finalImage) {
      if (category === "Electronics") {
        finalImage = "https://images.unsplash.com/photo-1546054454-aa26e2b734c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600";
      } else if (category === "Fashion") {
        finalImage = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600";
      } else {
        finalImage = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600";
      }
    }

    if (editingProductId !== null) {
      updateProduct({
        id: editingProductId,
        name: safeName,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        discount: safeDiscount,
        rating: parseFloat(rating) || 4.8,
        category,
        subCategory: safeSubCategory,
        unit: safeUnit,
        image: finalImage,
        buyLink: safeBuyLink,
        keywords,
        description: safeDescription
      });
      triggerToast(`Product "${safeName}" updated successfully!`);
      setEditingProductId(null);
    } else {
      addProduct({
        name: safeName,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        discount: safeDiscount,
        rating: parseFloat(rating) || 4.8,
        category,
        subCategory: safeSubCategory,
        unit: safeUnit,
        image: finalImage,
        buyLink: safeBuyLink,
        keywords,
        description: safeDescription
      });
      triggerToast(`✅ "${safeName}" published & auto-pinned to Pinterest!`);
    }

    // Reset Form
    setName("");
    setPrice("");
    setOriginalPrice("");
    setDiscount("");
    setSubCategory("");
    setUnit("1 piece");
    setRating("4.8");
    setImage("");
    setPreviewUrl("");
    setBuyLink("");
    setKeywords([]);
    setDescription("");
  };

  // AI Product Generation handler — supports both text prompts and Amazon URLs
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) {
      setAiError("Please enter a product description or paste an Amazon link.");
      return;
    }
    setAiGenerating(true);
    setAiError(null);
    try {
      const isUrl = isAmazonUrl(aiPrompt);
      const generated = isUrl
        ? await generateProductFromAmazonLink(aiPrompt)
        : await generateProductWithAI(aiPrompt);
      // Auto-fill all form fields with AI-generated data
      setName(generated.name);
      setPrice(generated.price.toString());
      setOriginalPrice(generated.originalPrice.toString());
      setDiscount(generated.discount);
      setCategory(generated.category);
      setSubCategory(generated.subCategory || "");
      setKeywords(generated.keywords || []);
      setUnit(generated.unit);
      setRating(generated.rating.toString());
      setImage(generated.image);
      setPreviewUrl(generated.image);
      setBuyLink(generated.buyLink);
      setDescription(generated.description);
      setAiFieldsJustFilled(true);
      setTimeout(() => setAiFieldsJustFilled(false), 2000);
      triggerToast(isUrl
        ? "Product imported from Amazon link! Review and publish. \u{1F6D2}"
        : "Product generated by AI! Review and publish. \u{1F916}"
      );
      setAiPrompt("");
    } catch (err: any) {
      console.error("AI Generation Error:", err);
      setAiError(err.message || "Failed to generate product. Please try again.");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleEdit = (product: any) => {
    setEditingProductId(product.id);
    setName(product.name);
    setPrice(product.price.toString());
    setOriginalPrice(product.originalPrice ? product.originalPrice.toString() : "");
    setDiscount(product.discount || "");
    setCategory(product.category);
    setSubCategory(product.subCategory || "");
    setKeywords(product.keywords || []);
    setUnit(product.unit || "1 piece");
    setRating(product.rating.toString());
    setImage(product.image);
    setPreviewUrl(product.image);
    setBuyLink(product.buyLink || "");
    setDescription(product.description || "");
    
    // Smooth scroll up to the form
    window.scrollTo({ top: 180, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setName("");
    setPrice("");
    setOriginalPrice("");
    setDiscount("");
    setCategory("Electronics");
    setSubCategory("");
    setKeywords([]);
    setUnit("1 piece");
    setRating("4.8");
    setImage("");
    setPreviewUrl("");
    setBuyLink("");
    setDescription("");
  };

  const handleDelete = (id: number, productName: string) => {
    if (confirm(`Are you sure you want to delete "${productName}" from the catalog?`)) {
      // If we are currently editing the product that is being deleted, cancel the edit mode
      if (editingProductId === id) {
        handleCancelEdit();
      }
      deleteProduct(id);
      triggerToast(`Product "${productName}" removed from catalog.`);
    }
  };

  // ---------------------------------------------------------------------------
  // NoirCoins Rewards Admin Panel Subcomponent
  // ---------------------------------------------------------------------------
  const RewardsAdminPanel = () => {
    const [rewardsSubTab, setRewardsSubTab] = useState<"claims" | "redemptions" | "users" | "rules" | "fraud">("claims");
    const [rewardsData, setRewardsData] = useState<any>(null);
    const [rewardsLoading, setRewardsLoading] = useState(false);
    const [userQuery, setUserQuery] = useState("");
    
    // Adjust balance form state
    const [adjustEmail, setAdjustEmail] = useState("");
    const [adjustAmount, setAdjustAmount] = useState("");
    const [adjustReason, setAdjustReason] = useState("");
    
    // Approve/reject inputs
    const [commAmounts, setCommAmounts] = useState<Record<string, string>>({});
    const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});

    // Settings inputs
    const [rulesMinRedeem, setRulesMinRedeem] = useState("");
    const [rulesCommPct, setRulesCommPct] = useState("");
    const [rulesDefaultAffiliate, setRulesDefaultAffiliate] = useState("");

    const loadAllRewardsData = async () => {
      setRewardsLoading(true);
      try {
        const data = await adminGetAllData();
        setRewardsData(data);
        if (data?.rules) {
          setRulesMinRedeem(data.rules.minRedemption?.toString() || "10000");
          setRulesCommPct(data.rules.commissionPercentage?.toString() || "30");
          setRulesDefaultAffiliate(data.rules.defaultAffiliateRate?.toString() || "8");
        }
      } catch (err) {
        console.error("Failed to load rewards data", err);
      } finally {
        setRewardsLoading(false);
      }
    };

    useEffect(() => {
      loadAllRewardsData();
    }, []);

    const handleApproveClaim = async (claimId: string) => {
      const comm = commAmounts[claimId];
      if (!comm || parseFloat(comm) <= 0) {
        alert("Please enter a valid commission amount (₹) earned from this order.");
        return;
      }
      try {
        await adminApproveClaim(claimId, comm);
        alert("Purchase claim approved, coins awarded!");
        loadAllRewardsData();
      } catch (err: any) {
        alert(err.message || "Failed to approve claim");
      }
    };

    const handleRejectClaim = async (claimId: string) => {
      const notes = rejectNotes[claimId] || "Verification failed.";
      try {
        await adminRejectClaim(claimId, notes);
        alert("Purchase claim rejected.");
        loadAllRewardsData();
      } catch (err: any) {
        alert(err.message || "Failed to reject claim");
      }
    };

    const handleApproveRedemption = async (redId: string) => {
      if (!confirm("Are you sure you want to approve this redemption? (Voucher sent / UPI transferred)")) return;
      try {
        await adminApproveRedemption(redId);
        alert("Redemption marked as approved!");
        loadAllRewardsData();
      } catch (err: any) {
        alert(err.message || "Failed to approve redemption");
      }
    };

    const handleRejectRedemption = async (redId: string) => {
      if (!confirm("Are you sure you want to reject this redemption? Coins will be refunded to user.")) return;
      try {
        await adminRejectRedemption(redId);
        alert("Redemption rejected and coins refunded.");
        loadAllRewardsData();
      } catch (err: any) {
        alert(err.message || "Failed to reject redemption");
      }
    };

    const handleAdjustBalanceSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!adjustEmail || !adjustAmount || !adjustReason) {
        alert("Please fill in all fields to adjust balance.");
        return;
      }
      try {
        await adminAdjustBalance(adjustEmail, adjustAmount, adjustReason);
        alert("User balance adjusted successfully!");
        setAdjustEmail("");
        setAdjustAmount("");
        setAdjustReason("");
        loadAllRewardsData();
      } catch (err: any) {
        alert(err.message || "Failed to adjust balance");
      }
    };

    const handleToggleFreeze = async (email: string) => {
      if (!confirm(`Are you sure you want to change freeze status for ${email}?`)) return;
      try {
        await adminToggleFreeze(email);
        alert("User freeze status toggled!");
        loadAllRewardsData();
      } catch (err: any) {
        alert(err.message || "Failed to toggle freeze status");
      }
    };

    const handleSaveRules = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await adminSetRules({
          minRedemption: parseInt(rulesMinRedeem) || 10000,
          commissionPercentage: parseInt(rulesCommPct) || 30,
          defaultAffiliateRate: parseInt(rulesDefaultAffiliate) || 8
        });
        alert("Reward rules updated successfully!");
        loadAllRewardsData();
      } catch (err: any) {
        alert(err.message || "Failed to update rules");
      }
    };

    // Parse data safely
    const users = rewardsData?.users || [];
    const claims = rewardsData?.claims || [];
    const redemptions = rewardsData?.redemptions || [];
    const referrals = rewardsData?.referrals || [];

    const pendingClaims = claims.filter((c: any) => c.status === "pending");
    const pendingRedemptions = redemptions.filter((r: any) => r.status === "pending");

    const filteredUsers = users.filter((u: any) => 
      u.email.toLowerCase().includes(userQuery.toLowerCase()) || 
      u.name.toLowerCase().includes(userQuery.toLowerCase())
    );

    // Fraud Scans algorithm:
    // 1. Gmail Alias Spammers (root emails match, but plus alias is used)
    // 2. Same Referral code used recursively, or referrals from same username prefix
    const scanFraudList = () => {
      const flags: { id: string; email: string; type: string; details: string; severity: "high" | "medium" }[] = [];
      
      const emailBaseMap: Record<string, string[]> = {};
      users.forEach((u: any) => {
        let base = u.email.toLowerCase();
        if (base.includes("@gmail.com")) {
          const parts = base.split("@");
          const localPart = parts[0].split("+")[0].replace(/\./g, ""); // strip dots & plus
          base = `${localPart}@gmail.com`;
        }
        if (!emailBaseMap[base]) emailBaseMap[base] = [];
        emailBaseMap[base].push(u.email);
      });

      Object.entries(emailBaseMap).forEach(([base, list]) => {
        if (list.length > 1) {
          list.forEach(email => {
            flags.push({
              id: `fraud-gmail-${email}`,
              email,
              type: "Gmail Alias Spam",
              details: `Shares root inbox pattern with: ${list.filter(e => e !== email).join(", ")}`,
              severity: "high"
            });
          });
        }
      });

      // Self Referral Scan (referred email matches pattern of referrer)
      referrals.forEach((ref: any) => {
        const refRoot = ref.refereeEmail.split("@")[0].toLowerCase().slice(0, 5);
        const referrerRoot = ref.referrerEmail.split("@")[0].toLowerCase().slice(0, 5);
        if (refRoot === referrerRoot) {
          flags.push({
            id: `fraud-self-${ref.refereeEmail}`,
            email: ref.refereeEmail,
            type: "Self-Referral Warning",
            details: `Referred by: ${ref.referrerEmail} (very similar usernames)`,
            severity: "medium"
          });
        }
      });

      return flags;
    };

    const fraudFlags = scanFraudList();

    if (rewardsLoading && !rewardsData) {
      return (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-150 rounded-2xl">
          <Loader2 className="animate-spin text-[#E23744] mb-3" size={32} />
          <p className="text-sm font-semibold text-gray-500">Loading Rewards Management Database...</p>
        </div>
      );
    }

    return (
      <div className="bg-[#ffffff] rounded-2xl p-6 border border-[#E8E8E8] space-y-6">
        
        {/* Header Summary */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-4 gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Coins className="text-amber-500 animate-pulse" />
              NoirCoins Rewards System Management
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Vet orders commission claims, process payout redemptions, adjust user profiles, configure policies.</p>
          </div>
          <button 
            onClick={loadAllRewardsData}
            className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-250 text-gray-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Refresh Database ↻
          </button>
        </div>

        {/* Quick Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-amber-500/5 border border-amber-200 rounded-xl p-4 text-left">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Pending Claims</div>
            <div className="text-xl font-black text-amber-600 mt-1">{pendingClaims.length} Claims</div>
          </div>
          <div className="bg-indigo-500/5 border border-indigo-200 rounded-xl p-4 text-left">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Pending Cash Redemptions</div>
            <div className="text-xl font-black text-indigo-600 mt-1">{pendingRedemptions.length} requests</div>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-200 rounded-xl p-4 text-left">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Registered Loyalty Users</div>
            <div className="text-xl font-black text-emerald-600 mt-1">{users.length} Users</div>
          </div>
          <div className="bg-red-500/5 border border-red-200 rounded-xl p-4 text-left">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-semibold">Flagged Fraud Attempts</div>
            <div className="text-xl font-black text-red-500 mt-1">{fraudFlags.length} Warnings</div>
          </div>
        </div>

        {/* Subtab Controls */}
        <div className="flex border-b border-gray-150 gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: "claims", label: `📦 Claims (${pendingClaims.length})` },
            { id: "redemptions", label: `🎁 Redemptions (${pendingRedemptions.length})` },
            { id: "users", label: `👥 Users Directory` },
            { id: "rules", label: `⚙ Settings & Rules` },
            { id: "fraud", label: `⚠ Fraud Scanner (${fraudFlags.length})` }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setRewardsSubTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                rewardsSubTab === tab.id 
                  ? "bg-gray-950 text-white shadow-xs" 
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* View Subtabs */}
        <div className="min-h-[300px]">

          {/* SUBTAB: CLAIMS */}
          {rewardsSubTab === "claims" && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-800">Pending Purchase Claims for Vetting</h3>
              {pendingClaims.length === 0 ? (
                <p className="text-xs text-gray-500 italic py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">No pending purchase claims to review.</p>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 font-bold text-gray-600 border-b border-gray-200">
                        <th className="px-4 py-3">User & Date</th>
                        <th className="px-4 py-3">Store & Order</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Affiliate Commission (₹)</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150">
                      {pendingClaims.map((claim: any) => (
                        <tr key={claim.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="font-semibold text-gray-900">{claim.email}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">{new Date(claim.createdAt).toLocaleString()}</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-bold text-gray-800">{claim.merchant}</div>
                            <div className="text-[10px] text-gray-400 font-mono mt-0.5">{claim.orderId}</div>
                          </td>
                          <td className="px-4 py-4 font-semibold text-gray-800 whitespace-nowrap">
                            ₹{claim.purchaseAmount.toLocaleString()}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1.5 max-w-[120px]">
                              <input 
                                type="number" 
                                placeholder="Comm ₹"
                                value={commAmounts[claim.id] || ""}
                                onChange={(e) => setCommAmounts(prev => ({ ...prev, [claim.id]: e.target.value }))}
                                className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-850"
                              />
                            </div>
                            {commAmounts[claim.id] && (
                              <span className="text-[9px] text-amber-600 block mt-1 font-bold">
                                Rewards: {Math.round(parseFloat(commAmounts[claim.id] || "0") * 0.3 * 100)} 🪙
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={() => handleApproveClaim(claim.id)}
                                className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
                              >
                                Approve
                              </button>
                              
                              <details className="relative">
                                <summary className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-[10px] font-bold list-none cursor-pointer">
                                  Reject
                                </summary>
                                <div className="absolute right-0 bottom-full mb-2 bg-white border border-gray-250 rounded-xl p-3 shadow-xl z-50 text-left min-w-[200px]">
                                  <label className="block text-[9px] font-bold uppercase text-gray-500 mb-1">Rejection Reason</label>
                                  <input 
                                    type="text" 
                                    placeholder="e.g. Order cancelled"
                                    value={rejectNotes[claim.id] || ""}
                                    onChange={(e) => setRejectNotes(prev => ({ ...prev, [claim.id]: e.target.value }))}
                                    className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-800 mb-2"
                                  />
                                  <button 
                                    type="button"
                                    onClick={() => handleRejectClaim(claim.id)}
                                    className="w-full py-1 bg-red-600 hover:bg-red-750 text-white font-bold rounded text-[10px]"
                                  >
                                    Confirm Reject
                                  </button>
                                </div>
                              </details>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* SUBTAB: REDEMPTIONS */}
          {rewardsSubTab === "redemptions" && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-800">Pending Coins Cashouts Vouchers</h3>
              {pendingRedemptions.length === 0 ? (
                <p className="text-xs text-gray-500 italic py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">No pending redemptions to verify.</p>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 font-bold text-gray-600 border-b border-gray-200">
                        <th className="px-4 py-3">User & Date</th>
                        <th className="px-4 py-3">Redeem Item</th>
                        <th className="px-4 py-3">Target Details</th>
                        <th className="px-4 py-3">Cash Value</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150">
                      {pendingRedemptions.map((red: any) => (
                        <tr key={red.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="font-semibold text-gray-900">{red.email}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">{new Date(red.createdAt).toLocaleString()}</div>
                          </td>
                          <td className="px-4 py-4 font-bold text-gray-800 whitespace-nowrap">
                            {red.type}
                          </td>
                          <td className="px-4 py-4 font-mono text-gray-700 whitespace-nowrap select-all">
                            {red.details}
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-bold text-red-500">-{red.amountCoins.toLocaleString()} 🪙</div>
                            <div className="text-[9px] text-gray-400">Equivalent to ₹{red.amountINR.toFixed(2)}</div>
                          </td>
                          <td className="px-4 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={() => handleApproveRedemption(red.id)}
                                className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-[10px] font-bold cursor-pointer"
                              >
                                Mark Paid
                              </button>
                              <button 
                                onClick={() => handleRejectRedemption(red.id)}
                                className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-[10px] font-bold cursor-pointer"
                              >
                                Refund Coins
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* SUBTAB: USERS DIRECTORY */}
          {rewardsSubTab === "users" && (
            <div className="space-y-6">
              
              <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <h3 className="text-sm font-bold text-gray-800">NoirCoins Members Registry</h3>
                <div className="relative w-full max-w-xs">
                  <input 
                    type="text" 
                    placeholder="Search name or email..."
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Adjust Balance Override Inline form */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <form onSubmit={handleAdjustBalanceSubmit} className="flex flex-wrap gap-3 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-[9px] font-bold uppercase text-gray-500 mb-1">Override Balance User Email</label>
                    <select 
                      value={adjustEmail}
                      onChange={(e) => setAdjustEmail(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-xs"
                    >
                      <option value="">Select User</option>
                      {users.map((u: any) => (
                        <option key={u.email} value={u.email}>{u.email} ({u.name})</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-28">
                    <label className="block text-[9px] font-bold uppercase text-gray-500 mb-1">Coin Offset (Δ)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 500 or -1000"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-[9px] font-bold uppercase text-gray-500 mb-1">Override Reason</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Loyalty campaign compensation"
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-gray-950 text-white rounded text-xs font-bold hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    Adjust Balance
                  </button>
                </form>
              </div>

              {/* Users table */}
              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 font-bold text-gray-600 border-b border-gray-200">
                      <th className="px-4 py-3">Member Name</th>
                      <th className="px-4 py-3">Email Address</th>
                      <th className="px-4 py-3">Active Balance</th>
                      <th className="px-4 py-3">Lifetime Coins</th>
                      <th className="px-4 py-3">Streak Count</th>
                      <th className="px-4 py-3">Account Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150">
                    {filteredUsers.map((u: any) => (
                      <tr key={u.email} className="hover:bg-gray-50">
                        <td className="px-4 py-3.5 whitespace-nowrap font-bold text-gray-900">{u.name}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-mono text-gray-600">{u.email}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-bold text-amber-600 font-mono">{u.coinsBalance.toLocaleString()} 🪙</td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-mono">{u.lifetimeCoins.toLocaleString()}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-mono text-center">{u.streakCount || 0}d</td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                            u.isFrozen 
                              ? "bg-red-50 border-red-200 text-red-700" 
                              : "bg-green-50 border-green-200 text-green-700"
                          }`}>
                            {u.isFrozen ? "Frozen" : "Active"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-1.5">
                            <button 
                              onClick={() => {
                                setAdjustEmail(u.email);
                                window.scrollTo({ top: 400, behavior: "smooth" });
                              }}
                              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-[10px] font-bold cursor-pointer"
                            >
                              Adjust
                            </button>
                            <button 
                              onClick={() => handleToggleFreeze(u.email)}
                              className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer border ${
                                u.isFrozen 
                                  ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" 
                                  : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                              }`}
                            >
                              {u.isFrozen ? "Unfreeze" : "Freeze"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* SUBTAB: SETTINGS */}
          {rewardsSubTab === "rules" && (
            <div className="max-w-xl">
              <h3 className="text-sm font-bold text-gray-800 mb-4">Modify Rewards System Ratios</h3>
              
              <form onSubmit={handleSaveRules} className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Minimum Redemption Limit (Coins)</label>
                  <input 
                    type="number" 
                    value={rulesMinRedeem}
                    onChange={(e) => setRulesMinRedeem(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Default 10,000 Coins = ₹100 INR conversion minimum threshold.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Referral / User Purchase Reward Ratio (% of Commission)</label>
                  <input 
                    type="number" 
                    value={rulesCommPct}
                    onChange={(e) => setRulesCommPct(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Percentage of affiliate commission value converted to loyalty coins. Default is 30%.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Estimated Direct Affiliate Margin (%)</label>
                  <input 
                    type="number" 
                    value={rulesDefaultAffiliate}
                    onChange={(e) => setRulesDefaultAffiliate(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Estimated standard referral margin on direct purchases when checking approximate product page preview coins rewards.</p>
                </div>

                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-gray-950 text-white rounded-full text-xs font-bold hover:bg-gray-800 transition-colors shadow cursor-pointer"
                >
                  Save Policy Config
                </button>
              </form>
            </div>
          )}

          {/* SUBTAB: FRAUD */}
          {rewardsSubTab === "fraud" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800">Automated Referral Abuse Scan Alerts</h3>
                <span className="px-2 py-0.5 bg-red-100 text-red-700 border border-red-200 rounded-full font-bold text-[9px] uppercase tracking-wider">
                  Active
                </span>
              </div>

              {fraudFlags.length === 0 ? (
                <p className="text-xs text-gray-500 italic py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">No suspicious account clusters or fingerprint collisions scanned.</p>
              ) : (
                <div className="space-y-3">
                  {fraudFlags.map((flag) => (
                    <div 
                      key={flag.id} 
                      className={`border rounded-xl p-4 flex items-start gap-3 bg-white ${
                        flag.severity === "high" ? "border-red-300 bg-red-50/10" : "border-amber-300 bg-amber-50/10"
                      }`}
                    >
                      <AlertTriangle className={flag.severity === "high" ? "text-red-500 shrink-0" : "text-amber-500 shrink-0"} size={18} />
                      <div className="flex-1 text-left text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-gray-900">{flag.type}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                            flag.severity === "high" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                          }`}>
                            {flag.severity} RISK
                          </span>
                        </div>
                        <p className="text-gray-700 font-mono font-semibold mt-1">Target Account: {flag.email}</p>
                        <p className="text-gray-500 mt-0.5 leading-relaxed">{flag.details}</p>
                        <div className="mt-3 flex gap-2">
                          <button 
                            onClick={() => handleToggleFreeze(flag.email)}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            Freeze Account
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    );
  };

  // Quick stats calculations
  const totalCatalogValue = products.reduce((sum, p) => sum + p.price, 0);
  const averagePrice = products.length > 0 ? (totalCatalogValue / products.length).toFixed(0) : "0";

  return (
    <div className="min-h-screen bg-[#F8F8F8] pt-44 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Navigation */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-[#E23744] mb-6 transition-colors cursor-pointer"
        >
          <ChevronLeft size={20} />
          Exit Admin Panel
        </button>

        <div className="flex items-center gap-3 mb-8">
          <ShieldCheck size={36} className="text-[#E23744]" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">noirkart Admin Control Center</h1>
            <p className="text-xs text-gray-500">Add, review, and delete premium curated external links from the public store catalog.</p>
          </div>
        </div>

        {/* Tab Navigation Toggle */}
        <div className="flex border-b border-gray-200 mb-8 gap-4">
          <button
            onClick={() => setActiveTab("products")}
            className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "products"
                ? "border-[#E23744] text-[#E23744]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            📦 Products Catalog
          </button>
          <button
            onClick={() => {
              setActiveTab("blog");
            }}
            className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "blog"
                ? "border-[#E23744] text-[#E23744]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            📝 Blog Review Articles
          </button>
          <button
            onClick={() => {
              setActiveTab("analytics");
            }}
            className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "analytics"
                ? "border-[#E23744] text-[#E23744]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            📊 Advanced Analytics
          </button>
          <button
            onClick={() => {
              setActiveTab("rewards");
            }}
            className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "rewards"
                ? "border-[#E23744] text-[#E23744]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            🪙 Rewards Management
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Active Products", val: products.length, icon: List, col: "text-[#E23744] bg-[#E23744]/10" },
            { label: "Est. Catalog Value", val: `₹${totalCatalogValue.toLocaleString()}`, icon: DollarSign, col: "text-blue-400 bg-blue-500/10" },
            { label: "Avg. Item Price", val: `₹${averagePrice}`, icon: DollarSign, col: "text-purple-400 bg-purple-500/10" },
            { label: "Shortlisted Watchers", val: `${cart.length} saves`, icon: ShoppingBag, col: "text-amber-400 bg-amber-500/10" },
            { label: "Total Activity Logs", val: `${analyticsEvents.length} events`, icon: Eye, col: "text-emerald-500 bg-emerald-500/10" }
          ].map((stat, i) => (
            <div key={i} className="bg-[#ffffff] rounded-xl p-5 border border-[#E8E8E8] flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.val}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.col}`}>
                <stat.icon size={22} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {activeTab === "analytics" ? (
            <AnalyticsDashboard />
          ) : activeTab === "rewards" ? (
            <div className="lg:col-span-3">
              <RewardsAdminPanel />
            </div>
          ) : activeTab === "products" ? (
            <>
              {/* Add Product Form Column */}
              <div className="lg:col-span-1">
                <div className="bg-[#ffffff] rounded-2xl p-6 border border-[#E8E8E8]">

                  {/* ⚡ Bulk AI Upload Section */}
                  {editingProductId === null && (
                    <div className="mb-5">
                      {/* Toggle Button */}
                      <button
                        type="button"
                        onClick={() => setBulkOpen((v) => !v)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 transition-all cursor-pointer group"
                      >
                        <span className="flex items-center gap-2">
                          <span className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg text-white shadow-sm group-hover:scale-110 transition-transform">
                            <Zap size={14} />
                          </span>
                          <span className="text-sm font-bold text-gray-800">Bulk AI Upload</span>
                          <span className="text-[9px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Beta</span>
                        </span>
                        <span className="text-gray-400 group-hover:text-indigo-500 transition-colors">
                          {bulkOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </span>
                      </button>

                      {/* Collapsible body */}
                      <AnimatePresence>
                        {bulkOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.22, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-pink-50/40 p-4 space-y-3">
                              {/* Decorative glow */}
                              <div className="absolute -top-6 -right-6 w-20 h-20 bg-indigo-300/20 rounded-full blur-2xl pointer-events-none" />

                              <p className="text-[11px] text-gray-500 leading-relaxed">
                                Paste <strong>Amazon URLs</strong> or <strong>product descriptions</strong> — one per line. AI generates &amp; uploads all products automatically.
                              </p>

                              {/* Textarea */}
                              <div className="relative">
                                <textarea
                                  id="bulk-upload-textarea"
                                  rows={5}
                                  disabled={bulkRunning}
                                  placeholder={"https://www.amazon.in/dp/B09X3ZQFJ8\nwireless earbuds with ANC under ₹2000\nhttps://www.amazon.in/dp/B0BSXWM9L8\npremium leather wallet for men"}
                                  value={bulkInput}
                                  onChange={(e) => setBulkInput(e.target.value)}
                                  className="w-full px-3 py-2.5 bg-white/90 border border-indigo-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-300 text-xs text-gray-800 placeholder-gray-400 disabled:opacity-50 resize-none font-mono leading-relaxed transition-all"
                                />
                                {/* Line count badge */}
                                {bulkInput.trim() && (
                                  <span className="absolute bottom-2 right-2 text-[10px] text-indigo-500 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 font-semibold">
                                    {parseBulkInputs(bulkInput).length} item{parseBulkInputs(bulkInput).length !== 1 ? "s" : ""}
                                  </span>
                                )}
                              </div>

                              {/* Input parse preview (type detection chips) */}
                              {!bulkRunning && !bulkDone && bulkInput.trim() && bulkItems.length === 0 && (
                                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                                  {parseBulkInputs(bulkInput).map((line, i) => (
                                    <span key={i} className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                                      isAmazonUrl(line)
                                        ? "bg-orange-50 border-orange-200 text-orange-700"
                                        : "bg-blue-50 border-blue-200 text-blue-700"
                                    }`}>
                                      {isAmazonUrl(line) ? <LinkIcon size={9} /> : <FileText size={9} />}
                                      {isAmazonUrl(line) ? "URL" : "Text"}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Live progress bar */}
                              {bulkRunning && bulkItems.length > 0 && (
                                <div className="space-y-1.5">
                                  <div className="flex justify-between text-[10px] text-gray-500">
                                    <span>Processing…</span>
                                    <span>{bulkSuccessCount + bulkFailCount} / {bulkItems.length}</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                                    <motion.div
                                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                      animate={{ width: `${((bulkSuccessCount + bulkFailCount) / bulkItems.length) * 100}%` }}
                                      transition={{ duration: 0.3 }}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Per-item status list */}
                              {bulkItems.length > 0 && (
                                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-0.5">
                                  <AnimatePresence initial={false}>
                                    {bulkItems.map((item) => (
                                      <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.18 }}
                                        className={`flex items-start gap-2 rounded-lg px-2.5 py-2 border text-[11px] transition-colors ${
                                          item.status === "pending"
                                            ? "bg-gray-50 border-gray-200 text-gray-500"
                                            : item.status === "processing"
                                            ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                                            : item.status === "success"
                                            ? "bg-green-50 border-green-200 text-green-800"
                                            : "bg-red-50 border-red-200 text-red-700"
                                        }`}
                                      >
                                        {/* Status icon */}
                                        <span className="flex-shrink-0 mt-0.5">
                                          {item.status === "pending" && <span className="text-gray-400">⏳</span>}
                                          {item.status === "processing" && <Loader2 size={12} className="animate-spin text-indigo-500" />}
                                          {item.status === "success" && <CheckCheck size={12} className="text-green-600" />}
                                          {item.status === "failed" && <XCircle size={12} className="text-red-500" />}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                          <p className="truncate font-medium">
                                            {item.status === "success" && item.product ? item.product.name : item.input.slice(0, 55) + (item.input.length > 55 ? "…" : "")}
                                          </p>
                                          {item.status === "success" && item.product && (
                                            <p className="text-[10px] opacity-70">₹{item.product.price.toLocaleString()} · {item.product.category}</p>
                                          )}
                                          {item.status === "failed" && item.error && (
                                            <p className="text-[10px] opacity-70 truncate">{item.error}</p>
                                          )}
                                        </div>
                                      </motion.div>
                                    ))}
                                  </AnimatePresence>
                                </div>
                              )}

                              {/* Completion Summary Banner */}
                              <AnimatePresence>
                                {bulkDone && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 6 }}
                                    className={`flex items-center gap-3 rounded-xl px-4 py-3 border text-sm font-semibold ${
                                      bulkFailCount === 0
                                        ? "bg-green-50 border-green-200 text-green-800"
                                        : bulkSuccessCount === 0
                                        ? "bg-red-50 border-red-200 text-red-800"
                                        : "bg-amber-50 border-amber-200 text-amber-800"
                                    }`}
                                  >
                                    <span className="text-xl">
                                      {bulkFailCount === 0 ? "🎉" : bulkSuccessCount === 0 ? "💔" : "⚠️"}
                                    </span>
                                    <div className="flex-1">
                                      <span className="text-green-700 font-bold">{bulkSuccessCount} uploaded</span>
                                      {bulkFailCount > 0 && (
                                        <span className="ml-2 text-red-600 font-bold">{bulkFailCount} failed</span>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={handleBulkReset}
                                      className="text-[11px] underline opacity-70 hover:opacity-100 cursor-pointer"
                                    >
                                      Reset
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Action buttons */}
                              <div className="flex gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={handleBulkUpload}
                                  disabled={bulkRunning || parseBulkInputs(bulkInput).length === 0 || !isGeminiConfigured}
                                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-600 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  {bulkRunning ? (
                                    <><Loader2 size={13} className="animate-spin" /> Processing…</>
                                  ) : (
                                    <><Zap size={13} /> Generate &amp; Upload All</>
                                  )}
                                </button>
                                {(bulkInput || bulkItems.length > 0) && !bulkRunning && (
                                  <button
                                    type="button"
                                    onClick={handleBulkReset}
                                    className="px-3 py-2.5 border border-gray-200 rounded-xl text-gray-500 hover:text-red-500 hover:border-red-200 transition-all cursor-pointer text-xs"
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* ✨ AI Product Generator Section */}
                  {editingProductId === null && (
                    <div className="mb-6">
                      <div className="relative overflow-hidden rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50/80 via-pink-50/50 to-red-50/40 p-5">
                        {/* Decorative shimmer */}
                        <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-purple-300/20 to-pink-300/20 rounded-full blur-2xl pointer-events-none" />
                        <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-gradient-to-br from-pink-300/15 to-red-300/15 rounded-full blur-2xl pointer-events-none" />

                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className={`p-1.5 rounded-lg text-white shadow-sm transition-all ${isAmazonUrl(aiPrompt) ? "bg-gradient-to-br from-orange-500 to-red-500" : "bg-gradient-to-br from-purple-500 to-pink-500"}`}>
                              {isAmazonUrl(aiPrompt) ? <LinkIcon size={16} /> : <Sparkles size={16} />}
                            </div>
                            <h3 className="text-sm font-bold text-gray-800">
                              {isAmazonUrl(aiPrompt) ? "Import from Amazon Link" : "Generate with AI"}
                            </h3>
                            {!isGeminiConfigured && (
                              <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase">API Key Required</span>
                            )}
                          </div>

                          <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">
                            {isAmazonUrl(aiPrompt) ? (
                              <>✅ <strong>Amazon link detected</strong> — AI will fetch product name, price, image &amp; all details automatically.</>
                            ) : (
                              <><strong>Paste an Amazon link</strong> or describe any product — AI auto-fills all fields including name, price, category, keywords &amp; image.</>
                            )}
                          </p>

                          <div className="flex gap-2">
                            <input
                              id="ai-product-input"
                              type="text"
                              placeholder='Paste Amazon link or describe: "wireless earbuds under ₹2000"'
                              value={aiPrompt}
                              onChange={(e) => { setAiPrompt(e.target.value); setAiError(null); }}
                              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAiGenerate(); } }}
                              onPaste={(e) => {
                                // Auto-trigger on paste if it looks like an Amazon URL
                                const pasted = e.clipboardData.getData("text").trim();
                                if (isAmazonUrl(pasted)) {
                                  // Let the state update first, then auto-generate
                                  setTimeout(() => {
                                    setAiPrompt(pasted);
                                    setAiError(null);
                                  }, 0);
                                }
                              }}
                              disabled={aiGenerating}
                              className={`flex-1 px-3 py-2.5 bg-white/90 border rounded-xl focus:outline-none focus:ring-2 text-sm text-gray-800 placeholder-gray-400 disabled:opacity-50 transition-all ${
                                isAmazonUrl(aiPrompt)
                                  ? "border-orange-300/80 focus:ring-orange-400/40 focus:border-orange-300"
                                  : "border-purple-200/80 focus:ring-purple-400/40 focus:border-purple-300"
                              }`}
                            />
                            <button
                              type="button"
                              onClick={handleAiGenerate}
                              disabled={aiGenerating || !aiPrompt.trim()}
                              className={`px-4 py-2.5 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 min-w-[130px] justify-center ${
                                isAmazonUrl(aiPrompt)
                                  ? "bg-gradient-to-r from-orange-500 via-red-500 to-[#E23744] hover:from-orange-600 hover:via-red-600 hover:to-[#CB202D]"
                                  : "bg-gradient-to-r from-purple-600 via-pink-500 to-[#E23744] hover:from-purple-700 hover:via-pink-600 hover:to-[#CB202D]"
                              }`}
                            >
                              {aiGenerating ? (
                                <><Loader2 size={14} className="animate-spin" />Fetching…</>
                              ) : isAmazonUrl(aiPrompt) ? (
                                <><UploadCloud size={14} />Import Product</>
                              ) : (
                                <><Wand2 size={14} />Generate ✨</>
                              )}
                            </button>
                          </div>

                          {/* AI Error */}
                          <AnimatePresence>
                            {aiError && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
                              >
                                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                                <p className="text-xs leading-relaxed">{aiError}</p>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* AI Success flash */}
                          <AnimatePresence>
                            {aiFieldsJustFilled && (
                              <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="mt-3 flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2"
                              >
                                <CheckCircle2 size={14} className="flex-shrink-0" />
                                <p className="text-xs font-semibold">All fields populated! Review below and publish.</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="relative my-5">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
                        <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-white px-3 text-gray-400 font-semibold tracking-wider">Or fill manually</span></div>
                      </div>
                    </div>
                  )}

                  <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                    {editingProductId !== null ? (
                      <>
                        <ShieldCheck size={20} className="text-[#E23744]" />
                        Edit Curated Product
                      </>
                    ) : (
                      <>
                        <PlusCircle size={20} className="text-[#E23744]" />
                        Add Curated Product
                      </>
                    )}
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Product Name <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Premium mechanical keyboard"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 bg-[#F8F8F8] border border-[#E8E8E8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E23744]/50 text-sm text-gray-900 placeholder-gray-400"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Price (₹) <span className="text-red-400">*</span></label>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="e.g., 2999"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="w-full px-3 py-2 bg-[#F8F8F8] border border-[#E8E8E8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E23744]/50 text-sm text-gray-900 placeholder-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Orig. Price (₹)</label>
                        <input
                          type="number"
                          placeholder="e.g., 4999"
                          value={originalPrice}
                          onChange={(e) => setOriginalPrice(e.target.value)}
                          className="w-full px-3 py-2 bg-[#F8F8F8] border border-[#E8E8E8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E23744]/50 text-sm text-gray-900 placeholder-gray-400"
                        />
                      </div>
                    </div>

                     <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Category</label>
                        <input
                          type="text"
                          list="category-suggestions"
                          placeholder="e.g., Apparel & Accessories"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full px-3 py-2 bg-[#F8F8F8] border border-[#E8E8E8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E23744]/50 text-sm text-gray-900 placeholder-gray-400"
                        />
                        <datalist id="category-suggestions">
                          <option value="Apparel & Accessories" />
                          <option value="Shoes, Luggage & Bags, Watches" />
                          <option value="Beauty" />
                          <option value="Kitchen" />
                          <option value="Furniture" />
                          <option value="Home" />
                          <option value="Grocery" />
                          <option value="Amazon Fresh" />
                          <option value="Sports" />
                          <option value="Automotive" />
                          <option value="Health and Personal Care" />
                          <option value="Baby products" />
                          <option value="Echo & Alexa Devices" />
                          <option value="Fire TV Devices" />
                          <option value="Pet Products" />
                          <option value="Mobile Accessories" />
                          <option value="Books" />
                          <option value="Office Products" />
                          <option value="Toys" />
                          <option value="BISS" />
                          <option value="Lawn & Garden" />
                          <option value="Video Games" />
                          <option value="Personal Care Appliances" />
                          <option value="Personal Computers" />
                          <option value="Smart Watches" />
                          <option value="Televisions" />
                          <option value="Electronics" />
                          <option value="Large Appliances" />
                          <option value="Bicycles & Heavy Gym Equipment" />
                          <option value="Tyres & Rims" />
                          <option value="Jewelry (Excluding silver & Gold coins)" />
                          <option value="Data Storage Devices" />
                          <option value="Mobile Phones" />
                          <option value="Bill Payment & Recharges" />
                          <option value="All Other Categories" />
                        </datalist>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Sub Category</label>
                        <input
                          type="text"
                          list="subcategory-suggestions"
                          placeholder="e.g., Headphones"
                          value={subCategory}
                          onChange={(e) => setSubCategory(e.target.value)}
                          className="w-full px-3 py-2 bg-[#F8F8F8] border border-[#E8E8E8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E23744]/50 text-sm text-gray-900 placeholder-gray-400"
                        />
                        <datalist id="subcategory-suggestions">
                          <option value="Headphones" />
                          <option value="Earbuds" />
                          <option value="Speakers" />
                          <option value="Smartwatches" />
                          <option value="Backpacks" />
                          <option value="T-Shirts" />
                          <option value="Mice & Keyboards" />
                          <option value="Coffee & Tea" />
                          <option value="Chocolates" />
                          <option value="Home Decor" />
                        </datalist>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Discount label</label>
                        <input
                          type="text"
                          placeholder="e.g., 40% OFF"
                          value={discount}
                          onChange={(e) => setDiscount(e.target.value)}
                          className="w-full px-3 py-2 bg-[#F8F8F8] border border-[#E8E8E8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E23744]/50 text-sm text-gray-900 placeholder-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Unit</label>
                        <input
                          type="text"
                          placeholder="e.g., 1 piece"
                          value={unit}
                          onChange={(e) => setUnit(e.target.value)}
                          className="w-full px-3 py-2 bg-[#F8F8F8] border border-[#E8E8E8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E23744]/50 text-sm text-gray-900 placeholder-gray-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Rating</label>
                        <input
                          type="number"
                          step="0.1"
                          min="1"
                          max="5"
                          placeholder="e.g., 4.8"
                          value={rating}
                          onChange={(e) => setRating(e.target.value)}
                          className="w-full px-3 py-2 bg-[#F8F8F8] border border-[#E8E8E8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E23744]/50 text-sm text-gray-900 placeholder-gray-400"
                        />
                      </div>
                      <div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Product Description & Curation Notes</label>
                      <textarea
                        rows={3}
                        placeholder="Premium product description detailing the key features, specs, and curation notes. If empty, a professional curation summary will be automatically displayed."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3 py-2 bg-[#F8F8F8] border border-[#E8E8E8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E23744]/50 text-sm text-gray-900 placeholder-gray-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Product Image</label>
                      
                      {previewUrl ? (
                        <div className="relative group rounded-xl overflow-hidden border border-[#E8E8E8] bg-[#F8F8F8] aspect-video flex items-center justify-center p-2">
                          <img
                            src={previewUrl}
                            alt="Product upload preview"
                            className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={handleResetImage}
                              className="p-2.5 bg-red-600/95 text-white rounded-full hover:bg-red-700 transition-all transform scale-90 group-hover:scale-100 duration-300 shadow-md cursor-pointer"
                              title="Remove Image"
                            >
                              <X size={18} />
                            </button>
                          </div>
                          
                          {uploading && (
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white px-4">
                              <Loader2 className="animate-spin text-[#E23744] mb-2" size={28} />
                              <p className="text-xs font-semibold">Uploading to Cloud Storage...</p>
                              <div className="w-3/4 bg-gray-700 h-1.5 rounded-full mt-2 overflow-hidden border border-gray-800">
                                <div 
                                  className="bg-[#E23744] h-full transition-all duration-300 rounded-full" 
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-mono mt-1 text-gray-300">{uploadProgress}%</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          onDragEnter={handleDrag}
                          onDragOver={handleDrag}
                          onDragLeave={handleDrag}
                          onDrop={handleDrop}
                          className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer min-h-[140px] text-center ${
                            dragActive
                              ? "border-[#E23744] bg-[#E23744]/5 scale-[0.99] shadow-inner"
                              : "border-[#E8E8E8] hover:border-[#E23744] hover:bg-[#F8F8F8]"
                          }`}
                        >
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          
                          <div className="p-2.5 bg-[#F8F8F8] rounded-full text-gray-400 mb-2">
                            <UploadCloud size={24} />
                          </div>
                          <p className="text-xs font-semibold text-gray-700">
                            Drag and drop your image, or <span className="text-[#E23744] underline">browse</span>
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            Supports PNG, JPG, JPEG, WEBP, SVG (Max 25MB)
                          </p>
                        </div>
                      )}

                      {/* Manual paste field */}
                      <div className="mt-2">
                        <details className="group">
                          <summary className="text-[10px] font-semibold text-gray-400 hover:text-gray-500 cursor-pointer list-none flex items-center gap-1 select-none">
                            <span className="transition-transform duration-200 group-open:rotate-90">▶</span>
                            Or paste direct image URL instead
                          </summary>
                          <div className="mt-1.5 pl-2.5 border-l-2 border-[#E8E8E8]">
                            <input
                              type="url"
                              placeholder="e.g. https://images.unsplash.com/..."
                              value={image}
                              onChange={(e) => {
                                setImage(e.target.value);
                                setPreviewUrl(e.target.value);
                              }}
                              className="w-full px-3 py-1.5 bg-[#F8F8F8] border border-[#E8E8E8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E23744]/50 text-xs text-gray-900 placeholder-gray-400"
                            />
                          </div>
                        </details>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Merchant Affiliate Link <span className="text-red-400">*</span></label>
                      <input
                        type="url"
                        required
                        placeholder="e.g., https://amazon.in/..."
                        value={buyLink}
                        onChange={(e) => setBuyLink(e.target.value)}
                        className="w-full px-3 py-2 bg-[#F8F8F8] border border-[#E8E8E8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E23744]/50 text-sm text-gray-900 placeholder-gray-400"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#E23744] hover:bg-[#CB202D] text-white py-3 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer mt-3"
                    >
                      {editingProductId !== null ? "Update Product Details 💾" : "Publish to Catalog ⚡"}
                    </button>
                    
                    {editingProductId !== null && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer mt-2"
                      >
                        Cancel Edit ✕
                      </button>
                    )}
                  </form>
                </div>
              </div>

              {/* Catalog Listing Manager Column */}
              <div className="lg:col-span-2">
                <div className="bg-[#ffffff] rounded-2xl p-6 border border-[#E8E8E8] overflow-hidden">
                  <div className="flex justify-between items-center mb-5">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <List size={20} className="text-[#E23744]" />
                      Catalog Listings ({products.length})
                    </h2>
                    <span className="text-xs bg-[#F8F8F8] text-gray-500 px-3 py-1 rounded-full font-semibold border border-[#E8E8E8]">
                      LocalStorage Persistent
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-[#E8E8E8] text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                          <th className="pb-3 w-16">Item</th>
                          <th className="pb-3">Details</th>
                          <th className="pb-3 w-28">Price</th>
                          <th className="pb-3 w-20 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F5F5F5]">
                        {products.map((p) => (
                          <tr key={p.id} className="text-sm">
                            <td className="py-4.5 pr-3">
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#F8F8F8] border border-[#E8E8E8] flex-shrink-0 flex items-center justify-center p-0.5">
                                <img src={p.image} alt={p.name} className="max-w-full max-h-full object-contain" />
                              </div>
                            </td>
                            <td className="py-4.5 min-w-[200px] pr-3">
                              <p className="font-bold text-gray-900 line-clamp-1">{p.name}</p>
                              <span className="text-[10px] bg-[#F8F8F8] text-gray-500 uppercase tracking-wider font-bold px-2 py-0.5 rounded mt-1.5 inline-block border border-[#E8E8E8]">
                                {p.category}{p.subCategory ? ` • ${p.subCategory}` : ""}
                              </span>
                            </td>
                            <td className="py-4.5 font-semibold text-gray-900 pr-3">
                              <p>₹{p.price}</p>
                              {p.originalPrice && (
                                <p className="text-xs text-gray-400 line-through">₹{p.originalPrice}</p>
                              )}
                            </td>
                            <td className="py-4.5 text-right flex justify-end gap-1.5">
                              <button
                                onClick={() => handleEdit(p)}
                                className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                                title="Edit Product"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(p.id, p.name)}
                                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                                title="Delete Product"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Blog Review Articles Form Column */}
              <div className="lg:col-span-1">
                <div className="bg-[#ffffff] rounded-2xl p-6 border border-[#E8E8E8]">
                  <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                    {editingArticleId !== null ? (
                      <>
                        <ShieldCheck size={20} className="text-[#E23744]" />
                        Edit Review Article
                      </>
                    ) : (
                      <>
                        <PlusCircle size={20} className="text-[#E23744]" />
                        Write Review Article
                      </>
                    )}
                  </h2>

                  <form onSubmit={handleBlogSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Article Title <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Premium Wireless Headphones Review"
                        value={articleTitle}
                        onChange={(e) => setArticleTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-[#F8F8F8] border border-[#E8E8E8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E23744]/50 text-sm text-gray-900 placeholder-gray-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Excerpt / Summary <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="Short summary of the review..."
                        value={articleExcerpt}
                        onChange={(e) => setArticleExcerpt(e.target.value)}
                        className="w-full px-3 py-2 bg-[#F8F8F8] border border-[#E8E8E8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E23744]/50 text-sm text-gray-900 placeholder-gray-400"
                      />
                    </div>



                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-semibold text-gray-500">Affiliate / Buy Links (Max 5)</label>
                        {articleAffiliateLinks.length < 5 && (
                          <button
                            type="button"
                            onClick={() => setArticleAffiliateLinks(prev => [...prev, { label: "", url: "" }])}
                            className="text-xs font-bold text-[#E23744] hover:text-[#CB202D] hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            + Add Link
                          </button>
                        )}
                      </div>

                      {articleAffiliateLinks.length === 0 ? (
                        <div>
                          <input
                            type="url"
                            placeholder="Primary affiliate URL (e.g. https://amazon.in/dp/...)"
                            value={articleAffiliateLink}
                            onChange={(e) => {
                              setArticleAffiliateLink(e.target.value);
                            }}
                            className="w-full px-3 py-2 bg-[#F8F8F8] border border-[#E8E8E8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E23744]/50 text-sm text-gray-900 placeholder-gray-400"
                          />
                          <p className="text-[10px] text-gray-400 mt-1">
                            Click "+ Add Link" above if you want to display multiple merchant options (up to 5 buttons).
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-60 overflow-y-auto p-1.5 bg-gray-50/50 rounded-xl border border-gray-100">
                          {articleAffiliateLinks.map((link, idx) => (
                            <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded-lg border border-gray-100 shadow-2xs">
                              <input
                                type="text"
                                required
                                placeholder="Label (e.g. Amazon)"
                                value={link.label}
                                onChange={(e) => {
                                  const updated = [...articleAffiliateLinks];
                                  updated[idx].label = e.target.value;
                                  setArticleAffiliateLinks(updated);
                                }}
                                className="w-1/3 px-2 py-1.5 bg-[#F8F8F8] border border-[#E8E8E8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E23744]/50 text-xs text-gray-900 font-semibold"
                              />
                              <input
                                type="url"
                                required
                                placeholder="Affiliate URL"
                                value={link.url}
                                onChange={(e) => {
                                  const updated = [...articleAffiliateLinks];
                                  updated[idx].url = e.target.value;
                                  setArticleAffiliateLinks(updated);
                                  if (idx === 0) setArticleAffiliateLink(e.target.value);
                                }}
                                className="flex-1 px-2 py-1.5 bg-[#F8F8F8] border border-[#E8E8E8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E23744]/50 text-xs text-gray-900"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = articleAffiliateLinks.filter((_, i) => i !== idx);
                                  setArticleAffiliateLinks(updated);
                                  if (updated.length > 0) {
                                    setArticleAffiliateLink(updated[0].url);
                                  } else {
                                    setArticleAffiliateLink("");
                                  }
                                }}
                                className="p-1 text-gray-400 hover:text-red-500 cursor-pointer"
                                title="Delete link"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Price Override (₹)</label>
                        <input
                          type="number"
                          placeholder="e.g. 2999"
                          value={articlePrice}
                          onChange={(e) => setArticlePrice(e.target.value)}
                          className="w-full px-3 py-2 bg-[#F8F8F8] border border-[#E8E8E8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E23744]/50 text-sm text-gray-900 placeholder-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Rating Override</label>
                        <input
                          type="number"
                          step="0.1"
                          min="1"
                          max="5"
                          placeholder="4.8"
                          value={articleRating}
                          onChange={(e) => setArticleRating(e.target.value)}
                          className="w-full px-3 py-2 bg-[#F8F8F8] border border-[#E8E8E8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E23744]/50 text-sm text-gray-900 placeholder-gray-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Author</label>
                        <input
                          type="text"
                          value={articleAuthor}
                          onChange={(e) => setArticleAuthor(e.target.value)}
                          className="w-full px-3 py-2 bg-[#F8F8F8] border border-[#E8E8E8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E23744]/50 text-sm text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Date</label>
                        <input
                          type="text"
                          value={articleDate}
                          onChange={(e) => setArticleDate(e.target.value)}
                          className="w-full px-3 py-2 bg-[#F8F8F8] border border-[#E8E8E8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E23744]/50 text-sm text-gray-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Full Content <span className="text-red-400">*</span></label>
                      <p className="text-[10px] text-gray-400 mb-1">Separate paragraphs with double newlines (hit enter twice).</p>
                      <textarea
                        required
                        rows={8}
                        placeholder="Write your in-depth review content here..."
                        value={articleContent}
                        onChange={(e) => setArticleContent(e.target.value)}
                        className="w-full px-3 py-2 bg-[#F8F8F8] border border-[#E8E8E8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E23744]/50 text-sm text-gray-900 placeholder-gray-400 font-sans leading-relaxed text-left"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Review Banner Image</label>
                      {articlePreviewUrl ? (
                        <div className="relative group rounded-xl overflow-hidden border border-[#E8E8E8] bg-[#F8F8F8] aspect-video flex items-center justify-center p-2">
                          <img
                            src={articlePreviewUrl}
                            alt="Article upload preview"
                            className="max-w-full max-h-full object-contain"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => { setArticleImage(""); setArticlePreviewUrl(""); }}
                              className="p-2.5 bg-red-600/95 text-white rounded-full hover:bg-red-700 transition-all cursor-pointer"
                            >
                              <X size={18} />
                            </button>
                          </div>
                          {articleUploading && (
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white px-4">
                              <Loader2 className="animate-spin text-[#E23744] mb-2" size={28} />
                              <p className="text-xs font-semibold">Uploading banner...</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="relative border-2 border-dashed border-[#E8E8E8] hover:border-[#E23744] rounded-xl p-4 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer min-h-[100px] text-center">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              if (e.target.files && e.target.files[0]) {
                                await handleArticleImageUpload(e.target.files[0]);
                              }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <UploadCloud size={20} className="text-gray-400 mb-1" />
                          <p className="text-xs text-gray-600">Drag or click to upload banner image</p>
                        </div>
                      )}
                      <div className="mt-2">
                        <details className="group">
                          <summary className="text-[10px] font-semibold text-gray-400 hover:text-gray-500 cursor-pointer list-none flex items-center gap-1 select-none">
                            <span className="transition-transform duration-200 group-open:rotate-90">▶</span> Or paste direct image URL instead
                          </summary>
                          <div className="mt-1.5">
                            <input
                              type="url"
                              placeholder="e.g. https://images.unsplash.com/..."
                              value={articleImage}
                              onChange={(e) => {
                                setArticleImage(e.target.value);
                                setArticlePreviewUrl(e.target.value);
                              }}
                              className="w-full px-3 py-1.5 bg-[#F8F8F8] border border-[#E8E8E8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E23744]/50 text-xs text-gray-900 placeholder-gray-400"
                            />
                          </div>
                        </details>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#E23744] hover:bg-[#CB202D] text-white py-3 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer mt-3"
                    >
                      {editingArticleId !== null ? "Update Review Article 💾" : "Publish Review ⚡"}
                    </button>

                    {editingArticleId !== null && (
                      <button
                        type="button"
                        onClick={handleCancelEditArticle}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer mt-2"
                      >
                        Cancel Edit ✕
                      </button>
                    )}
                  </form>
                </div>
              </div>

              {/* Review Listings Column */}
              <div className="lg:col-span-2">
                <div className="bg-[#ffffff] rounded-2xl p-6 border border-[#E8E8E8] overflow-hidden">
                  <div className="flex justify-between items-center mb-5">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <List size={20} className="text-[#E23744]" />
                      Review Articles ({articles.length})
                    </h2>
                    <span className="text-xs bg-[#F8F8F8] text-gray-500 px-3 py-1 rounded-full font-semibold border border-[#E8E8E8]">
                      LocalStorage & Firestore
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-[#E8E8E8] text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                          <th className="pb-3 w-16">Banner</th>
                          <th className="pb-3">Title & Author</th>
                          <th className="pb-3 w-28">Product Price</th>
                          <th className="pb-3 w-20 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F5F5F5]">
                        {articles.map((art) => (
                          <tr key={art.id} className="text-sm">
                            <td className="py-4.5 pr-3">
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#F8F8F8] border border-[#E8E8E8] flex-shrink-0 flex items-center justify-center p-0.5">
                                <img src={art.image} alt={art.title} className="max-w-full max-h-full object-cover" />
                              </div>
                            </td>
                            <td className="py-4.5 min-w-[200px] pr-3">
                              <p className="font-bold text-gray-900 line-clamp-1">{art.title}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                By {art.author} on {art.date}
                              </p>
                            </td>
                            <td className="py-4.5 font-semibold text-gray-900 pr-3">
                              <p>₹{art.productPrice}</p>
                              <span className="text-[9px] bg-red-50 text-[#E23744] font-bold px-1.5 py-0.5 rounded inline-block mt-1 border border-red-100">
                                ★ {art.rating}
                              </span>
                            </td>
                            <td className="py-4.5 text-right flex justify-end gap-1.5">
                              <button
                                onClick={() => handleEditArticle(art)}
                                className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                                title="Edit Review"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteArticle(art.id, art.title)}
                                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                                title="Delete Review"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Admin Toast Alerts */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-55 bg-gray-900/95 backdrop-blur-xs text-white px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 border border-gray-800 text-sm max-w-sm sm:max-w-md"
          >
            <CheckCircle2 className="text-[#E23744] flex-shrink-0" size={20} />
            <span className="font-medium text-left">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
