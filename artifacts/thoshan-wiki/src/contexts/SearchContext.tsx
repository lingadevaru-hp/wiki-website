import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { ArticleType } from "../lib/articleTypes";

/** Search scope: the whole archive, or one collection shelf (news). */
export type SearchScope = "all" | ArticleType;

interface SearchContextValue {
  isOpen: boolean;
  scope: SearchScope;
  openSearch: (scope?: SearchScope) => void;
  closeSearch: () => void;
  toggleSearch: () => void;
}

const SearchContext = createContext<SearchContextValue>({
  isOpen: false,
  scope: "all",
  openSearch: () => {},
  closeSearch: () => {},
  toggleSearch: () => {},
});

export function SearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [scope, setScope] = useState<SearchScope>("all");

  const openSearch = useCallback((nextScope: SearchScope = "all") => {
    setScope(nextScope);
    setIsOpen(true);
  }, []);
  // Closing resets to the whole archive, so the header icon always opens
  // global search; collection pages pass their scope explicitly.
  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setScope("all");
  }, []);
  const toggleSearch = useCallback(() => setIsOpen((v) => !v), []);

  return (
    <SearchContext.Provider
      value={{ isOpen, scope, openSearch, closeSearch, toggleSearch }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  return useContext(SearchContext);
}
