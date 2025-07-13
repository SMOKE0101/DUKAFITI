
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, SortAsc, X, Grid3X3, List } from 'lucide-react';
import { useIsMobile, useIsTablet } from '../../hooks/use-mobile';

interface InventoryFiltersProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortBy: 'name' | 'stock' | 'price';
  onSortChange: (sort: 'name' | 'stock' | 'price') => void;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
}

const InventoryFilters: React.FC<InventoryFiltersProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode = 'grid',
  onViewModeChange
}) => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Mobile Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10 h-12 rounded-xl border-2 bg-background text-foreground shadow-sm focus:shadow-md transition-all duration-200"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => onSearchChange('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Mobile Filter Row */}
        <div className="flex gap-3">
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="flex-1 h-12 rounded-xl border-2 bg-background text-foreground shadow-sm">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-purple-600" />
                <SelectValue placeholder="Category" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl bg-popover text-popover-foreground shadow-xl border-2">
              {categories.map(category => (
                <SelectItem key={category} value={category} className="rounded-lg">
                  {category === 'all' ? 'All Categories' : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="flex-1 h-12 rounded-xl border-2 bg-background text-foreground shadow-sm">
              <div className="flex items-center gap-2">
                <SortAsc className="w-4 h-4 text-purple-600" />
                <SelectValue placeholder="Sort" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl bg-popover text-popover-foreground shadow-xl border-2">
              <SelectItem value="name" className="rounded-lg">Name A-Z</SelectItem>
              <SelectItem value="stock" className="rounded-lg">Stock High-Low</SelectItem>
              <SelectItem value="price" className="rounded-lg">Price High-Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  if (isTablet) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Filter & Search</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Tablet Search */}
          <div className="md:col-span-1 relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 transition-colors group-focus-within:text-primary" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-12 h-12 rounded-xl border-2 bg-background text-foreground shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => onSearchChange('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Tablet Category Filter */}
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="h-12 rounded-xl border-2 bg-background text-foreground shadow-sm hover:shadow-md transition-all duration-200 focus:border-primary/50">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" />
                <SelectValue placeholder="Select category" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-2 bg-popover text-popover-foreground shadow-xl">
              {categories.map(category => (
                <SelectItem 
                  key={category} 
                  value={category}
                  className="rounded-lg hover:bg-primary/10 focus:bg-primary/10"
                >
                  {category === 'all' ? 'All Categories' : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Tablet Sort */}
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="h-12 rounded-xl border-2 bg-background text-foreground shadow-sm hover:shadow-md transition-all duration-200 focus:border-primary/50">
              <div className="flex items-center gap-2">
                <SortAsc className="w-4 h-4 text-primary" />
                <SelectValue placeholder="Sort by" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-2 bg-popover text-popover-foreground shadow-xl">
              <SelectItem value="name" className="rounded-lg hover:bg-primary/10 focus:bg-primary/10">Name A-Z</SelectItem>
              <SelectItem value="stock" className="rounded-lg hover:bg-primary/10 focus:bg-primary/10">Stock High-Low</SelectItem>
              <SelectItem value="price" className="rounded-lg hover:bg-primary/10 focus:bg-primary/10">Price High-Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Filter & Search</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        {/* Enhanced Search */}
        <div className="md:col-span-2 relative group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 transition-colors group-focus-within:text-primary" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-12 h-12 rounded-xl border-2 bg-background/50 backdrop-blur-sm hover:bg-background/70 focus:bg-background transition-all duration-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => onSearchChange('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Enhanced Category Filter */}
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="h-12 rounded-xl border-2 bg-background/50 backdrop-blur-sm hover:bg-background/70 focus:bg-background transition-all duration-200 focus:border-primary/50">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              <SelectValue placeholder="Select category" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl border-2 bg-popover text-popover-foreground backdrop-blur-xl">
            {categories.map(category => (
              <SelectItem 
                key={category} 
                value={category}
                className="rounded-lg hover:bg-primary/10 focus:bg-primary/10"
              >
                {category === 'all' ? 'All Categories' : category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Enhanced Sort */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="h-12 rounded-xl border-2 bg-background/50 backdrop-blur-sm hover:bg-background/70 focus:bg-background transition-all duration-200 focus:border-primary/50">
            <div className="flex items-center gap-2">
              <SortAsc className="w-4 h-4 text-primary" />
              <SelectValue placeholder="Sort by" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl border-2 bg-popover text-popover-foreground backdrop-blur-xl">
            <SelectItem value="name" className="rounded-lg hover:bg-primary/10 focus:bg-primary/10">Name A-Z</SelectItem>
            <SelectItem value="stock" className="rounded-lg hover:bg-primary/10 focus:bg-primary/10">Stock High-Low</SelectItem>
            <SelectItem value="price" className="rounded-lg hover:bg-primary/10 focus:bg-primary/10">Price High-Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default InventoryFilters;
