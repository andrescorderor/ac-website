import { useEffect } from 'react';

const SITE_ORIGIN = 'https://andresmcorderor.netlify.app';

interface PageSeoOptions {
  title: string;
  description: string;
  path: string;
  jsonLd?: Record<string, unknown>;
}

/**
 * Dynamically synchronizes document head metadata, canonical URL, Open Graph tags,
 * and route-level JSON-LD structured data on public routes.
 */
export function usePageSeo({ title, description, path, jsonLd }: PageSeoOptions) {
  useEffect(() => {
    const canonicalUrl = `${SITE_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
    document.title = title;

    const setMeta = (selector: string, content: string) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute('content', content);
    };

    setMeta('meta[name="description"]', description);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:url"]', canonicalUrl);
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', description);

    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', canonicalUrl);
    }

    const existingScript = document.getElementById('route-jsonld');
    if (existingScript) existingScript.remove();

    if (jsonLd) {
      const script = document.createElement('script');
      script.id = 'route-jsonld';
      script.type = 'application/ld+json';
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      const script = document.getElementById('route-jsonld');
      if (script) script.remove();
    };
  }, [title, description, path, jsonLd]);
}
