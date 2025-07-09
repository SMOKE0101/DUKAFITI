
import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useSettings } from '../../hooks/useSettings';
import { Palette, Sun, Moon, Monitor } from 'lucide-react';

const AppearanceSettings = () => {
  const { settings, updateSettings, loading } = useSettings();

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updateSettings({ theme });
    
    // Apply theme immediately
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System theme
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center py-8">
      {/* Theme Selection */}
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <Label className="flex items-center justify-center gap-2 text-lg font-medium mb-6">
            <Palette className="w-5 h-5" />
            Theme
          </Label>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => handleThemeChange('light')}
            className={`p-6 rounded-lg border-2 flex flex-col items-center gap-3 transition-all duration-200 ${
              settings.theme === 'light' 
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
            }`}
          >
            <Sun className="w-8 h-8 text-yellow-500" />
            <span className="font-medium">Light</span>
            <span className="text-sm text-gray-500 text-center">Clean and bright interface</span>
          </button>
          
          <button
            type="button"
            onClick={() => handleThemeChange('dark')}
            className={`p-6 rounded-lg border-2 flex flex-col items-center gap-3 transition-all duration-200 ${
              settings.theme === 'dark' 
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
            }`}
          >
            <Moon className="w-8 h-8 text-blue-500" />
            <span className="font-medium">Dark</span>
            <span className="text-sm text-gray-500 text-center">Easy on the eyes</span>
          </button>
          
          <button
            type="button"
            onClick={() => handleThemeChange('system')}
            className={`p-6 rounded-lg border-2 flex flex-col items-center gap-3 transition-all duration-200 ${
              settings.theme === 'system' 
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
            }`}
          >
            <Monitor className="w-8 h-8 text-gray-600" />
            <span className="font-medium">System</span>
            <span className="text-sm text-gray-500 text-center">Matches your device</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings;
