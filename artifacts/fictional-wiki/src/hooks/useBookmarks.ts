import { useState, useEffect, useCallback } from 'react';

export interface BookmarkItem {
  slug: string;
  title: string;
  category: string;
  savedAt: number;
}

const BOOKMARKS_KEY = 'thoshan_wiki_bookmarks_v1';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(BOOKMARKS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    } catch (e) {
      console.error('Failed to save bookmarks to localStorage', e);
    }
  }, [bookmarks]);

  const addBookmark = useCallback((item: Omit<BookmarkItem, 'savedAt'>) => {
    setBookmarks((prev) => {
      if (prev.some((b) => b.slug === item.slug)) return prev;
      return [{ ...item, savedAt: Date.now() }, ...prev];
    });
  }, []);

  const removeBookmark = useCallback((slug: string) => {
    setBookmarks((prev) => prev.filter((b) => b.slug !== slug));
  }, []);

  const isBookmarked = useCallback(
    (slug: string) => bookmarks.some((b) => b.slug === slug),
    [bookmarks]
  );

  const toggleBookmark = useCallback(
    (item: Omit<BookmarkItem, 'savedAt'>) => {
      if (isBookmarked(item.slug)) {
        removeBookmark(item.slug);
      } else {
        addBookmark(item);
      }
    },
    [isBookmarked, addBookmark, removeBookmark]
  );

  return {
    bookmarks,
    addBookmark,
    removeBookmark,
    isBookmarked,
    toggleBookmark,
  };
}
