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

export const useSimpleTemplateSearch = () => {
  const [allTemplates, setAllTemplates] = useState<ProductTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { isOnline } = useNetworkStatus();
  const { getCache, setCache, getCacheInfo, isInitialized } = usePublicTemplateCache();

  // Load all templates with enhanced caching
  const loadTemplates = useCallback(async () => {
    if (!isInitialized) return;
    
    setLoading(true);
    setError(null);

    try {
      // Clear old cache with wrong item count to force fresh fetch
      const currentCacheInfo = getCacheInfo('all_product_templates');
      if (currentCacheInfo.exists && currentCacheInfo.itemCount && currentCacheInfo.itemCount < 7000) {
        console.log('[SimpleTemplateSearch] Clearing outdated cache with only', currentCacheInfo.itemCount, 'items');
        // Clear the cache by removing the key
        localStorage.removeItem('public_cache_all_product_templates');
      }

      // Check cache again after potential clearing
      const cacheInfo = getCacheInfo('all_product_templates');
      console.log('[SimpleTemplateSearch] Cache info after clearing:', cacheInfo);
      
      if (cacheInfo.exists && cacheInfo.isValid && cacheInfo.itemCount && cacheInfo.itemCount >= 7000) {
        console.log('[SimpleTemplateSearch] Using cached data:', cacheInfo.itemCount, 'templates');
        const cached = getCache<ProductTemplate[]>('all_product_templates');
        if (cached && Array.isArray(cached)) {
          setAllTemplates(cached);
          setLoading(false);
          return;
        }
      }

      // Fetch fresh data if online
      if (isOnline) {
        console.log('[SimpleTemplateSearch] Fetching all templates from database...');
        
        // Get total count first for verification
        const { count } = await supabase
          .from('duka_products_templates')
          .select('*', { count: 'exact', head: true });
          
        console.log('[SimpleTemplateSearch] Total templates in DB:', count);
        
        // Fetch ALL templates using range-based query to bypass limits
        const { data, error: fetchError, count: totalCount } = await supabase
          .from('duka_products_templates')
          .select('*', { count: 'exact' })
          .order('name')
          .range(0, 9999); // Use range instead of limit to get all templates

        if (fetchError) {
          setError('Failed to load templates');
          console.error('[SimpleTemplateSearch] Fetch error:', fetchError);
        } else {
          console.log('[SimpleTemplateSearch] Fetched', data?.length || 0, 'templates');
          const templates = data || [];
          setCache('all_product_templates', templates, '1.1');
          setAllTemplates(templates);
          
          // Log verification data
          const testSearches = ['kabras', 'sugar', 'omo', 'bread'];
          testSearches.forEach(term => {
            const found = templates.filter(t => t.name.toLowerCase().includes(term.toLowerCase()));
            console.log(`[SimpleTemplateSearch] ${term} items:`, found.length);
          });
        }
      } else {
        // Offline - check if we have any cached data
        const cached = getCache<ProductTemplate[]>('all_product_templates');
        if (cached && Array.isArray(cached) && cached.length > 0) {
          console.log('[SimpleTemplateSearch] Using offline cached data:', cached.length, 'templates');
          setAllTemplates(cached);
        } else {
          setError('No cached templates available offline');
        }
      }
    } catch (err) {
      setError('Failed to load templates');
      console.error('[SimpleTemplateSearch] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [isOnline, getCache, setCache, getCacheInfo, isInitialized]);

  // Initialize Fuse.js for search
  const fuse = useMemo(() => {
    if (allTemplates.length === 0) return null;
    
    return new Fuse(allTemplates, {
      keys: [
        { name: 'name', weight: 0.8 },
        { name: 'category', weight: 0.2 }
      ],
      threshold: 0.3, // More precise matching for better results
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

  // Filter and search templates
  const filteredTemplates = useMemo(() => {
    let results = allTemplates;
    
    console.log('[SimpleTemplateSearch] Starting filter with', allTemplates.length, 'total templates');
    console.log('[SimpleTemplateSearch] Search term:', searchTerm);
    console.log('[SimpleTemplateSearch] Selected category:', selectedCategory);

    // Apply category filter first
    if (selectedCategory !== 'all') {
      results = results.filter(t => t.category === selectedCategory);
      console.log('[SimpleTemplateSearch] After category filter:', results.length, 'templates');
    }

    // Apply search if there's a search term
    if (searchTerm.trim() && fuse) {
      const searchResults = fuse.search(searchTerm.trim());
      console.log('[SimpleTemplateSearch] Fuse search results:', searchResults.length);
      const searchIds = new Set(searchResults.map(result => result.item.id));
      results = results.filter(t => searchIds.has(t.id));
      console.log('[SimpleTemplateSearch] After search filter:', results.length, 'templates');
      
      // Debug: show first few search results
      if (searchResults.length > 0) {
        console.log('[SimpleTemplateSearch] First few matches:', searchResults.slice(0, 3).map(r => r.item.name));
      }
    }

    console.log('[SimpleTemplateSearch] Final filtered results:', results.length);
    return results;
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

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

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
    refetch: loadTemplates,
    totalTemplates: allTemplates.length,
    hasActiveSearch: searchTerm.trim().length > 0,
    hasActiveFilter: selectedCategory !== 'all',
  };
};