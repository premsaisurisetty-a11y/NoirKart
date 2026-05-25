import { Instagram, Linkedin, Facebook, Twitter } from "lucide-react";

export function Footer() {
  const socialLinks = [
    { icon: Instagram, label: "Instagram", href: "#" },
    { icon: Facebook, label: "Facebook", href: "#" },
    { icon: Twitter, label: "Twitter", href: "#" },
    { icon: Linkedin, label: "LinkedIn", href: "#" },
  ];
  const footerLinks = {
    "Useful Links": ["About", "Careers", "Blog", "Press", "Guidelines"],
    "Categories": ["Electronics", "Fashion", "Audio", "Watches", "Accessories", "Workspace"],
    "Disclosures": ["Affiliate Disclosure", "How it Works", "Terms of Use", "FAQ"],
    "For Brands": ["Submit a Deal", "Advertise", "Brand Partnership", "Business Enquiries"],
  };

  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-8">
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <div className="mb-4">
              <img src="/Noirkart.png" alt="noirkart" className="h-10 w-auto object-contain" />
            </div>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Your ultimate curated directory for premium product designs and handpicked deals. We find and verify the best merchant purchase links so you don't have to.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a key={social.label} href={social.href}
                  className="w-9 h-9 rounded-full bg-gray-100 hover:bg-[#E23744] hover:text-white transition-colors flex items-center justify-center cursor-pointer">
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
                  <li key={link}><a href="#" className="text-sm text-gray-600 hover:text-[#E23744] transition-colors cursor-pointer">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-200 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600">
            <p>© 2026 noirkart. Premium Curated Links & Showcases. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-[#E23744] transition-colors cursor-pointer">Privacy Policy</a>
              <a href="#" className="hover:text-[#E23744] transition-colors cursor-pointer">Terms of Service</a>
              <a href="#" className="hover:text-[#E23744] transition-colors cursor-pointer">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
