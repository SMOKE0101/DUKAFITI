import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  UtensilsCrossed, 
  Smartphone, 
  Sparkles, 
  Home, 
  Shirt, 
  Wine, 
  Apple, 
  Grid3X3,
  X 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryButtonGridProps {
  categories: string[];
  selectedCategories: string[];
  onCategoryToggle: (category: string) => void;
  onClearAll: () => void;
  templateCounts?: Record<string, number>;
  disabled?: boolean;
}

const CategoryButtonGrid: React.FC<CategoryButtonGridProps> = ({
  categories,
  selectedCategories,
  onCategoryToggle,
  onClearAll,
  templateCounts = {},
  disabled = false
}) => {
  const getCategoryIcon = (category: string) => {
    const lowerCategory = category.toLowerCase();
    switch (lowerCategory) {
      case 'foods':
        return UtensilsCrossed;
      case 'electronics':
        return Smartphone;
      case 'personal care':
        return Sparkles;
      case 'homecare':
        return Home;
      case 'households':
        return Home;
      case 'textile':
        return Shirt;
      case 'liquor':
        return Wine;
      case 'fresh products':
        return Apple;
      default:
        return Grid3X3;
    }
  };

  const getDisplayName = (category: string) => {
    if (category === 'all') return 'All Templates';
    return category.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const hasActiveCategories = selectedCategories.length > 0 && !selectedCategories.includes('all');

  // Filter out 'all' category for the toggle buttons
  const toggleableCategories = categories.filter(cat => cat !== 'all');

  return (
    <div className="space-y-3">
      {/* Category Toggle Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {toggleableCategories.map((category) => {
          const isSelected = selectedCategories.includes(category);
          const Icon = getCategoryIcon(category);
          const count = templateCounts[category] || 0;
          
          return (
            <Button
              key={category}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              disabled={disabled}
              onClick={() => onCategoryToggle(category)}
              className={cn(
                "flex items-center gap-2 h-auto p-3 text-left justify-start transition-all duration-200",
                "hover:scale-105 active:scale-95",
                isSelected 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "hover:bg-muted/50 border-border/50"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-xs truncate">
                  {getDisplayName(category)}
                </div>
                {count > 0 && (
                  <div className="text-xs opacity-70">
                    {count.toLocaleString()} items
                  </div>
                )}
              </div>
            </Button>
          );
        })}
      </div>

      {/* Selected Categories Summary & Clear Button */}
      {hasActiveCategories && (
        <div className="flex items-center justify-between gap-2 p-3 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {selectedCategories.map((category) => (
              <Badge 
                key={category} 
                variant="secondary" 
                className="text-xs"
              >
                {getDisplayName(category)}
                <button
                  onClick={() => onCategoryToggle(category)}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  disabled={disabled}
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAll}
            disabled={disabled}
            className="text-destructive hover:text-destructive border-destructive/20 hover:border-destructive/40"
          >
            <X className="w-3 h-3 mr-1" />
            Clear All
          </Button>
        </div>
      )}

      {/* Quick Stats */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {selectedCategories.length > 0 && !selectedCategories.includes('all')
            ? `${selectedCategories.length} ${selectedCategories.length === 1 ? 'category' : 'categories'} selected`
            : 'All categories shown'
          }
        </span>
        <span>
          {Object.values(templateCounts).reduce((sum, count) => sum + count, 0).toLocaleString()} total templates
        </span>
      </div>
    </div>
  );
};

export default CategoryButtonGrid;