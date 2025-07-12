
import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, Package, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSupabaseProducts } from '@/hooks/useSupabaseProducts';
import { useSupabaseCustomers } from '@/hooks/useSupabaseCustomers';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  name: string;
  type: 'product' | 'customer';
  category?: string;
  phone?: string;
}

interface SearchBarProps {
  className?: string;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  className, 
  placeholder = "Search products, customers..." 
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const { products = [] } = useSupabaseProducts();
  const { customers = [] } = useSupabaseCustomers();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter results based on query
  const searchResults: SearchResult[] = React.useMemo(() => {
    if (!query.trim()) return [];

    const productResults = products
      .filter(product => 
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5)
      .map(product => ({
        id: product.id,
        name: product.name,
        type: 'product' as const,
        category: product.category,
      }));

    const customerResults = customers
      .filter(customer => 
        customer.name.toLowerCase().includes(query.toLowerCase()) ||
        customer.phone.includes(query)
      )
      .slice(0, 5)
      .map(customer => ({
        id: customer.id,
        name: customer.name,
        type: 'customer' as const,
        phone: customer.phone,
      }));

    return [...productResults, ...customerResults];
  }, [query, products, customers]);

  const handleSearch = (searchQuery: string, resultType?: 'product' | 'customer', resultId?: string) => {
    if (!searchQuery.trim()) return;
    
    // Add to recent searches
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item !== searchQuery);
      return [searchQuery, ...filtered].slice(0, 5);
    });
    
    setIsOpen(false);
    
    // Navigate based on result type
    if (resultType === 'product') {
      navigate(`/inventory?search=${encodeURIComponent(searchQuery)}${resultId ? `&highlight=${resultId}` : ''}`);
    } else if (resultType === 'customer') {
      navigate(`/customers?search=${encodeURIComponent(searchQuery)}${resultId ? `&highlight=${resultId}` : ''}`);
    } else {
      // Default search - try inventory first
      navigate(`/inventory?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.length > 0 || recentSearches.length > 0);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" />
        <Input
          value={query}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsOpen(query.length > 0 || recentSearches.length > 0)}
          placeholder={placeholder}
          className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/70 focus:bg-white/20"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-white/10"
          >
            <X className="h-4 w-4 text-white/70" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {searchResults.length > 0 ? (
            <div className="py-2">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Search Results
              </div>
              {searchResults.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSearch(result.name, result.type, result.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                >
                  {result.type === 'product' ? (
                    <Package className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Users className="h-4 w-4 text-green-500" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {result.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {result.type === 'product' ? result.category : result.phone}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : query ? (
            <div className="py-6 text-center text-gray-500 dark:text-gray-400">
              No results found for "{query}"
            </div>
          ) : recentSearches.length > 0 ? (
            <div className="py-2">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Recent Searches
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setQuery(search);
                    handleSearch(search);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                >
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-gray-100">{search}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
