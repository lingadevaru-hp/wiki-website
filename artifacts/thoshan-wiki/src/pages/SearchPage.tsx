import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import WikiLayout from "../components/WikiLayout";
import SearchResults from "../components/SearchResults";
import { loadArticlesIndex, searchArticles } from "../lib/articleLoader";
import type { ArticleIndexEntry } from "../types/article";
import SEO from "../components/SEO";
import { useLocale } from "../contexts/LocaleContext";

export default function SearchPage() {
  const { t } = useLocale();
  const [location] = useLocation();
  const [results, setResults] = useState<ArticleIndexEntry[]>([]);
  const [suggestions, setSuggestions] = useState<ArticleIndexEntry[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") || "";
    setQuery(q);
    if (q) {
      setLoading(true);
      searchArticles(q).then((r) => {
        setResults(r);
        setLoading(false);
      });
    } else {
      loadArticlesIndex().then((index) =>
        setSuggestions(
          index.articles.filter((a) => !a.hiddenFromSearch).slice(0, 6),
        ),
      );
    }
  }, [location]);

  return (
    <WikiLayout footer showBackTop>
      <SEO
        title={
          query
            ? `Search: ${query} — Lingadevaru HP's Wiki`
            : "Search — Lingadevaru HP's Wiki"
        }
        description={
          query
            ? `Search results for "${query}" in Lingadevaru HP's Wiki.`
            : "Search articles in Lingadevaru HP's Wiki across blockchain, AI, infrastructure, and more."
        }
        path="/wiki/search"
      />
      {loading ? (
        <div className="text-sm text-muted-foreground">{t('search.searching')}</div>
      ) : query ? (
        <SearchResults results={results} query={query} />
      ) : (
        <div data-testid="search-empty-state">
          <h2 className="text-xl font-serif mb-1">{t('search.wiki')}</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Type at least 2 characters in the search bar above, or start with
            one of these articles.
          </p>
          <ul className="search-results-list">
            {suggestions.map((article) => (
              <li key={article.id}>
                <Link
                  href={`/wiki/${article.slug}`}
                  className="index-row"
                  style={{ borderWidth: 1 }}
                >
                  <span className="index-copy">
                    <strong>{article.title}</strong>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </WikiLayout>
  );
}
