import { Link } from "wouter";
import type { ArticleIndexEntry } from "../types/article";

interface SearchResultsProps {
  results: ArticleIndexEntry[];
  query: string;
}

export default function SearchResults({ results, query }: SearchResultsProps) {
  if (!query) return null;

  return (
    <div data-testid="search-results">
      <h2 className="text-xl font-serif mb-1">Search results</h2>
      <p className="text-sm text-muted-foreground mb-4">
        {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;
        {query}&rdquo;
      </p>
      {results.length === 0 ? (
        <div className="border border-border p-4 bg-card text-sm">
          <p className="font-bold mb-1">No results found</p>
          <p className="text-muted-foreground">
            There is no article with that name. You can{" "}
            <a href="#" className="text-accent hover:underline">
              create this article
            </a>
            .
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {results.map((article) => (
            <li
              key={article.id}
              className="border-b border-border"
              data-testid={`search-result-${article.id}`}
            >
              <Link
                href={`/wiki/${article.slug}`}
                className="block pb-4 hover:bg-card/60 transition-colors"
              >
                <span className="text-accent text-lg font-serif">
                  {article.title}
                </span>
                {article.thumbnail && (
                  <img
                    src={article.thumbnail}
                    alt={article.title}
                    className="float-right ml-3 mb-1 w-20 h-14 object-cover border border-border"
                  />
                )}
                <p className="text-xs text-muted-foreground mt-0.5 mb-1">
                  {article.category}
                </p>
                <p className="text-sm text-foreground">{article.excerpt}</p>
                <div className="clear-both" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
