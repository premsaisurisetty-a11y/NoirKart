import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.VITE_FIREBASE_APP_ID || ""
};

export default async function handler(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).send('Product ID is required.');
  }

  try {
    let targetProduct = null;

    if (firebaseConfig.apiKey && firebaseConfig.projectId) {
      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);
      const querySnapshot = await getDocs(collection(db, "products"));
      
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const pId = data.id || docSnap.id;
        if (String(pId) === String(id)) {
          targetProduct = {
            image: data.image || ""
          };
        }
      });
    }

    if (targetProduct && targetProduct.image) {
      const imgStr = targetProduct.image;
      
      if (imgStr.startsWith('data:image/')) {
        // Extract MIME type and base64 data
        const match = imgStr.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
        
        if (match) {
          const contentType = match[1];
          const base64Data = match[2];
          const buffer = Buffer.from(base64Data, 'base64');
          
          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', 'public, max-age=86400');
          return res.status(200).send(buffer);
        }
      } else if (imgStr.startsWith('http://') || imgStr.startsWith('https://')) {
        // Redirect to the external public image URL
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.redirect(302, imgStr);
      }
    }

    // Default fallback: redirect to og-image.png
    const siteUrl = (process.env.VITE_SITE_URL || 'https://noirkart.com').replace(/\/+$/, "");
    return res.redirect(302, `${siteUrl}/og-image.png`);
  } catch (error) {
    console.error('Image proxy failed:', error);
    try {
      const siteUrl = (process.env.VITE_SITE_URL || 'https://noirkart.com').replace(/\/+$/, "");
      return res.redirect(302, `${siteUrl}/og-image.png`);
    } catch (_) {
      return res.status(500).send('Internal Server Error');
    }
  }
}
