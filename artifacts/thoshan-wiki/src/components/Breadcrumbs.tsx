import { Link } from "wouter";
import { useLocale } from "../contexts/LocaleContext";
import { Home } from "lucide-react";
import { useEffect } from "react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const { t } = useLocale();
  // BreadcrumbList JSON-LD schema
  useEffect(() => {
    const baseUrl = "https://lingadevaru.in";
    const allItems = [
      { name: "Home", item: baseUrl + "/" },
      ...items.map((item) => ({
        name: item.label,
        item: item.href ? baseUrl + item.href : undefined,
      })),
    ];

    const schema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: allItems.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        ...(item.item ? { item: item.item } : {}),
      })),
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-breadcrumb-schema", "true");
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      document.head
        .querySelectorAll('script[data-breadcrumb-schema]')
        .forEach((el) => el.remove());
    };
  }, [items]);

  return (
    <nav
      aria-label={t('article.breadcrumb')}
      className="wiki-breadcrumbs flex min-w-0 max-w-full flex-wrap items-center gap-x-1.5 gap-y-2 text-sm text-muted-foreground mb-5 mt-1 min-h-[32px] pt-1"
    >
      <Link
        href="/"
        className="shrink-0 rounded-md p-1.5 -m-1 text-foreground hover:text-accent transition-colors inline-flex items-center"
        aria-label={t('menu.home')}
      >
        <Home size={15} className="shrink-0" />
      </Link>

      {items.map((item, index) => (
        <span key={index} className="flex min-w-0 items-center gap-1.5">
          <span aria-hidden="true" className="shrink-0 select-none text-muted-foreground/70">
            /
          </span>
          {item.href ? (
            <Link
              href={item.href}
              className="min-w-0 truncate rounded px-0.5 py-1 -my-1 text-foreground hover:text-accent hover:underline hover:underline-offset-4 transition-colors max-w-[38vw] min-[420px]:max-w-[150px] sm:max-w-[200px]"
            >
              {item.label}
            </Link>
          ) : (
            <span
              aria-current={index === items.length - 1 ? "page" : undefined}
              className="min-w-0 truncate px-0.5 py-1 -my-1 text-muted-foreground max-w-[38vw] min-[420px]:max-w-[150px] sm:max-w-[220px]"
            >
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
