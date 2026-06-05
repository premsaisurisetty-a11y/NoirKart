import { motion } from "motion/react";
import { ChevronLeft } from "lucide-react";
import SEO from "../components/SEO";

export function AffiliatePage() {
  return (
    <>
      <SEO 
        title="Affiliate Disclosure"
        description="Read the Affiliate Disclosure for NoirKart. Understand our relationships with Amazon Associates and other affiliate programs."
      />
      <div className="min-h-screen bg-gray-50 pt-36 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-2 text-gray-600 hover:text-[#E23744] mb-6 transition-colors cursor-pointer w-fit font-medium">
            <ChevronLeft size={20} /> Back to Curated Directory
          </a>
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-sm p-8 md:p-12 border border-gray-100 text-left"
          >
            <h1 className="text-4xl font-extrabold text-gray-900 mb-6 tracking-tight">Affiliate Disclosure</h1>
            <p className="text-sm text-gray-500 mb-8">Last Updated: June 5, 2026</p>

            <div className="space-y-6 text-gray-600 leading-relaxed text-sm">
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">1. Transparency First</h2>
                <p>
                  We believe in transparency on the internet. In compliance with the FTC Guidelines and Google Publisher policies, this page explains the affiliate relationships that NoirKart (noirkart.com) has with other companies and merchants.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">2. What Is An Affiliate Link?</h2>
                <p>
                  Many of the product links on NoirKart are affiliate links. This means that if you click on the link and make a purchase on the external merchant site (such as Amazon India), NoirKart may receive a small referral commission at no additional cost to you.
                </p>
                <p className="mt-2">
                  The price you pay for the product remains exactly the same whether you use our link or go directly to the merchant's site.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">3. Amazon Associates Program</h2>
                <p>
                  NoirKart is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.in. As an Amazon Associate, we earn from qualifying purchases.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">4. Our Curation Standard</h2>
                <p>
                  Our referral relationships do not influence the products we choose to display. We only recommend products that have excellent user ratings, high aesthetic design appeal, and represent vetted deals.
                </p>
                <p className="mt-2">
                  We showcase products because they match our standards of premium design, not because of the small commission we may earn.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">5. Contact Information</h2>
                <p>
                  If you have any questions regarding this disclosure or our relationship with merchants, feel free to contact us at <strong>support@noirkart.com</strong>.
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
