import React from 'react';
import { TutorialConfig } from '@/types/tutorial';
import { BarChart, Calendar, Download, TrendingUp } from 'lucide-react';

export const reportsTutorial: TutorialConfig = {
  id: 'reports',
  name: 'Reports & Analytics',
  description: 'Master business reporting and data analysis for better decisions',
  page: '/app/reports',
  estimatedDuration: 5,
  difficulty: 'advanced',
  category: 'feature',
  steps: [
    {
      id: '1',
      page: 'reports',
      title: 'Business Intelligence Hub',
      description: 'Access comprehensive reports and analytics to understand your business performance.',
      target: '[data-tutorial="reports-container"]',
      placement: 'center',
      highlightStyle: 'glow',
      content: (
        <div className="space-y-2">
          <p className="text-sm">Reports help you:</p>
          <ul className="text-xs space-y-1 ml-4">
            <li>• Track sales trends</li>
            <li>• Analyze product performance</li>
            <li>• Monitor customer behavior</li>
            <li>• Make data-driven decisions</li>
          </ul>
        </div>
      ),
      delay: 500,
    },
    {
      id: '2',
      page: 'reports',
      title: 'Date Range Selection',
      description: 'Choose the time period for your reports and analysis.',
      target: '[data-tutorial="date-picker"]',
      placement: 'bottom',
      highlightStyle: 'border',
      content: (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-500" />
          <span className="text-sm">Analyze daily, weekly, monthly, or custom periods</span>
        </div>
      ),
    },
    {
      id: '3',
      page: 'reports',
      title: 'Sales Summary Cards',
      description: 'Get quick insights into your key performance metrics.',
      target: '[data-tutorial="summary-cards"]',
      placement: 'bottom',
      highlightStyle: 'glow',
      content: (
        <div className="text-sm">
          <p>Key metrics at a glance:</p>
          <ul className="text-xs mt-1 space-y-1 ml-4">
            <li>• Total revenue</li>
            <li>• Number of transactions</li>
            <li>• Average sale value</li>
            <li>• Profit margins</li>
          </ul>
        </div>
      ),
    },
    {
      id: '4',
      page: 'reports',
      title: 'Interactive Charts',
      description: 'Visualize your data with interactive charts and graphs.',
      target: '[data-tutorial="charts-section"]',
      placement: 'top',
      highlightStyle: 'border',
      content: (
        <div className="flex items-center gap-2">
          <BarChart className="w-4 h-4 text-green-500" />
          <span className="text-sm">Hover over charts for detailed information</span>
        </div>
      ),
    },
    {
      id: '5',
      page: 'reports',
      title: 'Sales Trends',
      description: 'Track how your sales performance changes over time.',
      target: '[data-tutorial="sales-trend"]',
      placement: 'top',
      highlightStyle: 'glow',
      content: (
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-500" />
          <span className="text-sm">Identify patterns and seasonal trends</span>
        </div>
      ),
    },
    {
      id: '6',
      page: 'reports',
      title: 'Data Tables',
      description: 'View detailed transaction data in organized tables.',
      target: '[data-tutorial="data-tables"]',
      placement: 'top',
      highlightStyle: 'border',
      content: (
        <div className="text-sm">
          <p>Explore individual transactions, customer purchases, and product sales in detail.</p>
        </div>
      ),
    },
    {
      id: '7',
      page: 'reports',
      title: 'Export Reports',
      description: 'Download reports for external analysis or record keeping.',
      target: '[data-tutorial="export-button"]',
      placement: 'bottom',
      highlightStyle: 'border',
      content: (
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-orange-500" />
          <span className="text-sm">Export to PDF, Excel, or CSV formats</span>
        </div>
      ),
    },
    {
      id: '8',
      page: 'reports',
      title: 'Reports Mastery Achieved!',
      description: 'You can now analyze your business data like a professional analyst.',
      target: '[data-tutorial="reports-container"]',
      placement: 'center',
      highlightStyle: 'glow',
      content: (
        <div className="text-sm text-center">
          <p className="font-medium mb-2">🎉 Reports Tutorial Complete!</p>
          <p>Use these insights to grow your business and make informed decisions!</p>
        </div>
      ),
    },
  ],
};