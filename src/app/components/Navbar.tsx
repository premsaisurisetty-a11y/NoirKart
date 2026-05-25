import { motion, AnimatePresence } from "motion/react";
import { Heart, Search, MapPin, User, Mail, Lock, X, LogOut, CheckCircle2, ChevronDown, ShieldCheck } from "lucide-react";
import { useState } from "react";
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
}

export function Navbar({ cartCount = 0, onCartClick, onLogoClick, onAdminClick }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Login / Auth State
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [signUpName, setSignUpName] = useState("");

  const {
    isLoggedIn,
    activeUserEmail,
    userName: name,
    loginUser,
    logoutUser
  } = useCart();

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Please fill in all fields.");
      return;
    }

    if (isFirebaseConfigured && auth) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        setIsLoginOpen(false);
        triggerToast("Logged in securely via Firebase Auth!");
        setEmail("");
        setPassword("");
      } catch (err: any) {
        console.error("Firebase Login Error:", err);
        alert(`Authentication failed: ${err.message}`);
      }
    } else {
      // Offline LocalStorage Accounts check
      const lowercaseEmail = email.toLowerCase();
      const storedUsers = localStorage.getItem("noirkart_users");
      let users = storedUsers ? JSON.parse(storedUsers) : [];

      // Pre-seed default admin if not existing
      if (!users.some((u: any) => u.email === "admin@noirkart.com")) {
        users.push({
          name: "Admin Manager",
          email: "admin@noirkart.com",
          password: "admin"
        });
        localStorage.setItem("noirkart_users", JSON.stringify(users));
      }

      const foundUser = users.find((u: any) => u.email === lowercaseEmail && u.password === password);
      
      if (foundUser) {
        // Save local session
        localStorage.setItem("noirkart_active_session", JSON.stringify({
          email: lowercaseEmail,
          name: foundUser.name
        }));

        loginUser(lowercaseEmail, foundUser.name);
        setIsLoginOpen(false);
        triggerToast(`Welcome back, ${foundUser.name}! (Offline Session Restored)`);
        setEmail("");
        setPassword("");
      } else {
        alert("Invalid email or password.\n\nHint: Use admin@noirkart.com / admin to unlock the Admin Control Panel, or sign up for a new account!");
      }
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName || !email || !password) {
      alert("Please fill in all fields.");
      return;
    }

    if (isFirebaseConfigured && auth) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Sync Display Name in profile
        await updateProfile(user, { displayName: signUpName });

        setIsLoginOpen(false);
        triggerToast(`Account created securely! Welcome, ${signUpName}.`);
        setSignUpName("");
        setEmail("");
        setPassword("");
      } catch (err: any) {
        console.error("Firebase Sign Up Error:", err);
        alert(`Failed to create account: ${err.message}`);
      }
    } else {
      // Offline LocalStorage signup
      const lowercaseEmail = email.toLowerCase();
      const storedUsers = localStorage.getItem("noirkart_users");
      let users = storedUsers ? JSON.parse(storedUsers) : [];

      if (users.some((u: any) => u.email === lowercaseEmail)) {
        alert("An account with this email address already exists.");
        return;
      }

      const newUser = { name: signUpName, email: lowercaseEmail, password };
      users.push(newUser);
      localStorage.setItem("noirkart_users", JSON.stringify(users));
      
      // Save local session
      localStorage.setItem("noirkart_active_session", JSON.stringify({
        email: lowercaseEmail,
        name: signUpName
      }));

      loginUser(lowercaseEmail, signUpName);
      setIsLoginOpen(false);
      triggerToast(`Account created locally! Welcome, ${signUpName}.`);
      setSignUpName("");
      setEmail("");
      setPassword("");
    }
  };

  const handleLogout = async () => {
    if (isFirebaseConfigured && auth) {
      try {
        await signOut(auth);
        setShowDropdown(false);
        triggerToast("Logged out securely from Firebase.");
      } catch (err: any) {
        console.error("Firebase Signout Error:", err);
        alert(`Failed to sign out: ${err.message}`);
      }
    } else {
      logoutUser();
      setShowDropdown(false);
      triggerToast("Logged out successfully.");
    }
  };

  const handleGoogleLogin = async () => {
    if (isFirebaseConfigured && auth) {
      try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        setIsLoginOpen(false);
        triggerToast("Signed in securely with Google Auth!");
      } catch (err: any) {
        console.error("Firebase Google Auth Error:", err);
        if (err.code !== "auth/popup-closed-by-user") {
          alert(`Google login failed: ${err.message}`);
        }
      }
    } else {
      // Offline local simulated Google Login
      // Save local session
      localStorage.setItem("noirkart_active_session", JSON.stringify({
        email: "google.user@noirkart.com",
        name: "Google User"
      }));

      loginUser("google.user@noirkart.com", "Google User");
      setIsLoginOpen(false);
      triggerToast("Signed in securely with Google! (Simulated Offline Session)");
    }
  };

  const handleAppleLogin = () => {
    // Offline local simulated Apple Login
    // Save local session
    localStorage.setItem("noirkart_active_session", JSON.stringify({
      email: "apple.user@noirkart.com",
      name: "Apple User"
    }));

    loginUser("apple.user@noirkart.com", "Apple User");
    setIsLoginOpen(false);
    triggerToast("Signed in securely with Apple! (Simulated Offline Session)");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <motion.div
              className="flex items-center gap-2.5 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              onClick={onLogoClick}
            >
              <img
                src="/noirkart_logo.png"
                alt="noirkart logo"
                className="w-9 h-9 rounded-lg object-cover border border-gray-200 shadow-xs"
              />
              <h1 className="text-2xl font-normal text-[#0c831f] hidden sm:block tracking-wide" style={{ fontFamily: "'Titan One', cursive" }}>noirkart</h1>
            </motion.div>

            <div className="hidden md:flex items-center gap-2 text-sm">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 border border-gray-100">
                <MapPin size={18} className="text-[#0c831f]" />
                <div className="text-left">
                  <div className="text-xs text-gray-500">Verified Curated Links</div>
                  <div className="font-semibold text-gray-800 flex items-center gap-1">
                    Direct Purchases Only
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-xl mx-8 hidden md:block">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder='Search handpicked premium gear...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0c831f] focus:border-transparent transition-all text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {!isLoggedIn ? (
              <button
                onClick={() => {
                  setIsSignUp(false);
                  setIsLoginOpen(true);
                }}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <User size={20} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-800">Login</span>
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-gray-100 shadow-2xs"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    {name ? name.charAt(0).toUpperCase() : "A"}
                  </div>
                  <span className="text-sm font-medium text-gray-800 hidden sm:inline">
                    {activeUserEmail === "admin@noirkart.com" ? "Admin" : (name ? name.split(" ")[0] : "User")}
                  </span>
                  <ChevronDown size={14} className="text-gray-500" />
                </button>

                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-1"
                    >
                      <div className="px-4 py-2 border-b border-gray-50">
                        <p className="text-xs text-gray-400">Signed in as</p>
                        <p className="text-sm font-semibold text-gray-800 truncate text-left">
                          {activeUserEmail === "admin@noirkart.com" ? "Admin Manager" : (name || "Prem Kumar")}
                        </p>
                        <p className="text-xs text-gray-500 truncate text-left">{activeUserEmail || "prem@nexus.com"}</p>
                      </div>

                      {activeUserEmail === "admin@noirkart.com" && (
                        <button
                          onClick={() => {
                            onAdminClick?.();
                            setShowDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-[#0c831f] hover:bg-green-50 transition-colors flex items-center gap-2 cursor-pointer font-bold border-b border-gray-50"
                        >
                          <ShieldCheck size={16} />
                          Admin Control Panel ⚙️
                        </button>
                      )}

                      <button
                        onClick={() => {
                          onCartClick?.();
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <Heart size={16} className="text-[#0c831f]" />
                        My Shortlist ({cartCount})
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 border-t border-gray-50 cursor-pointer"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <motion.button
              className="relative p-3 rounded-lg bg-[#0c831f] hover:bg-[#0a6b1a] transition-colors cursor-pointer flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCartClick}
              title="View Watchlist"
            >
              <Heart className="text-white fill-white" size={20} />
              {cartCount > 0 && (
                <motion.span
                  className="absolute -top-1.5 -right-1.5 bg-[#ffd400] text-gray-900 text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  {cartCount}
                </motion.span>
              )}
            </motion.button>
          </div>
        </div>

        <div className="md:hidden pb-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search premium products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c831f] text-xs"
            />
          </div>
        </div>
      </div>

      <div className="bg-gradient-green">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-2 text-white text-xs font-semibold tracking-wide">
            💎 Curated Premium Showcase — Handpicked Deals & Direct Purchase Links
          </div>
        </div>
      </div>

      {/* Toast Notification overlay */}
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

      {/* Glassmorphic Login/Signup Modal */}
      <AnimatePresence>
        {isLoginOpen && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            {/* Dark Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLoginOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-2xl p-6 md:p-8 shadow-2xl border border-gray-100 z-10 overflow-hidden"
            >
              {/* Decorative elements */}
              <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#0c831f]/10 rounded-full blur-xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-[#ffd400]/10 rounded-full blur-xl pointer-events-none" />

              <button
                onClick={() => setIsLoginOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {isSignUp ? "Create an Account" : "Welcome Back"}
                </h2>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                  {isSignUp 
                    ? "Join noirkart to track and curate premium product links." 
                    : "Access your saved watches, shortlists, and premium deal recommendations."
                  }
                </p>
              </div>

              <form onSubmit={isSignUp ? handleSignUpSubmit : handleLoginSubmit} className="space-y-4">
                {isSignUp && (
                  <div className="text-left">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name</label>
                    <div className="relative">
                      <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={signUpName}
                        onChange={(e) => setSignUpName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0c831f] focus:border-transparent text-sm transition-all"
                      />
                    </div>
                  </div>
                )}

                <div className="text-left">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0c831f] focus:border-transparent text-sm transition-all"
                    />
                  </div>
                </div>

                <div className="text-left">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0c831f] focus:border-transparent text-sm transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#0c831f] hover:bg-[#0a6b1a] text-white py-3 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg cursor-pointer mt-2"
                >
                  {isSignUp ? "Sign Up" : "Sign In"}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-gray-400 font-medium">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={handleGoogleLogin}
                  className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-xs font-semibold text-gray-700 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.466 0-6.277-2.85-6.277-6.36s2.81-6.36 6.277-6.36c1.497 0 2.87.525 3.96 1.4l2.97-3A11.026 11.026 0 0 0 12.24 1C6.01 1 1 5.925 1 12s5.01 11 11.24 11c5.962 0 10.9-4.22 10.9-10.285 0-.583-.058-1.15-.175-1.715H12.24z"
                    />
                  </svg>
                  Google
                </button>
                <button
                  onClick={handleAppleLogin}
                  className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-xs font-semibold text-gray-700 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.2.67-2.92 1.5-.63.72-1.18 1.87-1.03 2.98.1.01.21.02.32.02.88 0 2.01-.58 2.64-1.44z" />
                  </svg>
                  Apple
                </button>
              </div>

              <div className="text-center text-xs">
                <span className="text-gray-400">
                  {isSignUp ? "Already have an account? " : "New to noirkart? "}
                </span>
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-[#0c831f] hover:underline font-bold cursor-pointer"
                >
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


