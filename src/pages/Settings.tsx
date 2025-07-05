
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ShopProfileSettings from '../components/settings/ShopProfileSettings';
import BusinessConfigSettings from '../components/settings/BusinessConfigSettings';
import FinancialSettings from '../components/settings/FinancialSettings';
import NotificationSettings from '../components/settings/NotificationSettings';
import DataManagementSettings from '../components/settings/DataManagementSettings';
import SecuritySettings from '../components/settings/SecuritySettings';
import AppearanceSettings from '../components/settings/AppearanceSettings';
import DarajaSettings from '../components/settings/DarajaSettings';
import SMSSettings from '../components/settings/SMSSettings';
import { Store, DollarSign, Bell, Database, Shield, Palette, Smartphone, MessageSquare } from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');

  const settingsTabs = [
    { id: 'profile', label: 'Shop Profile', icon: Store, component: ShopProfileSettings },
    { id: 'business', label: 'Business Config', icon: Store, component: BusinessConfigSettings },
    { id: 'financial', label: 'Financial', icon: DollarSign, component: FinancialSettings },
    { id: 'daraja', label: 'M-Pesa Setup', icon: Smartphone, component: DarajaSettings },
    { id: 'sms', label: 'SMS Settings', icon: MessageSquare, component: SMSSettings },
    { id: 'notifications', label: 'Notifications', icon: Bell, component: NotificationSettings },
    { id: 'data', label: 'Data Management', icon: Database, component: DataManagementSettings },
    { id: 'security', label: 'Security', icon: Shield, component: SecuritySettings },
    { id: 'appearance', label: 'Appearance', icon: Palette, component: AppearanceSettings },
  ];

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">DukaFiti Settings</h1>
        <p className="text-gray-600">Manage your shop preferences and configuration</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-9 h-auto">
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
                    Configure your {tab.label.toLowerCase()} preferences and options
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
