import { Link } from 'wouter';
import type { ArticleIndexEntry } from '../types/article';

const categoryColors: Record<string, string> = {
  'Profile': '#3366CC',
  'Blockchain': '#E67E22',
  'AI / ML': '#8E44AD',
  'Infrastructure': '#27AE60',
  'Security': '#C0392B',
  'Systems': '#2980B9',
  'Web': '#16A085',
  'Learning': '#F39C12',
};

interface RelatedArticlesProps {
  articles: ArticleIndexEntry[];
  currentSlug?: string;
  maxItems?: number;
}

export default function RelatedArticles({ 
  articles, 
  currentSlug, 
  maxItems = 3 
}: RelatedArticlesProps) {
  const filteredArticles = articles
    .filter(article => article.slug !== currentSlug)
    .slice(0, maxItems);

  if (filteredArticles.length === 0) return null;

  return (
    <section className="mt-8 pt-6 border-t border-border">
      <h2 className="text-sm font-semibold text-foreground mb-4">
        Related Articles
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {filteredArticles.map((article) => (
          <Link
            key={article.id}
            href={`/wiki/${article.slug}`}
            className="flex gap-3 border border-border p-3 hover:bg-card hover:border-accent/30 transition-all rounded-lg group"
          >
            {article.thumbnail && (
              <img
                src={article.thumbnail}
                alt={article.title}
                className="w-16 h-12 object-cover border border-border shrink-0 rounded"
              />
            )}
            <div className="min-w-0 flex-1">
              <span 
                className="text-[10px] font-semibold uppercase tracking-wider block mb-1"
                style={{
                  color: categoryColors[article.category] || '#A0AABC',
                }}
              >
                {article.category}
              </span>
              <h3 className="text-sm font-medium text-foreground group-hover:text-accent transition-colors line-clamp-1">
                {article.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {article.excerpt}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
