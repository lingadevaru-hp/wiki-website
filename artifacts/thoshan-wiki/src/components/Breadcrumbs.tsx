import { Link } from "wouter";
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
      aria-label="Breadcrumb"
      className="flex items-center gap-1 text-sm text-muted-foreground mb-4"
    >
      <Link
        href="/"
        className="text-foreground hover:text-accent transition-colors"
        aria-label="Home"
      >
        <Home size={14} className="shrink-0" />
      </Link>

      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          <span className="text-muted-foreground">/</span>
          {item.href ? (
            <Link
              href={item.href}
              className="text-foreground hover:text-accent transition-colors truncate max-w-[120px] sm:max-w-[200px]"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-muted-foreground truncate max-w-[120px] sm:max-w-[200px]">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
