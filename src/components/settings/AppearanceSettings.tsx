
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '../../hooks/useSettings';
import { Save, Moon, Sun, Monitor } from 'lucide-react';

const AppearanceSettings = () => {
  const { settings, saveSettings } = useSettings();
  const [formData, setFormData] = useState({
    theme: settings.theme,
    emailNotifications: settings.emailNotifications,
    smsNotifications: settings.smsNotifications,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(formData);
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="theme" className="block text-sm font-medium text-gray-700">
          Theme Preference
        </Label>
        <Select
          value={formData.theme}
          onValueChange={(value: 'light' | 'dark' | 'system') => 
            setFormData({ ...formData, theme: value })
          }
        >
          <SelectTrigger className="w-full bg-gray-100 rounded-xl p-4 border-0 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition-all duration-200">
            <SelectValue placeholder="Select theme" />
          </SelectTrigger>
          <SelectContent className="bg-white rounded-xl shadow-lg border border-gray-200">
            {themeOptions.map(option => {
              const Icon = option.icon;
              return (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  className="hover:bg-gray-50 rounded-lg flex items-center gap-2"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {option.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

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
