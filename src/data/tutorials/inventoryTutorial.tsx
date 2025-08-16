import React from 'react';
import { TutorialConfig } from '@/types/tutorial';
import { Package, Plus, Search, AlertTriangle } from 'lucide-react';

export const inventoryTutorial: TutorialConfig = {
  id: 'inventory',
  name: 'Inventory Management',
  description: 'Learn to manage your products, stock levels, and inventory operations',
  page: '/app/inventory',
  estimatedDuration: 7,
  difficulty: 'intermediate',
  category: 'onboarding',
  steps: [
    {
      id: '1',
      page: 'inventory',
      title: 'Inventory Overview',
      description: 'This is your product management center where you control your entire inventory.',
      target: '[data-tutorial="inventory-container"]',
      placement: 'center',
      highlightStyle: 'glow',
      content: (
        <div className="space-y-2">
          <p className="text-sm">Manage your inventory effectively:</p>
          <ul className="text-xs space-y-1 ml-4">
            <li>• Add and edit products</li>
            <li>• Track stock levels</li>
            <li>• Set up low stock alerts</li>
            <li>• Organize by categories</li>
          </ul>
        </div>
      ),
      delay: 500,
    },
    {
      id: '2',
      page: 'inventory',
      title: 'Add New Product',
      description: 'Click here to add new products to your inventory.',
      target: '[data-tutorial="add-product-button"]',
      placement: 'bottom',
      highlightStyle: 'border',
      action: 'click',
      content: (
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-green-500" />
          <span className="text-sm">Start building your product catalog</span>
        </div>
      ),
    },
    {
      id: '3',
      page: 'inventory',
      title: 'Product Templates',
      description: 'Use pre-made product templates to add items quickly.',
      target: '[data-tutorial="product-templates"]',
      placement: 'right',
      highlightStyle: 'glow',
      content: (
        <div className="text-sm">
          <p>Browse thousands of product templates with images and standard pricing.</p>
        </div>
      ),
    },
    {
      id: '4',
      page: 'inventory',
      title: 'Search and Filter',
      description: 'Find products quickly using the search bar and filters.',
      target: '[data-tutorial="inventory-search"]',
      placement: 'bottom',
      highlightStyle: 'border',
      content: (
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-blue-500" />
          <span className="text-sm">Search by name, category, or stock status</span>
        </div>
      ),
    },
    {
      id: '5',
      page: 'inventory',
      title: 'Product Grid',
      description: 'View all your products with key information at a glance.',
      target: '[data-tutorial="product-list"]',
      placement: 'center',
      highlightStyle: 'glow',
      content: (
        <div className="text-sm">
          <p>Each product card shows:</p>
          <ul className="text-xs mt-1 space-y-1 ml-4">
            <li>• Product image and name</li>
            <li>• Current stock level</li>
            <li>• Selling and cost price</li>
            <li>• Quick action buttons</li>
          </ul>
        </div>
      ),
    },
    {
      id: '6',
      page: 'inventory',
      title: 'Stock Management',
      description: 'Click on any product to edit details or update stock levels.',
      target: '[data-tutorial="product-card"]:first-child',
      placement: 'right',
      highlightStyle: 'border',
      content: (
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-orange-500" />
          <span className="text-sm">Edit product details or restock items</span>
        </div>
      ),
    },
    {
      id: '7',
      page: 'inventory',
      title: 'Low Stock Alerts',
      description: 'Products with low stock are highlighted for your attention.',
      target: '[data-tutorial="low-stock-indicator"]',
      placement: 'top',
      highlightStyle: 'border',
      content: (
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-sm">Never run out of popular items</span>
        </div>
      ),
    },
    {
      id: '8',
      page: 'inventory',
      title: 'Category Management',
      description: 'Organize products into categories for better organization.',
      target: '[data-tutorial="category-filter"]',
      placement: 'bottom',
      highlightStyle: 'border',
      content: (
        <div className="text-sm">
          <p>Categories help you and customers find products faster during sales.</p>
        </div>
      ),
    },
    {
      id: '9',
      page: 'inventory',
      title: 'Bulk Operations',
      description: 'Perform actions on multiple products at once.',
      target: '[data-tutorial="bulk-actions"]',
      placement: 'bottom',
      highlightStyle: 'glow',
      content: (
        <div className="text-sm">
          <p>Select multiple products to update prices, categories, or stock levels together.</p>
        </div>
      ),
    },
    {
      id: '10',
      page: 'inventory',
      title: 'Inventory Mastery!',
      description: 'You now know how to manage your inventory like a professional.',
      target: '[data-tutorial="inventory-container"]',
      placement: 'center',
      highlightStyle: 'glow',
      content: (
        <div className="text-sm text-center">
          <p className="font-medium mb-2">🎉 Inventory Tutorial Complete!</p>
          <p>Your products are organized and ready for sales. Try the Customers tutorial next!</p>
        </div>
      ),
    },
  ],
};