import { motion } from "motion/react";
import { ChevronLeft } from "lucide-react";
import SEO from "../components/SEO";

export function AboutPage() {
  return (
    <>
      <SEO 
        title="About Us"
        description="Learn more about NoirKart, our curation standards, and our handpicked merchant deal recommendations."
      />
      <div className="min-h-screen bg-gray-50 pt-44 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-2 text-gray-600 hover:text-[#E23744] mb-6 transition-colors cursor-pointer w-fit font-medium">
            <ChevronLeft size={20} /> Back to Curated Directory
          </a>
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-sm p-8 md:p-12 border border-gray-100"
          >
            <h1 className="text-4xl font-extrabold text-gray-900 mb-6 tracking-tight">About NoirKart</h1>
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              Welcome to <strong>NoirKart</strong>—your ultimate curated directory for premium product designs and handpicked web deals. We help design-conscious consumers find the absolute best products directly from official and verified merchant stores.
            </p>

            <div className="border-t border-gray-100 pt-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-950 mb-4">Our Curation Mission</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                The internet is flooded with millions of products, make-shift stores, and fake discounts. Finding premium quality items that have actual verified reviews is harder than ever. NoirKart was created to solve this problem.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Our catalog curators scour various marketplaces, manufacturer sites, and trusted brands to find high-end design-focused items. We do not manufacture or pack these products ourselves; instead, we refer you directly to the secure checkout systems of established merchants (like Amazon and brand stores) where you get the safest buying experience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 pt-4">
              <div className="bg-red-50/50 p-6 rounded-xl border border-red-100 text-center">
                <span className="text-3xl mb-2 block">🔍</span>
                <h3 className="font-bold text-gray-900 mb-1">Handpicked</h3>
                <p className="text-xs text-gray-600">Strict design and visual appeal criteria.</p>
              </div>
              <div className="bg-red-50/50 p-6 rounded-xl border border-red-100 text-center">
                <span className="text-3xl mb-2 block">🛡️</span>
                <h3 className="font-bold text-gray-900 mb-1">100% Vetted</h3>
                <p className="text-xs text-gray-600">Links are verified for authenticity and safety.</p>
              </div>
              <div className="bg-red-50/50 p-6 rounded-xl border border-red-100 text-center">
                <span className="text-3xl mb-2 block">🔗</span>
                <h3 className="font-bold text-gray-900 mb-1">Direct Links</h3>
                <p className="text-xs text-gray-600">Secure checkout directly with official merchants.</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-8">
              <h2 className="text-2xl font-bold text-gray-950 mb-4">How It Works</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                1. <strong>Discover</strong>: Browse our catalog pages structured neatly by categories.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                2. <strong>Compare</strong>: Check curated specifications, ratings, and vetted pricing details.
              </p>
              <p className="text-gray-600 leading-relaxed">
                3. <strong>Buy Securely</strong>: Clicking on "Buy from Official Store" routes you straight to the merchant's checkout, where you transact directly and securely.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
