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

// Lazy loading hook that only loads templates when needed with pagination
export const useLazyTemplateSearch = () => {
  const [allTemplates, setAllTemplates] = useState<ProductTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const TEMPLATES_PER_PAGE = 100; // Display 100 templates at a time
  
  const { isOnline } = useNetworkStatus();
  const { getCache, setCache, getCacheInfo, isInitialized } = usePublicTemplateCache();

  // Fast initialization - only load first 100 templates for display
  const initializeTemplates = useCallback(async () => {
    if (initialized) return;
    
    setLoading(true);
    setError(null);
    setInitialized(true);

    try {
      // Check cache first
      const cacheInfo = getCacheInfo('first_100_templates');
      
      if (cacheInfo.exists && cacheInfo.isValid && cacheInfo.itemCount && cacheInfo.itemCount >= 100) {
        console.log('[LazyTemplateSearch] Using cached first 100 templates:', cacheInfo.itemCount);
        const cached = getCache<ProductTemplate[]>('first_100_templates');
        if (cached && Array.isArray(cached)) {
          setAllTemplates(cached);
          // Get total count from another cache or estimate
          const totalCacheInfo = getCacheInfo('total_template_count');
          if (totalCacheInfo.exists) {
            const totalCached = getCache<number>('total_template_count');
            if (totalCached) setTotalCount(totalCached);
          }
          setLoading(false);
          return;
        }
      }

      // Load from database if online
      if (isOnline) {
        console.log('[LazyTemplateSearch] Loading first 100 templates from database...');
        
        // Get total count first
        const { count, error: countError } = await supabase
          .from('duka_products_templates')
          .select('*', { count: 'exact', head: true });
          
        if (countError) {
          throw new Error(`Failed to get template count: ${countError.message}`);
        }
        
        setTotalCount(count || 0);
        setCache('total_template_count', count || 0, '1.0');
        
        // Load first 100 templates only
        const { data: firstBatch, error: batchError } = await supabase
          .from('duka_products_templates')
          .select('*')
          .order('name')
          .limit(TEMPLATES_PER_PAGE);

        if (batchError) {
          throw new Error(`Failed to load templates: ${batchError.message}`);
        }

        if (firstBatch) {
          setAllTemplates(firstBatch);
          setCache('first_100_templates', firstBatch, '1.0');
          console.log('[LazyTemplateSearch] Loaded first batch:', firstBatch.length, 'templates out of', count);
        }
      } else {
        // Offline - check if we have any cached data
        const cached = getCache<ProductTemplate[]>('first_100_templates');
        if (cached && Array.isArray(cached) && cached.length > 0) {
          console.log('[LazyTemplateSearch] Using offline cached data:', cached.length, 'templates');
          setAllTemplates(cached);
          const totalCached = getCache<number>('total_template_count');
          if (totalCached) setTotalCount(totalCached);
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
  }, [isOnline, getCache, setCache, getCacheInfo, initialized]);

  // Load more templates for pagination (loads next 100 when needed)
  const loadMoreTemplates = useCallback(async (page: number) => {
    if (!isOnline) return;
    
    setLoading(true);
    try {
      const offset = (page - 1) * TEMPLATES_PER_PAGE;
      console.log('[LazyTemplateSearch] Loading more templates, page:', page, 'offset:', offset);
      
      // Check cache first for this specific page
      const pageCache = getCache<ProductTemplate[]>(`templates_page_${page}`);
      if (pageCache && Array.isArray(pageCache) && pageCache.length > 0) {
        console.log('[LazyTemplateSearch] Using cached page', page, ':', pageCache.length, 'templates');
        setAllTemplates(pageCache);
        setLoading(false);
        return;
      }
      
      const { data: moreBatch, error } = await supabase
        .from('duka_products_templates')
        .select('*')
        .order('name')
        .range(offset, offset + TEMPLATES_PER_PAGE - 1);

      if (error) {
        throw new Error(`Failed to load more templates: ${error.message}`);
      }

      if (moreBatch && moreBatch.length > 0) {
        setAllTemplates(moreBatch);
        setCache(`templates_page_${page}`, moreBatch, '1.0');
        console.log('[LazyTemplateSearch] Loaded page', page, ':', moreBatch.length, 'templates');
      }
    } catch (err) {
      setError('Failed to load more templates');
      console.error('[LazyTemplateSearch] Load more error:', err);
    } finally {
      setLoading(false);
    }
  }, [isOnline, setCache, getCache]);

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

  // Filter and search templates 
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

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    if (page !== currentPage && page >= 1) {
      setCurrentPage(page);
      // Check if we need to load more templates for this page
      if (page > 1) {
        loadMoreTemplates(page);
      }
    }
  }, [currentPage, loadMoreTemplates]);

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
    totalTemplates: totalCount > 0 ? totalCount : allTemplates.length, // Use total count from DB if available
    hasActiveSearch: searchTerm.trim().length > 0,
    hasActiveFilter: selectedCategory !== 'all',
    initialized,
    // Pagination
    currentPage,
    totalPages: Math.ceil((totalCount > 0 ? totalCount : allTemplates.length) / TEMPLATES_PER_PAGE),
    templatesPerPage: TEMPLATES_PER_PAGE,
    handlePageChange,
    loadMoreTemplates
  };
};