
import React, { memo, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { useSettings } from '../../hooks/useSettings';
import { useTheme } from 'next-themes';
import { Palette, Sun, Moon, LucideIcon } from 'lucide-react';

// Properly typed theme option interface
interface ThemeOption {
  value: 'light' | 'dark';
  label: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
}

// Memoize theme option data with proper typing
const THEME_OPTIONS: ThemeOption[] = [
  {
    value: 'light',
    label: 'LIGHT',
    description: 'Clean and bright interface',
    icon: Sun,
    iconColor: 'text-yellow-500',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20'
  },
  {
    value: 'dark', 
    label: 'DARK',
    description: 'Easy on the eyes',
    icon: Moon,
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20'
  }
];

// Memoized theme button component
const ThemeButton = memo(({ 
  option, 
  isActive, 
  onSelect 
}: { 
  option: ThemeOption;
  isActive: boolean;
  onSelect: () => void;
}) => {
  const IconComponent = option.icon;
  
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`p-6 rounded-xl border-2 flex flex-col items-center gap-4 transition-all duration-200 hover:scale-105 bg-background ${
        isActive
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg ring-2 ring-blue-500/20' 
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
        isActive ? option.bgColor : 'bg-gray-100 dark:bg-gray-800'
      }`}>
        <IconComponent className={`w-8 h-8 ${option.iconColor}`} />
      </div>
      <div className="text-center">
        <span className="font-mono font-bold uppercase tracking-wider text-gray-900 dark:text-white">
          {option.label}
        </span>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {option.description}
        </p>
      </div>
    </button>
  );
});

const AppearanceSettings = () => {
  const { settings, saveSettings, loading } = useSettings();
  const { setTheme } = useTheme();

  // Use only settings theme as source of truth - no automatic switching
  const activeTheme = useMemo(() => {
    return settings.theme || 'light';
  }, [settings.theme]);

  const handleThemeChange = useMemo(() => (newTheme: 'light' | 'dark') => {
    console.log('Manual theme change:', newTheme);
    
    // Update theme immediately for instant UI feedback
    setTheme(newTheme);
    
    // Save to persistent storage
    saveSettings({ theme: newTheme });
  }, [setTheme, saveSettings]);

  // Memoize theme buttons to prevent recreation
  const themeButtons = useMemo(() => 
    THEME_OPTIONS.map((option) => (
      <ThemeButton
        key={option.value}
        option={option}
        isActive={activeTheme === option.value}
        onSelect={() => handleThemeChange(option.value)}
      />
    )), [activeTheme, handleThemeChange]
  );

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

  return (
    <div className="w-full bg-background border-2 border-gray-300 dark:border-gray-600 rounded-xl p-8">
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
          {themeButtons}
        </div>
      </div>
    </div>
  );
};

export default memo(AppearanceSettings);
