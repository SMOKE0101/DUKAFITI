import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Search, X, Filter, History, TrendingUp, Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TemplatesSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCategory: string;
  categories: string[];
  onCategoryChange: (category: string) => void;
  onClearFilters: () => void;
  templatesCount: number;
  searchSuggestions?: string[];
  searchHistory?: string[];
  onSearchSuggestionSelect?: (suggestion: string) => void;
  isSearching?: boolean;
  totalItems?: number;
}

const TemplatesSearch: React.FC<TemplatesSearchProps> = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  categories,
  onCategoryChange,
  onClearFilters,
  templatesCount,
  searchSuggestions = [],
  searchHistory = [],
  onSearchSuggestionSelect,
  isSearching = false,
  totalItems = 0
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const hasActiveFilters = searchTerm.trim() || selectedCategory !== 'all';

  useEffect(() => {
    if (searchTerm.length > 1 && isFocused) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [searchTerm, isFocused]);

  const handleSuggestionSelect = (suggestion: string) => {
    onSearchChange(suggestion);
    onSearchSuggestionSelect?.(suggestion);
    setShowSuggestions(false);
    searchInputRef.current?.blur();
  };

  const recentSearches = searchHistory.slice(0, 5);
  const displaySuggestions = searchSuggestions.slice(0, 8);

  return (
    <div className="space-y-3">
      {/* Enhanced Search Bar with Suggestions */}
      <div className="relative">
        <Popover open={showSuggestions} onOpenChange={setShowSuggestions}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Search className={cn(
                "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors",
                isSearching ? "text-purple-500 animate-pulse" : "text-gray-400"
              )} />
              {isSearching && (
                <Sparkles className="absolute left-8 top-1/2 transform -translate-y-1/2 w-3 h-3 text-purple-400 animate-spin" />
              )}
              <Input
                ref={searchInputRef}
                placeholder="Search thousands of products... (try 'soap', 'electronics', etc.)"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                className={cn(
                  "pl-10 pr-10 transition-all duration-200",
                  isSearching && "pl-14",
                  isFocused && "ring-2 ring-purple-200 border-purple-300",
                  searchTerm && "bg-purple-50 dark:bg-purple-900/10"
                )}
              />
              {searchTerm && (
                <Button
                  onClick={() => {
                    onSearchChange('');
                    setShowSuggestions(false);
                  }}
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-red-100"
                >
                  <X className="w-4 h-4 text-red-500" />
                </Button>
              )}
            </div>
          </PopoverTrigger>
          
          <PopoverContent className="w-full p-0 mt-1" align="start" side="bottom">
            <Command>
              <CommandList>
                {/* Recent Searches */}
                {recentSearches.length > 0 && !searchTerm && (
                  <CommandGroup heading="Recent Searches">
                    {recentSearches.map((search, index) => (
                      <CommandItem
                        key={`recent-${index}`}
                        onSelect={() => handleSuggestionSelect(search)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <History className="w-4 h-4 text-gray-400" />
                        <span>{search}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Search Suggestions */}
                {displaySuggestions.length > 0 && searchTerm && (
                  <CommandGroup heading="Suggestions">
                    {displaySuggestions.map((suggestion, index) => (
                      <CommandItem
                        key={`suggestion-${index}`}
                        onSelect={() => handleSuggestionSelect(suggestion)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <TrendingUp className="w-4 h-4 text-purple-500" />
                        <span className="flex-1">{suggestion}</span>
                        <span className="text-xs text-gray-400">suggestion</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Popular Categories */}
                {!searchTerm && categories.length > 1 && (
                  <CommandGroup heading="Popular Categories">
                    {categories.slice(1, 6).map((category) => (
                      <CommandItem
                        key={`cat-${category}`}
                        onSelect={() => {
                          onCategoryChange(category);
                          setShowSuggestions(false);
                        }}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Filter className="w-4 h-4 text-blue-500" />
                        <span className="capitalize">{category}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {searchTerm && displaySuggestions.length === 0 && (
                  <CommandEmpty>No suggestions found for "{searchTerm}"</CommandEmpty>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
          <Filter className="w-4 h-4" />
          Categories:
        </div>
        
        {categories.map((category) => {
          const isActive = selectedCategory === category;
          const displayName = category === 'all' ? 'All' : category?.charAt(0).toUpperCase() + category?.slice(1);
          
          return (
            <Badge
              key={category}
              variant={isActive ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-colors hover:scale-105",
                isActive 
                  ? "bg-purple-600 hover:bg-purple-700 text-white" 
                  : "hover:bg-purple-50 dark:hover:bg-purple-900/20"
              )}
              onClick={() => onCategoryChange(category)}
            >
              {displayName}
            </Badge>
          );
        })}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            onClick={onClearFilters}
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
          >
            <X className="w-3 h-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Enhanced Results Summary */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-600 dark:text-gray-400">
            Showing <span className="font-semibold text-purple-600">{templatesCount}</span> of{' '}
            <span className="font-semibold">{totalItems}</span> templates
          </span>
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-xs">
              Filtered
            </Badge>
          )}
          {isSearching && (
            <Badge variant="outline" className="text-xs animate-pulse">
              <Clock className="w-3 h-3 mr-1" />
              Searching...
            </Badge>
          )}
        </div>
        
        {searchTerm && templatesCount > 0 && (
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
            ✓ {templatesCount} found
          </Badge>
        )}
      </div>
    </div>
  );
};

export default TemplatesSearch;