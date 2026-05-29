import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Trash2, Edit, PlusCircle, ShoppingBag, DollarSign, List, ShieldCheck, CheckCircle2, UploadCloud, X, Loader2, Sparkles, Wand2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useCart } from "../context/CartContext";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage, isFirebaseConfigured } from "../lib/firebase";
import { generateProductWithAI, generateProductFromAmazonLink, isAmazonUrl, isGeminiConfigured } from "../lib/gemini";

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
  const { products, addProduct, deleteProduct, updateProduct, cart } = useCart();

  // Form State
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [category, setCategory] = useState("Electronics");
  const [unit, setUnit] = useState("1 piece");
  const [rating, setRating] = useState("4.8");
  const [image, setImage] = useState("");
  const [buyLink, setBuyLink] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
        name,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        discount: discount || undefined,
        rating: parseFloat(rating) || 4.8,
        category,
        unit,
        image: finalImage,
        buyLink
      });
      triggerToast(`Product "${name}" updated successfully!`);
      setEditingProductId(null);
    } else {
      addProduct({
        name,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        discount: discount || undefined,
        rating: parseFloat(rating) || 4.8,
        category,
        unit,
        image: finalImage,
        buyLink
      });
      triggerToast(`Product "${name}" added to catalog successfully!`);
    }

    // Reset Form
    setName("");
    setPrice("");
    setOriginalPrice("");
    setDiscount("");
    setUnit("1 piece");
    setRating("4.8");
    setImage("");
    setPreviewUrl("");
    setBuyLink("");
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
      setUnit(generated.unit);
      setRating(generated.rating.toString());
      setImage(generated.image);
      setPreviewUrl(generated.image);
      setBuyLink(generated.buyLink);
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
    setUnit(product.unit || "1 piece");
    setRating(product.rating.toString());
    setImage(product.image);
    setPreviewUrl(product.image);
    setBuyLink(product.buyLink || "");
    
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
    setUnit("1 piece");
    setRating("4.8");
    setImage("");
    setPreviewUrl("");
    setBuyLink("");
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

  // Quick stats calculations
  const totalCatalogValue = products.reduce((sum, p) => sum + p.price, 0);
  const averagePrice = products.length > 0 ? (totalCatalogValue / products.length).toFixed(0) : "0";

  return (
    <div className="min-h-screen bg-[#F8F8F8] pt-32 pb-16">
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

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Active Products", val: products.length, icon: List, col: "text-[#E23744] bg-[#E23744]/10" },
            { label: "Est. Catalog Value", val: `₹${totalCatalogValue.toLocaleString()}`, icon: DollarSign, col: "text-blue-400 bg-blue-500/10" },
            { label: "Avg. Item Price", val: `₹${averagePrice}`, icon: DollarSign, col: "text-purple-400 bg-purple-500/10" },
            { label: "Shortlisted Watchers", val: `${cart.length} saves`, icon: ShoppingBag, col: "text-amber-400 bg-amber-500/10" }
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
          
          {/* Add Product Form Column */}
          <div className="lg:col-span-1">
            <div className="bg-[#ffffff] rounded-2xl p-6 border border-[#E8E8E8]">

              {/* ✨ AI Product Generator Section */}
              {editingProductId === null && (
                <div className="mb-6">
                  <div className="relative overflow-hidden rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50/80 via-pink-50/50 to-red-50/40 p-5">
                    {/* Decorative shimmer */}
                    <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-purple-300/20 to-pink-300/20 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-gradient-to-br from-pink-300/15 to-red-300/15 rounded-full blur-2xl pointer-events-none" />

                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg text-white shadow-sm">
                          <Sparkles size={16} />
                        </div>
                        <h3 className="text-sm font-bold text-gray-800">Generate with AI</h3>
                        {!isGeminiConfigured && (
                          <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase">API Key Required</span>
                        )}
                      </div>

                      <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">
                        <strong>Paste an Amazon link</strong> or describe any product — AI auto-fills all fields including name, price, category, keywords & image.
                      </p>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder='Paste Amazon link or describe: "wireless earbuds under ₹2000"'
                          value={aiPrompt}
                          onChange={(e) => { setAiPrompt(e.target.value); setAiError(null); }}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAiGenerate(); } }}
                          disabled={aiGenerating}
                          className="flex-1 px-3 py-2.5 bg-white/90 border border-purple-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400/40 focus:border-purple-300 text-sm text-gray-800 placeholder-gray-400 disabled:opacity-50 transition-all"
                        />
                        <button
                          type="button"
                          onClick={handleAiGenerate}
                          disabled={aiGenerating || !aiPrompt.trim()}
                          className="px-4 py-2.5 bg-gradient-to-r from-purple-600 via-pink-500 to-[#E23744] hover:from-purple-700 hover:via-pink-600 hover:to-[#CB202D] text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 min-w-[130px] justify-center"
                        >
                          {aiGenerating ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Wand2 size={14} />
                              Generate ✨
                            </>
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
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8F8F8] border border-[#E8E8E8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E23744]/50 text-sm text-gray-900"
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Fashion">Fashion</option>
                      <option value="Audio">Audio</option>
                      <option value="Watches">Watches</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Workspace">Workspace</option>
                      <option value="Grocery">Grocery</option>
                      <option value="Chocolates">Chocolates</option>
                      <option value="Beverages">Beverages</option>
                      <option value="Gifts">Gifts</option>
                    </select>
                  </div>
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
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Product Image</label>
                  
                  {previewUrl ? (
                    /* Thumbnail Preview */
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
                          className="p-2.5 bg-red-600/95 text-gray-900 rounded-full hover:bg-red-700 transition-all transform scale-90 group-hover:scale-100 duration-300 shadow-md cursor-pointer"
                          title="Remove Image"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      
                      {uploading && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-gray-900 px-4">
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
                    /* Drag & Drop Area */
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
                            {p.category}
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
