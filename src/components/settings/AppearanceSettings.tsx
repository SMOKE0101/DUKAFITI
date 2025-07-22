
import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '../../hooks/useSettings';
import { Moon, Sun } from 'lucide-react';

const AppearanceSettings = () => {
  const { settings, saveSettings, loading } = useSettings();
  const [formData, setFormData] = useState({
    theme: 'light' as 'light' | 'dark',
  });

  // Update form data when settings are loaded
  useEffect(() => {
    console.log('Settings loaded in AppearanceSettings:', settings);
    setFormData({
      theme: (settings.theme === 'dark' ? 'dark' : 'light') as 'light' | 'dark',
    });
  }, [settings]);

  const handleThemeToggle = async (isDark: boolean) => {
    const newTheme = isDark ? 'dark' : 'light';
    console.log('Theme toggle changed to:', newTheme);
    
    // Update local state immediately for instant UI feedback
    setFormData({ ...formData, theme: newTheme });
    
    // Save theme change immediately without waiting
    await saveSettings({ theme: newTheme });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Theme Toggle Section */}
      <div className="space-y-4">
        <Label className="block text-sm font-medium text-gray-700">
          Theme Preference
        </Label>
        
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3">
            <Sun className="w-5 h-5 text-amber-500" />
            <span className={`text-sm font-medium transition-colors ${formData.theme === 'light' ? 'text-purple-600' : 'text-gray-600'}`}>
              Light Mode
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <Switch
              checked={formData.theme === 'dark'}
              onCheckedChange={handleThemeToggle}
              className="data-[state=checked]:bg-purple-600 focus:ring-purple-300"
            />
            <span className={`text-sm font-medium transition-colors ${formData.theme === 'dark' ? 'text-purple-600' : 'text-gray-600'}`}>
              Dark Mode
            </span>
            <Moon className="w-5 h-5 text-indigo-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings;
