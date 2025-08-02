import { useState, useMemo, useCallback, useEffect } from 'react';
import Fuse from 'fuse.js';
import { useDebounce } from './useProductionOptimization';
import { useLocalStorage } from './useLocalStorage';

interface SearchableItem {
  id: number;
  name: string;
  category: string | null;
  [key: string]: any;
}

interface SearchFilters {
  categories: string[];
  [key: string]: any;
}

interface UseFuseSearchOptions {
  threshold?: number;
  debounceMs?: number;
  maxResults?: number;
}

export function useFuseSearch<T extends SearchableItem>(
  items: T[],
  options: UseFuseSearchOptions = {}
) {
  const {
    threshold = 0.35, // Balance between strict and fuzzy
    debounceMs = 150,
    maxResults = 1000
  } = options;

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({ categories: [] });
  const { value: searchHistory, setValue: setSearchHistory } = useLocalStorage<string[]>('fuse_search_history', []);
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);

  // Configure Fuse.js
  const fuseOptions = useMemo(() => ({
    keys: [
      { name: 'name', weight: 0.8 },      // Name is most important
      { name: 'category', weight: 0.2 }   // Category is secondary
    ],
    threshold,                            // Typo tolerance
    includeScore: true,                   // For result ranking
    includeMatches: true,                 // For highlighting
    ignoreCase: true,                     // Case insensitive
    minMatchCharLength: 1,                // Allow single character matches
    shouldSort: true,                     // Sort by relevance
    ignoreLocation: true,                 // Don't care about position in string
    findAllMatches: true,                 // Find all matches
    useExtendedSearch: false              // Keep it simple
  }), [threshold]);

  // Create Fuse instance
  const fuse = useMemo(() => {
    console.log('[FuseSearch] Creating Fuse instance for', items.length, 'items');
    return new Fuse(items, fuseOptions);
  }, [items, fuseOptions]);

  // Search results
  const searchResults = useMemo(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < 1) {
      return applyFilters(items, filters);
    }

    console.log('[FuseSearch] Searching for:', debouncedSearchTerm);
    const startTime = performance.now();
    
    const fuseResults = fuse.search(debouncedSearchTerm);
    const results = fuseResults
      .slice(0, maxResults)
      .map(result => result.item);

    const endTime = performance.now();
    console.log(`[FuseSearch] Found ${results.length} results in ${(endTime - startTime).toFixed(2)}ms`);

    return applyFilters(results, filters);
  }, [debouncedSearchTerm, fuse, filters, items, maxResults]);

  // Loading state effect
  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm && searchTerm.length >= 1) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  }, [searchTerm, debouncedSearchTerm]);

  // Search suggestions
  const searchSuggestions = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];

    const suggestions = new Set<string>();

    // Add from search history
    searchHistory.forEach(term => {
      if (term.toLowerCase().includes(searchTerm.toLowerCase())) {
        suggestions.add(term);
      }
    });

    // Add category suggestions
    const categories = [...new Set(items.map(item => item.category).filter(Boolean))];
    categories.forEach(category => {
      if (category && category.toLowerCase().includes(searchTerm.toLowerCase())) {
        suggestions.add(category);
      }
    });

    // Add product name suggestions (first few words)
    items.forEach(item => {
      if (item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        const words = item.name.split(/\s+/).slice(0, 3).join(' ');
        if (words.length <= 50) {
          suggestions.add(words);
        }
      }
    });

    return Array.from(suggestions).slice(0, 8);
  }, [searchTerm, items, searchHistory]);

  // Filter options
  const filterOptions = useMemo(() => {
    const categories = [...new Set(items.map(item => item.category).filter(Boolean))];
    return {
      categories: categories.sort(),
      totalItems: items.length
    };
  }, [items]);

  // Search functions
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    
    // Add to search history
    if (term.length >= 3 && !searchHistory.includes(term)) {
      const newHistory = [term, ...searchHistory.slice(0, 9)];
      setSearchHistory(newHistory);
    }
  }, [searchHistory, setSearchHistory]);

  const handleFilterChange = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setFilters({ categories: [] });
  }, []);

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
  }, [setSearchHistory]);

  return {
    // Search state
    searchTerm,
    searchResults,
    searchSuggestions,
    filters,
    filterOptions,
    isSearching,
    
    // Search actions
    handleSearch,
    handleFilterChange,
    clearSearch,
    
    // History
    searchHistory,
    clearSearchHistory,
    
    // Computed values
    hasActiveSearch: searchTerm.length >= 1,
    hasActiveFilters: filters.categories.length > 0,
    totalResults: searchResults.length
  };
}

// Helper function
function applyFilters<T extends SearchableItem>(items: T[], filters: SearchFilters): T[] {
  let filtered = items;
  
  // Category filter
  if (filters.categories.length > 0) {
    filtered = filtered.filter(item => 
      item.category && filters.categories.includes(item.category)
    );
  }
  
  return filtered;
}