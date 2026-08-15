import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  type?: 'website' | 'article';
  keywords?: string[];
}

export default function SEO({ title, description, path = '/', type = 'website', keywords = [] }: SEOProps) {
  useEffect(() => {
    const url = new URL(path, window.location.origin).href;
    document.title = title;
    const tags: Record<string, string> = {
      description,
      'og:title': title,
      'og:description': description,
      'og:type': type,
      'og:url': url,
      'twitter:title': title,
      'twitter:description': description,
      'twitter:card': 'summary_large_image',
    };
    if (keywords.length) tags.keywords = keywords.join(', ');
    Object.entries(tags).forEach(([name, content]) => {
      const selector = `meta[name="${name}"], meta[property="${name}"]`;
      let tag = document.head.querySelector<HTMLMetaElement>(selector);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(name.startsWith('og:') ? 'property' : 'name', name);
        document.head.appendChild(tag);
      }
      tag.content = content;
    });
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = url;
  }, [description, keywords, path, title, type]);
  return null;
}
