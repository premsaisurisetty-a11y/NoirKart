import { Product } from "../components/ProductCard";

const SITE_URL = import.meta.env.VITE_SITE_URL || "https://noirkart.com";
const CLEAN_SITE_URL = SITE_URL.replace(/\/+$/, "");
const ACCESS_TOKEN = import.meta.env.VITE_INSTAGRAM_ACCESS_TOKEN || "";
const BUSINESS_ACCOUNT_ID = import.meta.env.VITE_INSTAGRAM_BUSINESS_ACCOUNT_ID || "";
const INSTAGRAM_PROFILE_URL = import.meta.env.VITE_INSTAGRAM_PROFILE_URL || "https://www.instagram.com";

/**
 * Checks if the product image URL is a public HTTP/HTTPS URL that Meta
 * can fetch. Base64 data URIs cannot be used with the Meta APIs.
 */
const isPublicImageUrl = (url: string): boolean =>
  url.startsWith("http://") || url.startsWith("https://");

/**
 * Build a clean Instagram caption/description for a product.
 */
export const buildInstagramCaption = (product: Product): string => {
  const productUrl = product.buyLink || `${CLEAN_SITE_URL}/?product=${product.id}`;
  const parts = [
    `🔥 ${product.name} 🔥`,
    product.discount ? `🏷️ Deal: ${product.discount}` : "",
    `💰 Price: ₹${product.price.toLocaleString("en-IN")}`,
    product.originalPrice
      ? `(Original price: ₹${product.originalPrice.toLocaleString("en-IN")})`
      : "",
    `\n✨ Curated by NoirKart — Shop with confidence using verified, direct-to-merchant links.`,
    `👉 Shop now: ${productUrl}`,
    `\n#NoirKart #InstagramShopping #ShopSmart #IndiaDeals #CuratedDeals #${product.category.replace(/\s+/g, "")}`,
  ];
  return parts.filter(Boolean).join(" ");
};

/**
 * Helper to delay execution (used for API processing wait).
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Attempt to publish a product photo to Instagram via Meta Graph API.
 * Returns true on success, false on failure (so caller can fall back).
 */
const publishViaApi = async (product: Product): Promise<boolean> => {
  if (!ACCESS_TOKEN || !BUSINESS_ACCOUNT_ID) return false;
  if (!isPublicImageUrl(product.image)) return false;

  const caption = buildInstagramCaption(product);

  try {
    // Step 1: Create Media Container
    console.log(`[NoirKart Instagram] Creating media container for: "${product.name}"...`);
    const containerParams = new URLSearchParams({
      image_url: product.image,
      caption,
      access_token: ACCESS_TOKEN,
    });
    
    const containerResponse = await fetch(
      `https://graph.facebook.com/v19.0/${BUSINESS_ACCOUNT_ID}/media?${containerParams.toString()}`,
      { method: "POST" }
    );

    if (!containerResponse.ok) {
      const errBody = await containerResponse.json().catch(() => ({}));
      console.warn("[NoirKart Instagram] ⚠️ Container creation failed:", errBody);
      return false;
    }

    const { id: creationId } = await containerResponse.json();
    if (!creationId) {
      console.warn("[NoirKart Instagram] ⚠️ No container ID returned.");
      return false;
    }

    console.log(`[NoirKart Instagram] Container created (ID: ${creationId}). Waiting for processing...`);
    
    // Give Meta's servers 5 seconds to process the image container before publishing
    await delay(5000);

    // Step 2: Publish the Media Container
    const publishParams = new URLSearchParams({
      creation_id: creationId,
      access_token: ACCESS_TOKEN,
    });

    const publishResponse = await fetch(
      `https://graph.facebook.com/v19.0/${BUSINESS_ACCOUNT_ID}/media_publish?${publishParams.toString()}`,
      { method: "POST" }
    );

    if (publishResponse.ok) {
      const pubData = await publishResponse.json();
      console.log(`[NoirKart Instagram] ✅ Published successfully. Post ID: ${pubData.id}`);
      return true;
    } else {
      const errBody = await publishResponse.json().catch(() => ({}));
      console.warn("[NoirKart Instagram] ⚠️ Publishing failed:", errBody);
      return false;
    }
  } catch (err) {
    console.warn("[NoirKart Instagram] ⚠️ API request encountered an error:", err);
    return false;
  }
};

/**
 * Copy caption to clipboard and trigger profile redirection in manual fallback mode.
 */
export const copyAndRedirectToInstagram = async (product: Product): Promise<void> => {
  const caption = buildInstagramCaption(product);
  
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(caption);
      console.log("[NoirKart Instagram] Caption copied to clipboard successfully.");
    } catch (err) {
      console.warn("[NoirKart Instagram] Failed to write text to clipboard:", err);
    }
  }

  // Open Instagram in new window
  window.open(INSTAGRAM_PROFILE_URL, "_blank", "noopener,noreferrer");
};

/**
 * Main entry point: post a product to Instagram.
 *
 * Priority:
 *  1. Meta Content Publishing API (if ACCESS_TOKEN + BUSINESS_ACCOUNT_ID are set)
 *  2. Manual clipboard + redirection fallback (always works)
 */
export const postProductToInstagram = async (product: Product): Promise<{ success: boolean; method: "api" | "fallback" }> => {
  const apiSuccess = await publishViaApi(product);
  if (apiSuccess) {
    return { success: true, method: "api" };
  } else {
    await copyAndRedirectToInstagram(product);
    return { success: true, method: "fallback" };
  }
};
