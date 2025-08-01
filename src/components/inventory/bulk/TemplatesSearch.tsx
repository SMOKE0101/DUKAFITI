import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Search, X, Filter, History, TrendingUp, Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import CategoryButtonGrid from './CategoryButtonGrid';

interface TemplatesSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCategory: string;
  selectedCategories?: string[];
  categories: string[];
  onCategoryChange: (category: string) => void;
  onCategoryToggle?: (category: string) => void;
  onClearFilters: () => void;
  templatesCount: number;
  searchSuggestions?: string[];
  searchHistory?: string[];
  onSearchSuggestionSelect?: (suggestion: string) => void;
  isSearching?: boolean;
  totalItems?: number;
  templateCounts?: Record<string, number>;
}

const TemplatesSearch: React.FC<TemplatesSearchProps> = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  selectedCategories = [],
  categories,
  onCategoryChange,
  onCategoryToggle,
  onClearFilters,
  templatesCount,
  searchSuggestions = [],
  searchHistory = [],
  onSearchSuggestionSelect,
  isSearching = false,
  totalItems = 0,
  templateCounts = {}
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const hasActiveFilters = searchTerm.trim() || (selectedCategories.length > 0 && !selectedCategories.includes('all'));

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
    <div className="space-y-4">
      {/* Enhanced Search Bar with Suggestions */}
      <div className="relative">
        <Popover open={showSuggestions} onOpenChange={setShowSuggestions}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Search className={cn(
                "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors",
                isSearching ? "text-primary animate-pulse" : "text-muted-foreground"
              )} />
              {isSearching && (
                <Sparkles className="absolute left-8 top-1/2 transform -translate-y-1/2 w-3 h-3 text-primary animate-spin" />
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
                  isFocused && "ring-2 ring-primary/20 border-primary/30",
                  searchTerm && "bg-primary/5"
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
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-destructive/10"
                >
                  <X className="w-4 h-4 text-destructive" />
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
                        <History className="w-4 h-4 text-muted-foreground" />
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
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span className="flex-1">{suggestion}</span>
                        <span className="text-xs text-muted-foreground">suggestion</span>
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
                        <Filter className="w-4 h-4 text-primary" />
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

      {/* Enhanced Category System */}
      <CategoryButtonGrid
        categories={categories}
        selectedCategories={selectedCategories}
        onCategoryToggle={onCategoryToggle || onCategoryChange}
        onClearAll={onClearFilters}
        templateCounts={templateCounts}
        disabled={isSearching}
      />

      {/* Enhanced Results Summary */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            Showing <span className="font-semibold text-primary">{templatesCount.toLocaleString()}</span> of{' '}
            <span className="font-semibold">{totalItems.toLocaleString()}</span> templates
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
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
            ✓ {templatesCount.toLocaleString()} found
          </Badge>
        )}
      </div>
    </div>
  );
};

export default TemplatesSearch;