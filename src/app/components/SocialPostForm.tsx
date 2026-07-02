import React, { useState } from "react";
import { Product } from "./ProductCard";
import { postProductToInstagram } from "../lib/instagram";
import { postProductToPinterest } from "../lib/pinterest";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { 
  Instagram, 
  Download, 
  Check, 
  Send, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Sparkles, 
  Loader2, 
  Eye,
  FileText
} from "lucide-react";

interface SocialPostFormProps {
  products: Product[];
  triggerToast: (msg: string) => void;
}

export function SocialPostForm({ products, triggerToast }: SocialPostFormProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [link, setLink] = useState<string>("https://noirkart.com");
  const [imageUrl, setImageUrl] = useState<string>("");
  
  const [postToInstagram, setPostToInstagram] = useState<boolean>(true);
  const [postToPinterest, setPostToPinterest] = useState<boolean>(false);
  
  const [isPosting, setIsPosting] = useState<boolean>(false);
  const [previewTab, setPreviewTab] = useState<"instagram" | "pinterest">("instagram");
  const [isIgFallbackOpen, setIsIgFallbackOpen] = useState<boolean>(false);

  // Handle auto-filling details from product
  const handleQuickFill = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const prodId = e.target.value;
    setSelectedProductId(prodId);
    if (!prodId) return;

    const prod = products.find(p => p.id.toString() === prodId);
    if (prod) {
      setTitle(prod.name);
      setImageUrl(prod.image);
      setLink(prod.buyLink || `https://noirkart.com/?product=${prod.id}`);
      
      // Build a clean initial description
      const discPart = prod.discount ? `🏷️ Deal: ${prod.discount}` : "";
      const priceText = `💰 Price: ₹${prod.price.toLocaleString("en-IN")}`;
      const originalText = prod.originalPrice ? `(was ₹${prod.originalPrice.toLocaleString("en-IN")})` : "";
      
      const parts = [
        `🔥 ${prod.name} 🔥`,
        discPart,
        priceText,
        originalText,
        `\n✨ Curated by NoirKart — Shop with confidence using verified, direct-to-merchant links.`,
        `👉 Link: ${prod.buyLink || `https://noirkart.com/?product=${prod.id}`}`,
        `\n#NoirKart #PremiumDeals #IndiaDeals #InstagramShopping #${prod.category.replace(/\s+/g, "")}`
      ];
      setDescription(parts.filter(Boolean).join(" "));
    }
  };

  // Direct image downloader
  const handleDownloadImage = () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `${title.replace(/\s+/g, "_") || "social_post"}.jpg`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Submit Handler
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl || !description) {
      alert("Please provide an image URL and a post caption.");
      return;
    }
    if (!postToInstagram && !postToPinterest) {
      alert("Please check at least one platform to publish.");
      return;
    }

    setIsPosting(true);
    
    // Construct a pseudo product payload
    const pseudoProduct: Product = {
      id: Number(selectedProductId) || Date.now(),
      name: title || "NoirKart Deal",
      price: 0,
      category: "General",
      image: imageUrl,
      buyLink: link
    };

    try {
      let instaSuccess = false;
      let instaMethod: "api" | "fallback" = "fallback";
      let pinSuccess = false;

      // 1. Post to Instagram
      if (postToInstagram) {
        const result = await postProductToInstagram(pseudoProduct);
        instaSuccess = result.success;
        instaMethod = result.method;
        if (instaMethod === "api") {
          triggerToast("✅ Instagram Direct Auto-Post published successfully!");
        } else {
          setIsIgFallbackOpen(true);
        }
      }

      // 2. Post to Pinterest
      if (postToPinterest) {
        // Direct call to Pinterest
        await postProductToPinterest(pseudoProduct);
        pinSuccess = true;
        triggerToast("✅ Product shared/auto-pinned to Pinterest!");
      }
      
    } catch (err: any) {
      console.error(err);
      triggerToast(`⚠️ Publishing action returned an error: ${err.message || err}`);
    } finally {
      setIsPosting(false);
    }
  };

  const imagePlaceholder = "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=600&auto=format&fit=crop";

  return (
    <div className="bg-[#ffffff] rounded-2xl p-6 border border-[#E8E8E8] shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="text-[#E23744]" size={22} />
            Direct Social Media Post
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Publish custom captions and images directly to Instagram and Pinterest without modifying the catalog.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Form Column */}
        <form onSubmit={handlePublish} className="lg:col-span-7 space-y-5">
          
          {/* Quick Fill Select */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              ⚡ Quick-Fill from Catalog
            </label>
            <select
              value={selectedProductId}
              onChange={handleQuickFill}
              className="w-full px-3.5 py-2.5 bg-[#F8F8F8] border border-[#E8E8E8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E23744]/30 text-sm text-gray-900 font-medium"
            >
              <option value="">-- Choose an existing product (Optional) --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (₹{p.price})
                </option>
              ))}
            </select>
          </div>

          <hr className="border-gray-100" />

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <FileText size={13} /> Post Title / Name
            </label>
            <input
              type="text"
              placeholder="e.g. Premium Ergonomic Keyboard Deal"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F8F8F8] border border-[#E8E8E8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E23744]/30 text-sm text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Link URL */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <LinkIcon size={13} /> Link / Target Destination URL
            </label>
            <input
              type="url"
              placeholder="https://noirkart.com/?product=..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F8F8F8] border border-[#E8E8E8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E23744]/30 text-sm text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <ImageIcon size={13} /> Product Image URL
            </label>
            <input
              type="url"
              required
              placeholder="https://images.unsplash.com/..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F8F8F8] border border-[#E8E8E8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E23744]/30 text-sm text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Post Description / Caption */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                ✍️ Post Caption / Description
              </label>
              <span className={`text-[10px] font-bold ${description.length > 2200 ? "text-red-500" : "text-gray-400"}`}>
                {description.length} / 2200 chars (Insta limit)
              </span>
            </div>
            <textarea
              required
              rows={6}
              placeholder="Write a compelling caption containing features, pricing, discount, and hashtags..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F8F8F8] border border-[#E8E8E8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E23744]/30 text-sm text-gray-900 placeholder-gray-400 font-sans leading-relaxed text-left"
            />
          </div>

          {/* Destination Platform Checkbox Grid */}
          <div className="bg-[#F9FAFB] rounded-xl p-4 border border-gray-100">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              📢 Target Share Platforms
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${postToInstagram ? "bg-pink-50/50 border-pink-200 text-[#E1306C]" : "bg-white border-gray-200 text-gray-500"}`}>
                <input
                  type="checkbox"
                  checked={postToInstagram}
                  onChange={(e) => setPostToInstagram(e.target.checked)}
                  className="rounded text-[#E1306C] focus:ring-[#E1306C] w-4 h-4"
                />
                <div>
                  <p className="text-xs font-bold flex items-center gap-1">
                    <Instagram size={14} /> Instagram Feed
                  </p>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Posts image & caption</p>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${postToPinterest ? "bg-red-55/40 border-red-200 text-[#BD081C]" : "bg-white border-gray-200 text-gray-500"}`}>
                <input
                  type="checkbox"
                  checked={postToPinterest}
                  onChange={(e) => setPostToPinterest(e.target.checked)}
                  className="rounded text-[#BD081C] focus:ring-[#BD081C] w-4 h-4"
                />
                <div>
                  <p className="text-xs font-bold flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" className="w-[13px] h-[13px] inline" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.08 3.16 9.4 7.63 11.16-.1-.95-.2-2.4.04-3.43.22-.93 1.4-5.93 1.4-5.93s-.36-.72-.36-1.77c0-1.66.96-2.9 2.17-2.9 1.02 0 1.52.77 1.52 1.68 0 1.03-.65 2.57-.99 4c-.28 1.19.6 2.16 1.77 2.16 2.12 0 3.76-2.24 3.76-5.47 0-2.86-2.06-4.86-5-4.86-3.4 0-5.4 2.56-5.4 5.2 0 1.03.4 2.14.9 2.74.1.12.1.23.08.34l-.34 1.4c-.06.24-.18.28-.4.18-1.5-.7-2.43-2.9-2.43-4.66 0-3.8 2.76-7.3 7.97-7.3 4.18 0 7.43 2.98 7.43 6.96 0 4.16-2.62 7.5-6.26 7.5-1.22 0-2.37-.63-2.76-1.38l-.75 2.87c-.27 1.04-1.02 2.34-1.5 3.13C10.74 23.83 11.36 24 12 24c6.63 0 12-5.37 12-12S18.63 0 12 0z"/>
                    </svg> Pinterest Pin
                  </p>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Pins title, description & url</p>
                </div>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPosting}
            className="w-full bg-[#E23744] hover:bg-[#CB202D] disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 border-none"
          >
            {isPosting ? (
              <>
                <Loader2 className="animate-spin" size={16} /> Publishing Social Post...
              </>
            ) : (
              <>
                <Send size={15} /> Publish Social Post Now
              </>
            )}
          </button>
        </form>

        {/* Live Mock Preview Column */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Eye size={14} /> Real-Time Mock Preview
            </span>
            <div className="flex bg-gray-100 rounded-lg p-0.5 border border-gray-200">
              <button
                type="button"
                onClick={() => setPreviewTab("instagram")}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${previewTab === "instagram" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-700"}`}
              >
                Instagram
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab("pinterest")}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${previewTab === "pinterest" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-700"}`}
              >
                Pinterest
              </button>
            </div>
          </div>

          <div className="flex-1 bg-[#F9FAFB] border border-[#E8E8E8] rounded-2xl p-4 flex items-center justify-center min-h-[380px]">
            {previewTab === "instagram" ? (
              /* Instagram Mobile Post Preview */
              <div className="w-full max-w-[280px] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm text-left">
                {/* Header */}
                <div className="flex items-center gap-2 p-2.5 border-b border-gray-100">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#FFB6C1] to-[#FF69B4] flex items-center justify-center text-white text-[10px] font-black">NK</div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-900 leading-none">noir_kart.in</p>
                    <p className="text-[8px] text-gray-400 mt-0.5 leading-none">Sponsored • Vetted Deals</p>
                  </div>
                </div>

                {/* Post Image */}
                <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden border-b border-gray-100 relative">
                  <img
                    src={imageUrl || imagePlaceholder}
                    alt="Mock Preview"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Buttons Bar */}
                <div className="flex items-center justify-between px-2.5 py-2">
                  <div className="flex gap-2">
                    <span className="text-gray-600 text-sm select-none">❤️</span>
                    <span className="text-gray-600 text-sm select-none">💬</span>
                    <span className="text-gray-600 text-sm select-none">✈️</span>
                  </div>
                  <span className="text-gray-600 text-sm select-none">🔖</span>
                </div>

                {/* Caption Details */}
                <div className="px-2.5 pb-3">
                  <p className="text-[10px] leading-relaxed text-gray-800 line-clamp-4">
                    <strong className="font-extrabold text-gray-900 mr-1">noir_kart.in</strong>
                    {description || "Add description text using the textarea box to preview formatting..."}
                  </p>
                </div>
              </div>
            ) : (
              /* Pinterest Pin Mock Card */
              <div className="w-full max-w-[220px] bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm text-left p-2.5">
                <div className="rounded-xl overflow-hidden bg-gray-50 aspect-[3/4] flex items-center justify-center border border-gray-100 relative">
                  <img
                    src={imageUrl || imagePlaceholder}
                    alt="Mock Pin Preview"
                    className="w-full h-full object-cover"
                  />
                  {link && (
                    <div className="absolute bottom-2 left-2 bg-white/95 px-2 py-0.5 rounded-full text-[8px] font-bold text-gray-800 shadow-sm flex items-center gap-0.5 max-w-[120px] truncate">
                      <LinkIcon size={8} /> noirkart.com
                    </div>
                  )}
                </div>
                <div className="mt-2.5">
                  <h3 className="text-xs font-bold text-gray-900 leading-snug line-clamp-2">
                    {title || "Add a title to review layout..."}
                  </h3>
                  <p className="text-[9px] text-gray-400 leading-normal mt-1 line-clamp-2">
                    {description || "Enter details..."}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2.5 pt-1.5 border-t border-gray-50">
                    <div className="w-4 h-4 rounded-full bg-slate-900 flex items-center justify-center text-white text-[8px] font-bold">N</div>
                    <span className="text-[9px] font-semibold text-gray-700">NoirKart</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Manual share Guide modal */}
      <Dialog open={isIgFallbackOpen} onOpenChange={setIsIgFallbackOpen}>
        <DialogContent className="max-w-md bg-white border border-gray-100 shadow-xl rounded-2xl p-6 text-left">
          <DialogHeader className="space-y-3">
            <div className="mx-auto w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center text-[#E1306C]">
              <Instagram size={24} />
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900 text-center">Instagram Manual Publishing</DialogTitle>
            <DialogDescription className="text-sm text-gray-500 text-center">
              Instagram does not support direct web publishing links. Follow these quick steps to post this curated product.
            </DialogDescription>
          </DialogHeader>

          <div className="my-6 space-y-4">
            <div className="flex items-start gap-3 p-3 bg-green-50/70 border border-green-100 rounded-xl">
              <Check className="text-green-600 mt-0.5 shrink-0" size={18} />
              <div className="text-xs text-green-800">
                <strong>Caption Copied!</strong> The formatted product caption (including the verified check-out link and tags) has been successfully copied to your clipboard.
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex gap-3 text-xs leading-relaxed text-gray-600 font-medium">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-gray-700 font-bold flex items-center justify-center shrink-0">1</span>
                <div>
                  Save the product image to your local device.
                  <button 
                    onClick={handleDownloadImage}
                    className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-[#E23744] hover:underline cursor-pointer border-none bg-transparent p-0"
                  >
                    <Download size={12} /> Download Product Image
                  </button>
                </div>
              </div>

              <div className="flex gap-3 text-xs leading-relaxed text-gray-600 font-medium">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-gray-700 font-bold flex items-center justify-center shrink-0">2</span>
                <div>
                  We have opened your Instagram account page in a new tab. Select <strong>Create Post / Story</strong>.
                </div>
              </div>

              <div className="flex gap-3 text-xs leading-relaxed text-gray-600 font-medium">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-gray-700 font-bold flex items-center justify-center shrink-0">3</span>
                <div>
                  Choose the saved image, paste the caption from your clipboard, and publish!
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setIsIgFallbackOpen(false)}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer text-center border-none"
            >
              Done
            </button>
            <a
              href={import.meta.env.VITE_INSTAGRAM_PROFILE_URL || "https://www.instagram.com"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F56040] hover:opacity-90 text-white font-bold text-xs rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 no-underline font-sans"
            >
              Open Instagram ↗
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
