import { useEffect } from "react";
import {
  SUPPORTED_LOCALES,
  detectLocale,
  localeEntry,
} from "../i18n/supportedLocales";

const OG_LOCALE: Record<string, string> = {
  en: "en_US",
  kn: "kn_IN",
  hi: "hi_IN",
  ja: "ja_JP",
  ml: "ml_IN",
  ta: "ta_IN",
  te: "te_IN",
  gu: "gu_IN",
};

function upsertHrefLang(hreflang: string, href: string) {
  let link = document.head.querySelector<HTMLLinkElement>(
    `link[rel="alternate"][hreflang="${hreflang}"]`,
  );
  if (!link) {
    link = document.createElement("link");
    link.rel = "alternate";
    link.hreflang = hreflang;
    document.head.appendChild(link);
  }
  link.href = href;
}

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  type?: "website" | "article";
  keywords?: string[];
  ogImage?: string;
  article?: {
    datePublished?: string;
    dateModified?: string;
  };
  schema?: Record<string, unknown> | Record<string, unknown>[];
}

function upsertMeta(
  name: string,
  content: string,
  attribute: "name" | "property" = "name",
) {
  const selector = `meta[${attribute}="${name}"]`;
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, name);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function upsertLink(rel: string, href: string) {
  let link = document.head.querySelector<HTMLLinkElement>(
    `link[rel="${rel}"]`,
  );
  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    document.head.appendChild(link);
  }
  link.href = href;
}

export default function SEO({
  title,
  description,
  path = "/",
  type = "website",
  keywords = [],
  ogImage = "https://lingadevaru.in/opengraph.jpg",
  article,
  schema,
}: SEOProps) {
  useEffect(() => {
    const url = new URL(path, window.location.origin).href;

    // Title
    document.title = title;

    // Core meta
    upsertMeta("description", description);
    upsertMeta("author", "Lingadevaru H P");
    upsertMeta("robots", "index, follow, max-image-preview:large, max-snippet:-1");
    upsertMeta("googlebot", "index, follow, max-image-preview:large, max-snippet:-1");
    upsertMeta("bingbot", "index, follow, max-image-preview:large, max-snippet:-1");
    if (keywords.length) upsertMeta("keywords", keywords.join(", "));

    // Open Graph
    upsertMeta("og:title", title, "property");
    upsertMeta("og:description", description, "property");
    upsertMeta("og:type", type, "property");
    upsertMeta("og:url", url, "property");
    upsertMeta("og:site_name", "Lingadevaru HP | Thoshan's Wiki", "property");
    upsertMeta("og:image", ogImage, "property");
    upsertMeta("og:image:width", "1200", "property");
    upsertMeta("og:image:height", "630", "property");
    // Locale alternates: tell search engines (Google, DuckDuckGo, Brave)
    // this page exists in other languages on sibling subdomains.
    const active = detectLocale(
      window.location.hostname,
      window.location.search,
    );
    upsertMeta(
      "og:locale",
      OG_LOCALE[active] ?? OG_LOCALE.en,
      "property",
    );
    for (const entry of SUPPORTED_LOCALES) {
      const u = new URL(path, `https://${entry.host}`).href;
      upsertHrefLang(entry.code, u);
    }
    upsertHrefLang(
      "x-default",
      new URL(path, `https://${localeEntry("en").host}`).href,
    );

    // Twitter Card
    upsertMeta("twitter:card", "summary_large_image");
    upsertMeta("twitter:title", title);
    upsertMeta("twitter:description", description);
    upsertMeta("twitter:image", ogImage);
    upsertMeta("twitter:site", "@lingadevaruhp");
    upsertMeta("twitter:creator", "@lingadevaruhp");

    // Article-specific OG tags
    if (type === "article" && article) {
      if (article.datePublished)
        upsertMeta("article:published_time", article.datePublished, "property");
      if (article.dateModified)
        upsertMeta("article:modified_time", article.dateModified, "property");
      upsertMeta("article:author", "Lingadevaru H P", "property");
    }

    // Canonical
    upsertLink("canonical", url);

    // JSON-LD schema
    if (schema) {
      const schemas = Array.isArray(schema) ? schema : [schema];
      // Remove existing page-level JSON-LD
      document.head
        .querySelectorAll('script[type="application/ld+json"][data-page-schema]')
        .forEach((el) => el.remove());
      schemas.forEach((s) => {
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.setAttribute("data-page-schema", "true");
        script.textContent = JSON.stringify(s);
        document.head.appendChild(script);
      });
    }

    return () => {
      // Clean up page-level JSON-LD on unmount
      document.head
        .querySelectorAll('script[type="application/ld+json"][data-page-schema]')
        .forEach((el) => el.remove());
    };
  }, [
    article,
    description,
    keywords,
    ogImage,
    path,
    schema,
    title,
    type,
  ]);

  return null;
}
