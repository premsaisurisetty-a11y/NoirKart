import { motion, AnimatePresence } from "motion/react";
import { Heart, User, Mail, Lock, X, LogOut, CheckCircle2, ChevronDown, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { hashPassword, verifyPassword } from "../lib/sanitize";
import { useCart } from "../context/CartContext";
import { auth, isFirebaseConfigured } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";

interface NavbarProps {
  cartCount?: number;
  onCartClick?: () => void;
  onLogoClick?: () => void;
  onAdminClick?: () => void;
  onBlogClick?: () => void;
  onAboutClick?: () => void;
  onContactClick?: () => void;
  onCoinsClick?: () => void;
  activePage?: string;
}

export function Navbar({ cartCount = 0, onCartClick, onLogoClick, onAdminClick, onBlogClick, onAboutClick, onContactClick, onCoinsClick, activePage = "home" }: NavbarProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [signUpName, setSignUpName] = useState("");

  const {
    isLoggedIn,
    isAdmin,
    activeUserEmail,
    userName: name,
    loginUser,
    logoutUser,
    isLoginOpen,
    setIsLoginOpen,
    sendOtp,
    verifyOtpAndLogin,
    coinsProfile
  } = useCart();

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => { setToastMessage(null); }, 3500);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { alert("Please enter your email address."); return; }
    setLoading(true);
    try {
      await sendOtp(email);
      setOtpSent(true);
      triggerToast("Verification code sent to your email!");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) { alert("Please enter the 6-digit verification code."); return; }
    if (isSignUp && !signUpName) { alert("Please enter your full name."); return; }
    setLoading(true);
    try {
      await verifyOtpAndLogin(email, otp, isSignUp ? signUpName : undefined);
      setIsLoginOpen(false);
      triggerToast(isSignUp ? `Account created! Welcome, ${signUpName.trim()}.` : "Logged in successfully!");
      setEmail("");
      setOtp("");
      setSignUpName("");
      setOtpSent(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Verification failed. Please check the code and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (isFirebaseConfigured && auth) {
      try { 
        await signOut(auth); 
        logoutUser();
        setShowDropdown(false); 
        triggerToast("Logged out successfully."); 
      }
      catch (err: any) { 
        logoutUser();
        alert(`Failed to sign out: ${err.message}`); 
      }
    } else {
      logoutUser(); setShowDropdown(false); triggerToast("Logged out successfully.");
    }
  };

  const handleGoogleLogin = async () => {
    if (isFirebaseConfigured && auth) {
      try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        setIsLoginOpen(false);
        triggerToast("Signed in with Google!");
      } catch (err: any) {
        if (err.code !== "auth/popup-closed-by-user") alert(`Google login failed: ${err.message}`);
      }
    } else {
      localStorage.setItem("noirkart_active_session", JSON.stringify({ email: "google.user@noirkart.com", name: "Google User" }));
      loginUser("google.user@noirkart.com", "Google User");
      setIsLoginOpen(false);
      triggerToast("Signed in with Google! (Simulated)");
    }
  };


  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24">
          <div className="flex items-center gap-8">
            <motion.div className="flex items-center cursor-pointer" whileHover={{ scale: 1.02 }} onClick={onLogoClick}>
              <img src="/Noirkart.png" alt="noirkart" className="h-20 w-auto object-contain" />
            </motion.div>
          </div>


          <div className="flex items-center gap-4">
            {isLoggedIn && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onCoinsClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 border border-amber-200 shadow-2xs cursor-pointer transition-all"
                title="My NoirCoins Balance"
              >
                <span className="text-base animate-pulse">🪙</span>
                <span className="text-xs font-extrabold text-amber-800 tracking-wide font-mono">
                  {coinsProfile ? coinsProfile.coinsBalance.toLocaleString() : "0"}
                </span>
              </motion.button>
            )}

            {!isLoggedIn ? (
              <button onClick={() => { setIsSignUp(false); setIsLoginOpen(true); }}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <User size={20} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-800">Login</span>
              </button>
            ) : (
              <div className="relative">
                <button onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-gray-100 shadow-2xs">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#E23744] to-[#CB202D] text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    {name ? name.charAt(0).toUpperCase() : "A"}
                  </div>
                  <span className="text-sm font-medium text-gray-800 hidden sm:inline">
                    {isAdmin ? "Admin" : (name ? name.split(" ")[0] : "User")}
                  </span>
                  <ChevronDown size={14} className="text-gray-500" />
                </button>

                <AnimatePresence>
                  {showDropdown && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-50">
                        <p className="text-xs text-gray-400">Signed in as</p>
                        <p className="text-sm font-semibold text-gray-800 truncate text-left">{isAdmin ? "Admin Manager" : (name || "User")}</p>
                        <p className="text-xs text-gray-500 truncate text-left">{activeUserEmail || "user@noirkart.com"}</p>
                      </div>
                      {isAdmin && (
                        <button onClick={() => { onAdminClick?.(); setShowDropdown(false); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-[#E23744] hover:bg-red-50 transition-colors flex items-center gap-2 cursor-pointer font-bold border-b border-gray-50">
                          <ShieldCheck size={16} /> Admin Control Panel ⚙️
                        </button>
                      )}
                      <button onClick={() => { onCoinsClick?.(); setShowDropdown(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50/50 transition-colors flex items-center gap-2 cursor-pointer font-bold border-b border-gray-50">
                        <span className="text-base">🪙</span> My NoirCoins Rewards
                      </button>
                      <button onClick={() => { onCartClick?.(); setShowDropdown(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer">
                        <Heart size={16} className="text-[#E23744]" /> My Shortlist ({cartCount})
                      </button>
                      <button onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 border-t border-gray-50 cursor-pointer">
                        <LogOut size={16} /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <motion.button
              className="relative p-3 rounded-lg bg-[#E23744] hover:bg-[#CB202D] transition-colors cursor-pointer flex items-center justify-center"
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onCartClick} title="View Watchlist">
              <Heart className="text-white fill-white" size={20} />
              {cartCount > 0 && (
                <motion.span className="absolute -top-1.5 -right-1.5 bg-white text-[#E23744] text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm border border-red-100"
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500 }}>
                  {cartCount}
                </motion.span>
              )}
            </motion.button>
          </div>
        </div>

      </div>

      {/* Nav Chips Bar */}
      <div className="bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-2.5 overflow-x-auto scrollbar-hide">
            {/* Noirkart — brand chip (always highlighted) */}
            <motion.button
              onClick={onLogoClick}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all cursor-pointer shadow-sm ${
                activePage === "home"
                  ? "bg-[#E23744] text-white shadow-md shadow-red-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span className="text-base">🛒</span>
              <span>Noirkart</span>
            </motion.button>

            {/* Blog chip */}
            <motion.button
              onClick={onBlogClick}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all cursor-pointer ${
                activePage === "blog"
                  ? "bg-[#E23744] text-white shadow-md shadow-red-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span className="text-base">📝</span>
              <span>Blog</span>
            </motion.button>

            {/* About chip */}
            <motion.button
              onClick={onAboutClick}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all cursor-pointer ${
                activePage === "about"
                  ? "bg-[#E23744] text-white shadow-md shadow-red-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span className="text-base">✨</span>
              <span>About</span>
            </motion.button>

            {/* Contact chip */}
            <motion.button
              onClick={onContactClick}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all cursor-pointer ${
                activePage === "contact"
                  ? "bg-[#E23744] text-white shadow-md shadow-red-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span className="text-base">📬</span>
              <span>Contact</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-55 bg-gray-900/95 backdrop-blur-xs text-white px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 border border-gray-800 text-sm max-w-sm sm:max-w-md">
            <CheckCircle2 className="text-[#E23744] flex-shrink-0" size={20} />
            <span className="font-medium text-left">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      <AnimatePresence>
        {isLoginOpen && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsLoginOpen(false)} className="absolute inset-0 bg-black/50 backdrop-blur-xs" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-2xl p-6 md:p-8 shadow-2xl border border-gray-100 z-10 overflow-hidden">
              <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#E23744]/10 rounded-full blur-xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-[#E23744]/5 rounded-full blur-xl pointer-events-none" />

              <button onClick={() => setIsLoginOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all cursor-pointer">
                <X size={18} />
              </button>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{isSignUp ? "Create an Account" : "Welcome Back"}</h2>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                  {isSignUp ? "Join noirkart to track and curate premium product links." : "Access your saved watches, shortlists, and premium deal recommendations."}
                </p>
              </div>

              {isSignUp && sessionStorage.getItem("noirkart_pending_referral") && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 mb-4 text-left">
                  <span className="text-base mt-0.5">🎁</span>
                  <div>
                    <p className="text-xs font-bold text-amber-900">Referred by code: {sessionStorage.getItem("noirkart_pending_referral")}</p>
                    <p className="text-[10px] text-amber-700 mt-0.5">Register now to earn your <strong>100 NoirCoins</strong> signup bonus!</p>
                  </div>
                </div>
              )}

              <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
                {!otpSent ? (
                  <>
                    {isSignUp && (
                      <div className="text-left animate-fadeIn">
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name</label>
                        <div className="relative">
                          <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input type="text" placeholder="John Doe" required value={signUpName} onChange={(e) => setSignUpName(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E23744]/30 focus:border-[#E23744]/40 text-sm transition-all" />
                        </div>
                      </div>
                    )}
                    <div className="text-left">
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address</label>
                      <div className="relative">
                        <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E23744]/30 focus:border-[#E23744]/40 text-sm transition-all" />
                      </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-[#E23744] hover:bg-[#CB202D] disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg cursor-pointer mt-2">
                      {loading ? "Sending Code..." : "Send Verification Code"}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="bg-gray-50 border border-gray-150 rounded-xl p-3.5 flex items-center justify-between gap-3 text-left">
                      <div className="truncate">
                        <p className="text-[10px] text-gray-400 font-semibold uppercase">Sending to</p>
                        <p className="text-xs font-bold text-gray-700 truncate">{email}</p>
                      </div>
                      <button type="button" onClick={() => { setOtpSent(false); setOtp(""); }} className="text-[10px] text-[#E23744] hover:underline font-bold whitespace-nowrap cursor-pointer">
                        Change Email
                      </button>
                    </div>

                    <div className="text-left animate-fadeIn">
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">6-Digit Verification Code</label>
                      <div className="relative">
                        <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder="Enter 6-digit code" maxLength={6} required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E23744]/30 focus:border-[#E23744]/40 text-sm transition-all text-center tracking-[4px] font-mono font-bold" />
                      </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-[#E23744] hover:bg-[#CB202D] disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg cursor-pointer mt-2">
                      {loading ? "Verifying..." : (isSignUp ? "Verify & Sign Up" : "Verify & Sign In")}
                    </button>
                  </>
                )}
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-3 text-gray-400 font-medium">Or continue with</span></div>
              </div>

              <div className="flex justify-center mb-6">
                <button onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-xs font-semibold text-gray-700 cursor-pointer">
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.466 0-6.277-2.85-6.277-6.36s2.81-6.36 6.277-6.36c1.497 0 2.87.525 3.96 1.4l2.97-3A11.026 11.026 0 0 0 12.24 1C6.01 1 1 5.925 1 12s5.01 11 11.24 11c5.962 0 10.9-4.22 10.9-10.285 0-.583-.058-1.15-.175-1.715H12.24z" /></svg>
                  Google
                </button>
              </div>

              <div className="text-center text-xs">
                <span className="text-gray-400">{isSignUp ? "Already have an account? " : "New to noirkart? "}</span>
                <button onClick={() => { setIsSignUp(!isSignUp); setOtpSent(false); setOtp(""); }} className="text-[#E23744] hover:underline font-bold cursor-pointer">
                  {isSignUp ? "Sign In" : "Create one"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </nav>
  );
}
