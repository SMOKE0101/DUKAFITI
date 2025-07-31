import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNetworkStatus } from './useNetworkStatus';
import { useCacheManager } from './useCacheManager';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const { isOnline } = useNetworkStatus();
  const { getCache, setCache } = useCacheManager();

  // Get unique categories from templates
  const categories = useMemo(() => {
    const uniqueCategories = ['all', ...new Set(templates.map(t => t.category).filter(Boolean))];
    return uniqueCategories;
  }, [templates]);

  // Filter templates based on search and category
  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(search) ||
        (template.category?.toLowerCase().includes(search))
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [templates, searchTerm, selectedCategory]);

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

  // Search templates with debouncing
  const searchTemplates = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  // Filter by category
  const filterByCategory = useCallback((category: string) => {
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
    allTemplates: templates,
    loading,
    error,
    searchTerm,
    selectedCategory,
    categories,
    searchTemplates,
    filterByCategory,
    clearFilters,
    refetch: loadTemplates,
    isOnline,
  };
};