import React from 'react';
import { TutorialConfig } from '@/types/tutorial';
import { TrendingUp, Users, Package, Activity } from 'lucide-react';

export const dashboardTutorial: TutorialConfig = {
  id: 'dashboard',
  name: 'Dashboard Overview',
  description: 'Learn to navigate your business dashboard and understand key metrics',
  page: '/app/dashboard',
  estimatedDuration: 5,
  difficulty: 'beginner',
  category: 'onboarding',
  steps: [
    {
      id: '1',
      page: 'dashboard',
      title: 'Welcome to Your Dashboard',
      description: 'This is your business command center where you can see everything at a glance.',
      target: '[data-tutorial="dashboard-container"]',
      placement: 'center',
      highlightStyle: 'glow',
      content: (
        <div className="space-y-2">
          <p className="text-sm">Your dashboard provides real-time insights into:</p>
          <ul className="text-xs space-y-1 ml-4">
            <li>• Sales performance</li>
            <li>• Inventory levels</li>
            <li>• Customer analytics</li>
            <li>• Financial metrics</li>
          </ul>
        </div>
      ),
      delay: 500,
    },
    {
      id: '2',
      page: 'dashboard',
      title: 'Sales Overview Card',
      description: 'Track your daily, weekly, and monthly sales performance.',
      target: '[data-tutorial="sales-card"]',
      placement: 'bottom',
      highlightStyle: 'border',
      content: (
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <span className="text-sm">Monitor sales trends and revenue growth</span>
        </div>
      ),
    },
    {
      id: '3',
      page: 'dashboard',
      title: 'Customer Metrics',
      description: 'Keep track of your customer base and their purchase patterns.',
      target: '[data-tutorial="customers-card"]',
      placement: 'bottom',
      highlightStyle: 'border',
      content: (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-500" />
          <span className="text-sm">View total customers and recent activity</span>
        </div>
      ),
    },
    {
      id: '4',
      page: 'dashboard',
      title: 'Inventory Status',
      description: 'Monitor your stock levels and identify items that need restocking.',
      target: '[data-tutorial="inventory-card"]',
      placement: 'bottom',
      highlightStyle: 'border',
      content: (
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-orange-500" />
          <span className="text-sm">Track inventory and low stock alerts</span>
        </div>
      ),
    },
    {
      id: '5',
      page: 'dashboard',
      title: 'Recent Activity Feed',
      description: 'Stay updated with the latest transactions and important events.',
      target: '[data-tutorial="activity-feed"]',
      placement: 'left',
      highlightStyle: 'glow',
      content: (
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-500" />
          <span className="text-sm">See recent sales, payments, and system updates</span>
        </div>
      ),
    },
    {
      id: '6',
      page: 'dashboard',
      title: 'Quick Actions',
      description: 'Access frequently used features directly from your dashboard.',
      target: '[data-tutorial="quick-actions"]',
      placement: 'top',
      highlightStyle: 'border',
      content: (
        <div className="text-sm">
          <p>Use these shortcuts to:</p>
          <ul className="text-xs mt-1 space-y-1 ml-4">
            <li>• Record a quick sale</li>
            <li>• Add new products</li>
            <li>• Register customers</li>
          </ul>
        </div>
      ),
    },
    {
      id: '7',
      page: 'dashboard',
      title: 'Navigation Sidebar',
      description: 'Use the sidebar to navigate between different sections of your shop.',
      target: '[data-tutorial="sidebar"]',
      placement: 'right',
      highlightStyle: 'glow',
      content: (
        <div className="text-sm">
          <p>Navigate to:</p>
          <ul className="text-xs mt-1 space-y-1 ml-4">
            <li>• Sales - Record transactions</li>
            <li>• Inventory - Manage products</li>
            <li>• Customers - Manage clients</li>
            <li>• Reports - View analytics</li>
          </ul>
        </div>
      ),
    },
    {
      id: '8',
      page: 'dashboard',
      title: 'You're All Set!',
      description: 'You now know how to use your dashboard effectively. Ready to explore other features?',
      target: '[data-tutorial="dashboard-container"]',
      placement: 'center',
      highlightStyle: 'glow',
        content: (
          <div className="text-sm text-center">
            <p className="font-medium mb-2">🎉 Dashboard Tutorial Complete!</p>
            <p>Next, try the Sales tutorial to learn how to record transactions.</p>
          </div>
        ),
    },
  ],
};