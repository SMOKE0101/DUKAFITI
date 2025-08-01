import { useState, useMemo, useCallback, useEffect } from 'react';
import { useDebounce } from './useProductionOptimization';
import { useLocalStorage } from './useLocalStorage';

interface SearchableItem {
  id: number;
  name: string;
  category: string | null;
  [key: string]: any;
}

interface SearchResult<T> extends SearchableItem {
  score: number;
  matchedFields: string[];
  originalItem: T;
}

interface SearchFilters {
  categories: string[];
  priceRange?: { min: number; max: number };
  [key: string]: any;
}

interface SearchAnalytics {
  term: string;
  timestamp: number;
  resultCount: number;
  selected?: boolean;
}

interface UseIntelligentSearchOptions {
  searchFields?: string[];
  minSearchLength?: number;
  debounceMs?: number;
  maxResults?: number;
  enableAnalytics?: boolean;
}

export function useIntelligentSearch<T extends SearchableItem>(
  items: T[],
  options: UseIntelligentSearchOptions = {}
) {
  const {
    searchFields = ['name', 'category'],
    minSearchLength = 1,
    debounceMs = 300,
    maxResults = 1000,
    enableAnalytics = true
  } = options;

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({ categories: [] });
  const { value: searchHistory, setValue: setSearchHistory } = useLocalStorage<string[]>('search_history', []);
  const { value: searchAnalytics, setValue: setSearchAnalytics } = useLocalStorage<SearchAnalytics[]>('search_analytics', []);
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);

  // Create search index for fast lookup
  const searchIndex = useMemo(() => {
    return items.map(item => ({
      ...item,
      searchableText: searchFields
        .map(field => String(item[field] || ''))
        .join(' ')
        .toLowerCase(),
      keywords: extractKeywords(item.name, item.category)
    }));
  }, [items, searchFields]);

  // Intelligent search algorithm
  const searchResults = useMemo(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < minSearchLength) {
      return applyFilters(items, filters);
    }

    const query = debouncedSearchTerm.toLowerCase().trim();
    const results: SearchResult<T>[] = [];

    searchIndex.forEach(item => {
      const score = calculateSearchScore(item, query, searchFields);
      if (score > 0) {
        results.push({
          ...item,
          score,
          matchedFields: getMatchedFields(item, query, searchFields),
          originalItem: item
        });
      }
    });

    // Sort by score (descending) and apply filters
    const sortedResults = results
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);

    const filteredResults = applyFilters(sortedResults.map(r => r.originalItem), filters);
    return filteredResults;
  }, [debouncedSearchTerm, searchIndex, filters, items, searchFields, minSearchLength, maxResults]);

  // Handle search loading state separately
  useEffect(() => {
    if (debouncedSearchTerm && debouncedSearchTerm.length >= minSearchLength) {
      setIsSearching(true);
      const timer = setTimeout(() => setIsSearching(false), 100);
      return () => clearTimeout(timer);
    } else {
      setIsSearching(false);
    }
  }, [debouncedSearchTerm, minSearchLength]);

  // Handle search analytics separately
  useEffect(() => {
    if (enableAnalytics && debouncedSearchTerm && debouncedSearchTerm !== searchTerm && searchResults.length >= 0) {
      logSearchAnalytics(debouncedSearchTerm, searchResults.length);
    }
  }, [debouncedSearchTerm, searchTerm, searchResults.length, enableAnalytics]);

  // Search suggestions based on current input
  const searchSuggestions = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];

    const suggestions = new Set<string>();
    const query = searchTerm.toLowerCase();

    // Add exact matches from search history
    searchHistory.forEach(term => {
      if (term.toLowerCase().includes(query)) {
        suggestions.add(term);
      }
    });

    // Add category suggestions
    const uniqueCategories = [...new Set(items.map(item => item.category).filter(Boolean))];
    uniqueCategories.forEach(category => {
      if (category && category.toLowerCase().includes(query)) {
        suggestions.add(category);
      }
    });

    // Add product name suggestions
    items.forEach(item => {
      if (item.name.toLowerCase().includes(query)) {
        // Extract relevant words from the product name
        const words = item.name.split(/\s+/).filter(word => 
          word.length > 2 && word.toLowerCase().includes(query)
        );
        words.forEach(word => suggestions.add(word));
      }
    });

    return Array.from(suggestions).slice(0, 10);
  }, [searchTerm, searchHistory, items]);

  // Available filter options
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
    
    // Add to search history if it's a meaningful search
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
    setSearchAnalytics([]);
  }, [setSearchHistory, setSearchAnalytics]);

  // Analytics functions
  const logSearchAnalytics = useCallback((term: string, resultCount: number) => {
    if (!enableAnalytics) return;
    
    const analytics: SearchAnalytics = {
      term,
      timestamp: Date.now(),
      resultCount
    };
    
    setSearchAnalytics(prev => [analytics, ...prev.slice(0, 99)]);
  }, [enableAnalytics, setSearchAnalytics]);

  const markSearchSelection = useCallback((term: string) => {
    if (!enableAnalytics) return;
    
    setSearchAnalytics(prev => 
      prev.map(analytics => 
        analytics.term === term 
          ? { ...analytics, selected: true }
          : analytics
      )
    );
  }, [enableAnalytics, setSearchAnalytics]);

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
    
    // History and analytics
    searchHistory,
    searchAnalytics,
    clearSearchHistory,
    markSearchSelection,
    
    // Computed values
    hasActiveSearch: searchTerm.length >= minSearchLength,
    hasActiveFilters: filters.categories.length > 0,
    totalResults: searchResults.length
  };
}

// Helper functions
function extractKeywords(name: string, category: string | null): string[] {
  const keywords = new Set<string>();
  
  // Extract words from name
  const nameWords = name.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  nameWords.forEach(word => keywords.add(word));
  
  // Add category
  if (category) {
    keywords.add(category.toLowerCase());
  }
  
  // Add common synonyms and related terms
  const synonymMap: Record<string, string[]> = {
    'soap': ['detergent', 'cleaner', 'washing'],
    'shampoo': ['hair', 'care', 'cosmetic'],
    'milk': ['dairy', 'beverage', 'drink'],
    'rice': ['grain', 'food', 'staple'],
    'sugar': ['sweet', 'sweetener', 'additive']
  };
  
  nameWords.forEach(word => {
    if (synonymMap[word]) {
      synonymMap[word].forEach(synonym => keywords.add(synonym));
    }
  });
  
  return Array.from(keywords);
}

function calculateSearchScore(
  item: SearchableItem & { searchableText: string; keywords: string[] },
  query: string,
  searchFields: string[]
): number {
  let score = 0;
  const queryWords = query.split(/\s+/).filter(word => word.length > 0);
  
  queryWords.forEach(queryWord => {
    // Exact name match (highest score)
    if (item.name.toLowerCase() === queryWord) {
      score += 100;
    }
    // Name starts with query
    else if (item.name.toLowerCase().startsWith(queryWord)) {
      score += 80;
    }
    // Name contains query
    else if (item.name.toLowerCase().includes(queryWord)) {
      score += 60;
    }
    // Category exact match
    else if (item.category?.toLowerCase() === queryWord) {
      score += 50;
    }
    // Category contains query
    else if (item.category?.toLowerCase().includes(queryWord)) {
      score += 30;
    }
    // Keyword match
    else if (item.keywords.some(keyword => keyword.includes(queryWord))) {
      score += 20;
    }
    // Fuzzy match (Levenshtein distance)
    else {
      const fuzzyScore = calculateFuzzyMatch(queryWord, item.searchableText);
      score += fuzzyScore;
    }
  });
  
  return score;
}

function calculateFuzzyMatch(query: string, text: string): number {
  // Simple fuzzy matching based on character overlap
  const queryChars = new Set(query.toLowerCase());
  const textChars = new Set(text.toLowerCase());
  
  let matches = 0;
  queryChars.forEach(char => {
    if (textChars.has(char)) matches++;
  });
  
  const similarity = matches / Math.max(queryChars.size, 1);
  return similarity > 0.6 ? Math.floor(similarity * 15) : 0;
}

function getMatchedFields(
  item: SearchableItem,
  query: string,
  searchFields: string[]
): string[] {
  const matched: string[] = [];
  
  searchFields.forEach(field => {
    const value = String(item[field] || '').toLowerCase();
    if (value.includes(query)) {
      matched.push(field);
    }
  });
  
  return matched;
}

function applyFilters<T extends SearchableItem>(items: T[], filters: SearchFilters): T[] {
  let filtered = items;
  
  // Category filter
  if (filters.categories.length > 0) {
    filtered = filtered.filter(item => 
      item.category && filters.categories.includes(item.category)
    );
  }
  
  // Price range filter (if applicable)
  if (filters.priceRange) {
    filtered = filtered.filter(item => {
      const price = (item as any).price || (item as any).sellingPrice || 0;
      return price >= filters.priceRange!.min && price <= filters.priceRange!.max;
    });
  }
  
  return filtered;
}