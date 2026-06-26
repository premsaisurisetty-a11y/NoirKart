// NoirCoins Rewards System Helpers & LocalStorage Emulator

export interface UserProfile {
  email: string;
  name: string;
  referralCode: string;
  referredBy: string;
  coinsBalance: number;
  lifetimeCoins: number;
  redeemedCoins: number;
  pendingCoins: number;
  streakCount: number;
  lastDailyClaim?: string; // YYYY-MM-DD
  membershipTier: "Bronze" | "Silver" | "Gold" | "Platinum";
  isFrozen: boolean;
  createdAt: string;
  emailVerified?: boolean;
}

export interface CoinTransaction {
  id: string;
  email: string;
  date: string;
  reason: string;
  coinsAdded: number;
  coinsDeducted: number;
  status: "completed" | "pending" | "rejected";
  reference?: string;
}

export interface Referral {
  id: string;
  referrerEmail: string;
  refereeEmail: string;
  status: "signed_up" | "purchase_1" | "purchase_5" | "tier_gold";
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseClaim {
  id: string;
  email: string;
  merchant: string;
  orderId: string;
  purchaseAmount: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  verifiedAt?: string;
  commissionEarned?: number;
  coinsAwarded?: number;
  adminNotes?: string;
  reviewSubmitted?: boolean;
}

export interface Redemption {
  id: string;
  email: string;
  amountCoins: number;
  amountINR: number;
  type: string;
  details: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  processedAt?: string;
}

export interface UserBadge {
  id: string;
  email: string;
  badgeType: string;
  unlockedAt: string;
}

// ---------------------------------------------------------------------------
// Tier Utilities
// ---------------------------------------------------------------------------
export function getMembershipTier(lifetimeCoins: number): "Bronze" | "Silver" | "Gold" | "Platinum" {
  if (lifetimeCoins >= 200000) return "Platinum";
  if (lifetimeCoins >= 50000) return "Gold";
  if (lifetimeCoins >= 10000) return "Silver";
  return "Bronze";
}

export function getTierColor(tier: string): string {
  switch (tier) {
    case "Platinum": return "#E5E4E2"; // Platinum Silver/White
    case "Gold": return "#FFD700"; // Gold
    case "Silver": return "#C0C0C0"; // Silver
    default: return "#CD7F32"; // Bronze Brown
  }
}

export function getTierBenefits(tier: string): string[] {
  switch (tier) {
    case "Platinum":
      return [
        "👑 VIP Support 24/7",
        "⚡ Instant Purchase Verification (within 2 hours)",
        "🪙 20% bonus coins on all referral purchases",
        "🎁 Exclusive high-value gift cards"
      ];
    case "Gold":
      return [
        "✨ VIP Support Queue",
        "⚡ Priority Purchase Verification (within 12 hours)",
        "🪙 10% bonus coins on referral purchases",
        "🎫 Exclusive VIP vouchers unlocked"
      ];
    case "Silver":
      return [
        "⭐ Priority support ticketing",
        "⚡ Accelerated verification (within 24 hours)",
        "🪙 5% bonus coins on referral purchases"
      ];
    default:
      return [
        "🌱 Standard support line",
        "🔍 Standard verification time (2-3 days)",
        "🪙 Base referral reward rate"
      ];
  }
}

export function getBadgeDetails(badge: string): { title: string; desc: string; icon: string } {
  const detailsMap: { [key: string]: { title: string; desc: string; icon: string } } = {
    "First Purchase": { title: "First Purchase", desc: "Successfully verified your first curated deal purchase!", icon: "🛍️" },
    "Referral Master": { title: "Referral Master", desc: "Successfully referred 5 or more friends to NoirKart.", icon: "👥" },
    "Daily Shopper": { title: "Daily Shopper", desc: "Maintained a daily login streak of 7 days or more.", icon: "🔥" },
    "Deal Hunter": { title: "Deal Hunter", desc: "Saved 10+ curated products in your watchlist.", icon: "🎯" },
    "Top Reviewer": { title: "Top Reviewer", desc: "Contributed or read multiple vetting blog articles.", icon: "✍️" },
    "Gold Member": { title: "Gold Member", desc: "Reached the Gold Tier of membership (50,000+ coins).", icon: "🏆" },
    "Platinum Member": { title: "Platinum Member", desc: "Reached the Platinum Tier of membership (200,000+ coins).", icon: "👑" },
    "Early Supporter": { title: "Early Supporter", desc: "Joined during the initial launch of NoirCoins rewards.", icon: "🚀" },
    "Blog Reader": { title: "Blog Reader", desc: "Read 5+ curation vetting articles.", icon: "📚" },
    "Festival Shopper": { title: "Festival Shopper", desc: "Submitted a purchase claim during a special campaign window.", icon: "🏮" }
  };
  return detailsMap[badge] || { title: badge, desc: "Achievement unlocked!", icon: "🏅" };
}

// Helper to generate unique codes
export function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `NOIR-${code}`;
}

// ---------------------------------------------------------------------------
// LocalStorage Database Emulator (Offline Mode)
// ---------------------------------------------------------------------------

function loadFromLocal<T>(key: string, defaults: T): T {
  const saved = localStorage.getItem(key);
  if (!saved) return defaults;
  try {
    return JSON.parse(saved);
  } catch {
    return defaults;
  }
}

function saveToLocal(key: string, data: any) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function runOfflineAction(action: string, payload: any): any {
  if (payload) {
    if (typeof payload.email === "string") payload.email = payload.email.toLowerCase().trim();
    if (typeof payload.referrerEmail === "string") payload.referrerEmail = payload.referrerEmail.toLowerCase().trim();
    if (typeof payload.refereeEmail === "string") payload.refereeEmail = payload.refereeEmail.toLowerCase().trim();
    if (typeof payload.referrer === "string") payload.referrer = payload.referrer.toLowerCase().trim();
  }

  const USERS_KEY = "noirkart_coins_users"; // Map: email -> UserProfile
  const TXS_KEY = "noirkart_coins_transactions"; // Array: CoinTransaction[]
  const REFS_KEY = "noirkart_coins_referrals"; // Array: Referral[]
  const CLAIMS_KEY = "noirkart_coins_claims"; // Array: PurchaseClaim[]
  const REDEMPS_KEY = "noirkart_coins_redemptions"; // Array: Redemption[]
  const BADGES_KEY = "noirkart_coins_badges"; // Array: UserBadge[]
  const RULES_KEY = "noirkart_coins_rules";

  const defaultRules = { minRedemption: 10000, commissionPercentage: 30, defaultAffiliateRate: 8 };

  switch (action) {
    case "init_profile": {
      const { email, name } = payload;
      const users = loadFromLocal<Record<string, UserProfile>>(USERS_KEY, {});
      
      if (users[email]) {
        return users[email];
      }

      // Create new profile
      let refCode = generateReferralCode();
      let attempts = 0;
      while (Object.values(users).some((u) => u.referralCode === refCode) && attempts < 10) {
        refCode = generateReferralCode();
        attempts++;
      }
      const pendingRef = sessionStorage.getItem("noirkart_pending_referral") || "";

      // Look up referrer
      let referredByEmail = "";
      if (pendingRef) {
        const referrer = Object.values(users).find(u => u.referralCode === pendingRef);
        if (referrer) {
          referredByEmail = referrer.email;
        }
      }

      const newProfile: UserProfile = {
        email,
        name,
        referralCode: refCode,
        referredBy: referredByEmail,
        coinsBalance: 100, // 100 Signup Bonus
        lifetimeCoins: 100,
        redeemedCoins: 0,
        pendingCoins: 0,
        streakCount: 0,
        membershipTier: "Bronze",
        isFrozen: false,
        createdAt: new Date().toISOString(),
        emailVerified: false
      };

      users[email] = newProfile;
      saveToLocal(USERS_KEY, users);

      // Create Signup Transaction
      const transactions = loadFromLocal<CoinTransaction[]>(TXS_KEY, []);
      const signupTx: CoinTransaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email,
        date: new Date().toISOString(),
        reason: "Signup Bonus",
        coinsAdded: 100,
        coinsDeducted: 0,
        status: "completed",
        reference: "Welcome Bonus"
      };
      transactions.unshift(signupTx);
      saveToLocal(TXS_KEY, transactions);

      // Unlock Early Supporter Badge
      const badges = loadFromLocal<UserBadge[]>(BADGES_KEY, []);
      badges.push({
        id: `bdg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email,
        badgeType: "Early Supporter",
        unlockedAt: new Date().toISOString()
      });
      saveToLocal(BADGES_KEY, badges);

      // Save referral mapping
      if (referredByEmail) {
        const referrals = loadFromLocal<Referral[]>(REFS_KEY, []);
        referrals.push({
          id: `ref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          referrerEmail: referredByEmail,
          refereeEmail: email,
          status: "signed_up",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        saveToLocal(REFS_KEY, referrals);
        sessionStorage.removeItem("noirkart_pending_referral");
      }

      return newProfile;
    }

    case "get_profile_details": {
      const { email } = payload;
      const users = loadFromLocal<Record<string, UserProfile>>(USERS_KEY, {});
      const txs = loadFromLocal<CoinTransaction[]>(TXS_KEY, []);
      const refs = loadFromLocal<Referral[]>(REFS_KEY, []);
      const claims = loadFromLocal<PurchaseClaim[]>(CLAIMS_KEY, []);
      const redemps = loadFromLocal<Redemption[]>(REDEMPS_KEY, []);
      const badges = loadFromLocal<UserBadge[]>(BADGES_KEY, []);
      const rules = loadFromLocal(RULES_KEY, defaultRules);

      const userProfile = users[email] || null;
      const userTxs = txs.filter(t => t.email === email);
      const userRefs = refs.filter(r => r.referrerEmail === email);
      const userClaims = claims.filter(c => c.email === email);
      const userRedemps = redemps.filter(r => r.email === email);
      const userBadges = badges.filter(b => b.email === email);

      return {
        profile: userProfile,
        transactions: userTxs,
        referrals: userRefs,
        claims: userClaims,
        redemptions: userRedemps,
        badges: userBadges,
        rules
      };
    }

    case "claim_daily": {
      const { email } = payload;
      const users = loadFromLocal<Record<string, UserProfile>>(USERS_KEY, {});
      const profile = users[email];
      if (!profile) throw new Error("User profile not found");
      if (profile.isFrozen) throw new Error("Account is frozen");

      const todayStr = new Date().toISOString().split("T")[0];
      if (profile.lastDailyClaim === todayStr) {
        throw new Error("You have already claimed your daily reward today.");
      }

      // Check if last claim was yesterday to maintain streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      let streak = profile.streakCount || 0;
      if (profile.lastDailyClaim === yesterdayStr) {
        streak += 1;
      } else {
        streak = 1; // Reset streak
      }

      // Calculate reward payout
      const payout = streak >= 7 ? 100 : streak * 10;

      // Update Profile
      profile.coinsBalance += payout;
      profile.lifetimeCoins += payout;
      profile.streakCount = streak;
      profile.lastDailyClaim = todayStr;
      profile.membershipTier = getMembershipTier(profile.lifetimeCoins);
      users[email] = profile;
      saveToLocal(USERS_KEY, users);

      // Create Transaction
      const transactions = loadFromLocal<CoinTransaction[]>(TXS_KEY, []);
      const newTx: CoinTransaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email,
        date: new Date().toISOString(),
        reason: `Daily Login Reward (Day ${streak})`,
        coinsAdded: payout,
        coinsDeducted: 0,
        status: "completed",
        reference: `Streak: ${streak} days`
      };
      transactions.unshift(newTx);
      saveToLocal(TXS_KEY, transactions);

      // Check for Daily Shopper Badge (streak >= 7)
      const badges = loadFromLocal<UserBadge[]>(BADGES_KEY, []);
      const alreadyHasBadge = badges.some(b => b.email === email && b.badgeType === "Daily Shopper");
      if (streak >= 7 && !alreadyHasBadge) {
        badges.push({
          id: `bdg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          email,
          badgeType: "Daily Shopper",
          unlockedAt: new Date().toISOString()
        });
        saveToLocal(BADGES_KEY, badges);
      }

      return { profile, transaction: newTx, payout };
    }

    case "submit_claim": {
      const { email, merchant, orderId, purchaseAmount } = payload;
      const users = loadFromLocal<Record<string, UserProfile>>(USERS_KEY, {});
      const profile = users[email];
      if (!profile) throw new Error("User not registered");
      if (profile.isFrozen) throw new Error("Account is frozen");

      const claims = loadFromLocal<PurchaseClaim[]>(CLAIMS_KEY, []);
      
      const newClaim: PurchaseClaim = {
        id: `clm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email,
        merchant,
        orderId,
        purchaseAmount: parseFloat(purchaseAmount) || 0,
        status: "pending",
        createdAt: new Date().toISOString()
      };
      claims.unshift(newClaim);
      saveToLocal(CLAIMS_KEY, claims);
      return newClaim;
    }

    case "redeem": {
      const { email, amountCoins, type, details } = payload;
      const users = loadFromLocal<Record<string, UserProfile>>(USERS_KEY, {});
      const profile = users[email];
      if (!profile) throw new Error("User not registered");
      if (profile.isFrozen) throw new Error("Account is frozen");
      if (profile.coinsBalance < amountCoins) throw new Error("Insufficient NoirCoins balance!");
      if (amountCoins < 10000) throw new Error("Minimum redemption amount is 10,000 Coins.");

      // Calculate INR (100 coins = 1 INR)
      const amountINR = amountCoins / 100;

      // Update Profile
      profile.coinsBalance -= amountCoins;
      profile.redeemedCoins += amountCoins;
      users[email] = profile;
      saveToLocal(USERS_KEY, users);

      // Create Pending Transaction
      const transactions = loadFromLocal<CoinTransaction[]>(TXS_KEY, []);
      const newTx: CoinTransaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email,
        date: new Date().toISOString(),
        reason: `Redemption: ${type}`,
        coinsAdded: 0,
        coinsDeducted: amountCoins,
        status: "pending",
        reference: details
      };
      transactions.unshift(newTx);
      saveToLocal(TXS_KEY, transactions);

      // Create Redemption Document
      const redemptions = loadFromLocal<Redemption[]>(REDEMPS_KEY, []);
      const newRedemption: Redemption = {
        id: `rdm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email,
        amountCoins,
        amountINR,
        type,
        details,
        status: "pending",
        createdAt: new Date().toISOString()
      };
      redemptions.unshift(newRedemption);
      saveToLocal(REDEMPS_KEY, redemptions);

      return { profile, redemption: newRedemption };
    }

    case "get_leaderboard": {
      const users = loadFromLocal<Record<string, UserProfile>>(USERS_KEY, {});
      const refs = loadFromLocal<Referral[]>(REFS_KEY, []);
      const claims = loadFromLocal<PurchaseClaim[]>(CLAIMS_KEY, []);

      const list = Object.values(users).map(u => {
        const referralsCount = refs.filter(r => r.referrerEmail === u.email).length;
        const purchaseCount = claims.filter(c => c.email === u.email && c.status === "approved").length;
        return {
          email: u.email,
          name: u.name,
          coinsBalance: u.coinsBalance,
          lifetimeCoins: u.lifetimeCoins,
          referralsCount,
          purchaseCount
        };
      });

      const topEarners = [...list].sort((a, b) => b.lifetimeCoins - a.lifetimeCoins).slice(0, 10);
      const topReferrers = [...list].sort((a, b) => b.referralsCount - a.referralsCount).slice(0, 10);
      const topShoppers = [...list].sort((a, b) => b.purchaseCount - a.purchaseCount).slice(0, 10);

      return { topEarners, topReferrers, topShoppers };
    }

    case "admin_get_all": {
      const users = loadFromLocal<Record<string, UserProfile>>(USERS_KEY, {});
      const claims = loadFromLocal<PurchaseClaim[]>(CLAIMS_KEY, []);
      const redemptions = loadFromLocal<Redemption[]>(REDEMPS_KEY, []);
      const txs = loadFromLocal<CoinTransaction[]>(TXS_KEY, []);
      const refs = loadFromLocal<Referral[]>(REFS_KEY, []);
      const badges = loadFromLocal<UserBadge[]>(BADGES_KEY, []);
      const rules = loadFromLocal(RULES_KEY, defaultRules);

      return {
        users: Object.values(users),
        claims,
        redemptions,
        transactions: txs,
        referrals: refs,
        badges,
        rules
      };
    }

    case "admin_set_rules": {
      const { rules } = payload;
      saveToLocal(RULES_KEY, rules);
      return rules;
    }

    case "admin_adjust_balance": {
      const { email, amount, reason } = payload;
      const users = loadFromLocal<Record<string, UserProfile>>(USERS_KEY, {});
      const profile = users[email];
      if (!profile) throw new Error("User profile not found");

      const delta = parseInt(amount) || 0;
      profile.coinsBalance += delta;
      if (delta > 0) {
        profile.lifetimeCoins += delta;
      }
      profile.membershipTier = getMembershipTier(profile.lifetimeCoins);
      users[email] = profile;
      saveToLocal(USERS_KEY, users);

      // Create Admin Adjustment Transaction
      const transactions = loadFromLocal<CoinTransaction[]>(TXS_KEY, []);
      const newTx: CoinTransaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email,
        date: new Date().toISOString(),
        reason: `Admin adjustment: ${reason}`,
        coinsAdded: delta > 0 ? delta : 0,
        coinsDeducted: delta < 0 ? Math.abs(delta) : 0,
        status: "completed",
        reference: "Admin Override"
      };
      transactions.unshift(newTx);
      saveToLocal(TXS_KEY, transactions);

      return profile;
    }

    case "admin_toggle_freeze": {
      const { email } = payload;
      const users = loadFromLocal<Record<string, UserProfile>>(USERS_KEY, {});
      const profile = users[email];
      if (!profile) throw new Error("User profile not found");

      profile.isFrozen = !profile.isFrozen;
      users[email] = profile;
      saveToLocal(USERS_KEY, users);

      return profile;
    }

    case "admin_approve_claim": {
      const { claimId, commissionAmount } = payload;
      const claims = loadFromLocal<PurchaseClaim[]>(CLAIMS_KEY, []);
      const claimIdx = claims.findIndex(c => c.id === claimId);
      if (claimIdx === -1) throw new Error("Claim not found");
      if (claims[claimIdx].status !== "pending") throw new Error("Claim already processed");

      const claim = claims[claimIdx];
      const comm = parseFloat(commissionAmount) || 0;
      
      // Reward Coins = 30% of Affiliate Commission Value.
      // E.g. commission of ₹100 = 30% * 100 = ₹30 equivalent.
      // ₹30 equivalent in coins (100 coins = ₹1) is 30 * 100 = 3000 Coins.
      const coinsAwarded = Math.round(comm * 0.30 * 100);

      claim.status = "approved";
      claim.verifiedAt = new Date().toISOString();
      claim.commissionEarned = comm;
      claim.coinsAwarded = coinsAwarded;
      claims[claimIdx] = claim;
      saveToLocal(CLAIMS_KEY, claims);

      // Update User Profile
      const users = loadFromLocal<Record<string, UserProfile>>(USERS_KEY, {});
      const profile = users[claim.email];
      if (profile) {
        // Count user's total approved claims
        const userApprovedCount = claims.filter(c => c.email === claim.email && c.status === "approved").length;
        let purchaseBonus = 0;
        if (userApprovedCount === 1) { // First Purchase Bonus: +500 Coins
          purchaseBonus = 500;
        }

        const finalCoinsAwarded = coinsAwarded + purchaseBonus;
        profile.coinsBalance += finalCoinsAwarded;
        profile.lifetimeCoins += finalCoinsAwarded;
        profile.membershipTier = getMembershipTier(profile.lifetimeCoins);
        users[claim.email] = profile;
        saveToLocal(USERS_KEY, users);

        // Add Transaction Log
        const transactions = loadFromLocal<CoinTransaction[]>(TXS_KEY, []);
        transactions.unshift({
          id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          email: claim.email,
          date: new Date().toISOString(),
          reason: "Purchase Reward",
          coinsAdded: coinsAwarded,
          coinsDeducted: 0,
          status: "completed",
          reference: `Order: ${claim.orderId}`
        });

        if (purchaseBonus > 0) {
          transactions.unshift({
            id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            email: claim.email,
            date: new Date().toISOString(),
            reason: "First Verified Purchase Bonus",
            coinsAdded: purchaseBonus,
            coinsDeducted: 0,
            status: "completed",
            reference: `Claim: ${claimId}`
          });
        }
        saveToLocal(TXS_KEY, transactions);

        // Check if First Purchase Badge is unlocked
        const badges = loadFromLocal<UserBadge[]>(BADGES_KEY, []);
        const alreadyHasBadge = badges.some(b => b.email === claim.email && b.badgeType === "First Purchase");
        if (!alreadyHasBadge) {
          badges.push({
            id: `bdg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            email: claim.email,
            badgeType: "First Purchase",
            unlockedAt: new Date().toISOString()
          });
          saveToLocal(BADGES_KEY, badges);
        }

        // Process Referrer purchase rewards if applicable
        if (profile.referredBy) {
          const referrerProfile = users[profile.referredBy];
          if (referrerProfile) {
            // Count referee's total approved purchase claims
            const refereeApprovalsCount = claims.filter(c => c.email === claim.email && c.status === "approved").length;
            const referrals = loadFromLocal<Referral[]>(REFS_KEY, []);
            const refIdx = referrals.findIndex(r => r.referrerEmail === profile.referredBy && r.refereeEmail === claim.email);
            
            let rewardCoins = 0;
            let refStatus: "signed_up" | "purchase_1" | "purchase_5" | "tier_gold" = "signed_up";

            if (refereeApprovalsCount === 1 && (!referrals[refIdx] || referrals[refIdx].status === "signed_up")) {
              rewardCoins = 500; // First Purchase verified: Referrer receives 500 Coins
              refStatus = "purchase_1";
            } else if (refereeApprovalsCount === 5 && referrals[refIdx] && referrals[refIdx].status === "purchase_1") {
              rewardCoins = 1000; // 5 Purchases verified: Referrer receives 1000 Coins
              refStatus = "purchase_5";
            }

            if (rewardCoins > 0) {
              referrerProfile.coinsBalance += rewardCoins;
              referrerProfile.lifetimeCoins += rewardCoins;
              referrerProfile.membershipTier = getMembershipTier(referrerProfile.lifetimeCoins);
              users[profile.referredBy] = referrerProfile;
              saveToLocal(USERS_KEY, users);

              // Log Referrer Transaction
              transactions.unshift({
                id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                email: profile.referredBy,
                date: new Date().toISOString(),
                reason: `Referral Purchase Milestone: ${profile.name}`,
                coinsAdded: rewardCoins,
                coinsDeducted: 0,
                status: "completed",
                reference: `Referee: ${claim.email}`
              });
              saveToLocal(TXS_KEY, transactions);

              // Update referral status connection
              if (refIdx !== -1) {
                referrals[refIdx].status = refStatus;
                referrals[refIdx].updatedAt = new Date().toISOString();
                saveToLocal(REFS_KEY, referrals);
              }

              // Check if Referrer has 5 referrals for Referral Master Badge
              const referrerRefsCount = referrals.filter(r => r.referrerEmail === profile.referredBy && r.status !== "signed_up").length;
              const hasRefMaster = badges.some(b => b.email === profile.referredBy && b.badgeType === "Referral Master");
              if (referrerRefsCount >= 5 && !hasRefMaster) {
                badges.push({
                  id: `bdg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  email: profile.referredBy,
                  badgeType: "Referral Master",
                  unlockedAt: new Date().toISOString()
                });
                saveToLocal(BADGES_KEY, badges);
              }
            }
          }
        }
      }

      return claim;
    }

    case "admin_reject_claim": {
      const { claimId, notes } = payload;
      const claims = loadFromLocal<PurchaseClaim[]>(CLAIMS_KEY, []);
      const claimIdx = claims.findIndex(c => c.id === claimId);
      if (claimIdx === -1) throw new Error("Claim not found");
      if (claims[claimIdx].status !== "pending") throw new Error("Claim already processed");

      claims[claimIdx].status = "rejected";
      claims[claimIdx].verifiedAt = new Date().toISOString();
      claims[claimIdx].adminNotes = notes || "Verification details matching failed.";
      saveToLocal(CLAIMS_KEY, claims);

      return claims[claimIdx];
    }

    case "admin_approve_redemption": {
      const { redemptionId } = payload;
      const redemptions = loadFromLocal<Redemption[]>(REDEMPS_KEY, []);
      const redempIdx = redemptions.findIndex(r => r.id === redemptionId);
      if (redempIdx === -1) throw new Error("Redemption request not found");
      if (redemptions[redempIdx].status !== "pending") throw new Error("Request already processed");

      redemptions[redempIdx].status = "approved";
      redemptions[redempIdx].processedAt = new Date().toISOString();
      saveToLocal(REDEMPS_KEY, redemptions);

      // Update Transaction status to completed
      const transactions = loadFromLocal<CoinTransaction[]>(TXS_KEY, []);
      const txIdx = transactions.findIndex(t => t.email === redemptions[redempIdx].email && t.coinsDeducted === redemptions[redempIdx].amountCoins && t.status === "pending");
      if (txIdx !== -1) {
        transactions[txIdx].status = "completed";
        saveToLocal(TXS_KEY, transactions);
      }

      return redemptions[redempIdx];
    }

    case "admin_reject_redemption": {
      const { redemptionId } = payload;
      const redemptions = loadFromLocal<Redemption[]>(REDEMPS_KEY, []);
      const redempIdx = redemptions.findIndex(r => r.id === redemptionId);
      if (redempIdx === -1) throw new Error("Redemption request not found");
      if (redemptions[redempIdx].status !== "pending") throw new Error("Request already processed");

      const redemp = redemptions[redempIdx];
      redemp.status = "rejected";
      redemp.processedAt = new Date().toISOString();
      redemptions[redempIdx] = redemp;
      saveToLocal(REDEMPS_KEY, redemptions);

      // Refund User Balance
      const users = loadFromLocal<Record<string, UserProfile>>(USERS_KEY, {});
      const profile = users[redemp.email];
      if (profile) {
        profile.coinsBalance += redemp.amountCoins;
        profile.redeemedCoins -= redemp.amountCoins;
        users[redemp.email] = profile;
        saveToLocal(USERS_KEY, users);

        // Log Payout Refund Transaction
        const transactions = loadFromLocal<CoinTransaction[]>(TXS_KEY, []);
        
        // Update original transaction to rejected
        const txIdx = transactions.findIndex(t => t.email === redemp.email && t.coinsDeducted === redemp.amountCoins && t.status === "pending");
        if (txIdx !== -1) {
          transactions[txIdx].status = "rejected";
        }
        
        // Push refund transaction
        transactions.unshift({
          id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          email: redemp.email,
          date: new Date().toISOString(),
          reason: `Redemption Rejected (Refund)`,
          coinsAdded: redemp.amountCoins,
          coinsDeducted: 0,
          status: "completed",
          reference: `ID: ${redemp.id}`
        });
        saveToLocal(TXS_KEY, transactions);
      }

      return redemp;
    }

    case "verify_email": {
      const { email } = payload;
      const users = loadFromLocal<Record<string, UserProfile>>(USERS_KEY, {});
      const profile = users[email];
      if (!profile) throw new Error("User profile not found");
      if (profile.emailVerified) return profile;

      profile.emailVerified = true;
      profile.coinsBalance += 110;
      profile.lifetimeCoins += 110;
      profile.membershipTier = getMembershipTier(profile.lifetimeCoins);
      users[email] = profile;
      saveToLocal(USERS_KEY, users);

      // Log transaction
      const transactions = loadFromLocal<CoinTransaction[]>(TXS_KEY, []);
      transactions.unshift({
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email,
        date: new Date().toISOString(),
        reason: "Email Verification Bonus",
        coinsAdded: 110,
        coinsDeducted: 0,
        status: "completed",
        reference: "Email Verified"
      });
      saveToLocal(TXS_KEY, transactions);

      return profile;
    }

    case "submit_review": {
      const { email, claimId, rating, reviewText } = payload;
      const users = loadFromLocal<Record<string, UserProfile>>(USERS_KEY, {});
      const profile = users[email];
      if (!profile) throw new Error("User profile not found");

      const claims = loadFromLocal<PurchaseClaim[]>(CLAIMS_KEY, []);
      const claimIdx = claims.findIndex(c => c.id === claimId);
      if (claimIdx === -1) throw new Error("Purchase claim not found");
      const claim = claims[claimIdx];
      if (claim.status !== "approved") throw new Error("Only verified purchases can be reviewed");
      if (claim.reviewSubmitted) throw new Error("Review already submitted for this purchase");

      claim.reviewSubmitted = true;
      claims[claimIdx] = claim;
      saveToLocal(CLAIMS_KEY, claims);

      profile.coinsBalance += 50;
      profile.lifetimeCoins += 50;
      profile.membershipTier = getMembershipTier(profile.lifetimeCoins);
      users[email] = profile;
      saveToLocal(USERS_KEY, users);

      // Log transaction
      const transactions = loadFromLocal<CoinTransaction[]>(TXS_KEY, []);
      transactions.unshift({
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email,
        date: new Date().toISOString(),
        reason: "Product Review Reward",
        coinsAdded: 50,
        coinsDeducted: 0,
        status: "completed",
        reference: `Claim: ${claimId}`
      });
      saveToLocal(TXS_KEY, transactions);

      // Unlock Top Reviewer Badge
      const badges = loadFromLocal<UserBadge[]>(BADGES_KEY, []);
      const alreadyHasBadge = badges.some(b => b.email === email && b.badgeType === "Top Reviewer");
      if (!alreadyHasBadge) {
        badges.push({
          id: `bdg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          email,
          badgeType: "Top Reviewer",
          unlockedAt: new Date().toISOString()
        });
        saveToLocal(BADGES_KEY, badges);
      }

      return profile;
    }

    default:
      throw new Error(`Unsupported offline action: ${action}`);
  }
}
