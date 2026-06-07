import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://noir-kart.vercel.app';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  keywords, 
  image = DEFAULT_OG_IMAGE,
  url = SITE_URL,
  type = 'website'
}) => {
  const siteTitle = `${title} | NoirKart`;

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
      {import.meta.env.VITE_GOOGLE_SITE_VERIFICATION && (
        <meta name="google-site-verification" content={import.meta.env.VITE_GOOGLE_SITE_VERIFICATION} />
      )}

      {/* Canonical URL */}
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook / LinkedIn / WhatsApp */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="NoirKart — Curated Premium Deals" />
      <meta property="og:site_name" content="NoirKart" />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={siteTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      <meta property="twitter:image:alt" content="NoirKart — Curated Premium Deals" />
    </Helmet>
  );
};

export default SEO;
