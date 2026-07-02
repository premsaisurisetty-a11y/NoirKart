import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, doc, getDoc, setDoc, deleteDoc, collection, 
  getDocs, query, where
} from "firebase/firestore";
import { Resend } from 'resend';
import crypto from 'crypto';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.VITE_FIREBASE_APP_ID || ""
};

// Lazy initialization of Firebase
let isFirebaseConfigured = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

function getDb() {
  if (!isFirebaseConfigured) return null;
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  return getFirestore(app);
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// In-memory fallback map for storing OTPs when Firebase is not configured
const inMemoryOtps = new Map(); // email -> { code, expiresAt }

// Allowed origins for CORS
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

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const subpath = url.searchParams.get("subpath") || "";

  try {
    const db = getDb();

    // -------------------------------------------------------------------------
    // 1. ENDPOINT: Send OTP
    // -------------------------------------------------------------------------
    if (subpath === "send-otp") {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
      }

      const { email } = req.body || {};
      if (!email) {
        return res.status(400).json({ error: "Email address is required" });
      }

      const cleanEmail = email.toLowerCase().trim();
      
      // Generate 6-digit random code
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

      // Save OTP code
      if (isFirebaseConfigured && db) {
        await setDoc(doc(db, "otps", cleanEmail), {
          email: cleanEmail,
          code: otpCode,
          expiresAt
        });
      } else {
        inMemoryOtps.set(cleanEmail, { code: otpCode, expiresAt });
      }

      console.log(`[OTP DEBUG] OTP for ${cleanEmail} is ${otpCode}`);

      // Try sending email via Resend
      if (resend) {
        try {
          const sendResult = await resend.emails.send({
            from: 'NoirKart Login <auth@noirkart.in>',
            to: cleanEmail,
            subject: `${otpCode} is your NoirKart login verification code`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded-lg">
                <h2 style="color: #000; text-align: center;">NoirKart OTP Login</h2>
                <p>Hello,</p>
                <p>Use the following 6-digit verification code to complete your NoirKart registration or sign-in. This code is valid for 5 minutes:</p>
                <div style="font-size: 28px; font-weight: bold; text-align: center; letter-spacing: 4px; padding: 15px; margin: 20px 0; background-color: #f9f9f9; border-radius: 8px; border: 1px dashed #ccc;">
                  ${otpCode}
                </div>
                <p style="font-size: 12px; color: #666; text-align: center; margin-top: 30px;">
                  If you didn't request this code, please ignore this email.
                </p>
              </div>
            `
          });

          if (sendResult.error) {
            console.error("Resend API returned error:", sendResult.error);
            return res.status(200).json({ 
              success: true, 
              sent: false, 
              otp: otpCode, 
              error: `Resend error: ${sendResult.error.message}` 
            });
          }

          return res.status(200).json({ success: true, sent: true });
        } catch (emailErr) {
          console.error("Failed to send email via Resend:", emailErr);
          // Fallback to returning the OTP if Resend fails, so it doesn't block developers
          return res.status(200).json({ 
            success: true, 
            sent: false, 
            otp: otpCode, 
            error: `Failed to dispatch email: ${emailErr.message || emailErr}` 
          });
        }
      } else {
        // Return OTP directly in response in offline / dev mode
        return res.status(200).json({ 
          success: true, 
          sent: false, 
          otp: otpCode, 
          note: "Resend not configured. OTP printed for development." 
        });
      }
    }

    // -------------------------------------------------------------------------
    // 2. ENDPOINT: Verify OTP
    // -------------------------------------------------------------------------
    if (subpath === "verify-otp") {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
      }

      const { email, otp } = req.body || {};
      if (!email || !otp) {
        return res.status(400).json({ error: "Email and OTP code are required" });
      }

      const cleanEmail = email.toLowerCase().trim();
      const cleanOtp = otp.trim();

      let record = null;
      if (isFirebaseConfigured && db) {
        const otpSnap = await getDoc(doc(db, "otps", cleanEmail));
        if (otpSnap.exists()) {
          record = otpSnap.data();
        }
      } else {
        record = inMemoryOtps.get(cleanEmail);
      }

      if (!record) {
        return res.status(400).json({ error: "Verification code not found or expired. Please request a new one." });
      }

      if (Date.now() > record.expiresAt) {
        // Clean up expired OTP
        if (isFirebaseConfigured && db) {
          await deleteDoc(doc(db, "otps", cleanEmail));
        } else {
          inMemoryOtps.delete(cleanEmail);
        }
        return res.status(400).json({ error: "Verification code has expired. Please request a new one." });
      }

      if (record.code !== cleanOtp) {
        return res.status(400).json({ error: "Incorrect verification code. Please try again." });
      }

      // Successful verification -> clean up OTP record
      if (isFirebaseConfigured && db) {
        await deleteDoc(doc(db, "otps", cleanEmail));
      } else {
        inMemoryOtps.delete(cleanEmail);
      }

      // Generate a secure, deterministic HMAC password for Firebase Auth
      const saltSecret = process.env.OTP_SECRET || "noirkart-secure-hmac-otp-salt";
      const tempPassword = crypto
        .createHmac("sha256", saltSecret)
        .update(cleanEmail)
        .digest("hex");

      return res.status(200).json({ success: true, tempPassword });
    }

    return res.status(404).json({ error: "Not found" });

  } catch (err) {
    console.error("API error inside api/auth:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
