
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '../../hooks/useSettings';
import { Save, Moon, Sun } from 'lucide-react';

const AppearanceSettings = () => {
  const { settings, saveSettings, loading } = useSettings();
  const [formData, setFormData] = useState({
    theme: 'light' as 'light' | 'dark',
    emailNotifications: false,
    smsNotifications: false,
  });

  // Update form data when settings are loaded
  useEffect(() => {
    console.log('Settings loaded in AppearanceSettings:', settings);
    setFormData({
      theme: (settings.theme === 'dark' ? 'dark' : 'light') as 'light' | 'dark',
      emailNotifications: settings.emailNotifications || false,
      smsNotifications: settings.smsNotifications || false,
    });
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Saving appearance settings:', formData);
    await saveSettings(formData);
  };

  const handleThemeToggle = (isDark: boolean) => {
    const newTheme = isDark ? 'dark' : 'light';
    console.log('Theme toggle changed to:', newTheme);
    setFormData({ ...formData, theme: newTheme });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      {/* Notification Settings */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div className="flex-1">
            <Label className="text-sm font-medium text-gray-700">
              Email Notifications
            </Label>
            <p className="text-xs text-gray-500 mt-1">
              Receive updates and alerts via email
            </p>
          </div>
          <Switch
            checked={formData.emailNotifications}
            onCheckedChange={(checked) => 
              setFormData({ ...formData, emailNotifications: checked })
            }
            className="data-[state=checked]:bg-purple-600 focus:ring-purple-300"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div className="flex-1">
            <Label className="text-sm font-medium text-gray-700">
              SMS Notifications
            </Label>
            <p className="text-xs text-gray-500 mt-1">
              Receive alerts and updates via SMS
            </p>
          </div>
          <Switch
            checked={formData.smsNotifications}
            onCheckedChange={(checked) => 
              setFormData({ ...formData, smsNotifications: checked })
            }
            className="data-[state=checked]:bg-purple-600 focus:ring-purple-300"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button 
          type="submit" 
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-xl transition-colors duration-200 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Settings
        </Button>
      </div>
    </form>
  );
};

export default AppearanceSettings;
