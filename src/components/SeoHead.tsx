import React, { useEffect } from 'react';

interface SeoHeadProps {
  title: string;
  description?: string;
  canonicalPath?: string;
  jsonLd?: Record<string, unknown> | null;
}

export const SeoHead: React.FC<SeoHeadProps> = ({
  title,
  description,
  canonicalPath,
  jsonLd,
}) => {
  useEffect(() => {
    document.title = title;

    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);
    }

    if (canonicalPath) {
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      const base = window.location.origin || 'https://erikalog.netlify.app';
      canonical.setAttribute('href', `${base}${canonicalPath}`);
    }

    const existingScript = document.getElementById('erikalog-jsonld');
    if (existingScript) {
      existingScript.remove();
    }

    if (jsonLd) {
      const script = document.createElement('script');
      script.id = 'erikalog-jsonld';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      const s = document.getElementById('erikalog-jsonld');
      if (s) s.remove();
    };
  }, [title, description, canonicalPath, jsonLd]);

  return null;
};
