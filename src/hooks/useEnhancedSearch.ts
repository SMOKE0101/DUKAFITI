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
  [key: string]: any;
}

interface UseEnhancedSearchOptions {
  searchFields?: string[];
  minSearchLength?: number;
  debounceMs?: number;
  maxResults?: number;
  enableAnalytics?: boolean;
}

// Comprehensive brand and product recognition system
const BRAND_DATABASE = {
  // Sugar brands
  'kabras': ['kabras sugar', 'sugar'],
  'mumias': ['mumias sugar', 'sugar'],
  'sony': ['sony sugar', 'sugar'],
  'chemelil': ['chemelil sugar', 'sugar'],
  
  // Flour/Unga brands
  'exe': ['exe flour', 'flour', 'unga'],
  'hostess': ['hostess flour', 'flour', 'unga'],
  'pembe': ['pembe flour', 'flour', 'unga'],
  'jogoo': ['jogoo flour', 'flour', 'unga'],
  
  // Oil brands
  'fresh fri': ['fresh fri oil', 'cooking oil', 'oil'],
  'elianto': ['elianto oil', 'cooking oil', 'oil'],
  'postman': ['postman oil', 'cooking oil', 'oil'],
  'kimbo': ['kimbo oil', 'cooking oil', 'oil'],
  'rina': ['rina oil', 'cooking oil', 'oil'],
  
  // Soap/Detergent brands
  'omo': ['omo detergent', 'washing powder', 'soap'],
  'ariel': ['ariel detergent', 'washing powder', 'soap'],
  'persil': ['persil detergent', 'washing powder', 'soap'],
  'toss': ['toss detergent', 'washing powder', 'soap'],
  
  // Personal care
  'colgate': ['colgate toothpaste', 'toothpaste', 'dental'],
  'close up': ['close up toothpaste', 'toothpaste', 'dental'],
  'aquafresh': ['aquafresh toothpaste', 'toothpaste', 'dental'],
  
  // Beverages
  'coca cola': ['coca cola', 'coke', 'soda', 'soft drink'],
  'fanta': ['fanta', 'orange', 'soda', 'soft drink'],
  'sprite': ['sprite', 'lemon', 'soda', 'soft drink'],
  'pepsi': ['pepsi', 'cola', 'soda', 'soft drink'],
  
  // Dairy
  'brookside': ['brookside milk', 'milk', 'dairy'],
  'tuzo': ['tuzo milk', 'milk', 'dairy'],
  'fresha': ['fresha milk', 'milk', 'dairy'],
  'new kcc': ['new kcc milk', 'milk', 'dairy'],
  
  // Tea
  'ketepa': ['ketepa tea', 'tea', 'chai'],
  'brookbond': ['brookbond tea', 'tea', 'chai'],
  'lipton': ['lipton tea', 'tea', 'chai'],
  
  // Water
  'dasani': ['dasani water', 'water', 'mineral water'],
  'keringet': ['keringet water', 'water', 'mineral water'],
  'aquafina': ['aquafina water', 'water', 'mineral water'],
  
  // Electronics
  'samsung': ['samsung', 'phone', 'smartphone', 'electronics'],
  'tecno': ['tecno', 'phone', 'smartphone', 'electronics'],
  'infinix': ['infinix', 'phone', 'smartphone', 'electronics'],
  'oppo': ['oppo', 'phone', 'smartphone', 'electronics'],
  'huawei': ['huawei', 'phone', 'smartphone', 'electronics'],
  
  // Bread
  'mini': ['mini bread', 'bread', 'bakery'],
  'festive': ['festive bread', 'bread', 'bakery'],
  'mothers choice': ['mothers choice bread', 'bread', 'bakery'],
  
  // Toilet paper
  'softcare': ['softcare tissue', 'toilet paper', 'tissue'],
  'rose': ['rose tissue', 'toilet paper', 'tissue'],
  'gentle care': ['gentle care tissue', 'toilet paper', 'tissue'],
};

// Text normalization for better matching
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace special chars with spaces
    .replace(/\s+/g, ' ') // Multiple spaces to single
    .trim();
}

// Advanced tokenization
function tokenizeText(text: string): string[] {
  const normalized = normalizeText(text);
  const words = normalized.split(' ').filter(word => word.length > 0);
  
  // Also include n-grams for better partial matching
  const tokens = new Set(words);
  
  // Add 2-grams and 3-grams for brand names
  for (let i = 0; i < words.length - 1; i++) {
    tokens.add(`${words[i]} ${words[i + 1]}`);
    if (i < words.length - 2) {
      tokens.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
    }
  }
  
  return Array.from(tokens);
}

// Excel-like substring matching with intelligent enhancements
function calculateSearchScore(item: SearchableItem, query: string): number {
  const normalizedQuery = normalizeText(query);
  const normalizedName = normalizeText(item.name);
  const normalizedCategory = normalizeText(item.category || '');
  
  let score = 0;
  
  // Tier 1: Exact substring matches (Excel-like behavior)
  if (normalizedName === normalizedQuery) {
    score += 1000; // Perfect match
  } else if (normalizedName.includes(normalizedQuery)) {
    // Position-based scoring for substring matches
    const position = normalizedName.indexOf(normalizedQuery);
    const lengthRatio = normalizedQuery.length / normalizedName.length;
    
    if (position === 0) {
      score += 800 + (lengthRatio * 200); // Starts with query
    } else {
      score += 600 + (lengthRatio * 100); // Contains query
    }
  }
  
  // Tier 2: Word boundary matches
  const queryWords = normalizedQuery.split(' ');
  const nameTokens = tokenizeText(item.name);
  
  queryWords.forEach(queryWord => {
    if (queryWord.length < 2) return;
    
    nameTokens.forEach(token => {
      if (token === queryWord) {
        score += 400; // Exact word match
      } else if (token.startsWith(queryWord)) {
        score += 300; // Word starts with query
      } else if (token.includes(queryWord)) {
        score += 200; // Word contains query
      }
    });
  });
  
  // Tier 3: Brand recognition
  const queryLower = normalizedQuery;
  Object.entries(BRAND_DATABASE).forEach(([brand, variants]) => {
    if (queryLower.includes(brand) || variants.some(v => queryLower.includes(v))) {
      if (normalizedName.includes(brand) || variants.some(v => normalizedName.includes(v))) {
        score += 500; // Brand match
      }
    }
  });
  
  // Tier 4: Category matching
  if (normalizedCategory.includes(normalizedQuery)) {
    if (normalizedCategory === normalizedQuery) {
      score += 300; // Exact category match
    } else if (normalizedCategory.startsWith(normalizedQuery)) {
      score += 200; // Category starts with query
    } else {
      score += 100; // Category contains query
    }
  }
  
  // Tier 5: Character overlap for typo tolerance
  if (score === 0 && normalizedQuery.length >= 3) {
    const commonChars = new Set();
    const queryChars = new Set(normalizedQuery);
    const nameChars = new Set(normalizedName);
    
    queryChars.forEach(char => {
      if (nameChars.has(char)) {
        commonChars.add(char);
      }
    });
    
    const overlap = commonChars.size / Math.max(queryChars.size, 1);
    if (overlap > 0.7) {
      score += Math.floor(overlap * 50); // Typo tolerance
    }
  }
  
  return score;
}

export function useEnhancedSearch<T extends SearchableItem>(
  items: T[],
  options: UseEnhancedSearchOptions = {}
) {
  const {
    searchFields = ['name', 'category'],
    minSearchLength = 1,
    debounceMs = 150, // Faster than before for better UX
    maxResults = 1000,
    enableAnalytics = true
  } = options;

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({ categories: [] });
  const { value: searchHistory, setValue: setSearchHistory } = useLocalStorage<string[]>('enhanced_search_history', []);
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);

  // Create optimized search index
  const searchIndex = useMemo(() => {
    console.log('[EnhancedSearch] Building search index for', items.length, 'items');
    
    return items.map(item => ({
      ...item,
      normalizedName: normalizeText(item.name),
      nameTokens: tokenizeText(item.name),
      categoryTokens: item.category ? tokenizeText(item.category) : [],
      brandMatches: Object.keys(BRAND_DATABASE).filter(brand => 
        normalizeText(item.name).includes(brand)
      )
    }));
  }, [items]);

  // Enhanced search algorithm
  const searchResults = useMemo(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < minSearchLength) {
      return applyFilters(items, filters);
    }

    console.log('[EnhancedSearch] Searching for:', debouncedSearchTerm);
    const startTime = performance.now();
    
    const results: SearchResult<T>[] = [];
    const query = debouncedSearchTerm.trim();

    searchIndex.forEach(item => {
      const score = calculateSearchScore(item, query);
      if (score > 0) {
        results.push({
          ...item,
          score,
          matchedFields: getMatchedFields(item, query, searchFields),
          originalItem: item
        });
      }
    });

    // Sort by score (descending) and limit results
    const sortedResults = results
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);

    const endTime = performance.now();
    console.log(`[EnhancedSearch] Found ${sortedResults.length} results in ${(endTime - startTime).toFixed(2)}ms`);

    const filteredResults = applyFilters(sortedResults.map(r => r.originalItem), filters);
    return filteredResults;
  }, [debouncedSearchTerm, searchIndex, filters, items, searchFields, minSearchLength, maxResults]);

  // Search loading state
  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm && searchTerm.length >= minSearchLength) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  }, [searchTerm, debouncedSearchTerm, minSearchLength]);

  // Intelligent search suggestions
  const searchSuggestions = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];

    const suggestions = new Set<string>();
    const query = normalizeText(searchTerm);

    // Add brand suggestions
    Object.keys(BRAND_DATABASE).forEach(brand => {
      if (brand.includes(query) || query.includes(brand)) {
        suggestions.add(brand);
        BRAND_DATABASE[brand].forEach(variant => {
          if (variant.includes(query)) {
            suggestions.add(variant);
          }
        });
      }
    });

    // Add exact product name matches
    items.forEach(item => {
      const normalizedName = normalizeText(item.name);
      if (normalizedName.includes(query)) {
        // Extract meaningful parts of the product name
        const words = item.name.split(/\s+/).filter(word => 
          word.length > 2 && normalizeText(word).includes(query)
        );
        words.forEach(word => suggestions.add(word));
        
        // Add the full name if it's reasonably short
        if (item.name.length <= 50) {
          suggestions.add(item.name);
        }
      }
    });

    // Add category suggestions
    const categories = [...new Set(items.map(item => item.category).filter(Boolean))];
    categories.forEach(category => {
      if (category && normalizeText(category).includes(query)) {
        suggestions.add(category);
      }
    });

    // Add from search history
    searchHistory.forEach(term => {
      if (normalizeText(term).includes(query)) {
        suggestions.add(term);
      }
    });

    return Array.from(suggestions)
      .slice(0, 12)
      .sort((a, b) => {
        // Prioritize shorter, more relevant suggestions
        const aRelevance = normalizeText(a).indexOf(query);
        const bRelevance = normalizeText(b).indexOf(query);
        if (aRelevance !== bRelevance) return aRelevance - bRelevance;
        return a.length - b.length;
      });
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
    hasActiveSearch: searchTerm.length >= minSearchLength,
    hasActiveFilters: filters.categories.length > 0,
    totalResults: searchResults.length
  };
}

// Helper functions
function getMatchedFields(
  item: SearchableItem,
  query: string,
  searchFields: string[]
): string[] {
  const matched: string[] = [];
  const normalizedQuery = normalizeText(query);
  
  searchFields.forEach(field => {
    const value = normalizeText(String(item[field] || ''));
    if (value.includes(normalizedQuery)) {
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
  
  return filtered;
}