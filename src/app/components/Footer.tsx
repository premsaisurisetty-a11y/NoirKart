import { Instagram, Linkedin, Facebook, Twitter } from "lucide-react";

export function Footer() {
  const socialLinks = [
    { icon: Instagram, label: "Instagram", href: "#" },
    { icon: Facebook, label: "Facebook", href: "#" },
    { icon: Twitter, label: "Twitter", href: "#" },
    { icon: Linkedin, label: "LinkedIn", href: "#" },
  ];
  const footerLinks = {
    "Useful Links": [
      { label: "About Us", href: "?page=about" },
      { label: "Contact Us", href: "?page=contact" },
      { label: "Careers", href: "?page=contact" },
      { label: "Blog", href: "?page=blog" },
    ],
    "Categories": [
      { label: "Electronics", href: "/#category-section-electronics" },
      { label: "Fashion", href: "/#category-section-fashion" },
      { label: "Audio", href: "/#category-section-audio" },
      { label: "Watches", href: "/#category-section-watches" },
      { label: "Accessories", href: "/#category-section-bags" },
      { label: "Workspace", href: "/#category-section-workspace" },
    ],
    "Disclosures": [
      { label: "Affiliate Disclosure", href: "?page=affiliate" },
      { label: "Privacy Policy", href: "?page=privacy" },
      { label: "Terms & Conditions", href: "?page=terms" },
      { label: "FAQ", href: "?page=contact" },
    ],
    "For Brands": [
      { label: "Submit a Deal", href: "?page=contact" },
      { label: "Advertise", href: "?page=contact" },
      { label: "Brand Partnership", href: "?page=contact" },
      { label: "Business Enquiries", href: "?page=contact" },
    ],
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
              NoirKart helps users discover the best products through curated recommendations and honest reviews. We may earn commissions from qualifying purchases at no additional cost to you.
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
          {Object.entries(footerLinks).map(([category, items]) => (
            <div key={category}>
              <h3 className="font-bold text-gray-800 mb-3 text-sm">{category}</h3>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.label}>
                    <a href={item.href} className="text-sm text-gray-600 hover:text-[#E23744] transition-colors cursor-pointer">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-200 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600">
            <p>© 2026 noirkart. Premium Curated Links & Showcases. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="?page=privacy" className="hover:text-[#E23744] transition-colors cursor-pointer">Privacy Policy</a>
              <a href="?page=terms" className="hover:text-[#E23744] transition-colors cursor-pointer">Terms & Conditions</a>
              <a href="?page=affiliate" className="hover:text-[#E23744] transition-colors cursor-pointer">Affiliate Disclosure</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
