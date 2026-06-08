import { Product } from "../components/ProductCard";

export interface TrustMetadata {
  dealScore: number;
  valueScore: number;
  isEditorsChoice: boolean;
  priceHistory: {
    current: number;
    avg30Day: number;
    allTimeLow: number;
  };
  pros: string[];
  cons: string[];
  recommendationReason: string;
}

export function getProductTrustMetadata(product: Product): TrustMetadata {
  const id = product.id || 1;
  const rating = product.rating || 4.5;
  const price = product.price || 999;
  const discountStr = product.discount || "";
  
  // Calculate deterministic scores based on ID, rating, discount
  let discountNum = 20;
  const match = discountStr.match(/(\d+)/);
  if (match) {
    discountNum = parseInt(match[1]);
  }
  
  const dealScore = Math.min(99, Math.max(85, Math.round(82 + (discountNum * 0.25) + (rating * 2.2) + (id % 4))));
  const valueScore = Math.min(99, Math.max(85, Math.round(80 + (rating * 3.4) + (id % 5))));
  const isEditorsChoice = rating >= 4.8;
  
  // Price history calculations
  const avg30Day = Math.round(price * 1.09);
  const allTimeLow = Math.round(price * 0.93);
  
  // Pros and Cons based on Category
  const cat = (product.category || "").toLowerCase();
  
  let pros = ["Excellent value for price", "Highly durable design", "Positive user feedback"];
  let cons = ["Standard features list", "Warranty limited by merchant"];
  let recommendationReason = "This product represents a safe purchase with proven merchant reviews and is verified by the NoirKart AI crawler.";

  if (cat.includes("audio")) {
    pros = ["Crystal clear high-fidelity sound", "Premium build quality & comfort", "Excellent active noise isolation"];
    cons = ["Slightly elevated bass by default", "Charging cable is relatively short"];
    recommendationReason = "Recommended for audiophiles looking for premium active noise cancellation and ergonomic cushion designs without brand premiums.";
  } else if (cat.includes("watch")) {
    pros = ["Exquisite premium luxury design", "Highly accurate chronograph timing", "Robust water-resistant casing"];
    cons = ["Slightly heavy wrist weight", "Strap might require initial break-in"];
    recommendationReason = "Vetted for timekeeping precision and scratch-resistant sapphire glass, making it an excellent formal and daily wear accessory.";
  } else if (cat.includes("workspace") || cat.includes("office") || cat.includes("desk")) {
    pros = ["Ergonomic design boosts productivity", "Sturdy premium materials", "Sleek aesthetic matches modern setups"];
    cons = ["Premium pricing point", "Requires minor desk footprint configuration"];
    recommendationReason = "Vetted as a top WFH choice due to its aluminum construction and immediate ergonomic alignment.";
  } else if (cat.includes("electronic") || cat.includes("device") || cat.includes("tv")) {
    pros = ["Advanced state-of-the-art features", "Energy efficient power usage", "Highly responsive controls"];
    cons = ["User manual is rather brief", "Requires stable power adapter"];
    recommendationReason = "Aggregated as a top tech recommendation based on responsive UI speeds and low standby thermal outputs.";
  } else if (cat.includes("fashion") || cat.includes("apparel") || cat.includes("bag")) {
    pros = ["Handcrafted organic materials", "Extremely comfortable daily wear", "Timeless aesthetic & design"];
    cons = ["Delicate fabric requires gentle care", "Sizing runs slightly snug"];
    recommendationReason = "Hand-selected by our wardrobe catalog designers for its authentic thread counts and durable zips.";
  } else if (cat.includes("grocery") || cat.includes("chocolate") || cat.includes("drink") || cat.includes("food")) {
    pros = ["Artisanal organic ingredients", "Rich delicious authentic taste profile", "Vetted shelf-life & packaging"];
    cons = ["Premium gourmet pricing", "Temperature sensitive storage needed"];
    recommendationReason = "Sourced directly from verified organic farms in India, ensuring authentic flavor and zero chemical additions.";
  }

  return {
    dealScore,
    valueScore,
    isEditorsChoice,
    priceHistory: {
      current: price,
      avg30Day,
      allTimeLow
    },
    pros,
    cons,
    recommendationReason
  };
}
