import { motion } from "motion/react";
import { Trash2, Plus, Minus, ShoppingBag, ChevronLeft, Tag } from "lucide-react";
import { Button } from "../components/Button";
import { useCart } from "../context/CartContext";
import { useState } from "react";

interface CartPageProps {
  onBack: () => void;
}

export function CartPage({ onBack }: CartPageProps) {
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);

  const deliveryFee = cartTotal > 99 ? 0 : 20;
  const total = cartTotal - discount + deliveryFee;

  const handleApplyPromo = () => {
    if (promoCode.toLowerCase() === "save10") {
      setDiscount(cartTotal * 0.1);
      alert("Promo code applied! ₹" + (cartTotal * 0.1).toFixed(0) + " discount");
    } else {
      alert("Invalid promo code");
    }
  };

  const handleCheckout = () => {
    alert("Proceeding to checkout... (This is a demo)");
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-white rounded-2xl shadow-sm p-12">
              <ShoppingBag className="mx-auto mb-6 text-gray-300" size={80} />
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Your Cart is Empty</h2>
              <p className="text-gray-600 mb-8">Add items to get started</p>
              <Button variant="primary" size="lg" onClick={onBack}>
                Start Shopping
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-[#0c831f] mb-6 transition-colors"
        >
          <ChevronLeft size={20} />
          Continue Shopping
        </button>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">My Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item, index) => (
              <motion.div
                key={item.id}
                className="bg-white rounded-xl shadow-sm p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{item.name}</h3>
                        <p className="text-sm text-gray-500">{item.unit}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 rounded-lg hover:bg-red-50 transition-colors ml-2"
                      >
                        <Trash2 className="text-red-500" size={18} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3 bg-gray-100 rounded-lg px-3 py-1.5">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="text-gray-600 hover:text-[#0c831f]"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="font-bold text-gray-900 min-w-[24px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="text-gray-600 hover:text-[#0c831f]"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <span className="text-lg font-bold text-gray-900">
                        ₹{(item.price * item.quantity).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            <button
              onClick={clearCart}
              className="text-sm text-red-500 hover:text-red-600 transition-colors flex items-center gap-2"
            >
              <Trash2 size={16} />
              Clear Cart
            </button>
          </div>

          <div className="lg:col-span-1">
            <motion.div
              className="bg-white rounded-xl shadow-sm p-6 sticky top-32"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">Bill Details</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{cartTotal.toFixed(0)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{discount.toFixed(0)}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</span>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900">To Pay</span>
                    <span className="text-gray-900">₹{total.toFixed(0)}</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="text-sm text-gray-600 mb-2 block flex items-center gap-2">
                  <Tag size={16} />
                  Apply Promo Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter code"
                    className="flex-1 px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0c831f] text-sm"
                  />
                  <Button variant="secondary" size="sm" onClick={handleApplyPromo}>
                    Apply
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Try: SAVE10 for 10% off</p>
              </div>

              <Button variant="primary" size="lg" className="w-full mb-4" onClick={handleCheckout}>
                Proceed to Pay
              </Button>

              {cartTotal < 99 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                  Add ₹{(99 - cartTotal).toFixed(0)} more for FREE delivery
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
