import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, doc, getDoc, setDoc, updateDoc, collection, 
  getDocs, query, where, orderBy, limit, runTransaction, addDoc
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.VITE_FIREBASE_APP_ID || ""
};

// Lazy initialization of Firebase
function getDb() {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error("Firebase is not configured on the server. Check VITE_FIREBASE_* env keys.");
  }
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  return getFirestore(app);
}

// ---------------------------------------------------------------------------
// Security: CORS configuration
// ---------------------------------------------------------------------------
const ALLOWED_ORIGINS = [
  'https://noirkart.in',
  'https://www.noirkart.in',
  'http://localhost:5173',
  'http://localhost:3000',
];

function setCorsHeaders(req, res) {
  const origin = req.headers['origin'] || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// ---------------------------------------------------------------------------
// Security: Verify Firebase JWT Token via Google Identity Toolkit API
// ---------------------------------------------------------------------------
async function verifyAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid authorization header");
  }
  const idToken = authHeader.split("Bearer ")[1];
  const apiKey = process.env.VITE_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new Error("Firebase Web API Key is not configured on server.");
  }

  const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken })
  });

  if (!response.ok) {
    throw new Error("Authentication token validation failed.");
  }

  const data = await response.json();
  if (!data.users || data.users.length === 0) {
    throw new Error("User context not found in Identity database.");
  }

  const user = data.users[0];
  return {
    uid: user.localId,
    email: user.email.toLowerCase(),
    displayName: user.displayName || "Premium Member"
  };
}

// Helper: membership tiering
function getMembershipTier(lifetimeCoins) {
  if (lifetimeCoins >= 200000) return "Platinum";
  if (lifetimeCoins >= 50000) return "Gold";
  if (lifetimeCoins >= 10000) return "Silver";
  return "Bronze";
}

// Helper: unique referrals generator
function generateReferralCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `NOIR-${code}`;
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const db = getDb();
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const subpath = (req.query?.subpath || url.searchParams.get("subpath") || url.pathname.split("/").pop() || "").trim();

    // -------------------------------------------------------------------------
    // 1. PUBLIC ENDPOINT: Leaderboard (Cached and public)
    // -------------------------------------------------------------------------
    if (subpath === "leaderboard") {
      if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
      
      const usersSnap = await getDocs(query(collection(db, "users"), limit(100)));
      const claimsSnap = await getDocs(collection(db, "claims"));
      const refsSnap = await getDocs(collection(db, "referrals"));

      const list = usersSnap.docs.map(docSnap => {
        const u = docSnap.data();
        const referralsCount = refsSnap.docs.filter(r => r.data().referrerEmail === u.email).length;
        const purchaseCount = claimsSnap.docs.filter(c => c.data().email === u.email && c.data().status === "approved").length;
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

      res.setHeader("Cache-Control", "public, max-age=60"); // Cache leaderboard for 1 min
      return res.status(200).json({ topEarners, topReferrers, topShoppers });
    }

    // Authenticate user for all other endpoints
    const authUser = await verifyAuth(req);
    const email = authUser.email;
    const name = authUser.displayName;

    // -------------------------------------------------------------------------
    // 2. ENDPOINT: Get Dashboard (GET)
    // -------------------------------------------------------------------------
    if (subpath === "get-dashboard") {
      if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

      const userDocRef = doc(db, "users", email);
      let userDocSnap = await getDoc(userDocRef);

      // Initialize Profile if not found
      if (!userDocSnap.exists()) {
        let refCode = generateReferralCode();
        let codeExists = true;
        let attempts = 0;
        while (codeExists && attempts < 10) {
          const q = query(collection(db, "users"), where("referralCode", "==", refCode));
          const snap = await getDocs(q);
          if (snap.empty) {
            codeExists = false;
          } else {
            refCode = generateReferralCode();
            attempts++;
          }
        }
        const pendingRef = url.searchParams.get("ref") || "";

        let referredByEmail = "";
        if (pendingRef) {
          const referrerQuery = query(collection(db, "users"), where("referralCode", "==", pendingRef));
          const referrerSnap = await getDocs(referrerQuery);
          if (!referrerSnap.empty) {
            referredByEmail = referrerSnap.docs[0].data().email;
          }
        }

        const newProfile = {
          email,
          name,
          referralCode: refCode,
          referredBy: referredByEmail,
          coinsBalance: 100, // Signup Bonus
          lifetimeCoins: 100,
          redeemedCoins: 0,
          pendingCoins: 0,
          streakCount: 0,
          membershipTier: "Bronze",
          isFrozen: false,
          createdAt: new Date().toISOString(),
          emailVerified: false
        };

        // Create user, transaction log, and badge in batch
        await setDoc(userDocRef, newProfile);
        
        await addDoc(collection(db, "transactions"), {
          email,
          date: new Date().toISOString(),
          reason: "Signup Bonus",
          coinsAdded: 100,
          coinsDeducted: 0,
          status: "completed",
          reference: "Welcome Bonus"
        });

        await addDoc(collection(db, "badges"), {
          email,
          badgeType: "Early Supporter",
          unlockedAt: new Date().toISOString()
        });

        if (referredByEmail) {
          await addDoc(collection(db, "referrals"), {
            referrerEmail: referredByEmail,
            refereeEmail: email,
            status: "signed_up",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }

        userDocSnap = await getDoc(userDocRef);
      }

      const profile = userDocSnap.data();

      // Read related logs
      const txsSnap = await getDocs(query(collection(db, "transactions"), where("email", "==", email)));
      const refsSnap = await getDocs(query(collection(db, "referrals"), where("referrerEmail", "==", email)));
      const claimsSnap = await getDocs(query(collection(db, "claims"), where("email", "==", email)));
      const redempsSnap = await getDocs(query(collection(db, "redemptions"), where("email", "==", email)));
      const badgesSnap = await getDocs(query(collection(db, "badges"), where("email", "==", email)));
      
      const rulesDoc = await getDoc(doc(db, "rewardRules", "default"));
      const rules = rulesDoc.exists() ? rulesDoc.data() : { minRedemption: 10000, commissionPercentage: 30, defaultAffiliateRate: 8 };

      return res.status(200).json({
        profile,
        transactions: txsSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.date.localeCompare(a.date)),
        referrals: refsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        claims: claimsSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.createdAt.localeCompare(a.createdAt)),
        redemptions: redempsSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.createdAt.localeCompare(a.createdAt)),
        badges: badgesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        rules
      });
    }

    // Check account status
    const userDocRef = doc(db, "users", email);
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) {
      return res.status(404).json({ error: "User profile not registered." });
    }
    const profile = userDocSnap.data();
    if (profile.isFrozen) {
      return res.status(403).json({ error: "This rewards account is frozen due to fraud detection." });
    }

    // -------------------------------------------------------------------------
    // 3. ENDPOINT: Claim Daily Login (POST)
    // -------------------------------------------------------------------------
    if (subpath === "claim-daily") {
      if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

      const todayStr = new Date().toISOString().split("T")[0];
      if (profile.lastDailyClaim === todayStr) {
        return res.status(400).json({ error: "Daily reward already claimed today." });
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      let streak = profile.streakCount || 0;
      if (profile.lastDailyClaim === yesterdayStr) {
        streak += 1;
      } else {
        streak = 1; // broken/reset
      }

      const payout = streak >= 7 ? 100 : streak * 10;

      await runTransaction(db, async (transaction) => {
        const freshUserDoc = await transaction.get(userDocRef);
        const uData = freshUserDoc.data();
        
        transaction.update(userDocRef, {
          coinsBalance: uData.coinsBalance + payout,
          lifetimeCoins: uData.lifetimeCoins + payout,
          streakCount: streak,
          lastDailyClaim: todayStr,
          membershipTier: getMembershipTier(uData.lifetimeCoins + payout)
        });
      });

      await addDoc(collection(db, "transactions"), {
        email,
        date: new Date().toISOString(),
        reason: `Daily Login Reward (Day ${streak})`,
        coinsAdded: payout,
        coinsDeducted: 0,
        status: "completed",
        reference: `Streak: ${streak} days`
      });

      if (streak >= 7) {
        const badgesQuery = query(collection(db, "badges"), where("email", "==", email), where("badgeType", "==", "Daily Shopper"));
        const bSnap = await getDocs(badgesQuery);
        if (bSnap.empty) {
          await addDoc(collection(db, "badges"), {
            email,
            badgeType: "Daily Shopper",
            unlockedAt: new Date().toISOString()
          });
        }
      }

      return res.status(200).json({ success: true, streak, payout });
    }

    // -------------------------------------------------------------------------
    // 4. ENDPOINT: Submit Claim (POST)
    // -------------------------------------------------------------------------
    if (subpath === "submit-claim") {
      if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
      const { merchant, orderId, purchaseAmount } = req.body;
      if (!merchant || !orderId || !purchaseAmount) {
        return res.status(400).json({ error: "Missing required claim fields" });
      }

      const newClaim = {
        email,
        merchant,
        orderId,
        purchaseAmount: parseFloat(purchaseAmount) || 0,
        status: "pending",
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, "claims"), newClaim);
      return res.status(200).json({ success: true, id: docRef.id });
    }

    // -------------------------------------------------------------------------
    // 5. ENDPOINT: Redeem (POST)
    // -------------------------------------------------------------------------
    if (subpath === "redeem") {
      if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
      const { amountCoins, type, details } = req.body;
      
      const coins = parseInt(amountCoins);
      if (isNaN(coins) || coins <= 0) return res.status(400).json({ error: "Invalid coin amount" });
      
      const rulesDoc = await getDoc(doc(db, "rewardRules", "default"));
      const minRedeem = rulesDoc.exists() ? rulesDoc.data().minRedemption : 10000;

      if (coins < minRedeem) {
        return res.status(400).json({ error: `Minimum redemption limit is ${minRedeem} Coins.` });
      }

      if (profile.coinsBalance < coins) {
        return res.status(400).json({ error: "Insufficient NoirCoins balance." });
      }

      const amountINR = coins / 100;

      // Update Profile Balance
      await runTransaction(db, async (transaction) => {
        const freshUserDoc = await transaction.get(userDocRef);
        const uData = freshUserDoc.data();
        if (uData.coinsBalance < coins) throw new Error("Balance changed mid-flight");
        
        transaction.update(userDocRef, {
          coinsBalance: uData.coinsBalance - coins,
          redeemedCoins: uData.redeemedCoins + coins
        });
      });

      // Log transaction
      const txRef = await addDoc(collection(db, "transactions"), {
        email,
        date: new Date().toISOString(),
        reason: `Redemption: ${type}`,
        coinsAdded: 0,
        coinsDeducted: coins,
        status: "pending",
        reference: details
      });

      // Log redemption claim
      await addDoc(collection(db, "redemptions"), {
        email,
        amountCoins: coins,
        amountINR,
        type,
        details,
        status: "pending",
        createdAt: new Date().toISOString(),
        transactionId: txRef.id
      });

      return res.status(200).json({ success: true });
    }

    // -------------------------------------------------------------------------
    // 6. ENDPOINT: Admin Panel Actions (GET & POST)
    // -------------------------------------------------------------------------
    if (subpath === "admin") {
      // Check admin status
      const adminDocSnap = await getDoc(doc(db, "admins", email));
      const isAdmin = adminDocSnap.exists() && adminDocSnap.data().role === "admin";
      if (!isAdmin) {
        return res.status(403).json({ error: "Forbidden: Admin access only." });
      }

      // Handle GET: retrieve all DB records for rewards management
      if (req.method === "GET") {
        const action = url.searchParams.get("action");
        if (action === "get_all") {
          const uSnap = await getDocs(collection(db, "users"));
          const cSnap = await getDocs(collection(db, "claims"));
          const rSnap = await getDocs(collection(db, "redemptions"));
          const tSnap = await getDocs(collection(db, "transactions"));
          const rfSnap = await getDocs(collection(db, "referrals"));
          const bSnap = await getDocs(collection(db, "badges"));
          const rulesSnap = await getDoc(doc(db, "rewardRules", "default"));

          const rules = rulesSnap.exists() ? rulesSnap.data() : { minRedemption: 10000, commissionPercentage: 30, defaultAffiliateRate: 8 };

          return res.status(200).json({
            users: uSnap.docs.map(d => d.data()),
            claims: cSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            redemptions: rSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            transactions: tSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            referrals: rfSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            badges: bSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            rules
          });
        }
        return res.status(400).json({ error: "Invalid action" });
      }

      // Handle POST: Actions
      if (req.method === "POST") {
        const { action, payload } = req.body;

        switch (action) {
          case "admin_set_rules": {
            const { rules } = payload;
            await setDoc(doc(db, "rewardRules", "default"), rules);
            return res.status(200).json({ success: true });
          }

          case "admin_adjust_balance": {
            const { email: targetEmail, amount, reason } = payload;
            const delta = parseInt(amount) || 0;
            
            const targetUserRef = doc(db, "users", targetEmail);
            await runTransaction(db, async (t) => {
              const uSnap = await t.get(targetUserRef);
              if (!uSnap.exists()) throw new Error("User does not exist");
              const u = uSnap.data();
              t.update(targetUserRef, {
                coinsBalance: u.coinsBalance + delta,
                lifetimeCoins: delta > 0 ? u.lifetimeCoins + delta : u.lifetimeCoins,
                membershipTier: getMembershipTier(delta > 0 ? u.lifetimeCoins + delta : u.lifetimeCoins)
              });
            });

            await addDoc(collection(db, "transactions"), {
              email: targetEmail,
              date: new Date().toISOString(),
              reason: `Admin adjustment: ${reason}`,
              coinsAdded: delta > 0 ? delta : 0,
              coinsDeducted: delta < 0 ? Math.abs(delta) : 0,
              status: "completed",
              reference: "Admin Override"
            });

            return res.status(200).json({ success: true });
          }

          case "admin_toggle_freeze": {
            const { email: targetEmail } = payload;
            const targetUserRef = doc(db, "users", targetEmail);
            const uSnap = await getDoc(targetUserRef);
            if (!uSnap.exists()) return res.status(404).json({ error: "User not found" });
            const user = uSnap.data();

            await updateDoc(targetUserRef, { isFrozen: !user.isFrozen });
            return res.status(200).json({ success: true });
          }

          case "admin_approve_claim": {
            const { claimId, commissionAmount } = payload;
            const comm = parseFloat(commissionAmount) || 0;
            const coinsAwarded = Math.round(comm * 0.3 * 100);

            const claimRef = doc(db, "claims", claimId);
            const claimSnap = await getDoc(claimRef);
            if (!claimSnap.exists()) return res.status(404).json({ error: "Claim not found" });
            const claim = claimSnap.data();
            if (claim.status !== "pending") return res.status(400).json({ error: "Claim already processed" });

            // Approve claim doc
            await updateDoc(claimRef, {
              status: "approved",
              verifiedAt: new Date().toISOString(),
              commissionEarned: comm,
              coinsAwarded
            });

            // Update user balance
            const targetUserRef = doc(db, "users", claim.email);
            const uSnap = await getDoc(targetUserRef);
            if (uSnap.exists()) {
              const u = uSnap.data();
              
              // Unlock First Purchase Badge if first approved claim
              const claimsQuery = query(collection(db, "claims"), where("email", "==", claim.email), where("status", "==", "approved"));
              const approvedClaimsSnap = await getDocs(claimsQuery);
              
              let purchaseBonus = 0;
              if (approvedClaimsSnap.size === 1) {
                purchaseBonus = 500;
                await addDoc(collection(db, "badges"), {
                  email: claim.email,
                  badgeType: "First Purchase",
                  unlockedAt: new Date().toISOString()
                });
              }

              const finalAwarded = coinsAwarded + purchaseBonus;
              await updateDoc(targetUserRef, {
                coinsBalance: u.coinsBalance + finalAwarded,
                lifetimeCoins: u.lifetimeCoins + finalAwarded,
                membershipTier: getMembershipTier(u.lifetimeCoins + finalAwarded)
              });

              await addDoc(collection(db, "transactions"), {
                email: claim.email,
                date: new Date().toISOString(),
                reason: "Purchase Reward",
                coinsAdded: coinsAwarded,
                coinsDeducted: 0,
                status: "completed",
                reference: `Order: ${claim.orderId}`
              });

              if (purchaseBonus > 0) {
                await addDoc(collection(db, "transactions"), {
                  email: claim.email,
                  date: new Date().toISOString(),
                  reason: "First Verified Purchase Bonus",
                  coinsAdded: purchaseBonus,
                  coinsDeducted: 0,
                  status: "completed",
                  reference: `Claim: ${claimId}`
                });
              }
            }
              // Check referrals milestone payouts for referrer
              if (u.referredBy) {
                const referrerUserRef = doc(db, "users", u.referredBy);
                const referrerSnap = await getDoc(referrerUserRef);
                if (referrerSnap.exists()) {
                  const referrer = referrerSnap.data();
                  const totalApprovedClaimsCount = approvedClaimsSnap.size;

                  const referralsQuery = query(collection(db, "referrals"), where("referrerEmail", "==", u.referredBy), where("refereeEmail", "==", claim.email));
                  const refDocsSnap = await getDocs(referralsQuery);
                  
                  if (!refDocsSnap.empty) {
                    const refDoc = refDocsSnap.docs[0];
                    const refData = refDoc.data();
                    let milestoneReward = 0;
                    let refStatus = refData.status;

                    if (totalApprovedClaimsCount === 1 && refData.status === "signed_up") {
                      milestoneReward = 500;
                      refStatus = "purchase_1";
                    } else if (totalApprovedClaimsCount === 5 && refData.status === "purchase_1") {
                      milestoneReward = 1000;
                      refStatus = "purchase_5";
                    }

                    if (milestoneReward > 0) {
                      await updateDoc(doc(db, "referrals", refDoc.id), {
                        status: refStatus,
                        updatedAt: new Date().toISOString()
                      });

                      await updateDoc(referrerUserRef, {
                        coinsBalance: referrer.coinsBalance + milestoneReward,
                        lifetimeCoins: referrer.lifetimeCoins + milestoneReward,
                        membershipTier: getMembershipTier(referrer.lifetimeCoins + milestoneReward)
                      });

                      await addDoc(collection(db, "transactions"), {
                        email: u.referredBy,
                        date: new Date().toISOString(),
                        reason: `Referral Purchase Milestone: ${u.name}`,
                        coinsAdded: milestoneReward,
                        coinsDeducted: 0,
                        status: "completed",
                        reference: `Referee: ${claim.email}`
                      });

                      // Check for Referral Master Badge
                      const refsEarnedQuery = query(collection(db, "referrals"), where("referrerEmail", "==", u.referredBy), where("status", "!=", "signed_up"));
                      const referralsEarnedSnap = await getDocs(refsEarnedQuery);
                      if (referralsEarnedSnap.size >= 5) {
                        const badgesCheckQuery = query(collection(db, "badges"), where("email", "==", u.referredBy), where("badgeType", "==", "Referral Master"));
                        const bCheckSnap = await getDocs(badgesCheckQuery);
                        if (bCheckSnap.empty) {
                          await addDoc(collection(db, "badges"), {
                            email: u.referredBy,
                            badgeType: "Referral Master",
                            unlockedAt: new Date().toISOString()
                          });
                        }
                      }
                    }
                  }
                }
              }
            }

            return res.status(200).json({ success: true });
          }

          case "admin_reject_claim": {
            const { claimId, notes } = payload;
            const claimRef = doc(db, "claims", claimId);
            const claimSnap = await getDoc(claimRef);
            if (!claimSnap.exists()) return res.status(404).json({ error: "Claim not found" });
            const claim = claimSnap.data();
            if (claim.status !== "pending") return res.status(400).json({ error: "Claim already processed" });

            await updateDoc(claimRef, {
              status: "rejected",
              verifiedAt: new Date().toISOString(),
              adminNotes: notes || "Verification details failed."
            });
            return res.status(200).json({ success: true });
          }

          case "admin_approve_redemption": {
            const { redemptionId } = payload;
            const redemptionRef = doc(db, "redemptions", redemptionId);
            const rSnap = await getDoc(redemptionRef);
            if (!rSnap.exists()) return res.status(404).json({ error: "Redemption not found" });
            const red = rSnap.data();
            if (red.status !== "pending") return res.status(400).json({ error: "Redemption already processed" });

            await updateDoc(redemptionRef, {
              status: "approved",
              processedAt: new Date().toISOString()
            });

            // Update associated transaction
            const txsQuery = query(collection(db, "transactions"), where("email", "==", red.email), where("coinsDeducted", "==", red.amountCoins), where("status", "==", "pending"));
            const tSnap = await getDocs(txsQuery);
            if (!tSnap.empty) {
              await updateDoc(doc(db, "transactions", tSnap.docs[0].id), { status: "completed" });
            }

            return res.status(200).json({ success: true });
          }

          case "admin_reject_redemption": {
            const { redemptionId } = payload;
            const redemptionRef = doc(db, "redemptions", redemptionId);
            const rSnap = await getDoc(redemptionRef);
            if (!rSnap.exists()) return res.status(404).json({ error: "Redemption not found" });
            const red = rSnap.data();
            if (red.status !== "pending") return res.status(400).json({ error: "Redemption already processed" });

            // Refund Coins
            const targetUserRef = doc(db, "users", red.email);
            const uSnap = await getDoc(targetUserRef);
            if (uSnap.exists()) {
              const u = uSnap.data();
              await updateDoc(targetUserRef, {
                coinsBalance: u.coinsBalance + red.amountCoins,
                redeemedCoins: u.redeemedCoins - red.amountCoins
              });
            }

            await updateDoc(redemptionRef, {
              status: "rejected",
              processedAt: new Date().toISOString()
            });

            // Mark transaction as rejected & log refund
            const txsQuery = query(collection(db, "transactions"), where("email", "==", red.email), where("coinsDeducted", "==", red.amountCoins), where("status", "==", "pending"));
            const tSnap = await getDocs(txsQuery);
            if (!tSnap.empty) {
              await updateDoc(doc(db, "transactions", tSnap.docs[0].id), { status: "rejected" });
            }

            await addDoc(collection(db, "transactions"), {
              email: red.email,
              date: new Date().toISOString(),
              reason: `Redemption Rejected (Refund)`,
              coinsAdded: red.amountCoins,
              coinsDeducted: 0,
              status: "completed",
              reference: `ID: ${redemptionId}`
            });

            return res.status(200).json({ success: true });
          }

          default:
            return res.status(400).json({ error: "Invalid admin action requested" });
        }
      }
      return res.status(405).json({ error: "Method not allowed" });
    }

    // -------------------------------------------------------------------------
    // 7. ENDPOINT: Verify Email (POST)
    // -------------------------------------------------------------------------
    if (subpath === "verify-email") {
      if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
      if (profile.emailVerified) {
        return res.status(200).json({ success: true, alreadyVerified: true });
      }

      await runTransaction(db, async (transaction) => {
        const freshUserDoc = await transaction.get(userDocRef);
        const uData = freshUserDoc.data();
        if (uData.emailVerified) return;

        transaction.update(userDocRef, {
          emailVerified: true,
          coinsBalance: uData.coinsBalance + 110,
          lifetimeCoins: uData.lifetimeCoins + 110,
          membershipTier: getMembershipTier(uData.lifetimeCoins + 110)
        });
      });

      await addDoc(collection(db, "transactions"), {
        email,
        date: new Date().toISOString(),
        reason: "Email Verification Bonus",
        coinsAdded: 110,
        coinsDeducted: 0,
        status: "completed",
        reference: "Email Verified"
      });

      return res.status(200).json({ success: true });
    }

    // -------------------------------------------------------------------------
    // 8. ENDPOINT: Submit Review (POST)
    // -------------------------------------------------------------------------
    if (subpath === "submit-review") {
      if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
      const { claimId, rating, reviewText } = req.body;
      if (!claimId || !rating || !reviewText) {
        return res.status(400).json({ error: "Missing review fields." });
      }

      const claimRef = doc(db, "claims", claimId);
      const claimSnap = await getDoc(claimRef);
      if (!claimSnap.exists()) return res.status(404).json({ error: "Claim not found." });
      const claim = claimSnap.data();
      if (claim.email !== email) return res.status(403).json({ error: "Forbidden" });
      if (claim.status !== "approved") return res.status(400).json({ error: "Only verified purchases can be reviewed." });
      if (claim.reviewSubmitted) return res.status(400).json({ error: "Review already submitted for this order." });

      // Update claim
      await updateDoc(claimRef, { reviewSubmitted: true });

      // Reward Coins
      await runTransaction(db, async (transaction) => {
        const freshUserDoc = await transaction.get(userDocRef);
        const uData = freshUserDoc.data();
        
        transaction.update(userDocRef, {
          coinsBalance: uData.coinsBalance + 50,
          lifetimeCoins: uData.lifetimeCoins + 50,
          membershipTier: getMembershipTier(uData.lifetimeCoins + 50)
        });
      });

      await addDoc(collection(db, "transactions"), {
        email,
        date: new Date().toISOString(),
        reason: "Product Review Reward",
        coinsAdded: 50,
        coinsDeducted: 0,
        status: "completed",
        reference: `Claim: ${claimId}`
      });

      const badgesQuery = query(collection(db, "badges"), where("email", "==", email), where("badgeType", "==", "Top Reviewer"));
      const bSnap = await getDocs(badgesQuery);
      if (bSnap.empty) {
        await addDoc(collection(db, "badges"), {
          email,
          badgeType: "Top Reviewer",
          unlockedAt: new Date().toISOString()
        });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(404).json({ error: "Endpoint not found" });

  } catch (err) {
    console.error("API error executing rewards subpath request:", err);
    return res.status(500).json({ error: err.message || "Internal Server Error" });
  }
}
