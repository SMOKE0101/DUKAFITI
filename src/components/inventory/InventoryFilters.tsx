
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';

interface InventoryFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterCategory: string;
  onCategoryChange: (category: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  categories: string[];
}

const InventoryFilters: React.FC<InventoryFiltersProps> = ({
  searchQuery,
  onSearchChange,
  filterCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  categories
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 py-4"
        />
      </div>
      
      <Select value={filterCategory} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-full sm:w-48">
          <Filter className="w-4 h-4 mr-2" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map(category => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name-asc">Name A-Z</SelectItem>
          <SelectItem value="name-desc">Name Z-A</SelectItem>
          <SelectItem value="stock-asc">Stock Low-High</SelectItem>
          <SelectItem value="stock-desc">Stock High-Low</SelectItem>
          <SelectItem value="price-asc">Price Low-High</SelectItem>
          <SelectItem value="price-desc">Price High-Low</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default InventoryFilters;
