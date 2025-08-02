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

export const useEnhancedTemplateSearch = () => {
  const [allTemplates, setAllTemplates] = useState<ProductTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  const { isOnline } = useNetworkStatus();
  const { getCache, setCache, getCacheInfo, isInitialized } = usePublicTemplateCache();

  // Load all templates with progressive loading
  const loadTemplates = useCallback(async () => {
    if (!isInitialized) return;
    
    setLoading(true);
    setError(null);
    setLoadingProgress(0);

    try {
      // Clear old cache with wrong item count or version to force fresh fetch
      const currentCacheInfo = getCacheInfo('all_product_templates');
      if (currentCacheInfo.exists && (
        (currentCacheInfo.itemCount && currentCacheInfo.itemCount < 7000) || 
        currentCacheInfo.version !== '2.0'
      )) {
        console.log('[EnhancedTemplateSearch] Clearing outdated cache - items:', currentCacheInfo.itemCount, 'version:', currentCacheInfo.version);
        localStorage.removeItem('public_cache_all_product_templates');
      }

      // Check cache again after potential clearing
      const cacheInfo = getCacheInfo('all_product_templates');
      console.log('[EnhancedTemplateSearch] Cache info after clearing:', cacheInfo);
      
      if (cacheInfo.exists && cacheInfo.isValid && cacheInfo.itemCount && cacheInfo.itemCount >= 7000 && cacheInfo.version === '2.0') {
        console.log('[EnhancedTemplateSearch] Using cached data:', cacheInfo.itemCount, 'templates');
        const cached = getCache<ProductTemplate[]>('all_product_templates');
        if (cached && Array.isArray(cached)) {
          setAllTemplates(cached);
          setLoadingProgress(100);
          setLoading(false);
          return;
        }
      }

      // Fetch fresh data if online using pagination to bypass 1,000 limit
      if (isOnline) {
        console.log('[EnhancedTemplateSearch] Fetching all templates using pagination...');
        setLoadingProgress(10);
        
        // Get total count first
        const { count, error: countError } = await supabase
          .from('duka_products_templates')
          .select('*', { count: 'exact', head: true });
          
        if (countError) {
          throw new Error(`Failed to get template count: ${countError.message}`);
        }
        
        console.log('[EnhancedTemplateSearch] Total templates available:', count);
        setLoadingProgress(20);
        
        // Fetch ALL templates using pagination (1000 per batch)
        const allTemplates: ProductTemplate[] = [];
        const batchSize = 1000;
        let totalFetched = 0;
        let hasMore = true;
        
        while (hasMore && totalFetched < (count || 0)) {
          const batchNum = Math.floor(totalFetched / batchSize) + 1;
          console.log(`[EnhancedTemplateSearch] Fetching batch ${batchNum}, offset: ${totalFetched}`);
          
          const { data: batch, error: batchError } = await supabase
            .from('duka_products_templates')
            .select('*')
            .order('name')
            .range(totalFetched, totalFetched + batchSize - 1);

          if (batchError) {
            throw new Error(`Failed to load templates batch ${batchNum}: ${batchError.message}`);
          }

          if (batch && batch.length > 0) {
            allTemplates.push(...batch);
            totalFetched += batch.length;
            
            // Update progress
            const progress = Math.min(80, 20 + (totalFetched / (count || 1)) * 60);
            setLoadingProgress(progress);
            
            console.log(`[EnhancedTemplateSearch] Fetched batch ${batchNum} of ${batch.length}, total: ${totalFetched}`);
            
            // Stop if we got less than expected (end of data)
            if (batch.length < batchSize) {
              hasMore = false;
            }
          } else {
            hasMore = false;
          }
          
          // Safety check to prevent infinite loops
          if (totalFetched >= 10000) {
            console.warn('[EnhancedTemplateSearch] Safety limit reached, stopping pagination');
            break;
          }
        }

        setLoadingProgress(90);
        console.log('[EnhancedTemplateSearch] Pagination complete. Total fetched:', totalFetched);
        
        // Cache the results
        setCache('all_product_templates', allTemplates, '2.0');
        setAllTemplates(allTemplates);
        setLoadingProgress(100);
        
        // Verify search targets exist
        const testSearches = ['kabras', 'sugar', 'omo', 'bread'];
        testSearches.forEach(term => {
          const found = allTemplates.filter(t => t.name.toLowerCase().includes(term.toLowerCase()));
          console.log(`[EnhancedTemplateSearch] ${term} items:`, found.length, found.map(t => t.name));
        });
      } else {
        // Offline - check if we have any cached data
        const cached = getCache<ProductTemplate[]>('all_product_templates');
        if (cached && Array.isArray(cached) && cached.length > 0) {
          console.log('[EnhancedTemplateSearch] Using offline cached data:', cached.length, 'templates');
          setAllTemplates(cached);
          setLoadingProgress(100);
        } else {
          throw new Error('No cached templates available offline');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load templates';
      setError(errorMessage);
      console.error('[EnhancedTemplateSearch] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [isOnline, getCache, setCache, getCacheInfo, isInitialized]);

  // Enhanced Fuse.js search configuration
  const fuse = useMemo(() => {
    if (allTemplates.length === 0) return null;
    
    return new Fuse(allTemplates, {
      keys: [
        { name: 'name', weight: 0.9 },
        { name: 'category', weight: 0.1 }
      ],
      threshold: 0.3, // More precise matching
      includeScore: true,
      minMatchCharLength: 1,
      shouldSort: true,
      ignoreLocation: true,
      findAllMatches: true,
      // Enhanced search options
      useExtendedSearch: true,
      includeMatches: true
    });
  }, [allTemplates]);

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(
      allTemplates
        .map(t => t.category)
        .filter(Boolean)
        .filter(cat => cat && cat.trim())
    )];
    return ['all', ...uniqueCategories.sort()];
  }, [allTemplates]);

  // Enhanced filtering and searching
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
      
      console.log(`[EnhancedTemplateSearch] Search for "${searchTerm}" returned ${searchResults.length} results`);
    }

    return results;
  }, [allTemplates, searchTerm, selectedCategory, fuse]);

  // Search function with debouncing
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

  // Refresh templates
  const refreshTemplates = useCallback(async () => {
    // Clear cache and reload
    const { clearCache } = usePublicTemplateCache();
    clearCache('all_product_templates');
    await loadTemplates();
  }, [loadTemplates]);

  // Load templates on mount and when network/cache status changes
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
    loadingProgress,
    handleSearch,
    handleCategoryChange,
    clearFilters,
    refetch: loadTemplates,
    refresh: refreshTemplates,
    totalTemplates: allTemplates.length,
    hasActiveSearch: searchTerm.trim().length > 0,
    hasActiveFilter: selectedCategory !== 'all',
    // Additional stats
    stats: {
      totalAvailable: allTemplates.length,
      currentlyVisible: filteredTemplates.length,
      categoriesAvailable: categories.length - 1, // -1 for 'all'
      isFiltered: searchTerm.trim().length > 0 || selectedCategory !== 'all'
    }
  };
};