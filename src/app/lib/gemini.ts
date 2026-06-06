import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || "";

// AI is configured if either Gemini or OpenRouter key is present
export const isGeminiConfigured = Boolean(GEMINI_API_KEY || OPENROUTER_API_KEY);

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// Valid categories that match the existing NoirKart store
const VALID_CATEGORIES = [
  "Apparel & Accessories", "Shoes, Luggage & Bags, Watches", "Beauty",
  "Kitchen", "Furniture", "Home", "Grocery", "Amazon Fresh", "Sports",
  "Automotive", "Health and Personal Care", "Baby products",
  "Echo & Alexa Devices", "Fire TV Devices", "Pet Products",
  "Mobile Accessories", "Books", "Office Products", "Toys", "BISS",
  "Lawn & Garden", "Video Games", "Personal Care Appliances",
  "Personal Computers", "Smart Watches", "Televisions", "Electronics",
  "Large Appliances", "Bicycles & Heavy Gym Equipment", "Tyres & Rims",
  "Jewelry (Excluding silver & Gold coins)", "Data Storage Devices", "Mobile Phones", "Bill Payment & Recharges",
  "All Other Categories"
];

export interface GeneratedProduct {
  name: string;
  price: number;
  originalPrice: number;
  discount: string;
  category: string;
  subCategory?: string;
  unit: string;
  rating: number;
  image: string;
  buyLink: string;
  keywords: string[];
}

/**
 * Check if the input looks like an Amazon URL.
 */
export function isAmazonUrl(input: string): boolean {
  const trimmed = input.trim();
  return /^https?:\/\/(www\.)?(amazon\.(in|com|co\.uk|de|fr|es|it|ca|com\.au|co\.jp)|amzn\.(in|to|com))\//i.test(trimmed);
}

/**
 * Extract readable product info from an Amazon URL slug.
 * e.g., "https://www.amazon.in/Sony-WH-1000XM4-Cancelling-Headphones/dp/B08F25LP2R"
 *   → "Sony WH 1000XM4 Cancelling Headphones"
 */
function extractProductInfoFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Try to extract product title from the URL slug (before /dp/)
    const dpMatch = pathname.match(/\/([^/]+)\/dp\//);
    if (dpMatch && dpMatch[1]) {
      // Replace hyphens with spaces and clean up
      return dpMatch[1].replace(/-/g, " ").replace(/\s+/g, " ").trim();
    }

    // Try other patterns: /gp/product/, /gp/aw/d/
    const gpMatch = pathname.match(/\/([^/]+)\/gp\//);
    if (gpMatch && gpMatch[1]) {
      return gpMatch[1].replace(/-/g, " ").replace(/\s+/g, " ").trim();
    }

    // Fallback: use search params if it's a search URL
    const searchQuery = urlObj.searchParams.get("k") || urlObj.searchParams.get("keywords");
    if (searchQuery) {
      return searchQuery.replace(/\+/g, " ");
    }

    // Last resort: use the full pathname cleaned up
    return pathname.replace(/\//g, " ").replace(/-/g, " ").replace(/\s+/g, " ").trim();
  } catch {
    return url;
  }
}

/**
 * Core function that calls Gemini with a prompt and returns a sanitized product.
 */
async function callGeminiForProduct(
  userMessage: string,
  systemPromptExtra: string = "",
  overrideBuyLink?: string
): Promise<GeneratedProduct> {
  if (!isGeminiConfigured) {
    throw new Error(
      "AI is not configured. Please add VITE_OPENROUTER_API_KEY or VITE_GEMINI_API_KEY to your .env file.\n" +
      "• OpenRouter (recommended): https://openrouter.ai/keys\n" +
      "• Gemini (free): https://aistudio.google.com/apikey"
    );
  }

  const isAmazon = userMessage.includes("http");
  let amazonContext = "";

  if (isAmazon) {
    try {
      const urlMatch = userMessage.match(/Amazon Product URL: (https?:\/\/[^\s]+)/);
      if (urlMatch && urlMatch[1]) {
        let amazonUrl = urlMatch[1];
        
        // Use Codetabs free proxy to bypass CORS and fetch actual Amazon HTML
        const res = await fetch("https://api.codetabs.com/v1/proxy?quest=" + encodeURIComponent(amazonUrl));
        const html = await res.text();
        
        // Extract Title
        const titleMatch = html.match(/<title>([^<]*)</);
        let title = titleMatch ? titleMatch[1].replace(/(:? Amazon\.in: Electronics|:? Amazon\.in|:? Buy Online)/gi, "").trim() : "Premium Amazon Product";
        if (title.length > 100) title = title.slice(0, 100) + "...";
        
        // Extract Price (e.g. from <span class="a-price-whole">1,559</span>)
        const priceMatch = html.match(/class="a-price-whole">([^<]*)</);
        const priceStr = priceMatch ? priceMatch[1].replace(/,/g, '').replace(/\./g, '').trim() : "";
        const price = priceStr ? Number(priceStr) : 1999;
        
        // Extract Original Price
        const origMatch = html.match(/class="a-price a-text-price"[^>]*><span aria-hidden="true">[^0-9]*([0-9,]+)</);
        const origPriceStr = origMatch ? origMatch[1].replace(/,/g, '').trim() : "";
        const originalPrice = origPriceStr ? Number(origPriceStr) : price + Math.floor(price * 0.5);
        
        const discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);
        
        // Extract High-Res Image (Filter out thumbnails containing '._')
        const imgMatches = html.match(/https:\/\/m\.media-amazon\.com\/images\/I\/[a-zA-Z0-9_\-\.]+\.jpg/g) || [];
        const hqImages = imgMatches.filter(img => !img.includes('._') && !img.includes('SX') && !img.includes('SY'));
        const image = hqImages.length > 0 ? hqImages[0] : "https://dummyimage.com/600x600/000/fff&text=Product+Image";

        // We won't return immediately! We will save these exact scraped details
        // and let the AI generate the proper Category, Keywords, and Rating.
        amazonContext = `
CRITICAL: You are formatting data for an Amazon product.
Exact Name: ${title}
Exact Sale Price: ${price}
Exact Original Price: ${originalPrice}

Use these exact prices and name. Do NOT invent your own prices. 
Determine the correct category from the allowed list, generate 12-18 relevant search keywords, and assign a realistic rating.`;

        // Store scraped data in global scope for this request to override the AI later
        (globalThis as any).scrapedAmazonData = {
          name: title,
          price: price,
          originalPrice: originalPrice,
          discount: `${discountPercent}% OFF`,
          image: image,
          buyLink: amazonUrl
        };
      }
    } catch (err) {
      console.error("Amazon direct scraping failed:", err);
    }
  }

  const systemPrompt = `You are a premium e-commerce product catalog assistant for "noirkart", an Indian premium curated deals store.

${systemPromptExtra}
${amazonContext}

Generate a COMPLETE product entry as a JSON object.

RULES:
1. "name" — A catchy, premium-sounding product name (2-6 words). Do NOT include brand names.
2. "price" — Realistic discounted selling price in Indian Rupees (INR). Must be a whole number.
3. "originalPrice" — The MRP / original price BEFORE discount. Must be higher than "price". Whole number.
4. "discount" — The discount percentage label, formatted exactly like "35% OFF". Calculate from price and originalPrice.
5. "category" — MUST be exactly one of: ${VALID_CATEGORIES.join(", ")}. Pick the closest match.
5b. "subCategory" — A relevant sub-category classification, e.g., "Headphones", "Earbuds", "Watches", "T-Shirts", "Backpacks", "Candles", "Snacks", "Office Supplies", "Mice & Keyboards", etc.
6. "unit" — e.g., "1 piece", "1 set", "1 pack", "1 box", "1 bottle", "1 bag", "1 tin", "1 box (16 pcs)" etc.
7. "rating" — A realistic rating between 4.3 and 5.0 with one decimal place.
8. "imageSearchTerm" — A 2-4 word English search term for finding a matching product photo on Unsplash. Be specific and visual.
9. "buySearchTerm" — A search query for finding this product on Amazon India.
10. "keywords" — An array of 12-18 relevant search keywords.

RESPOND ONLY with a valid JSON object. No markdown, no code fences.
Example output:
{"name":"Premium Wireless Headphones","price":2999,"originalPrice":4999,"discount":"40% OFF","category":"Audio","subCategory":"Headphones","unit":"1 piece","rating":4.8,"imageSearchTerm":"wireless headphones black","buySearchTerm":"premium wireless headphones","keywords":["headphones","audio","music"]}`;

  let responseText = "";

  // --- Priority 1: OpenRouter API (if key is configured) ---
  if (OPENROUTER_API_KEY) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://noirkart.com",
          "X-Title": "NoirKart Admin"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage }
          ],
          response_format: { type: "json_object" }
        })
      });
      const data = await res.json();
      if (data?.choices?.[0]?.message?.content) {
        responseText = data.choices[0].message.content.trim();
      } else {
        throw new Error("Empty OpenRouter response");
      }
    } catch (err: any) {
      console.warn("OpenRouter failed:", err.message, "— trying next fallback...");
    }
  }

  // --- Priority 2: Gemini Direct API (if key is configured and OpenRouter failed) ---
  if (!responseText && genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent([
        { text: systemPrompt },
        { text: userMessage }
      ]);
      responseText = result.response.text().trim();
    } catch (err: any) {
      console.warn("Gemini direct API failed:", err.message, "— trying Pollinations fallback...");
    }
  }

  // --- Priority 3: Pollinations free fallback (no key required) ---
  if (!responseText) {
    try {
      const fallbackPrompt = systemPrompt + "\n\nUser Request: " + userMessage;
      const res = await fetch('https://text.pollinations.ai/prompt/' + encodeURIComponent(fallbackPrompt) + '?json=true');
      responseText = await res.text();
      responseText = responseText.trim();
    } catch (fallbackErr) {
      throw new Error("All AI providers failed. Please check your API key or try again later.");
    }
  }

  let jsonStr = responseText;
  
  // Bulletproof JSON extractor: Grab everything from the first { to the last }
  const robustJsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (robustJsonMatch) {
    jsonStr = robustJsonMatch[0];
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse AI response:", responseText);
    throw new Error("AI returned an invalid response. Please try again.");
  }
  
  const category = VALID_CATEGORIES.includes(parsed.category)
    ? parsed.category
    : "Electronics";

  const price = Math.max(1, Math.round(Number(parsed.price) || 999));
  const originalPrice = Math.max(price + 1, Math.round(Number(parsed.originalPrice) || price * 1.5));
  const discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);

  // TRUE AUTOMATION: Generate a custom AI Product Photo instead of using broken Unsplash links
  const imageSearchTerm = parsed.imageSearchTerm || parsed.name || "premium product";
  const imagePrompt = `Professional product photography of ${imageSearchTerm}, studio lighting, highly detailed, clean white background, 4k`;
  const image = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=800&height=800&nologo=true`;

  // Buy link: use override (original Amazon link) or generate one
  let buyLink: string;
  if (overrideBuyLink) {
    buyLink = overrideBuyLink;
  } else {
    const buySearchTerm = parsed.buySearchTerm || parsed.name || "product";
    buyLink = `https://www.amazon.in/s?k=${encodeURIComponent(buySearchTerm)}`;
  }

  const finalName = (globalThis as any).scrapedAmazonData?.name || String(parsed.name || "AI Generated Product").slice(0, 80);
  const finalImage = (globalThis as any).scrapedAmazonData?.image || image;
  const finalBuyLink = (globalThis as any).scrapedAmazonData?.buyLink || buyLink;

  // Clear it so it doesn't leak to other requests
  delete (globalThis as any).scrapedAmazonData;

  return {
    name: finalName,
    price: price,
    originalPrice: originalPrice,
    discount: `${discountPercent}% OFF`,
    category,
    subCategory: parsed.subCategory ? String(parsed.subCategory).slice(0, 50) : undefined,
    unit: String(parsed.unit || "1 piece"),
    rating: Math.min(5, Math.max(1, Number((Number(parsed.rating) || 4.7).toFixed(1)))),
    image: finalImage,
    buyLink: finalBuyLink,
    keywords: Array.isArray(parsed.keywords)
      ? parsed.keywords.map((k: any) => String(k)).slice(0, 20)
      : ["product"]
  };
}

/**
 * Generate a product from a text description.
 */
export async function generateProductWithAI(prompt: string): Promise<GeneratedProduct> {
  if (!prompt.trim()) {
    throw new Error("Please enter a product description.");
  }
  return callGeminiForProduct(`Generate a product for: ${prompt}`);
}

/**
 * Generate a product from an Amazon product URL.
 * Extracts the product name from the URL slug and uses AI to fill in all fields.
 * Preserves the original Amazon link as the buy link.
 */
export async function generateProductFromAmazonLink(url: string): Promise<GeneratedProduct> {
  const trimmedUrl = url.trim();

  if (!isAmazonUrl(trimmedUrl)) {
    throw new Error("Please provide a valid Amazon product link (amazon.in, amazon.com, etc.).");
  }

  const extractedInfo = extractProductInfoFromUrl(trimmedUrl);

  const amazonContext = `The user has provided an Amazon product URL. Extract the product details from the URL information below.
The product's buy link should be the ORIGINAL Amazon URL provided — do NOT generate a search link.
Analyze the product name from the URL and generate accurate pricing, category, and details for the Indian market.`;

  return callGeminiForProduct(
    `Amazon Product URL: ${trimmedUrl}\nExtracted product info from URL: ${extractedInfo}\n\nGenerate the product entry based on this Amazon product.`,
    amazonContext,
    trimmedUrl // Preserve the original Amazon link
  );
}

