import React from 'react';
import { TutorialConfig } from '@/types/tutorial';
import { Settings, Store, Palette, Bell } from 'lucide-react';

export const settingsTutorial: TutorialConfig = {
  id: 'settings',
  name: 'Settings Configuration',
  description: 'Customize your shop settings and preferences for optimal operation',
  page: '/app/settings',
  estimatedDuration: 4,
  difficulty: 'beginner',
  category: 'feature',
  steps: [
    {
      id: '1',
      page: 'settings',
      title: 'Settings Hub',
      description: 'Configure your shop preferences, appearance, and integrations.',
      target: '[data-tutorial="settings-container"]',
      placement: 'center',
      highlightStyle: 'glow',
      content: (
        <div className="space-y-2">
          <p className="text-sm">Settings let you:</p>
          <ul className="text-xs space-y-1 ml-4">
            <li>• Update shop information</li>
            <li>• Customize appearance</li>
            <li>• Manage notifications</li>
            <li>• Configure integrations</li>
          </ul>
        </div>
      ),
      delay: 500,
    },
    {
      id: '2',
      page: 'settings',
      title: 'Shop Profile',
      description: 'Update your shop name, business type, and contact information.',
      target: '[data-tutorial="shop-profile"]',
      placement: 'right',
      highlightStyle: 'border',
      content: (
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-blue-500" />
          <span className="text-sm">Keep your business information current</span>
        </div>
      ),
    },
    {
      id: '3',
      page: 'settings',
      title: 'Appearance Settings',
      description: 'Customize the look and feel of your application.',
      target: '[data-tutorial="appearance-settings"]',
      placement: 'right',
      highlightStyle: 'border',
      content: (
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-purple-500" />
          <span className="text-sm">Choose themes, colors, and display preferences</span>
        </div>
      ),
    },
    {
      id: '4',
      page: 'settings',
      title: 'Notification Preferences',
      description: 'Control how and when you receive notifications about your business.',
      target: '[data-tutorial="notification-settings"]',
      placement: 'right',
      highlightStyle: 'border',
      content: (
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-orange-500" />
          <span className="text-sm">Set up alerts for low stock, payments, and more</span>
        </div>
      ),
    },
    {
      id: '5',
      page: 'settings',
      title: 'Tutorial Management',
      description: 'Control tutorial settings and restart any tutorial you want to review.',
      target: '[data-tutorial="tutorial-settings"]',
      placement: 'right',
      highlightStyle: 'glow',
      content: (
        <div className="text-sm">
          <p>Manage your learning experience:</p>
          <ul className="text-xs mt-1 space-y-1 ml-4">
            <li>• Restart completed tutorials</li>
            <li>• Adjust tutorial speed</li>
            <li>• Enable/disable features</li>
          </ul>
        </div>
      ),
    },
    {
      id: '6',
      page: 'settings',
      title: 'Settings Configuration Complete!',
      description: 'Your shop is now configured to work exactly how you need it.',
      target: '[data-tutorial="settings-container"]',
      placement: 'center',
      highlightStyle: 'glow',
      content: (
        <div className="text-sm text-center">
          <p className="font-medium mb-2">🎉 Settings Tutorial Complete!</p>
          <p>Your shop is fully customized and ready for optimal performance!</p>
        </div>
      ),
    },
  ],
};