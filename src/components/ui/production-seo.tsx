import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
}

const ProductionSEO: React.FC<SEOProps> = ({
  title = 'DukaFiti - Smart Business Management',
  description = 'Kenya\'s most advanced shop management system with M-Pesa integration and offline support.',
  keywords = 'Kenya shop management, duka management, M-Pesa integration, inventory management, POS system',
  image = '/lovable-uploads/bf4819d1-0c68-4a73-9c6e-6597615e7931.png',
  url = window.location.href,
  type = 'website'
}) => {
  const fullTitle = title.includes('DukaFiti') ? title : `${title} | DukaFiti`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="canonical" href={url} />

      {/* Open Graph Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="DukaFiti" />
      <meta property="og:locale" content="en_KE" />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Additional Meta Tags */}
      <meta name="author" content="DukaFiti" />
      <meta name="theme-color" content="#602d86" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="DukaFiti" />

      {/* Performance Hints */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="//supabase.com" />
    </Helmet>
  );
};

export default ProductionSEO;