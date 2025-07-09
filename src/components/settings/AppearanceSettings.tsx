
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '../../hooks/useSettings';
import { Palette, Monitor, Sun, Moon } from 'lucide-react';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    updateSettings({
      currencyFormat: formData.get('currencyFormat') as string,
      dateFormat: formData.get('dateFormat') as string,
      language: formData.get('language') as string,
      dashboardLayout: formData.get('dashboardLayout') as 'compact' | 'spacious',
    });
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Theme Selection */}
      <div className="space-y-4">
        <Label className="flex items-center gap-2 text-base font-medium">
          <Palette className="w-4 h-4" />
          Theme Preference
        </Label>
        <div className="grid grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => handleThemeChange('light')}
            className={`p-4 rounded-lg border-2 flex items-center justify-center gap-2 transition-colors ${
              settings.theme === 'light' 
                ? 'border-primary bg-primary/10' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Sun className="w-5 h-5" />
            <span>Light</span>
          </button>
          <button
            type="button"
            onClick={() => handleThemeChange('dark')}
            className={`p-4 rounded-lg border-2 flex items-center justify-center gap-2 transition-colors ${
              settings.theme === 'dark' 
                ? 'border-primary bg-primary/10' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Moon className="w-5 h-5" />
            <span>Dark</span>
          </button>
          <button
            type="button"
            onClick={() => handleThemeChange('system')}
            className={`p-4 rounded-lg border-2 flex items-center justify-center gap-2 transition-colors ${
              settings.theme === 'system' 
                ? 'border-primary bg-primary/10' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Monitor className="w-5 h-5" />
            <span>System</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Currency Format */}
        <div className="space-y-2">
          <Label htmlFor="currencyFormat">Currency Format</Label>
          <Select name="currencyFormat" defaultValue={settings.currencyFormat}>
            <SelectTrigger>
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="KSh {amount}">KSh 1,000</SelectItem>
              <SelectItem value="{amount} KSh">{'{amount}'} KSh</SelectItem>
              <SelectItem value="KES {amount}">KES 1,000</SelectItem>
              <SelectItem value="${amount}">${'{amount}'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Format */}
        <div className="space-y-2">
          <Label htmlFor="dateFormat">Date Format</Label>
          <Select name="dateFormat" defaultValue={settings.dateFormat}>
            <SelectTrigger>
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
              <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              <SelectItem value="DD-MM-YYYY">DD-MM-YYYY</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Language */}
        <div className="space-y-2">
          <Label htmlFor="language">Language</Label>
          <Select name="language" defaultValue={settings.language}>
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="sw">Kiswahili</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Dashboard Layout */}
        <div className="space-y-2">
          <Label htmlFor="dashboardLayout">Dashboard Layout</Label>
          <Select name="dashboardLayout" defaultValue={settings.dashboardLayout}>
            <SelectTrigger>
              <SelectValue placeholder="Select layout" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compact">Compact</SelectItem>
              <SelectItem value="spacious">Spacious</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button type="submit" className="px-8">
          Save Appearance Settings
        </Button>
      </div>
    </form>
  );
};

export default AppearanceSettings;
