import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';

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
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search templates by name..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Category Filter */}
        <div className="w-full sm:w-48">
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            onClick={onClearFilters}
            variant="outline"
            size="default"
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Clear
          </Button>
        )}
      </div>
      
      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {templatesCount} template{templatesCount !== 1 ? 's' : ''} found
          {hasActiveFilters && ' (filtered)'}
        </span>
      </div>
    </div>
  );
};

export default TemplatesSearch;