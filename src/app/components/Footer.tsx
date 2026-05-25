import { Instagram, Linkedin, MessageCircle, Send, Facebook, Twitter } from "lucide-react";

export function Footer() {
  const socialLinks = [
    { icon: Instagram, label: "Instagram", href: "#" },
    { icon: Facebook, label: "Facebook", href: "#" },
    { icon: Twitter, label: "Twitter", href: "#" },
    { icon: Linkedin, label: "LinkedIn", href: "#" },
  ];

  const footerLinks = {
    "Useful Links": ["About", "Careers", "Blog", "Press", "Lead"],
    "Categories": ["Electronics", "Fashion", "Audio", "Watches", "Accessories", "Workspace"],
    "For Consumers": ["Payments", "Shipping", "Product Returns", "FAQ", "Shop Checkout"],
    "For Partners": ["Sell on PREM NEXUS", "Partner Program", "Affiliate", "Business Enquiries"],
  };

  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-8">
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <h2 className="text-2xl font-bold text-[#0c831f] mb-4">PREM NEXUS</h2>
            <p className="text-sm text-gray-600 mb-4">
              India's fastest quick commerce platform. Get products delivered in 10 minutes.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-9 h-9 rounded-full bg-gray-100 hover:bg-[#0c831f] hover:text-white transition-colors flex items-center justify-center"
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-bold text-gray-800 mb-3 text-sm">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-gray-600 hover:text-[#0c831f] transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600">
            <p>© 2026 PREM NEXUS. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-[#0c831f] transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-[#0c831f] transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-[#0c831f] transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
