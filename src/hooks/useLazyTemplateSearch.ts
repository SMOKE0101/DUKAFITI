import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNetworkStatus } from './useNetworkStatus';
import { usePublicTemplateCache } from './usePublicTemplateCache';
import Fuse from 'fuse.js';

export interface ProductTemplate {
  id: number;
  name: string;
  category: string | null;
  image_url: string | null;
}

// Lazy loading hook that only loads templates when needed
export const useLazyTemplateSearch = () => {
  const [allTemplates, setAllTemplates] = useState<ProductTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  
  const { isOnline } = useNetworkStatus();
  const { getCache, setCache, getCacheInfo, isInitialized } = usePublicTemplateCache();

  // Fast initialization - only load templates when actually needed
  const initializeTemplates = useCallback(async () => {
    if (initialized || !isInitialized) return;
    
    setLoading(true);
    setError(null);
    setInitialized(true);

    try {
      // Check cache first
      const cacheInfo = getCacheInfo('all_product_templates');
      
      if (cacheInfo.exists && cacheInfo.isValid && cacheInfo.itemCount && cacheInfo.itemCount >= 7000) {
        console.log('[LazyTemplateSearch] Using cached data:', cacheInfo.itemCount, 'templates');
        const cached = getCache<ProductTemplate[]>('all_product_templates');
        if (cached && Array.isArray(cached)) {
          setAllTemplates(cached);
          setLoading(false);
          return;
        }
      }

      // Load from database if online
      if (isOnline) {
        console.log('[LazyTemplateSearch] Loading templates from database...');
        
        // Get a reasonable batch first (1000 items)
        const { data: initialBatch, error: initialError } = await supabase
          .from('duka_products_templates')
          .select('*')
          .order('name')
          .limit(1000);

        if (initialError) {
          throw new Error(`Failed to load templates: ${initialError.message}`);
        }

        if (initialBatch) {
          setAllTemplates(initialBatch);
          console.log('[LazyTemplateSearch] Loaded initial batch:', initialBatch.length, 'templates');
          
          // Load remaining templates in background
          loadRemainingTemplates(1000);
        }
      } else {
        // Offline - check if we have any cached data
        const cached = getCache<ProductTemplate[]>('all_product_templates');
        if (cached && Array.isArray(cached) && cached.length > 0) {
          console.log('[LazyTemplateSearch] Using offline cached data:', cached.length, 'templates');
          setAllTemplates(cached);
        } else {
          setError('No cached templates available offline');
        }
      }
    } catch (err) {
      setError('Failed to load templates');
      console.error('[LazyTemplateSearch] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [isOnline, getCache, setCache, getCacheInfo, isInitialized, initialized]);

  // Load remaining templates in background
  const loadRemainingTemplates = useCallback(async (offset: number) => {
    try {
      const { data: remainingBatch, error } = await supabase
        .from('duka_products_templates')
        .select('*')
        .order('name')
        .range(offset, offset + 6000); // Load remaining

      if (!error && remainingBatch && remainingBatch.length > 0) {
        setAllTemplates(prev => {
          const combined = [...prev, ...remainingBatch];
          // Cache the complete set
          setCache('all_product_templates', combined, '4.0');
          console.log('[LazyTemplateSearch] Background load complete:', combined.length, 'total templates');
          return combined;
        });
      }
    } catch (error) {
      console.error('[LazyTemplateSearch] Background load error:', error);
    }
  }, [setCache]);

  // Initialize Fuse.js for search
  const fuse = useMemo(() => {
    if (allTemplates.length === 0) return null;
    
    return new Fuse(allTemplates, {
      keys: [
        { name: 'name', weight: 0.8 },
        { name: 'category', weight: 0.2 }
      ],
      threshold: 0.3,
      includeScore: true,
      minMatchCharLength: 1,
      shouldSort: true,
      ignoreLocation: true,
      findAllMatches: true
    });
  }, [allTemplates]);

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(allTemplates.map(t => t.category).filter(Boolean))];
    return ['all', ...uniqueCategories.sort()];
  }, [allTemplates]);

  // Filter and search templates with pagination
  const filteredTemplates = useMemo(() => {
    let results = allTemplates;
    
    // Apply category filter first
    if (selectedCategory !== 'all') {
      results = results.filter(t => t.category === selectedCategory);
    }

    // Apply search if there's a search term
    if (searchTerm.trim() && fuse) {
      const searchResults = fuse.search(searchTerm.trim());
      const searchIds = new Set(searchResults.map(result => result.item.id));
      results = results.filter(t => searchIds.has(t.id));
    }

    // Limit results for performance (show first 1000 results)
    return results.slice(0, 1000);
  }, [allTemplates, searchTerm, selectedCategory, fuse]);

  // Search function
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  // Category filter function
  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedCategory('all');
  }, []);

  return {
    templates: filteredTemplates,
    allTemplates,
    loading,
    error,
    searchTerm,
    selectedCategory,
    categories,
    isOnline,
    handleSearch,
    handleCategoryChange,
    clearFilters,
    initializeTemplates,
    totalTemplates: allTemplates.length,
    hasActiveSearch: searchTerm.trim().length > 0,
    hasActiveFilter: selectedCategory !== 'all',
    initialized
  };
};