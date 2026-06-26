import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Award, Coins, Gift, User, Copy, Share2, Clock, Check, Trophy, Calendar, 
  ChevronRight, TrendingUp, UserCheck, Sparkles, AlertCircle, HelpCircle, 
  ArrowUpRight, ArrowDownLeft, Lock, Star, Shield, Info, Smartphone, Mail, Zap
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { getMembershipTier, getTierColor, getTierBenefits, getBadgeDetails } from "../lib/noircoins";
import SEO from "../components/SEO";
import confetti from "canvas-confetti";

export function NoirCoinsPage() {
  const {
    isLoggedIn,
    userName,
    activeUserEmail,
    setIsLoginOpen,
    coinsProfile,
    coinsTransactions,
    coinsReferrals,
    coinsClaims,
    coinsRedemptions,
    coinsBadges,
    coinsLeaderboard,
    coinsRules,
    claimDailyLogin,
    submitPurchaseClaim,
    requestRedemption,
    verifyEmailAddress,
    submitProductReview
  } = useCart();

  const [activeTab, setActiveTab] = useState<"overview" | "streak" | "claims" | "redeem" | "referral" | "leaderboard" | "badges">("overview");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [claimMerchant, setClaimMerchant] = useState("");
  const [claimOrderId, setClaimOrderId] = useState("");
  const [claimAmount, setClaimAmount] = useState("");
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimError, setClaimError] = useState("");
  const [claiming, setClaiming] = useState(false);

  // Email Verification states
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Product Review states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewClaimId, setReviewClaimId] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState("");

  // Redemption Form States
  const [redeemAmount, setRedeemAmount] = useState("");
  const [redeemType, setRedeemType] = useState("Amazon Gift Card");
  const [redeemDetails, setRedeemDetails] = useState("");
  const [redeemSuccess, setRedeemSuccess] = useState(false);
  const [redeemError, setRedeemError] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  // Daily Streak State
  const [dailyClaiming, setDailyClaiming] = useState(false);
  const [dailyMessage, setDailyMessage] = useState("");
  const [dailyError, setDailyError] = useState("");

  const referralLink = coinsProfile ? `https://noirkart.in/signup?ref=${coinsProfile.referralCode}` : "";

  const copyToClipboard = (text: string, isLink: boolean) => {
    navigator.clipboard.writeText(text);
    if (isLink) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleShare = (platform: "whatsapp" | "telegram" | "instagram" | "native") => {
    if (!referralLink) return;
    const shareText = `Shop Smart, Earn NoirCoins! Use my referral code ${coinsProfile?.referralCode} to sign up and get 100 Gold Coins. ${referralLink}`;
    
    if (platform === "whatsapp") {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, "_blank");
    } else if (platform === "telegram") {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent("Shop Smart, Earn NoirCoins! Signup now for 100 Coins bonus.")}`, "_blank");
    } else if (platform === "instagram") {
      // Instagram doesn't have a direct share link helper, copy to clipboard instead
      copyToClipboard(shareText, true);
      alert("Referral text copied to clipboard! Share it in your Instagram DMs or bio.");
    } else if (platform === "native") {
      if (navigator.share) {
        navigator.share({
          title: "NoirCoins Rewards System",
          text: shareText,
          url: referralLink,
        }).catch(console.error);
      } else {
        copyToClipboard(referralLink, true);
      }
    }
  };

  const handleDailyClaimSubmit = async () => {
    if (dailyClaiming) return;
    setDailyClaiming(true);
    setDailyMessage("");
    setDailyError("");
    try {
      const payout = await claimDailyLogin();
      setDailyMessage(`Success! You claimed ${payout} NoirCoins 🪙!`);
      // Trigger confetti firework
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#FFD700", "#FFA500", "#FFFFFF", "#000000"]
      });
    } catch (err: any) {
      setDailyError(err.message || "Failed to claim reward");
    } finally {
      setDailyClaiming(false);
    }
  };

  const handlePurchaseClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimMerchant || !claimOrderId || !claimAmount) {
      setClaimError("Please fill in all verification fields.");
      return;
    }
    setClaiming(true);
    setClaimError("");
    setClaimSuccess(false);
    try {
      await submitPurchaseClaim(claimMerchant, claimOrderId, claimAmount);
      setClaimSuccess(true);
      setClaimMerchant("");
      setClaimOrderId("");
      setClaimAmount("");
      // Reset success banner after 5s
      setTimeout(() => setClaimSuccess(false), 5000);
    } catch (err: any) {
      setClaimError(err.message || "Failed to submit claim.");
    } finally {
      setClaiming(false);
    }
  };

  const handleRedeemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemAmount || !redeemDetails) {
      setRedeemError("Please fill in the amount and destination details.");
      return;
    }
    const coins = parseInt(redeemAmount);
    if (isNaN(coins) || coins <= 0) {
      setRedeemError("Please enter a valid coin amount.");
      return;
    }
    if (coins < (coinsRules?.minRedemption || 10000)) {
      setRedeemError(`Minimum redemption amount is ${coinsRules?.minRedemption || 10000} Coins.`);
      return;
    }
    if (coins > (coinsProfile?.coinsBalance || 0)) {
      setRedeemError("You do not have enough coins in your balance.");
      return;
    }
    setRedeeming(true);
    setRedeemError("");
    setRedeemSuccess(false);
    try {
      await requestRedemption(coins, redeemType, redeemDetails);
      setRedeemSuccess(true);
      setRedeemAmount("");
      setRedeemDetails("");
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ["#FFD700", "#FFFFFF"]
      });
      setTimeout(() => setRedeemSuccess(false), 5000);
    } catch (err: any) {
      setRedeemError(err.message || "Failed to request redemption.");
    } finally {
      setRedeeming(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (verifyingEmail) return;
    setVerifyingEmail(true);
    setEmailError("");
    setEmailSuccess(false);
    try {
      await verifyEmailAddress();
      setEmailSuccess(true);
      confetti({
        particleCount: 100,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#FFD700", "#FFA500", "#FFFFFF"]
      });
      setTimeout(() => setEmailSuccess(false), 5000);
    } catch (err: any) {
      setEmailError(err.message || "Failed to verify email address.");
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleOpenReviewModal = (claimId: string) => {
    setReviewClaimId(claimId);
    setReviewRating(5);
    setReviewText("");
    setReviewError("");
    setReviewSuccess(false);
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) {
      setReviewError("Please write a short review feedback.");
      return;
    }
    setSubmittingReview(true);
    setReviewError("");
    try {
      await submitProductReview(reviewClaimId, reviewRating, reviewText);
      setReviewSuccess(true);
      confetti({
        particleCount: 80,
        spread: 50,
        origin: { y: 0.7 },
        colors: ["#FFD700", "#FFA500", "#FFFFFF"]
      });
      setTimeout(() => {
        setShowReviewModal(false);
        setReviewSuccess(false);
      }, 2000);
    } catch (err: any) {
      setReviewError(err.message || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Math for membership tier progress bar
  const lifetime = coinsProfile?.lifetimeCoins || 0;
  let nextTierName = "";
  let coinsNeededForNext = 0;
  let progressPercentage = 0;
  let currentTierMin = 0;
  let nextTierMin = 0;

  if (lifetime < 10000) {
    nextTierName = "Silver";
    currentTierMin = 0;
    nextTierMin = 10000;
  } else if (lifetime < 50000) {
    nextTierName = "Gold";
    currentTierMin = 10000;
    nextTierMin = 50000;
  } else if (lifetime < 200000) {
    nextTierName = "Platinum";
    currentTierMin = 50000;
    nextTierMin = 200000;
  }

  if (nextTierMin > 0) {
    coinsNeededForNext = nextTierMin - lifetime;
    const progressRange = nextTierMin - currentTierMin;
    const progressCurrent = lifetime - currentTierMin;
    progressPercentage = Math.min(100, Math.max(0, (progressCurrent / progressRange) * 100));
  } else {
    progressPercentage = 100;
  }

  // Find if Daily claimed today
  const todayStr = new Date().toISOString().split("T")[0];
  const dailyClaimedToday = coinsProfile?.lastDailyClaim === todayStr;

  // Render non-logged in state
  if (!isLoggedIn) {
    return (
      <>
        <SEO 
          title="NoirCoins Rewards Program"
          description="Shop smart, earn NoirCoins, and unlock exclusive rewards. Join the premium loyalty experience of NoirKart."
        />
        <div className="min-h-screen bg-gray-50 pt-44 pb-16 flex flex-col items-center justify-center">
          <div className="max-w-xl mx-auto px-4 text-center">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-24 h-24 bg-gradient-to-tr from-amber-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border border-amber-300 relative"
            >
              <Coins className="text-black w-12 h-12 animate-pulse" />
              <span className="absolute -top-1 -right-1 text-2xl">🪙</span>
            </motion.div>
            
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">NoirCoins Loyalty Club</h1>
            <p className="text-amber-500 font-semibold text-lg uppercase tracking-wider mb-6">"Shop Smart. Earn NoirCoins."</p>
            
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-8 text-left">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="text-amber-500" size={18} /> Exclusive Member Privileges:
              </h3>
              <ul className="space-y-3 text-gray-600 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">✓</span>
                  <div><strong>100 NoirCoins Welcome Bonus</strong> immediately on signup!</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">✓</span>
                  <div><strong>Earn 30% of commission</strong> back in gold coins on all verified partner purchases.</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">✓</span>
                  <div><strong>Daily login rewards</strong> scaling from 10 to 100 coins. Keep the streak active!</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">✓</span>
                  <div><strong>Tiered referral rewards</strong> up to 2,500 coins per milestone.</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">✓</span>
                  <div><strong>Flexible redemptions</strong> to UPI cash, Amazon/Flipkart vouchers. (100 Coins = ₹1).</div>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => setIsLoginOpen(true)}
                className="px-8 py-3 bg-gray-950 text-white rounded-full font-bold hover:bg-gray-800 hover:shadow-lg transition-all cursor-pointer border border-gray-900 shadow"
              >
                Join / Sign In Now
              </button>
              <a 
                href="/?page=home"
                className="px-8 py-3 bg-white text-gray-800 rounded-full font-bold hover:bg-gray-50 border border-gray-200 transition-all cursor-pointer text-center"
              >
                Explore Curated Deals
              </a>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO 
        title="My NoirCoins Rewards Dashboard"
        description="View your NoirCoins balance, daily streaks, rewards milestone, referral statistics, and claim purchase coins."
      />
      <div className="min-h-screen bg-gray-50 pt-40 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header Banner */}
          <div className="relative bg-gray-950 text-white rounded-3xl p-6 md:p-8 overflow-hidden shadow-2xl mb-8 border border-amber-500/20">
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-amber-400/20 to-yellow-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="px-3 py-1 bg-amber-400/20 text-amber-400 font-bold text-xs rounded-full border border-amber-400/30 uppercase tracking-widest">
                  {coinsProfile?.membershipTier} Tier Member
                </span>
                <h1 className="text-3xl md:text-4xl font-extrabold mt-3 tracking-tight">
                  Welcome back, <span className="text-amber-400">{userName || "Premium Member"}</span>!
                </h1>
                <p className="text-gray-400 text-sm mt-1">Shop Smart. Earn NoirCoins. Unlock premium cashbacks.</p>
              </div>

              <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-4 rounded-2xl backdrop-blur-sm self-start md:self-auto">
                <div className="bg-amber-400 rounded-full p-2.5 flex items-center justify-center shadow-lg shadow-amber-500/20 animate-bounce">
                  <Coins className="text-black" size={24} />
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-medium">Available Balance</div>
                  <div className="text-3xl font-black text-amber-400 flex items-center gap-1">
                    {coinsProfile?.coinsBalance.toLocaleString()} <span className="text-lg text-white font-normal">🪙</span>
                  </div>
                  <div className="text-xs text-gray-500">Equivalent to ₹{( (coinsProfile?.coinsBalance || 0) / 100 ).toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Frosty/Glass Tier Progress Bar */}
            {nextTierName && (
              <div className="mt-8 border-t border-white/10 pt-6">
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                  <span>Tier Progress: {lifetime.toLocaleString()} lifetime coins</span>
                  <span className="text-amber-400">Next Tier: {nextTierName} ({nextTierMin.toLocaleString()} coins)</span>
                </div>
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden border border-white/5 p-0.5">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${progressPercentage}%` }} 
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full"
                  />
                </div>
                <div className="text-[11px] text-gray-500 mt-1.5 flex items-center gap-1">
                  <Info size={12} className="text-gray-400" />
                  Earn {coinsNeededForNext.toLocaleString()} more coins to unlock {nextTierName} benefits!
                </div>
              </div>
            )}
          </div>

          {/* Email Verification Banner */}
          {coinsProfile && !coinsProfile.emailVerified && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 border border-amber-500/30 rounded-3xl p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-amber-500/5 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-4 text-left">
                <div className="bg-amber-400/20 text-amber-400 rounded-2xl p-3 border border-amber-400/30 shrink-0">
                  <Mail className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-extrabold text-gray-900 text-base">Verify Email Address</h4>
                  <p className="text-xs text-gray-600 mt-0.5">Verify your email address now to claim your <span className="font-bold text-amber-600">110 NoirCoins 🪙</span> bonus!</p>
                </div>
              </div>
              <div className="flex flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto">
                <button
                  disabled={verifyingEmail}
                  onClick={handleVerifyEmail}
                  className="px-6 py-2.5 bg-gray-950 text-white rounded-full text-xs font-black hover:bg-gray-800 transition-all cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {verifyingEmail ? "Verifying..." : "Verify & Claim 110 Coins"}
                </button>
                {emailError && (
                  <p className="text-[10px] text-red-500 font-semibold">{emailError}</p>
                )}
                {emailSuccess && (
                  <p className="text-[10px] text-green-600 font-bold">Email verified successfully! +110 Coins added.</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Grid Layout: Sidebar Navigation & Main Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Left Column Sidebar */}
            <div className="lg:col-span-1 flex flex-col gap-3">
              <button 
                onClick={() => setActiveTab("overview")}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-left text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "overview" 
                    ? "bg-gray-950 text-white shadow-lg shadow-gray-950/20 border border-gray-900" 
                    : "bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-gray-150"
                }`}
              >
                <User size={18} className={activeTab === "overview" ? "text-amber-400" : "text-gray-400"} />
                My Dashboard Overview
              </button>

              <button 
                onClick={() => setActiveTab("streak")}
                className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-left text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "streak" 
                    ? "bg-gray-950 text-white shadow-lg shadow-gray-950/20 border border-gray-900" 
                    : "bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-gray-150"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Calendar size={18} className={activeTab === "streak" ? "text-amber-400" : "text-gray-400"} />
                  Daily Login Streak
                </span>
                {!dailyClaimedToday && (
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                )}
              </button>

              <button 
                onClick={() => setActiveTab("claims")}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-left text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "claims" 
                    ? "bg-gray-950 text-white shadow-lg shadow-gray-950/20 border border-gray-900" 
                    : "bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-gray-150"
                }`}
              >
                <Award size={18} className={activeTab === "claims" ? "text-amber-400" : "text-gray-400"} />
                Claim Purchase Rewards
              </button>

              <button 
                onClick={() => setActiveTab("redeem")}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-left text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "redeem" 
                    ? "bg-gray-950 text-white shadow-lg shadow-gray-950/20 border border-gray-900" 
                    : "bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-gray-150"
                }`}
              >
                <Gift size={18} className={activeTab === "redeem" ? "text-amber-400" : "text-gray-400"} />
                Redeem Store
              </button>

              <button 
                onClick={() => setActiveTab("referral")}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-left text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "referral" 
                    ? "bg-gray-950 text-white shadow-lg shadow-gray-950/20 border border-gray-900" 
                    : "bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-gray-150"
                }`}
              >
                <Share2 size={18} className={activeTab === "referral" ? "text-amber-400" : "text-gray-400"} />
                Referral System
              </button>

              <button 
                onClick={() => setActiveTab("leaderboard")}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-left text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "leaderboard" 
                    ? "bg-gray-950 text-white shadow-lg shadow-gray-950/20 border border-gray-900" 
                    : "bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-gray-150"
                }`}
              >
                <Trophy size={18} className={activeTab === "leaderboard" ? "text-amber-400" : "text-gray-400"} />
                Leaderboards
              </button>

              <button 
                onClick={() => setActiveTab("badges")}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-left text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "badges" 
                    ? "bg-gray-950 text-white shadow-lg shadow-gray-950/20 border border-gray-900" 
                    : "bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-gray-150"
                }`}
              >
                <Sparkles size={18} className={activeTab === "badges" ? "text-amber-400" : "text-gray-400"} />
                Achievements & Badges
              </button>

              {coinsProfile?.isFrozen && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4 flex items-start gap-2.5">
                  <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                  <div>
                    <h5 className="font-bold text-red-800 text-xs">Account Suspended</h5>
                    <p className="text-[10px] text-red-600 mt-0.5">Your balance has been frozen due to potential abuse detection. Contact support.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column Content View */}
            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-3xl shadow-sm border border-gray-150 p-6 md:p-8 min-h-[500px]"
                >
                  
                  {/* TAB 1: OVERVIEW */}
                  {activeTab === "overview" && (
                    <div className="space-y-8">
                      {/* Sub-Header */}
                      <div>
                        <h2 className="text-2xl font-bold text-gray-950">Rewards Overview</h2>
                        <p className="text-sm text-gray-600">Track your loyalty points growth, streaking progress, and recent logs.</p>
                      </div>

                      {/* Stat Cards Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        
                        {/* Card: Current Coins */}
                        <div className="bg-gradient-to-br from-amber-500/5 to-yellow-600/10 border border-amber-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                          <Coins className="absolute right-4 bottom-4 text-amber-500/15 w-16 h-16 pointer-events-none" />
                          <div className="text-xs text-gray-500 font-bold uppercase tracking-wide">Current Balance</div>
                          <div className="text-2xl font-black text-gray-950 mt-2 flex items-center gap-1">
                            {coinsProfile?.coinsBalance.toLocaleString()} <span className="text-sm text-gray-500">🪙</span>
                          </div>
                          <p className="text-xs text-amber-600 font-medium mt-1">₹{( (coinsProfile?.coinsBalance || 0)/100 ).toFixed(2)} cash value</p>
                        </div>

                        {/* Card: Lifetime Earnings */}
                        <div className="bg-gray-50 border border-gray-150 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                          <TrendingUp className="absolute right-4 bottom-4 text-gray-900/5 w-16 h-16 pointer-events-none" />
                          <div className="text-xs text-gray-500 font-bold uppercase tracking-wide">Lifetime Earnings</div>
                          <div className="text-2xl font-black text-gray-950 mt-2">
                            {coinsProfile?.lifetimeCoins.toLocaleString()} <span className="text-xs text-gray-400 font-normal">coins</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Earned since joining</p>
                        </div>

                        {/* Card: Pending / Redeemed */}
                        <div className="bg-gray-50 border border-gray-150 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                          <Gift className="absolute right-4 bottom-4 text-gray-900/5 w-16 h-16 pointer-events-none" />
                          <div className="text-xs text-gray-500 font-bold uppercase tracking-wide">Coins Redeemed</div>
                          <div className="text-2xl font-black text-gray-950 mt-2">
                            {coinsProfile?.redeemedCoins.toLocaleString()} <span className="text-xs text-gray-400 font-normal">coins</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">₹{( (coinsProfile?.redeemedCoins || 0)/100 ).toFixed(2)} received</p>
                        </div>
                      </div>

                      {/* Daily Streak Highlight Panel */}
                      <div className="bg-gradient-to-r from-gray-950 to-gray-900 text-white rounded-2xl p-6 border border-amber-500/10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4 text-left">
                          <span className="text-4xl block">🔥</span>
                          <div>
                            <h4 className="font-bold text-lg text-white">Daily Login Rewards</h4>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Current streak: <span className="text-amber-400 font-bold">{coinsProfile?.streakCount || 0} days</span>. Claim daily to earn bonus coins!
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            if (dailyClaimedToday) {
                              setActiveTab("streak");
                            } else {
                              handleDailyClaimSubmit();
                            }
                          }}
                          className={`px-6 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                            dailyClaimedToday 
                              ? "bg-white/10 text-gray-300 hover:bg-white/20 border border-white/10" 
                              : "bg-amber-400 text-black hover:bg-amber-300 shadow-md hover:scale-105"
                          }`}
                        >
                          {dailyClaimedToday ? "View Streak Streak Tracker" : "Claim Today's Reward"}
                        </button>
                      </div>

                      {/* Referrals & Active Badges Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Referral Summary Panel */}
                        <div className="border border-gray-150 rounded-2xl p-6 space-y-4">
                          <h4 className="font-bold text-gray-950 flex items-center gap-2 text-sm uppercase tracking-wide">
                            <Share2 size={16} className="text-amber-500" /> Share Referral Code
                          </h4>
                          <p className="text-xs text-gray-600">Get 500 Coins when referred friends verify their first purchase, plus more milestones!</p>
                          
                          <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-xl">
                            <code className="text-sm font-mono font-bold text-gray-800 flex-1 px-2 select-all">
                              {coinsProfile?.referralCode}
                            </code>
                            <button 
                              onClick={() => copyToClipboard(coinsProfile?.referralCode || "", false)}
                              className="px-3 py-1.5 bg-gray-950 text-white rounded-lg text-[10px] font-bold hover:bg-gray-800 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              {copiedCode ? <Check size={10} /> : <Copy size={10} />}
                              {copiedCode ? "Copied" : "Copy"}
                            </button>
                          </div>
                          
                          <div className="text-xs text-gray-500 flex justify-between pt-1">
                            <span>Successful Referrals: <strong>{coinsReferrals.filter(r => r.status !== "signed_up").length}</strong></span>
                            <span>Earnings: <strong>{(coinsReferrals.filter(r => r.status !== "signed_up").length * 500)} Coins</strong></span>
                          </div>
                        </div>

                        {/* Recent Badges Panel */}
                        <div className="border border-gray-150 rounded-2xl p-6 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-gray-950 flex items-center gap-2 text-sm uppercase tracking-wide">
                              <Award size={16} className="text-amber-500" /> Unlocked Badges
                            </h4>
                            
                            {coinsBadges.length === 0 ? (
                              <p className="text-xs text-gray-500 mt-3 italic">No achievements unlocked yet. Make your first purchase vetting claim to start!</p>
                            ) : (
                              <div className="flex flex-wrap gap-2.5 mt-3.5">
                                {coinsBadges.slice(0, 4).map((badge) => {
                                  const details = getBadgeDetails(badge.badgeType);
                                  return (
                                    <div 
                                      key={badge.id}
                                      title={details.desc}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 hover:bg-gray-100 transition-all"
                                    >
                                      <span>{details.icon}</span>
                                      <span>{details.title}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          {coinsBadges.length > 0 && (
                            <button 
                              onClick={() => setActiveTab("badges")}
                              className="text-xs text-amber-500 hover:text-amber-600 font-bold mt-4 flex items-center gap-0.5 cursor-pointer w-fit"
                            >
                              View all achievements ({coinsBadges.length}) <ChevronRight size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Transaction Ledger Preview */}
                      <div className="space-y-4">
                        <h4 className="font-bold text-gray-950 text-sm uppercase tracking-wide flex items-center gap-2">
                          <Clock size={16} className="text-gray-400" /> Recent Coin Activity
                        </h4>
                        
                        {coinsTransactions.length === 0 ? (
                          <div className="text-center py-8 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-xs text-gray-500">
                            No ledger entries found.
                          </div>
                        ) : (
                          <div className="overflow-hidden border border-gray-150 rounded-2xl shadow-sm">
                            <table className="w-full border-collapse text-left text-xs">
                              <thead>
                                <tr className="bg-gray-50 border-b border-gray-150 font-bold text-gray-600">
                                  <th className="px-4 py-3">Date</th>
                                  <th className="px-4 py-3">Reason</th>
                                  <th className="px-4 py-3">Amount</th>
                                  <th className="px-4 py-3 text-right">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-150">
                                {coinsTransactions.slice(0, 5).map((tx) => (
                                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">
                                      {new Date(tx.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3.5 text-gray-800 font-medium">
                                      {tx.reason}
                                      {tx.reference && <span className="block text-[10px] text-gray-400 font-normal mt-0.5">{tx.reference}</span>}
                                    </td>
                                    <td className="px-4 py-3.5 font-bold">
                                      {tx.coinsAdded > 0 ? (
                                        <span className="text-green-600 flex items-center gap-0.5 font-mono">+{tx.coinsAdded}</span>
                                      ) : (
                                        <span className="text-red-500 flex items-center gap-0.5 font-mono">-{tx.coinsDeducted}</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                                        tx.status === "completed" 
                                          ? "bg-green-50 border-green-200 text-green-700" 
                                          : tx.status === "rejected"
                                          ? "bg-red-50 border-red-200 text-red-700"
                                          : "bg-amber-50 border-amber-200 text-amber-700"
                                      }`}>
                                        {tx.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: DAILY STREAK */}
                  {activeTab === "streak" && (
                    <div className="space-y-8">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-950">Daily Login Streak</h2>
                        <p className="text-sm text-gray-600">Claim your rewards consecutively to increase your daily coin payouts.</p>
                      </div>

                      {/* Display Alert Messages */}
                      {dailyMessage && (
                        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-medium flex items-center gap-2">
                          <Check size={16} /> {dailyMessage}
                        </div>
                      )}
                      {dailyError && (
                        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2">
                          <AlertCircle size={16} /> {dailyError}
                        </div>
                      )}

                      {/* Streak Map (Day 1 - 7 Visualizer) */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-4">
                        {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
                          const rewardCoins = dayNum === 7 ? 100 : dayNum * 10;
                          
                          // Determine streak state representation
                          const currentStreak = coinsProfile?.streakCount || 0;
                          let isClaimed = false;
                          let isCurrentNext = false;

                          if (dailyClaimedToday) {
                            // If claimed today, all days <= currentStreak are checked
                            isClaimed = dayNum <= currentStreak;
                          } else {
                            // If not claimed today yet, days < currentStreak + 1 are already claimed in the past (streak kept)
                            isClaimed = dayNum <= currentStreak;
                            isCurrentNext = dayNum === (currentStreak + 1) || (currentStreak >= 7 && dayNum === 7);
                          }

                          return (
                            <div 
                              key={dayNum} 
                              className={`rounded-2xl p-4 border text-center transition-all flex flex-col justify-between relative overflow-hidden ${
                                isClaimed 
                                  ? "bg-amber-400 border-amber-500/20 text-black shadow shadow-amber-400/20" 
                                  : isCurrentNext 
                                  ? "bg-gray-950 border-gray-900 text-white ring-2 ring-amber-400 shadow-lg scale-105" 
                                  : "bg-white border-gray-150 text-gray-500"
                              }`}
                            >
                              {isClaimed && (
                                <span className="absolute top-2 right-2 text-xs">✓</span>
                              )}
                              
                              <div className="text-[10px] font-bold uppercase tracking-wider">
                                Day {dayNum}
                              </div>
                              
                              <div className="my-4">
                                <span className="text-2xl block mb-1">🪙</span>
                                <span className="font-extrabold text-lg font-mono">+{rewardCoins}</span>
                              </div>

                              <div className="text-[10px] font-bold">
                                {isClaimed ? "Claimed" : isCurrentNext ? "Claim Now" : "Locked"}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Claim Button */}
                      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-150 text-center space-y-4">
                        <h4 className="font-bold text-gray-900 text-sm">
                          {dailyClaimedToday 
                            ? "Daily reward claimed! Return tomorrow to keep your streak." 
                            : "Your reward is ready to claim!"}
                        </h4>
                        <p className="text-xs text-gray-500 max-w-md mx-auto">
                          If you skip a single day, your streak will reset back to Day 1. Consistently log in to maximize your rewards at 100 coins/day.
                        </p>
                        
                        <button 
                          disabled={dailyClaimedToday || dailyClaiming}
                          onClick={handleDailyClaimSubmit}
                          className={`px-8 py-3 rounded-full text-xs font-black shadow transition-all cursor-pointer ${
                            dailyClaimedToday 
                              ? "bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed shadow-none" 
                              : "bg-amber-400 text-black hover:bg-amber-300 hover:scale-105"
                          }`}
                        >
                          {dailyClaiming 
                            ? "Processing Claim..." 
                            : dailyClaimedToday 
                            ? "Claimed (Next in ~15h)" 
                            : "Claim My Rewards"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: CLAIMS FORM */}
                  {activeTab === "claims" && (
                    <div className="space-y-8">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-950">Claim Purchase Rewards</h2>
                        <p className="text-sm text-gray-600">Submit details of product links you purchased via our direct merchant buttons to claim cashbacks.</p>
                      </div>

                      {/* Success / Error Banners */}
                      {claimSuccess && (
                        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-medium flex items-center gap-2">
                          <Check size={16} /> Purchase details submitted successfully! Our admins will verify the merchant commission log soon.
                        </div>
                      )}
                      {claimError && (
                        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2">
                          <AlertCircle size={16} /> {claimError}
                        </div>
                      )}

                      {/* Form Layout */}
                      <form onSubmit={handlePurchaseClaimSubmit} className="bg-gray-50 rounded-2xl p-6 border border-gray-150 space-y-4">
                        <h3 className="font-bold text-gray-900 text-sm">Vetting Claim Details:</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[11px] text-gray-500 font-bold uppercase mb-1.5">Merchant Name</label>
                            <select 
                              value={claimMerchant} 
                              onChange={(e) => setClaimMerchant(e.target.value)}
                              className="w-full bg-white border border-gray-250 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-amber-400"
                            >
                              <option value="">Select Store</option>
                              <option value="Amazon">Amazon.in</option>
                              <option value="Flipkart">Flipkart</option>
                              <option value="Myntra">Myntra</option>
                              <option value="Direct Brand Shop">Direct Brand Shop</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] text-gray-500 font-bold uppercase mb-1.5">Order ID</label>
                            <input 
                              type="text" 
                              value={claimOrderId} 
                              onChange={(e) => setClaimOrderId(e.target.value)}
                              placeholder="e.g. 403-1283894-823901"
                              className="w-full bg-white border border-gray-250 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-amber-400"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] text-gray-500 font-bold uppercase mb-1.5">Purchase Amount (INR)</label>
                            <input 
                              type="number" 
                              value={claimAmount} 
                              onChange={(e) => setClaimAmount(e.target.value)}
                              placeholder="e.g. 1999"
                              className="w-full bg-white border border-gray-250 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-amber-400"
                            />
                          </div>
                        </div>

                        <div className="text-[11px] text-gray-500 flex items-start gap-1 pt-1.5">
                          <Info size={12} className="text-gray-400 mt-0.5 shrink-0" />
                          <span>Coins rewards equal to <strong>30% of the commission</strong> earned by NoirKart from the affiliate tracking. This is calculated dynamically after checking the merchant reports. Duplicate accounts or fraud submissions will lead to immediate account freeze.</span>
                        </div>

                        <button 
                          type="submit" 
                          disabled={claiming}
                          className="px-6 py-2.5 bg-gray-950 text-white rounded-full text-xs font-bold hover:bg-gray-800 transition-colors shadow cursor-pointer"
                        >
                          {claiming ? "Submitting..." : "Submit Claim for Vetting"}
                        </button>
                      </form>

                      {/* Submitted Claims History */}
                      <div className="space-y-4">
                        <h4 className="font-bold text-gray-950 text-sm uppercase tracking-wide">Submitted Claims</h4>
                        
                        {coinsClaims.length === 0 ? (
                          <div className="text-center py-8 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-xs text-gray-500">
                            You haven't submitted any purchase claims yet.
                          </div>
                        ) : (
                          <div className="overflow-hidden border border-gray-150 rounded-2xl shadow-sm">
                            <table className="w-full border-collapse text-left text-xs">
                              <thead>
                                <tr className="bg-gray-50 border-b border-gray-150 font-bold text-gray-600">
                                  <th className="px-4 py-3">Submitted On</th>
                                  <th className="px-4 py-3">Store / Order</th>
                                  <th className="px-4 py-3">Amount</th>
                                  <th className="px-4 py-3">Coins Awarded</th>
                                  <th className="px-4 py-3 text-right">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-150">
                                {coinsClaims.map((claim) => (
                                  <tr key={claim.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">
                                      {new Date(claim.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3.5 text-gray-800">
                                      <div className="font-bold">{claim.merchant}</div>
                                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">{claim.orderId}</div>
                                    </td>
                                    <td className="px-4 py-3.5 font-semibold text-gray-700">
                                      ₹{claim.purchaseAmount.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3.5 font-bold font-mono">
                                      {claim.coinsAwarded ? (
                                        <span className="text-green-600">+{claim.coinsAwarded} 🪙</span>
                                      ) : (
                                        <span className="text-gray-400">TBD</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                                        claim.status === "approved" 
                                          ? "bg-green-50 border-green-200 text-green-700" 
                                          : claim.status === "rejected"
                                          ? "bg-red-50 border-red-200 text-red-700"
                                          : "bg-amber-50 border-amber-200 text-amber-700"
                                      }`}>
                                        {claim.status}
                                      </span>
                                      {claim.status === "approved" && (
                                        <div className="mt-1.5">
                                          {claim.reviewSubmitted ? (
                                            <div className="text-[10px] text-green-600 font-semibold italic">
                                              Reviewed (+50 🪙)
                                            </div>
                                          ) : (
                                            <button
                                              onClick={() => handleOpenReviewModal(claim.id)}
                                              className="px-2 py-1 bg-amber-400 text-black hover:bg-amber-300 rounded-lg text-[9px] font-bold transition-colors ml-auto block cursor-pointer border border-amber-500/20"
                                            >
                                              Write Review (+50 🪙)
                                            </button>
                                          )}
                                        </div>
                                      )}
                                      {claim.adminNotes && (
                                        <div className="text-[10px] text-red-500 mt-1 italic max-w-xs ml-auto">
                                          Note: {claim.adminNotes}
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: REDEEM STORE */}
                  {activeTab === "redeem" && (
                    <div className="space-y-8">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-950">Redeem NoirCoins</h2>
                        <p className="text-sm text-gray-600">Exchange your accumulated gold coins for gift vouchers or UPI cash.</p>
                      </div>

                      {/* Success / Error Banners */}
                      {redeemSuccess && (
                        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-medium flex items-center gap-2">
                          <Check size={16} /> Redemption request submitted! UPI withdrawals will be transferred within 24 hours after admin approval.
                        </div>
                      )}
                      {redeemError && (
                        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2">
                          <AlertCircle size={16} /> {redeemError}
                        </div>
                      )}

                      {/* Currency Calculator */}
                      <div className="bg-gradient-to-br from-amber-400/5 to-yellow-600/10 border border-amber-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-center sm:text-left">
                          <h4 className="font-bold text-gray-900 text-sm">Coin Conversion Rate</h4>
                          <p className="text-xs text-gray-500 mt-0.5">100 Coins = ₹1. Minimum redemption size: 10,000 Coins (₹100).</p>
                        </div>
                        <div className="text-right text-sm font-black text-gray-800 bg-white border border-amber-200 px-4 py-2 rounded-xl flex items-center gap-2">
                          <span>10,000 🪙</span>
                          <span>=</span>
                          <span className="text-amber-600">₹100 INR</span>
                        </div>
                      </div>

                      {/* Redeem Form */}
                      <form onSubmit={handleRedeemSubmit} className="bg-gray-50 border border-gray-150 rounded-2xl p-6 space-y-4">
                        <h3 className="font-bold text-gray-900 text-sm">New Redemption Request</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[11px] text-gray-500 font-bold uppercase mb-1.5">Redeem Option</label>
                            <select 
                              value={redeemType} 
                              onChange={(e) => setRedeemType(e.target.value)}
                              className="w-full bg-white border border-gray-250 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-amber-400 font-medium"
                            >
                              <option value="Amazon Gift Card">Amazon Gift Card</option>
                              <option value="Flipkart Gift Card">Flipkart Gift Card</option>
                              <option value="UPI Cash">UPI Direct Cash</option>
                              <option value="Premium Membership">NoirKart Premium Member (3 Months)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] text-gray-500 font-bold uppercase mb-1.5">Coins to Redeem</label>
                            <input 
                              type="number" 
                              value={redeemAmount} 
                              onChange={(e) => setRedeemAmount(e.target.value)}
                              placeholder="Minimum 10000"
                              className="w-full bg-white border border-gray-250 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-amber-400 font-semibold"
                            />
                            {redeemAmount && (
                              <div className="text-[10px] text-gray-500 mt-1 font-semibold">
                                Equivalent Cash Value: ₹{(parseInt(redeemAmount) / 100 || 0).toFixed(2)}
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-[11px] text-gray-500 font-bold uppercase mb-1.5">Destination Details</label>
                            <input 
                              type="text" 
                              value={redeemDetails} 
                              onChange={(e) => setRedeemDetails(e.target.value)}
                              placeholder={redeemType === "UPI Cash" ? "Enter UPI ID (e.g. name@okhdfc)" : "Enter email for voucher delivery"}
                              className="w-full bg-white border border-gray-250 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-amber-400"
                            />
                          </div>
                        </div>

                        <button 
                          type="submit" 
                          disabled={redeeming}
                          className="px-6 py-2.5 bg-gray-950 text-white rounded-full text-xs font-bold hover:bg-gray-800 transition-colors shadow cursor-pointer"
                        >
                          {redeeming ? "Processing Request..." : "Request Redemption"}
                        </button>
                      </form>

                      {/* Redemption History */}
                      <div className="space-y-4">
                        <h4 className="font-bold text-gray-950 text-sm uppercase tracking-wide">Redemption History</h4>
                        
                        {coinsRedemptions.length === 0 ? (
                          <div className="text-center py-8 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-xs text-gray-500">
                            No redemption logs found.
                          </div>
                        ) : (
                          <div className="overflow-hidden border border-gray-150 rounded-2xl shadow-sm">
                            <table className="w-full border-collapse text-left text-xs">
                              <thead>
                                <tr className="bg-gray-50 border-b border-gray-150 font-bold text-gray-600">
                                  <th className="px-4 py-3">Requested On</th>
                                  <th className="px-4 py-3">Voucher / Direct</th>
                                  <th className="px-4 py-3">Destination</th>
                                  <th className="px-4 py-3">Coins Redeemed</th>
                                  <th className="px-4 py-3 text-right">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-150">
                                {coinsRedemptions.map((red) => (
                                  <tr key={red.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">
                                      {new Date(red.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3.5 text-gray-800 font-bold">
                                      {red.type}
                                    </td>
                                    <td className="px-4 py-3.5 text-gray-600 font-mono">
                                      {red.details}
                                    </td>
                                    <td className="px-4 py-3.5 font-bold font-mono text-red-500">
                                      -{red.amountCoins.toLocaleString()} 🪙
                                      <span className="block text-[10px] text-gray-400 font-normal">₹{red.amountINR.toFixed(2)}</span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                                        red.status === "approved" 
                                          ? "bg-green-50 border-green-200 text-green-700" 
                                          : red.status === "rejected"
                                          ? "bg-red-50 border-red-200 text-red-700"
                                          : "bg-amber-50 border-amber-200 text-amber-700"
                                      }`}>
                                        {red.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 5: REFERRAL */}
                  {activeTab === "referral" && (
                    <div className="space-y-8">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-950">Referral System</h2>
                        <p className="text-sm text-gray-600">Invite friends and earn large rewards when they make their first verified shopping claim.</p>
                      </div>

                      {/* Milestone Card */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 border border-gray-150 rounded-2xl p-6 space-y-4">
                          <h4 className="font-bold text-gray-950 text-sm">Your Referral Code</h4>
                          
                          <div className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-xl shadow-inner">
                            <code className="text-lg font-mono font-black text-gray-800 flex-1 px-2 select-all">
                              {coinsProfile?.referralCode}
                            </code>
                            <button 
                              onClick={() => copyToClipboard(coinsProfile?.referralCode || "", false)}
                              className="px-4 py-2 bg-gray-950 text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              {copiedCode ? <Check size={12} /> : <Copy size={12} />}
                              {copiedCode ? "Copied" : "Copy"}
                            </button>
                          </div>

                          <div className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-xl shadow-inner">
                            <span className="text-[10px] text-gray-400 font-mono flex-1 overflow-hidden overflow-ellipsis whitespace-nowrap px-2">
                              {referralLink}
                            </span>
                            <button 
                              onClick={() => copyToClipboard(referralLink, true)}
                              className="px-4 py-2 bg-gray-950 text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                            >
                              {copiedLink ? <Check size={12} /> : <Copy size={12} />}
                              {copiedLink ? "Link Copied" : "Copy Link"}
                            </button>
                          </div>
                        </div>

                        {/* Social sharing buttons */}
                        <div className="border border-gray-150 rounded-2xl p-6 flex flex-col justify-between">
                          <h4 className="font-bold text-gray-950 text-sm mb-3">Quick Share Invite</h4>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <button 
                              onClick={() => handleShare("whatsapp")}
                              className="px-4 py-2.5 bg-[#25D366] text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <span>WhatsApp</span>
                            </button>

                            <button 
                              onClick={() => handleShare("telegram")}
                              className="px-4 py-2.5 bg-[#0088cc] text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <span>Telegram</span>
                            </button>

                            <button 
                              onClick={() => handleShare("instagram")}
                              className="px-4 py-2.5 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <span>Instagram DM</span>
                            </button>

                            <button 
                              onClick={() => handleShare("native")}
                              className="px-4 py-2.5 bg-gray-950 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Share2 size={14} />
                              <span>More Options</span>
                            </button>
                          </div>

                          <div className="text-[10px] text-gray-400 text-center mt-4">
                            Your friend immediately receives <strong>100 NoirCoins</strong> upon account verification.
                          </div>
                        </div>
                      </div>

                      {/* Milestones Rules */}
                      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-150 space-y-4">
                        <h4 className="font-bold text-gray-900 text-sm">Tiered Referral Rewards Rules:</h4>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-xs border-b border-gray-200 pb-2">
                            <span className="text-gray-600">Friend Signs Up</span>
                            <span className="font-bold text-amber-600">+100 Coins to Friend</span>
                          </div>
                          <div className="flex justify-between items-center text-xs border-b border-gray-200 pb-2">
                            <span className="text-gray-600">Friend verifies 1st Purchase Claim</span>
                            <span className="font-bold text-green-600">+500 Coins to Referrer</span>
                          </div>
                          <div className="flex justify-between items-center text-xs border-b border-gray-200 pb-2">
                            <span className="text-gray-600">Friend verifies 5th Purchase Claim</span>
                            <span className="font-bold text-green-600">+1,000 Coins to Referrer</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-600">Friend reaches Gold Tier</span>
                            <span className="font-bold text-green-600">+2,500 Coins to Referrer</span>
                          </div>
                        </div>
                      </div>

                      {/* List of Referred Friends */}
                      <div className="space-y-4">
                        <h4 className="font-bold text-gray-950 text-sm uppercase tracking-wide">Successful Referrals</h4>
                        
                        {coinsReferrals.length === 0 ? (
                          <div className="text-center py-8 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-xs text-gray-500">
                            You haven't referred anyone yet. Share your code to get started!
                          </div>
                        ) : (
                          <div className="overflow-hidden border border-gray-150 rounded-2xl shadow-sm">
                            <table className="w-full border-collapse text-left text-xs">
                              <thead>
                                <tr className="bg-gray-50 border-b border-gray-150 font-bold text-gray-600">
                                  <th className="px-4 py-3">Date Joined</th>
                                  <th className="px-4 py-3">Referee Email</th>
                                  <th className="px-4 py-3 text-right">Referral Milestone Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-150">
                                {coinsReferrals.map((ref) => (
                                  <tr key={ref.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3.5 text-gray-500">
                                      {new Date(ref.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3.5 text-gray-800 font-semibold font-mono">
                                      {ref.refereeEmail}
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-medium">
                                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                                        ref.status === "signed_up" 
                                          ? "bg-gray-100 border-gray-200 text-gray-600" 
                                          : ref.status === "purchase_1"
                                          ? "bg-blue-50 border-blue-200 text-blue-700"
                                          : ref.status === "purchase_5"
                                          ? "bg-purple-50 border-purple-200 text-purple-700"
                                          : "bg-amber-50 border-amber-200 text-amber-700"
                                      }`}>
                                        {ref.status.replace("_", " ")}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 6: LEADERBOARD */}
                  {activeTab === "leaderboard" && (
                    <div className="space-y-8">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-950">Top NoirCoins Leaders</h2>
                        <p className="text-sm text-gray-600">Check the top performers in the NoirKart shopping rewards program.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Leaderboard Column 1: Top Earners */}
                        <div className="border border-gray-150 rounded-2xl p-5 space-y-4">
                          <h4 className="font-bold text-gray-900 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                            <Trophy size={14} className="text-amber-500" /> Top Lifetime Earners
                          </h4>
                          
                          <div className="space-y-2 text-xs">
                            {coinsLeaderboard.topEarners?.map((user, idx) => (
                              <div key={user.email} className="flex justify-between items-center p-2 bg-gray-50 border border-gray-100 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                    idx === 0 ? "bg-amber-400 text-black" : idx === 1 ? "bg-gray-200 text-gray-700" : idx === 2 ? "bg-amber-700 text-white" : "bg-gray-100 text-gray-500"
                                  }`}>
                                    {idx + 1}
                                  </span>
                                  <span className="font-semibold text-gray-800 max-w-[100px] overflow-hidden overflow-ellipsis whitespace-nowrap">{user.name}</span>
                                </div>
                                <span className="font-bold font-mono text-amber-600">{user.lifetimeCoins.toLocaleString()} 🪙</span>
                              </div>
                            ))}
                            {(!coinsLeaderboard.topEarners || coinsLeaderboard.topEarners.length === 0) && (
                              <p className="text-[11px] text-gray-500 italic text-center py-4">No data available.</p>
                            )}
                          </div>
                        </div>

                        {/* Leaderboard Column 2: Top Referrers */}
                        <div className="border border-gray-150 rounded-2xl p-5 space-y-4">
                          <h4 className="font-bold text-gray-900 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                            <Share2 size={14} className="text-amber-500" /> Top Referral Masters
                          </h4>
                          
                          <div className="space-y-2 text-xs">
                            {coinsLeaderboard.topReferrers?.map((user, idx) => (
                              <div key={user.email} className="flex justify-between items-center p-2 bg-gray-50 border border-gray-100 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                    idx === 0 ? "bg-amber-400 text-black" : idx === 1 ? "bg-gray-200 text-gray-700" : idx === 2 ? "bg-amber-700 text-white" : "bg-gray-100 text-gray-500"
                                  }`}>
                                    {idx + 1}
                                  </span>
                                  <span className="font-semibold text-gray-800 max-w-[100px] overflow-hidden overflow-ellipsis whitespace-nowrap">{user.name}</span>
                                </div>
                                <span className="font-bold font-mono text-gray-700">{user.referralsCount} referrals</span>
                              </div>
                            ))}
                            {(!coinsLeaderboard.topReferrers || coinsLeaderboard.topReferrers.length === 0) && (
                              <p className="text-[11px] text-gray-500 italic text-center py-4">No data available.</p>
                            )}
                          </div>
                        </div>

                        {/* Leaderboard Column 3: Top Shoppers */}
                        <div className="border border-gray-150 rounded-2xl p-5 space-y-4">
                          <h4 className="font-bold text-gray-900 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                            <Award size={14} className="text-amber-500" /> Top Verified Shoppers
                          </h4>
                          
                          <div className="space-y-2 text-xs">
                            {coinsLeaderboard.topShoppers?.map((user, idx) => (
                              <div key={user.email} className="flex justify-between items-center p-2 bg-gray-50 border border-gray-100 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                    idx === 0 ? "bg-amber-400 text-black" : idx === 1 ? "bg-gray-200 text-gray-700" : idx === 2 ? "bg-amber-700 text-white" : "bg-gray-100 text-gray-500"
                                  }`}>
                                    {idx + 1}
                                  </span>
                                  <span className="font-semibold text-gray-800 max-w-[100px] overflow-hidden overflow-ellipsis whitespace-nowrap">{user.name}</span>
                                </div>
                                <span className="font-bold font-mono text-gray-700">{user.purchaseCount} purchases</span>
                              </div>
                            ))}
                            {(!coinsLeaderboard.topShoppers || coinsLeaderboard.topShoppers.length === 0) && (
                              <p className="text-[11px] text-gray-500 italic text-center py-4">No data available.</p>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* TAB 7: ACHIEVEMENTS & BADGES */}
                  {activeTab === "badges" && (
                    <div className="space-y-8">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-950">Achievements & Badges</h2>
                        <p className="text-sm text-gray-600">Unlock special badges by completing different tasks on NoirKart.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        {[
                          "First Purchase", "Referral Master", "Daily Shopper", "Deal Hunter", 
                          "Top Reviewer", "Gold Member", "Platinum Member", "Early Supporter", 
                          "Blog Reader", "Festival Shopper"
                        ].map((badgeType) => {
                          const details = getBadgeDetails(badgeType);
                          const isUnlocked = coinsBadges.some(b => b.badgeType === badgeType);

                          return (
                            <div 
                              key={badgeType}
                              className={`border rounded-2xl p-5 relative overflow-hidden transition-all flex flex-col justify-between ${
                                isUnlocked 
                                  ? "bg-white border-gray-200 shadow-sm" 
                                  : "bg-gray-50 border-gray-150 opacity-60"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className={`text-3xl p-2.5 rounded-xl ${isUnlocked ? "bg-amber-400/10" : "bg-gray-200/40"}`}>
                                  {details.icon}
                                </div>
                                {isUnlocked ? (
                                  <span className="px-2 py-0.5 bg-green-50 border border-green-200 text-green-700 rounded-full font-bold text-[9px] uppercase tracking-wider">
                                    Unlocked
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-0.5 px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-500 rounded-full font-bold text-[9px] uppercase tracking-wider">
                                    <Lock size={8} /> Locked
                                  </span>
                                )}
                              </div>

                              <div className="mt-4">
                                <h4 className="font-bold text-gray-900 text-sm">{details.title}</h4>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{details.desc}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>

          </div>

        </div>
      </div>

      {/* Product Review Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-gray-150 max-w-md w-full overflow-hidden shadow-2xl p-6 md:p-8 space-y-6 relative text-left"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-amber-400/10 rounded-full flex items-center justify-center mx-auto text-amber-500 border border-amber-400/20">
                  <Star className="fill-amber-400 text-amber-400" size={24} />
                </div>
                <h3 className="text-xl font-extrabold text-gray-900">Review Your Purchase</h3>
                <p className="text-xs text-gray-500">Share your thoughts on the product to earn <span className="font-bold text-amber-600">50 NoirCoins 🪙</span>.</p>
              </div>

              {reviewSuccess ? (
                <div className="py-8 text-center space-y-2">
                  <span className="text-4xl block">🎉</span>
                  <h4 className="font-bold text-green-600 text-sm">Review Submitted!</h4>
                  <p className="text-xs text-gray-500">50 Coins have been successfully added to your balance.</p>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  {/* Rating Selector */}
                  <div className="flex flex-col items-center space-y-2">
                    <label className="block text-[11px] text-gray-500 font-bold uppercase">Your Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="p-1 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star 
                            size={28} 
                            className={`transition-colors ${
                              star <= reviewRating 
                                ? "fill-amber-400 text-amber-400" 
                                : "text-gray-300"
                            }`} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Feedback Text */}
                  <div className="space-y-1 text-left">
                    <label className="block text-[11px] text-gray-500 font-bold uppercase">Feedback / Comments</label>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Tell us what you liked (or disliked) about this item..."
                      rows={4}
                      className="w-full bg-gray-50 border border-gray-250 rounded-2xl px-4 py-3 text-xs text-gray-800 focus:outline-none focus:border-amber-400 focus:bg-white resize-none"
                    />
                  </div>

                  {reviewError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-[10px] font-medium flex items-center gap-1.5">
                      <AlertCircle size={14} /> {reviewError}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowReviewModal(false)}
                      className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full text-xs font-bold transition-all cursor-pointer text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="flex-1 py-2.5 bg-gray-950 hover:bg-gray-800 text-white rounded-full text-xs font-bold transition-all cursor-pointer text-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {submittingReview ? "Submitting..." : "Submit & Earn"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
