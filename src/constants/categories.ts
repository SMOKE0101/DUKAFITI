// Product categories for inventory management
export const PRODUCT_CATEGORIES = [
  'Beverages',
  'Grains & Staples',
  'Snacks & Confectionery',
  'Cooking Essentials',
  'Dairy & Eggs',
  'Household Supplies',
  'Cleaning & Laundry',
  'Personal Care',
  'Stationery & Misc',
  'Other / Custom'
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];

// Check if a category is the custom category
export const isCustomCategory = (category: string): boolean => {
  return category === 'Other / Custom';
};

// Get display name for category (used in dropdowns)
export const getCategoryDisplayName = (category: string): string => {
  return category === 'Other / Custom' ? 'Other / Custom' : category;
};

// Validate custom category input
export const validateCustomCategory = (category: string): boolean => {
  return category.trim().length > 0 && category.trim().length <= 50;
};