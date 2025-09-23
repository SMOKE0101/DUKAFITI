import { TutorialStep } from '@/hooks/useTutorial';

export const DASHBOARD_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'summary-cards',
    title: 'Dashboard Overview',
    description: 'This is your main dashboard showing key business metrics like total revenue, sales count, and customer information.',
    targetId: 'dashboard-summary-cards'
  },
  {
    id: 'low-stock-alerts',
    title: 'Low Stock Alerts',
    description: 'This section shows products that are running low on inventory. Keep an eye on these to avoid stockouts.',
    targetId: 'low-stock-alerts-card'
  },
  {
    id: 'outstanding-debts',
    title: 'Outstanding Debts',
    description: 'Here you can see customers who have outstanding debts. This helps you track credit sales and follow up on payments.',
    targetId: 'outstanding-debts-card'
  },
  {
    id: 'quick-actions',
    title: 'Quick Actions',
    description: 'These buttons provide fast access to common tasks like recording sales, adding products, and adding customers.',
    targetId: 'quick-actions-section'
  }
];
