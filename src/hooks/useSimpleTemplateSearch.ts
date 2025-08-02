import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNetworkStatus } from './useNetworkStatus';
import { useCacheManager } from './useCacheManager';
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
  const { getCache, setCache } = useCacheManager();

  // Load all templates
  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Try cache first
      const cached = getCache<ProductTemplate[]>('all_product_templates');
      if (cached && Array.isArray(cached) && cached.length > 5000) {
        console.log('[SimpleTemplateSearch] Using cached data:', cached.length, 'templates');
        setAllTemplates(cached);
        setLoading(false);
        return;
      }

      // Fetch fresh data if online
      if (isOnline) {
        console.log('[SimpleTemplateSearch] Fetching all templates from database...');
        const { data, error: fetchError } = await supabase
          .from('duka_products_templates')
          .select('*')
          .order('name');

        if (fetchError) {
          setError('Failed to load templates');
          console.error('[SimpleTemplateSearch] Fetch error:', fetchError);
        } else {
          console.log('[SimpleTemplateSearch] Fetched', data?.length || 0, 'templates');
          const templates = data || [];
          setCache('all_product_templates', templates);
          setAllTemplates(templates);
          
          // Log some sample data
          const kabrasItems = templates.filter(t => t.name.toLowerCase().includes('kabras'));
          console.log('[SimpleTemplateSearch] Kabras items:', kabrasItems.length, kabrasItems.map(t => t.name));
        }
      } else {
        setError('No cached templates available offline');
      }
    } catch (err) {
      setError('Failed to load templates');
      console.error('[SimpleTemplateSearch] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [isOnline, getCache, setCache]);

  // Initialize Fuse.js for search
  const fuse = useMemo(() => {
    if (allTemplates.length === 0) return null;
    
    return new Fuse(allTemplates, {
      keys: [
        { name: 'name', weight: 0.8 },
        { name: 'category', weight: 0.2 }
      ],
      threshold: 0.4, // More forgiving for typos
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