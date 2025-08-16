import React from 'react';
import { TutorialConfig } from '@/types/tutorial';
import { ShoppingCart, User, CreditCard, Receipt } from 'lucide-react';

export const salesTutorial: TutorialConfig = {
  id: 'sales',
  name: 'Sales Management',
  description: 'Master the art of recording sales, managing cart, and processing payments',
  page: '/app/sales',
  estimatedDuration: 8,
  difficulty: 'beginner',
  category: 'onboarding',
  steps: [
    {
      id: '1',
      page: 'sales',
      title: 'Welcome to Sales',
      description: 'This is where you record all your sales transactions and manage customer purchases.',
      target: '[data-tutorial="sales-container"]',
      placement: 'center',
      highlightStyle: 'glow',
      content: (
        <div className="space-y-2">
          <p className="text-sm">The sales page helps you:</p>
          <ul className="text-xs space-y-1 ml-4">
            <li>• Find and add products to cart</li>
            <li>• Select customers</li>
            <li>• Process multiple payment methods</li>
            <li>• Generate receipts</li>
          </ul>
        </div>
      ),
      delay: 500,
    },
    {
      id: '2',
      page: 'sales',
      title: 'Product Search',
      description: 'Search for products by name, category, or scan barcodes.',
      target: '[data-tutorial="product-search"]',
      placement: 'bottom',
      highlightStyle: 'border',
      action: 'click',
      content: (
        <div className="text-sm">
          <p>Try typing a product name or use the category filters below.</p>
        </div>
      ),
    },
    {
      id: '3',
      page: 'sales',
      title: 'Product Categories',
      description: 'Browse products by category for faster selection.',
      target: '[data-tutorial="category-tabs"]',
      placement: 'bottom',
      highlightStyle: 'border',
      content: (
        <div className="text-sm">
          <p>Click on any category to filter products instantly.</p>
        </div>
      ),
    },
    {
      id: '4',
      page: 'sales',
      title: 'Product Grid',
      description: 'View all your products with images, prices, and stock levels.',
      target: '[data-tutorial="product-grid"]',
      placement: 'top',
      highlightStyle: 'glow',
      content: (
        <div className="text-sm">
          <p>Click on any product to add it to your cart. You can see:</p>
          <ul className="text-xs mt-1 space-y-1 ml-4">
            <li>• Product name and image</li>
            <li>• Current selling price</li>
            <li>• Available stock</li>
          </ul>
        </div>
      ),
    },
    {
      id: '5',
      page: 'sales',
      title: 'Shopping Cart',
      description: 'Review selected items, adjust quantities, and see the total.',
      target: '[data-tutorial="shopping-cart"]',
      placement: 'left',
      highlightStyle: 'border',
      content: (
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-green-500" />
          <span className="text-sm">Manage your current sale items here</span>
        </div>
      ),
    },
    {
      id: '6',
      page: 'sales',
      title: 'Customer Selection',
      description: 'Select an existing customer or add a new one for this sale.',
      target: '[data-tutorial="customer-selector"]',
      placement: 'top',
      highlightStyle: 'border',
      content: (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-blue-500" />
          <span className="text-sm">Required for credit sales and customer history</span>
        </div>
      ),
    },
    {
      id: '7',
      page: 'sales',
      title: 'Payment Methods',
      description: 'Choose how the customer will pay: cash, mobile money, or credit.',
      target: '[data-tutorial="payment-methods"]',
      placement: 'top',
      highlightStyle: 'border',
      content: (
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-purple-500" />
          <span className="text-sm">Support for multiple payment options</span>
        </div>
      ),
    },
    {
      id: '8',
      page: 'sales',
      title: 'Split Payments',
      description: 'Allow customers to pay using multiple methods in one transaction.',
      target: '[data-tutorial="split-payment"]',
      placement: 'top',
      highlightStyle: 'border',
      content: (
        <div className="text-sm">
          <p>Perfect for when customers want to pay part cash, part mobile money.</p>
        </div>
      ),
    },
    {
      id: '9',
      page: 'sales',
      title: 'Quick Picks',
      description: 'Access your most frequently sold items for faster checkout.',
      target: '[data-tutorial="quick-picks"]',
      placement: 'bottom',
      highlightStyle: 'glow',
      content: (
        <div className="text-sm">
          <p>These are automatically updated based on your sales patterns.</p>
        </div>
      ),
    },
    {
      id: '10',
      page: 'sales',
      title: 'Checkout Process',
      description: 'Complete the sale and generate a receipt.',
      target: '[data-tutorial="checkout-button"]',
      placement: 'top',
      highlightStyle: 'border',
      content: (
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-green-500" />
          <span className="text-sm">Final step to complete the transaction</span>
        </div>
      ),
    },
    {
      id: '11',
      page: 'sales',
      title: 'Offline Capability',
      description: 'Sales work even without internet connection.',
      target: '[data-tutorial="offline-indicator"]',
      placement: 'bottom',
      highlightStyle: 'glow',
      content: (
        <div className="text-sm">
          <p>All sales are saved locally and synced when you're back online.</p>
        </div>
      ),
    },
    {
      id: '12',
      page: 'sales',
      title: 'Sales Complete!',
      description: 'You\'re now ready to handle any sales situation efficiently.',
      target: '[data-tutorial="sales-container"]',
      placement: 'center',
      highlightStyle: 'glow',
      content: (
        <div className="text-sm text-center">
          <p className="font-medium mb-2">🎉 Sales Tutorial Complete!</p>
          <p>You can now record sales, manage payments, and serve customers like a pro!</p>
        </div>
      ),
    },
  ],
};