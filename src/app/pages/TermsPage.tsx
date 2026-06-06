import { motion } from "motion/react";
import { ChevronLeft } from "lucide-react";
import SEO from "../components/SEO";

export function TermsPage() {
  return (
    <>
      <SEO 
        title="Terms & Conditions"
        description="Review the Terms & Conditions of using NoirKart's premium curated deal directory."
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
            className="bg-white rounded-2xl shadow-sm p-8 md:p-12 border border-gray-100 text-left"
          >
            <h1 className="text-4xl font-extrabold text-gray-900 mb-6 tracking-tight">Terms & Conditions</h1>
            <p className="text-sm text-gray-500 mb-8">Last Updated: June 5, 2026</p>

            <div className="space-y-6 text-gray-600 leading-relaxed text-sm">
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">1. Agreement to Terms</h2>
                <p>
                  By accessing the website at noirkart.com, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">2. Use License</h2>
                <p>
                  Permission is granted to temporarily view the curated listings on NoirKart's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Modify or copy the content;</li>
                  <li>Use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
                  <li>Attempt to decompile or reverse engineer any software contained on NoirKart's website;</li>
                  <li>Transfer the materials to another person or "mirror" the materials on any other server.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">3. Disclaimer</h2>
                <p>
                  The materials on NoirKart's website are provided on an 'as is' basis. NoirKart makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                </p>
                <p className="mt-2">
                  Further, NoirKart does not warrant or make any representations concerning the accuracy, likely results, or reliability of the use of the materials on its website or otherwise relating to such materials or on any sites linked to this site.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">4. Purchase Disclaimer (Third-Party Sites)</h2>
                <p>
                  NoirKart is a curated catalog of recommendations. All product links take you directly to external merchant platforms (such as Amazon India). The actual purchase transaction, shipping, billing, returns, and support are handled solely by the external merchant. NoirKart is not responsible for any issues arising from your transaction on third-party sites.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">5. Limitations of Liability</h2>
                <p>
                  In no event shall NoirKart or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on NoirKart's website, even if NoirKart or an authorized representative has been notified orally or in writing of the possibility of such damage.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">6. Governing Law</h2>
                <p>
                  These terms and conditions are governed by and construed in accordance with the laws of Karnataka, India, and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
