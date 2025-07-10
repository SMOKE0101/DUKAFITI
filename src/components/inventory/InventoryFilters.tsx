
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, SortAsc } from 'lucide-react';

interface InventoryFiltersProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortBy: 'name' | 'stock' | 'price';
  onSortChange: (sort: 'name' | 'stock' | 'price') => void;
}

const InventoryFilters: React.FC<InventoryFiltersProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Filter & Search</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Enhanced Search */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 transition-colors group-focus-within:text-primary" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-12 h-12 rounded-xl border-2 bg-white/50 backdrop-blur-sm hover:bg-white/70 focus:bg-white transition-all duration-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
          />
        </div>
        
        {/* Enhanced Category Filter */}
        <div className="relative">
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="h-12 rounded-xl border-2 bg-white/50 backdrop-blur-sm hover:bg-white/70 focus:bg-white transition-all duration-200 focus:border-primary/50">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" />
                <SelectValue placeholder="Select category" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-2 bg-white/95 backdrop-blur-xl">
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
        </div>

        {/* Enhanced Sort */}
        <div className="relative">
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="h-12 rounded-xl border-2 bg-white/50 backdrop-blur-sm hover:bg-white/70 focus:bg-white transition-all duration-200 focus:border-primary/50">
              <div className="flex items-center gap-2">
                <SortAsc className="w-4 h-4 text-primary" />
                <SelectValue placeholder="Sort by" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-2 bg-white/95 backdrop-blur-xl">
              <SelectItem value="name" className="rounded-lg hover:bg-primary/10 focus:bg-primary/10">Name A-Z</SelectItem>
              <SelectItem value="stock" className="rounded-lg hover:bg-primary/10 focus:bg-primary/10">Stock High-Low</SelectItem>
              <SelectItem value="price" className="rounded-lg hover:bg-primary/10 focus:bg-primary/10">Price High-Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default InventoryFilters;
