import { Product } from "../components/ProductCard";

const SITE_URL = import.meta.env.VITE_SITE_URL || "https://noirkart.com";
const CLEAN_SITE_URL = SITE_URL.replace(/\/+$/, "");
const ACCESS_TOKEN = import.meta.env.VITE_PINTEREST_ACCESS_TOKEN || "";
const BOARD_ID = import.meta.env.VITE_PINTEREST_BOARD_ID || "";

/**
 * Checks if the product image URL is a public HTTP/HTTPS URL that Pinterest
 * can fetch. Base64 data URIs cannot be used with the Pinterest API.
 */
const isPublicImageUrl = (url: string): boolean =>
  url.startsWith("http://") || url.startsWith("https://");

/**
 * Build a clean Pinterest description for a product.
 */
const buildDescription = (product: Product): string => {
  const parts = [
    `${product.name}`,
    product.discount ? `🔥 ${product.discount}` : "",
    `Now only ₹${product.price.toLocaleString("en-IN")}`,
    product.originalPrice
      ? `(was ₹${product.originalPrice.toLocaleString("en-IN")})`
      : "",
    `\nVetted by NoirKart curators — shop safely with direct merchant links.`,
    `#NoirKart #${product.category.replace(/\s+/g, "")} #PremiumDeals #IndiaDeals`,
  ];
  return parts.filter(Boolean).join(" ");
};

/**
 * Attempt to create a pin via the Pinterest v5 API.
 * Returns true on success, false on failure (so caller can fall back).
 */
const pinViaApi = async (product: Product): Promise<boolean> => {
  if (!ACCESS_TOKEN || !BOARD_ID) return false;
  if (!isPublicImageUrl(product.image)) return false;

  const productUrl = `${CLEAN_SITE_URL}/?product=${product.id}`;

  try {
    const response = await fetch("https://api.pinterest.com/v5/pins", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        board_id: BOARD_ID,
        title: product.name,
        description: buildDescription(product),
        link: productUrl,
        media_source: {
          source_type: "image_url",
          url: product.image,
        },
      }),
    });

    if (response.ok) {
      console.log(
        `[NoirKart Pinterest] ✅ Pinned "${product.name}" successfully via API.`
      );
      return true;
    } else {
      const body = await response.json().catch(() => ({}));
      console.warn(
        `[NoirKart Pinterest] ⚠️ API returned ${response.status}:`,
        body
      );
      return false;
    }
  } catch (err) {
    console.warn("[NoirKart Pinterest] ⚠️ API request failed:", err);
    return false;
  }
};

/**
 * Opens the Pinterest web "Create Pin" dialog in a new tab as a fallback.
 * Works without any API keys.
 */
export const pinViaWebDialog = (product: Product): void => {
  const productUrl = `${CLEAN_SITE_URL}/?product=${product.id}`;
  const description = buildDescription(product);
  
  // Use public product image if available, else route through our dynamic image proxy API
  const mediaUrl = isPublicImageUrl(product.image)
    ? product.image
    : `${CLEAN_SITE_URL}/api/image?id=${product.id}`;

  const params = new URLSearchParams({
    url: productUrl,
    description,
    media: mediaUrl,
  });

  const pinUrl = `https://www.pinterest.com/pin/create/button/?${params.toString()}`;
  window.open(pinUrl, "_blank", "noopener,noreferrer,width=750,height=550");
};

/**
 * Main entry point: post a product to Pinterest.
 *
 * Priority:
 *  1. Pinterest v5 API (if ACCESS_TOKEN + BOARD_ID are set and image is public)
 *  2. Web share dialog (always works as fallback)
 */
export const postProductToPinterest = async (product: Product): Promise<void> => {
  const apiSuccess = await pinViaApi(product);
  if (!apiSuccess) {
    pinViaWebDialog(product);
  }
};
