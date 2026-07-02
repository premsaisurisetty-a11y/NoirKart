import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://noirkart.com';
const CLEAN_SITE_URL = SITE_URL.replace(/\/+$/, "");
const DEFAULT_OG_IMAGE = `${CLEAN_SITE_URL}/og-image.png`;

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  productId?: number;
}

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  keywords, 
  image = DEFAULT_OG_IMAGE,
  url = CLEAN_SITE_URL,
  type = 'website',
  productId
}) => {
  const siteTitle = `${title} | NoirKart`;

  // Fallback to the default branded OG image if the image is not a public URL (e.g. if it is a local base64 data URI)
  const isPublicUrl = (urlStr: string): boolean =>
    urlStr.startsWith("http://") || urlStr.startsWith("https://");
  
  const ogImage = isPublicUrl(image)
    ? image
    : productId
    ? `${CLEAN_SITE_URL}/api/image?id=${productId}`
    : DEFAULT_OG_IMAGE;
  const ogUrl = url.endsWith('/') ? url : `${url}/`;


  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content="index, follow" />
      {keywords && <meta name="keywords" content={keywords} />}
      {import.meta.env.VITE_PINTEREST_VERIFICATION_CODE && (
        <meta name="p:domain_verify" content={import.meta.env.VITE_PINTEREST_VERIFICATION_CODE} />
      )}
      {import.meta.env.VITE_META_DOMAIN_VERIFICATION && (
        <meta name="facebook-domain-verification" content={import.meta.env.VITE_META_DOMAIN_VERIFICATION} />
      )}
      {import.meta.env.VITE_GOOGLE_SITE_VERIFICATION && (
        <meta name="google-site-verification" content={import.meta.env.VITE_GOOGLE_SITE_VERIFICATION} />
      )}

      {/* Canonical URL */}
      <link rel="canonical" href={ogUrl} />

      {/* Open Graph / Facebook / LinkedIn / WhatsApp */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={ogUrl} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="NoirKart — Curated Premium Deals" />
      <meta property="og:site_name" content="NoirKart" />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={ogUrl} />
      <meta property="twitter:title" content={siteTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={ogImage} />
      <meta property="twitter:image:alt" content="NoirKart — Curated Premium Deals" />
    </Helmet>
  );
};

export default SEO;
