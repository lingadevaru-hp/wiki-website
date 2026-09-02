import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import WikiLayout from "../components/WikiLayout";
import SearchResults from "../components/SearchResults";
import { searchArticles } from "../lib/articleLoader";
import type { ArticleIndexEntry } from "../types/article";
import SEO from "../components/SEO";

export default function SearchPage() {
  const [location] = useLocation();
  const [results, setResults] = useState<ArticleIndexEntry[]>([]);
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
    }
  }, [location]);

  return (
    <WikiLayout footer>
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
        <div className="text-sm text-muted-foreground">Searching...</div>
      ) : (
        <SearchResults results={results} query={query} />
      )}
    </WikiLayout>
  );
}
