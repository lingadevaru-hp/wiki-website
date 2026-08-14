import { Link } from 'wouter';
import { Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
      <Link href="/" className="text-foreground hover:text-accent transition-colors" aria-label="Home">
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
