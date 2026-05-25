import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Trash2, PlusCircle, ShoppingBag, DollarSign, List, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useCart } from "../context/CartContext";

interface AdminPageProps {
  onBack: () => void;
}

export function AdminPage({ onBack }: AdminPageProps) {
  const { products, addProduct, deleteProduct, cart } = useCart();

  // Form State
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

    // Reset Form
    setName("");
    setPrice("");
    setOriginalPrice("");
    setDiscount("");
    setUnit("1 piece");
    setRating("4.8");
    setImage("");
    setBuyLink("");
  };

  const handleDelete = (id: number, productName: string) => {
    if (confirm(`Are you sure you want to delete "${productName}" from the catalog?`)) {
      deleteProduct(id);
      triggerToast(`Product "${productName}" removed from catalog.`);
    }
  };

  // Quick stats calculations
  const totalCatalogValue = products.reduce((sum, p) => sum + p.price, 0);
  const averagePrice = products.length > 0 ? (totalCatalogValue / products.length).toFixed(0) : "0";

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Navigation */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-[#0c831f] mb-6 transition-colors cursor-pointer"
        >
          <ChevronLeft size={20} />
          Exit Admin Panel
        </button>

        <div className="flex items-center gap-3 mb-8">
          <ShieldCheck size={36} className="text-[#0c831f]" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">noirkart Admin Control Center</h1>
            <p className="text-xs text-gray-500">Add, review, and delete premium curated external links from the public store catalog.</p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Active Products", val: products.length, icon: List, col: "text-[#0c831f] bg-green-50" },
            { label: "Est. Catalog Value", val: `₹${totalCatalogValue.toLocaleString()}`, icon: DollarSign, col: "text-blue-600 bg-blue-50" },
            { label: "Avg. Item Price", val: `₹${averagePrice}`, icon: DollarSign, col: "text-purple-600 bg-purple-50" },
            { label: "Shortlisted Watchers", val: `${cart.length} saves`, icon: ShoppingBag, col: "text-amber-600 bg-amber-50" }
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-xl shadow-xs p-5 border border-gray-100 flex items-center justify-between">
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
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
                <PlusCircle size={20} className="text-[#0c831f]" />
                Add Curated Product
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Product Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Premium mechanical keyboard"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0c831f] text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Price (₹) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g., 2999"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0c831f] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Orig. Price (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g., 4999"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0c831f] text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0c831f] text-sm"
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Fashion">Fashion</option>
                      <option value="Audio">Audio</option>
                      <option value="Watches">Watches</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Workspace">Workspace</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Discount label</label>
                    <input
                      type="text"
                      placeholder="e.g., 40% OFF"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0c831f] text-sm"
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
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0c831f] text-sm"
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
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0c831f] text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Image URL</label>
                  <input
                    type="url"
                    placeholder="Leave empty for generic default image"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0c831f] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Merchant Affiliate Link <span className="text-red-500">*</span></label>
                  <input
                    type="url"
                    required
                    placeholder="e.g., https://amazon.in/..."
                    value={buyLink}
                    onChange={(e) => setBuyLink(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0c831f] text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#0c831f] hover:bg-[#0a6b1a] text-white py-3 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer mt-3"
                >
                  Publish to Catalog ⚡
                </button>
              </form>
            </div>
          </div>

          {/* Catalog Listing Manager Column */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 overflow-hidden">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <List size={20} className="text-[#0c831f]" />
                  Catalog Listings ({products.length})
                </h2>
                <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-semibold">
                  LocalStorage Persistent
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <th className="pb-3 w-16">Item</th>
                      <th className="pb-3">Details</th>
                      <th className="pb-3 w-28">Price</th>
                      <th className="pb-3 w-20 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {products.map((p) => (
                      <tr key={p.id} className="text-sm">
                        <td className="py-4.5 pr-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                        </td>
                        <td className="py-4.5 min-w-[200px] pr-3">
                          <p className="font-bold text-gray-900 line-clamp-1">{p.name}</p>
                          <span className="text-[10px] bg-gray-100 text-gray-500 uppercase tracking-wider font-bold px-2 py-0.5 rounded mt-1.5 inline-block">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-4.5 font-semibold text-gray-900 pr-3">
                          <p>₹{p.price}</p>
                          {p.originalPrice && (
                            <p className="text-xs text-gray-400 line-through">₹{p.originalPrice}</p>
                          )}
                        </td>
                        <td className="py-4.5 text-right">
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors cursor-pointer inline-flex items-center"
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
            <CheckCircle2 className="text-[#0c831f] flex-shrink-0" size={20} />
            <span className="font-medium text-left">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
