import { motion } from "motion/react";
import { ChevronLeft } from "lucide-react";
import SEO from "../components/SEO";

export function PrivacyPage() {
  return (
    <>
      <SEO 
        title="Privacy Policy"
        description="Review the Privacy Policy for NoirKart to understand how we manage cookies, analytics, and external merchant links."
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
            <h1 className="text-4xl font-extrabold text-gray-900 mb-6 tracking-tight">Privacy Policy</h1>
            <p className="text-sm text-gray-500 mb-8">Last Updated: June 5, 2026</p>

            <div className="space-y-6 text-gray-600 leading-relaxed text-sm">
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">1. Introduction</h2>
                <p>
                  At NoirKart (accessible from noirkart.com), one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by NoirKart and how we use it.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">2. Information We Collect</h2>
                <p>
                  We only collect information directly from you when you register an account, customize your watchlist, or contact us. This may include:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Personal identifiers (Name, Email address).</li>
                  <li>Authentication credentials managed securely by Firebase Auth.</li>
                  <li>Watchlist selections saved in local storage or synced with Firestore.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">3. How We Use Your Information</h2>
                <p>
                  We use the information we collect to operate, maintain, and improve the directory showcase, including:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Providing the personalized Watchlist/Shortlist feature.</li>
                  <li>Saving administrator catalogs and product listings.</li>
                  <li>Analyzing page visits to optimize visual themes and loading performance.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">4. Cookies and Web Beacons</h2>
                <p>
                  Like any other website, NoirKart uses "cookies" to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience by customizing our web page content based on visitors' browser type and/or other information.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">5. Third-Party Links & Disclaimers</h2>
                <p>
                  Our website contains links to external merchant websites (such as Amazon and other direct sellers). NoirKart has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third-party websites or services. We encourage you to read the privacy policies of any external links you click.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">6. Contact Us</h2>
                <p>
                  If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us at <strong>support@noirkart.com</strong>.
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
