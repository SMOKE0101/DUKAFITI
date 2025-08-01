import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNetworkStatus } from './useNetworkStatus';
import { useCacheManager } from './useCacheManager';
import { useIntelligentSearch } from './useIntelligentSearch';

export interface ProductTemplate {
  id: number;
  name: string;
  category: string | null;
  image_url: string | null;
}

export interface TemplateFilters {
  searchTerm: string;
  selectedCategory: string;
}

export const useProductTemplates = () => {
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { isOnline } = useNetworkStatus();
  const { getCache, setCache } = useCacheManager();

  // Enhanced search with intelligent features
  const {
    searchTerm,
    searchResults,
    searchSuggestions,
    filters,
    filterOptions,
    isSearching,
    handleSearch: handleSearchChange,
    handleFilterChange,
    clearSearch,
    searchHistory,
    hasActiveSearch,
    hasActiveFilters,
    totalResults
  } = useIntelligentSearch(templates, {
    searchFields: ['name', 'category'],
    minSearchLength: 1,
    debounceMs: 300,
    maxResults: 1000,
    enableAnalytics: true
  });

  // Get unique categories from templates
  const categories = useMemo(() => {
    const uniqueCategories = ['all', ...new Set(templates.map(t => t.category).filter(Boolean))];
    return uniqueCategories;
  }, [templates]);

  // Use intelligent search results or all templates
  const filteredTemplates = useMemo(() => {
    if (hasActiveSearch || hasActiveFilters) {
      return searchResults;
    }
    return templates.sort((a, b) => a.name.localeCompare(b.name));
  }, [templates, searchResults, hasActiveSearch, hasActiveFilters]);

  // Load templates with cache-first strategy
  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Always load from cache first
      const cached = getCache<ProductTemplate[]>('product_templates');
      if (cached && Array.isArray(cached) && cached.length > 0) {
        console.log('[ProductTemplates] Using cached data:', cached.length, 'templates');
        setTemplates(cached);
        setLoading(false);
        
        // If online, fetch fresh data in background
        if (isOnline) {
          try {
            const { data, error: fetchError } = await supabase
              .from('duka_products_templates')
              .select('*')
              .order('name');

            if (!fetchError && data) {
              console.log('[ProductTemplates] Background refresh: fetched', data.length, 'templates');
              setCache('product_templates', data);
              
              // Only update if data actually changed
              if (JSON.stringify(data) !== JSON.stringify(cached)) {
                setTemplates(data);
              }
            }
          } catch (bgError) {
            console.error('[ProductTemplates] Background refresh failed:', bgError);
          }
        }
        return;
      }

      // No cache - fetch from server if online
      if (isOnline) {
        console.log('[ProductTemplates] No cache, fetching from server');
        const { data, error: fetchError } = await supabase
          .from('duka_products_templates')
          .select('*')
          .order('name');

        if (fetchError) {
          setError('Failed to load templates');
          console.error('[ProductTemplates] Fetch error:', fetchError);
        } else {
          console.log('[ProductTemplates] Fetched from server:', data?.length || 0, 'templates');
          setCache('product_templates', data || []);
          setTemplates(data || []);
        }
      } else {
        setError('No cached templates available offline');
      }
    } catch (err) {
      setError('Failed to load templates');
      console.error('[ProductTemplates] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [isOnline, getCache, setCache]);

  // Search templates with intelligent features
  const searchTemplates = useCallback((term: string) => {
    handleSearchChange(term);
  }, [handleSearchChange]);

  // Filter by category
  const filterByCategory = useCallback((category: string) => {
    handleFilterChange({ 
      categories: category === 'all' ? [] : [category] 
    });
  }, [handleFilterChange]);

  // Toggle category for multi-select
  const toggleCategory = useCallback((category: string) => {
    const currentCategories = filters.categories;
    if (currentCategories.includes(category)) {
      // Remove category
      handleFilterChange({ 
        categories: currentCategories.filter(c => c !== category) 
      });
    } else {
      // Add category
      handleFilterChange({ 
        categories: [...currentCategories, category] 
      });
    }
  }, [filters.categories, handleFilterChange]);

  // Clear filters
  const clearFilters = useCallback(() => {
    clearSearch();
  }, [clearSearch]);

  // Get selected category for backward compatibility
  const selectedCategory = useMemo(() => {
    return filters.categories.length > 0 ? filters.categories[0] : 'all';
  }, [filters.categories]);

  // Get template counts per category
  const templateCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    // Count templates per category
    templates.forEach(template => {
      if (template.category) {
        counts[template.category] = (counts[template.category] || 0) + 1;
      }
    });
    
    return counts;
  }, [templates]);

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  return {
    templates: filteredTemplates,
    allTemplates: templates,
    loading,
    error,
    searchTerm,
    selectedCategory,
    selectedCategories: filters.categories,
    categories,
    searchTemplates,
    filterByCategory,
    toggleCategory,
    clearFilters,
    refetch: loadTemplates,
    isOnline,
    templateCounts,
    // Enhanced search features
    searchSuggestions,
    searchHistory,
    isSearching,
    totalResults,
    hasActiveSearch,
    hasActiveFilters,
    totalItems: templates.length,
  };
};