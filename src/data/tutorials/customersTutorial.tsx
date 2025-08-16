import React from 'react';
import { TutorialConfig } from '@/types/tutorial';
import { Users, UserPlus, CreditCard, History } from 'lucide-react';

export const customersTutorial: TutorialConfig = {
  id: 'customers',
  name: 'Customer Management',
  description: 'Learn to manage customers, track debts, and handle payments',
  page: '/app/customers',
  estimatedDuration: 6,
  difficulty: 'intermediate',
  category: 'onboarding',
  steps: [
    {
      id: '1',
      page: 'customers',
      title: 'Customer Management Center',
      description: 'Manage all your customers, track their purchases, and handle credit transactions.',
      target: '[data-tutorial="customers-container"]',
      placement: 'center',
      highlightStyle: 'glow',
      content: (
        <div className="space-y-2">
          <p className="text-sm">Customer management helps you:</p>
          <ul className="text-xs space-y-1 ml-4">
            <li>• Keep customer contact information</li>
            <li>• Track credit and debt</li>
            <li>• View purchase history</li>
            <li>• Process payments</li>
          </ul>
        </div>
      ),
      delay: 500,
    },
    {
      id: '2',
      page: 'customers',
      title: 'Add New Customer',
      description: 'Register new customers with their contact details and credit limits.',
      target: '[data-tutorial="add-customer-button"]',
      placement: 'bottom',
      highlightStyle: 'border',
      action: 'click',
      content: (
        <div className="flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-green-500" />
          <span className="text-sm">Build your customer database</span>
        </div>
      ),
    },
    {
      id: '3',
      page: 'customers',
      title: 'Customer Search',
      description: 'Quickly find customers by name, phone number, or other details.',
      target: '[data-tutorial="customer-search"]',
      placement: 'bottom',
      highlightStyle: 'border',
      content: (
        <div className="text-sm">
          <p>Search customers instantly during sales or when recording payments.</p>
        </div>
      ),
    },
    {
      id: '4',
      page: 'customers',
      title: 'Customer Cards',
      description: 'Each customer card shows essential information and quick actions.',
      target: '[data-tutorial="customer-list"]',
      placement: 'center',
      highlightStyle: 'glow',
      content: (
        <div className="text-sm">
          <p>Customer cards display:</p>
          <ul className="text-xs mt-1 space-y-1 ml-4">
            <li>• Name and contact info</li>
            <li>• Outstanding debt amount</li>
            <li>• Credit limit status</li>
            <li>• Last purchase date</li>
          </ul>
        </div>
      ),
    },
    {
      id: '5',
      page: 'customers',
      title: 'Debt Management',
      description: 'Track outstanding debts and credit limits for each customer.',
      target: '[data-tutorial="debt-indicator"]',
      placement: 'right',
      highlightStyle: 'border',
      content: (
        <div className="text-sm">
          <p>Customers with outstanding debt are clearly marked. Monitor credit limits to manage risk.</p>
        </div>
      ),
    },
    {
      id: '6',
      page: 'customers',
      title: 'Record Payment',
      description: 'Process debt payments when customers pay their outstanding balances.',
      target: '[data-tutorial="record-payment"]',
      placement: 'top',
      highlightStyle: 'border',
      content: (
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-blue-500" />
          <span className="text-sm">Accept cash, mobile money, or split payments</span>
        </div>
      ),
    },
    {
      id: '7',
      page: 'customers',
      title: 'Customer History',
      description: 'View detailed purchase and payment history for any customer.',
      target: '[data-tutorial="customer-history"]',
      placement: 'top',
      highlightStyle: 'border',
      content: (
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-purple-500" />
          <span className="text-sm">Track all transactions and interactions</span>
        </div>
      ),
    },
    {
      id: '8',
      page: 'customers',
      title: 'Customer Analytics',
      description: 'Understand customer behavior and identify your best customers.',
      target: '[data-tutorial="customer-stats"]',
      placement: 'left',
      highlightStyle: 'glow',
      content: (
        <div className="text-sm">
          <p>See total purchases, payment patterns, and customer loyalty metrics.</p>
        </div>
      ),
    },
    {
      id: '9',
      page: 'customers',
      title: 'Customer Management Complete!',
      description: 'You can now manage customers and handle credit transactions professionally.',
      target: '[data-tutorial="customers-container"]',
      placement: 'center',
      highlightStyle: 'glow',
      content: (
        <div className="text-sm text-center">
          <p className="font-medium mb-2">🎉 Customer Tutorial Complete!</p>
          <p>You're ready to build strong customer relationships and manage credit safely!</p>
        </div>
      ),
    },
  ],
};