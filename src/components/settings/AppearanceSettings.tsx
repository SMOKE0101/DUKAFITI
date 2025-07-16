
import React from 'react';
import { Label } from '@/components/ui/label';
import { useSettings } from '../../hooks/useSettings';
import { useTheme } from 'next-themes';
import { Palette, Sun, Moon } from 'lucide-react';

const AppearanceSettings = () => {
  const { settings, saveSettings, loading } = useSettings();
  const { theme: currentTheme } = useTheme();

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    console.log('Theme change initiated:', newTheme, 'Current theme:', currentTheme);
    
    // Update settings - this will handle both local state and theme provider sync
    saveSettings({ theme: newTheme });
  };

  if (loading) {
    return (
      <div className="w-full bg-background border-2 border-gray-300 dark:border-gray-600 rounded-xl p-8">
        <div className="flex justify-center">
          <div className="animate-pulse space-y-4 w-full max-w-md">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
            <div className="grid grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Use settings theme as the source of truth, with fallback to current theme
  const activeTheme = settings.theme || currentTheme || 'light';
  
  console.log('Rendering AppearanceSettings - Settings theme:', settings.theme, 'Current theme:', currentTheme, 'Active theme:', activeTheme);

  return (
    <div className="w-full bg-background border-2 border-gray-300 dark:border-gray-600 rounded-xl p-8">
      {/* Theme Selection */}
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Palette className="w-5 h-5 text-primary" />
            </div>
            <Label className="text-lg font-mono font-bold uppercase tracking-wider text-gray-900 dark:text-white">
              Choose how you want the application to look
            </Label>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            type="button"
            onClick={() => handleThemeChange('light')}
            className={`p-6 rounded-xl border-2 flex flex-col items-center gap-4 transition-all duration-200 hover:scale-105 bg-background ${
              activeTheme === 'light'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg ring-2 ring-blue-500/20' 
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
              activeTheme === 'light'
                ? 'bg-yellow-100 dark:bg-yellow-900/20' 
                : 'bg-gray-100 dark:bg-gray-800'
            }`}>
              <Sun className="w-8 h-8 text-yellow-500" />
            </div>
            <div className="text-center">
              <span className="font-mono font-bold uppercase tracking-wider text-gray-900 dark:text-white">LIGHT</span>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Clean and bright interface</p>
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => handleThemeChange('dark')}
            className={`p-6 rounded-xl border-2 flex flex-col items-center gap-4 transition-all duration-200 hover:scale-105 bg-background ${
              activeTheme === 'dark'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg ring-2 ring-blue-500/20' 
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
              activeTheme === 'dark'
                ? 'bg-blue-100 dark:bg-blue-900/20' 
                : 'bg-gray-100 dark:bg-gray-800'
            }`}>
              <Moon className="w-8 h-8 text-blue-500" />
            </div>
            <div className="text-center">
              <span className="font-mono font-bold uppercase tracking-wider text-gray-900 dark:text-white">DARK</span>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Easy on the eyes</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings;
