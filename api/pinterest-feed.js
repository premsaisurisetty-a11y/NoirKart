import fs from 'fs';
import path from 'path';
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
  try {
    let products = [];
    
    if (firebaseConfig.apiKey && firebaseConfig.projectId) {
      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);
      const querySnapshot = await getDocs(collection(db, "products"));
      
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.name && data.price) {
          products.push({
            id: data.id || docSnap.id,
            name: data.name,
            price: data.price,
            category: data.category || "General",
            image: data.image || "",
            buyLink: data.buyLink || ""
          });
        }
      });
      // Sort by ID
      products.sort((a, b) => Number(a.id) - Number(b.id));
    }
    
    // Helper to escape XML special characters
    const escapeXml = (unsafe) => {
      if (typeof unsafe !== 'string') return '';
      return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };
    
    // If no products are in Firestore (or Firebase is unconfigured), fall back to the static feed
    if (products.length === 0) {
      console.log('No live products found in Firestore. Serving static feed fallback.');
      const staticXmlPath = path.join(process.cwd(), 'public/pinterest-feed.xml');
      if (fs.existsSync(staticXmlPath)) {
        const staticXml = fs.readFileSync(staticXmlPath, 'utf8');
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
        return res.status(200).send(staticXml);
      }
      throw new Error('No products found in Firestore and static fallback not found.');
    }
    
    console.log(`Successfully fetched ${products.length} live products from Firestore. Generating feed...`);
    
    let xml = `<?xml version="1.0" encoding="utf-8"?>\n`;
    xml += `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n`;
    xml += `  <channel>\n`;
    xml += `    <title>NoirKart Live Product Catalog</title>\n`;
    xml += `    <link>https://noirkart.com</link>\n`;
    xml += `    <description>Live Curated Premium Deals on NoirKart</description>\n`;
    
    for (const product of products) {
      const title = escapeXml(product.name);
      const description = escapeXml(
        `Buy ${product.name} at ₹${product.price}. Premium ${product.category} curated by NoirKart. Discover verified deals and official merchant links.`
      );
      const link = escapeXml(product.buyLink || `https://noirkart.com/?product=${product.id}`);
      const imageLink = escapeXml(product.image);
      const price = `${product.price} INR`;
      
      xml += `    <item>\n`;
      xml += `      <g:id>${product.id}</g:id>\n`;
      xml += `      <g:title>${title}</g:title>\n`;
      xml += `      <g:description>${description}</g:description>\n`;
      xml += `      <g:link>${link}</g:link>\n`;
      xml += `      <g:image_link>${imageLink}</g:image_link>\n`;
      xml += `      <g:price>${price}</g:price>\n`;
      xml += `      <g:availability>in stock</g:availability>\n`;
      xml += `      <g:condition>new</g:condition>\n`;
      xml += `      <g:brand>NoirKart</g:brand>\n`;
      xml += `    </item>\n`;
    }
    
    xml += `  </channel>\n`;
    xml += `</rss>\n`;
    
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
    return res.status(200).send(xml);
  } catch (error) {
    console.error('Dynamic feed generation failed:', error);
    res.status(500).send(`<error>Failed to generate live feed: ${error.message}</error>`);
  }
}
