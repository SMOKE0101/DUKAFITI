
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
    return (
      <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-8 bg-transparent">
        <div className="flex justify-center">
          <div className="animate-pulse space-y-4 w-full max-w-md">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-8 bg-transparent">
      {/* Theme Selection */}
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Palette className="w-5 h-5 text-primary" />
            </div>
            <Label className="text-lg font-mono font-bold uppercase tracking-wider text-gray-900 dark:text-white">
              Interface Theme
            </Label>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Choose how you want the application to look
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            type="button"
            onClick={() => handleThemeChange('light')}
            className={`p-6 rounded-xl border-2 flex flex-col items-center gap-4 transition-all duration-200 hover:scale-105 ${
              settings.theme === 'light' 
                ? 'border-primary bg-primary/5 shadow-lg' 
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800/50'
            }`}
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
              settings.theme === 'light' 
                ? 'bg-yellow-100 dark:bg-yellow-900/20' 
                : 'bg-gray-100 dark:bg-gray-800'
            }`}>
              <Sun className="w-8 h-8 text-yellow-500" />
            </div>
            <div className="text-center">
              <span className="font-mono font-bold uppercase tracking-wider text-gray-900 dark:text-white">Light</span>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Clean and bright interface</p>
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => handleThemeChange('dark')}
            className={`p-6 rounded-xl border-2 flex flex-col items-center gap-4 transition-all duration-200 hover:scale-105 ${
              settings.theme === 'dark' 
                ? 'border-primary bg-primary/5 shadow-lg' 
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800/50'
            }`}
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
              settings.theme === 'dark' 
                ? 'bg-blue-100 dark:bg-blue-900/20' 
                : 'bg-gray-100 dark:bg-gray-800'
            }`}>
              <Moon className="w-8 h-8 text-blue-500" />
            </div>
            <div className="text-center">
              <span className="font-mono font-bold uppercase tracking-wider text-gray-900 dark:text-white">Dark</span>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Easy on the eyes</p>
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => handleThemeChange('system')}
            className={`p-6 rounded-xl border-2 flex flex-col items-center gap-4 transition-all duration-200 hover:scale-105 ${
              settings.theme === 'system' 
                ? 'border-primary bg-primary/5 shadow-lg' 
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800/50'
            }`}
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
              settings.theme === 'system' 
                ? 'bg-purple-100 dark:bg-purple-900/20' 
                : 'bg-gray-100 dark:bg-gray-800'
            }`}>
              <Monitor className="w-8 h-8 text-purple-600" />
            </div>
            <div className="text-center">
              <span className="font-mono font-bold uppercase tracking-wider text-gray-900 dark:text-white">System</span>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Matches your device</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings;
