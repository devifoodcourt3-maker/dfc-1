import { useEffect } from 'react';

/**
 * Reusable SEO component for dynamic head tag updates per route
 */
const SEO = ({
  title = 'DFC Restaurant | Best Restaurant in Tagarapuvalasa & Bheemili',
  description = 'DFC Restaurant (Devi Food Court) — The best restaurant in Tagarapuvalasa & Bheemili. Order authentic Dum Biryani, Tandoori, Curries, Sweets & Mocktails online for fast home delivery.',
  keywords = 'DFC, DFC Restaurant, DFC Thagarapuvalasa, DFC Tagarapuvalasa, best restaurant, best restaurant in tagarapuvalasa, best restaurant in bheemili',
  canonical = 'https://dfcthagarapuvalasa.in',
  ogImage = 'https://dfcthagarapuvalasa.in/starter-chicken.png',
}) => {
  useEffect(() => {
    // Title
    document.title = title;

    // Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', description);

    // Meta Keywords
    let metaKw = document.querySelector('meta[name="keywords"]');
    if (metaKw) metaKw.setAttribute('content', keywords);

    // Canonical
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (linkCanonical) linkCanonical.setAttribute('href', canonical);

    // OG Title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);

    // OG Description
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', description);

    // OG URL
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', canonical);

    // OG Image
    let ogImg = document.querySelector('meta[property="og:image"]');
    if (ogImg) ogImg.setAttribute('content', ogImage);
  }, [title, description, keywords, canonical, ogImage]);

  return null;
};

export default SEO;
