import { Instagram, Linkedin } from "lucide-react";

// X (formerly Twitter) SVG — official monochrome mark
const XIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// Telegram SVG Icon
const TelegramIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
  </svg>
);

export function Footer() {
  const socialLinks = [
    { icon: Instagram, label: "Instagram", href: "https://www.instagram.com/noir_kart.in/" },
    { icon: TelegramIcon, label: "Telegram", href: "https://t.me/premdealsss" },
    { icon: XIcon, label: "X", href: "https://x.com/NoirKart" },
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
                  target="_blank" rel="noopener noreferrer"
                  aria-label={social.label}
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
