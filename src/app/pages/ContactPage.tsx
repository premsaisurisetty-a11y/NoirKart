import { motion } from "motion/react";
import { useState } from "react";
import { Mail, Phone, MapPin, CheckCircle2, ChevronLeft } from "lucide-react";
import SEO from "../components/SEO";

export function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      alert("Please fill in all fields.");
      return;
    }
    setSubmitted(true);
    setName("");
    setEmail("");
    setMessage("");
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <>
      <SEO 
        title="Contact Us"
        description="Have a question or a brand proposal? Contact the NoirKart team directly."
      />
      <div className="min-h-screen bg-gray-50 pt-36 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-2 text-gray-600 hover:text-[#E23744] mb-6 transition-colors cursor-pointer w-fit font-medium">
            <ChevronLeft size={20} /> Back to Curated Directory
          </a>
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 grid grid-cols-1 md:grid-cols-5"
          >
            {/* Contact Information Sidebar */}
            <div className="bg-gradient-to-br from-[#E23744] to-[#CB202D] p-8 md:p-12 text-white md:col-span-2 flex flex-col justify-between">
              <div>
                <h1 className="text-3xl font-extrabold mb-4">Contact Us</h1>
                <p className="text-sm opacity-90 leading-relaxed mb-8">
                  Have a question, feedback, or a partnership inquiry? We'd love to hear from you. Get in touch with our curation team.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Mail className="flex-shrink-0" size={20} />
                  <div>
                    <p className="text-xs opacity-75">Support Email</p>
                    <p className="text-sm font-semibold">support@noirkart.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Phone className="flex-shrink-0" size={20} />
                  <div>
                    <p className="text-xs opacity-75">Phone</p>
                    <p className="text-sm font-semibold">+91 98765 43210</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <MapPin className="flex-shrink-0" size={20} />
                  <div>
                    <p className="text-xs opacity-75">Office Location</p>
                    <p className="text-sm font-semibold">Bengaluru, Karnataka, India</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/20 text-xs opacity-75">
                Replies usually sent within 24-48 business hours.
              </div>
            </div>

            {/* Interactive Form */}
            <div className="p-8 md:p-12 md:col-span-3">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
              {submitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-6 flex items-start gap-3"
                >
                  <CheckCircle2 className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-bold text-green-900 mb-1">Message Sent!</h3>
                    <p className="text-sm leading-relaxed">
                      Thank you for contacting us. Our curation team has received your message and will review it shortly.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Your Name</label>
                    <input 
                      type="text" 
                      placeholder="John Doe" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E23744]/30 focus:border-[#E23744]/40 text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="you@example.com" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E23744]/30 focus:border-[#E23744]/40 text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Message Content</label>
                    <textarea 
                      rows={4}
                      placeholder="Write your message here..." 
                      value={message} 
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E23744]/30 focus:border-[#E23744]/40 text-sm transition-all"
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="w-full bg-[#E23744] hover:bg-[#CB202D] text-white py-3 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg cursor-pointer"
                  >
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
