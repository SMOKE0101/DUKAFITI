
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ShopProfileSettings from '../components/settings/ShopProfileSettings';
import AppearanceSettings from '../components/settings/AppearanceSettings';
import MpesaC2BSettings from '../components/settings/MpesaC2BSettings';
import { Store, Palette, Smartphone } from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');

  const settingsTabs = [
    { id: 'profile', label: 'Shop Profile', icon: Store, component: ShopProfileSettings },
    { id: 'appearance', label: 'Display', icon: Palette, component: AppearanceSettings },
    { id: 'mpesa', label: 'M-Pesa Setup', icon: Smartphone, component: MpesaC2BSettings },
  ];

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">DukaFiti Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your shop preferences and configuration</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          {settingsTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex flex-col items-center gap-2 p-3 text-xs"
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {settingsTabs.map((tab) => {
          const Component = tab.component;
          return (
            <TabsContent key={tab.id} value={tab.id} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <tab.icon size={24} />
                    {tab.label} Settings
                  </CardTitle>
                  <CardDescription>
                    {tab.id === 'profile' && 'Configure your shop information and contact details'}
                    {tab.id === 'appearance' && 'Customize your interface theme and appearance'}
                    {tab.id === 'mpesa' && 'Set up M-Pesa payment integration (Coming Soon)'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Component />
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default Settings;
