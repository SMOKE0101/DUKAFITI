
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="relative z-10">
            <h1 className="font-mono text-4xl font-black uppercase tracking-widest text-gray-900 dark:text-white mb-2">
              SETTINGS
            </h1>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Manage your shop preferences and configuration</p>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-4 right-8 w-16 h-16 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-full blur-lg"></div>
        </div>

        {/* Enhanced Settings Content */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Modern Tab List */}
            <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <TabsList className="w-full h-auto bg-transparent p-0 rounded-none">
                <div className="grid w-full grid-cols-3">
                  {settingsTabs.map((tab, index) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className={`
                          flex flex-col items-center gap-3 p-6 text-sm font-medium transition-all duration-200
                          border-b-2 border-transparent rounded-none
                          ${isActive 
                            ? 'border-primary bg-white dark:bg-gray-900 text-primary shadow-sm' 
                            : 'hover:bg-white/50 dark:hover:bg-gray-900/50 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                          }
                          ${index !== settingsTabs.length - 1 ? 'border-r border-gray-200 dark:border-gray-700' : ''}
                        `}
                      >
                        <div className={`
                          w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200
                          ${isActive 
                            ? 'bg-primary/10 text-primary shadow-sm' 
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                          }
                        `}>
                          <Icon size={20} strokeWidth={2} />
                        </div>
                        <span className="font-mono text-xs uppercase tracking-wider">
                          {tab.label}
                        </span>
                      </TabsTrigger>
                    );
                  })}
                </div>
              </TabsList>
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {settingsTabs.map((tab) => {
                const Component = tab.component;
                const Icon = tab.icon;
                return (
                  <TabsContent key={tab.id} value={tab.id} className="mt-0 space-y-6">
                    {/* Section Header */}
                    <div className="flex items-center gap-3 pb-6 border-b border-gray-200 dark:border-gray-700">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Icon size={20} className="text-primary" strokeWidth={2} />
                      </div>
                      <div>
                        <h2 className="font-mono text-xl font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                          {tab.label} Settings
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {tab.id === 'profile' && 'Configure your shop information and contact details'}
                          {tab.id === 'appearance' && 'Customize your interface theme and appearance'}
                          {tab.id === 'mpesa' && 'Set up M-Pesa payment integration (Coming Soon)'}
                        </p>
                      </div>
                    </div>

                    {/* Settings Component */}
                    <div className="space-y-6">
                      <Component />
                    </div>
                  </TabsContent>
                );
              })}
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Settings;
