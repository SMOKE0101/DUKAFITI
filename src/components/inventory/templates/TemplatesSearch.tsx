import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TemplatesSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCategory: string;
  categories: string[];
  onCategoryChange: (category: string) => void;
  onClearFilters: () => void;
  templatesCount: number;
}

const TemplatesSearch: React.FC<TemplatesSearchProps> = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  categories,
  onCategoryChange,
  onClearFilters,
  templatesCount
}) => {
  const hasActiveFilters = searchTerm.trim() || selectedCategory !== 'all';

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search templates by name or category..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <Button
            onClick={() => onSearchChange('')}
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
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

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>
          {templatesCount} template{templatesCount !== 1 ? 's' : ''} found
          {hasActiveFilters && ' with current filters'}
        </span>
      </div>
    </div>
  );
};

export default TemplatesSearch;