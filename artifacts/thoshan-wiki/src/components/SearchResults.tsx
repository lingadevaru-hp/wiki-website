import { Link } from "wouter";
import { useLocale } from "../contexts/LocaleContext";
import type { ArticleIndexEntry } from "../types/article";

interface SearchResultsProps {
  results: ArticleIndexEntry[];
  query: string;
}

export default function SearchResults({ results, query }: SearchResultsProps) {
  const { t } = useLocale();
  if (!query) return null;
  const capped = results.slice(0, 50);

  return (
    <div data-testid="search-results">
      <h2 className="text-xl font-serif mb-1">{t("search.results")}</h2>
      <p className="text-sm text-muted-foreground mb-4">
        {results.length === 1
          ? t("search.result1")
          : `${results.length} ${t("search.resultsN")}`}{" "}
        for &ldquo;{query}&rdquo;
        {results.length > capped.length
          ? ` — showing first ${capped.length}`
          : ""}
      </p>
      {results.length === 0 ? (
        <div className="border border-border rounded-xl p-4 bg-card text-sm">
          <p className="font-bold mb-1">{t("search.noResults")}</p>
          <p className="text-muted-foreground">
            {t("search.nothingFound")}{" "}
            <Link href="/wiki/articles" className="text-accent hover:underline">
              {t("home.browse")}
            </Link>
            .
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {capped.map((article) => (
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
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="float-right ml-3 mb-1 w-20 h-14 object-cover border border-border rounded-md"
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
