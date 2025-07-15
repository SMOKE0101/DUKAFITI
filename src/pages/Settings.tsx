
import React, { memo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ShopProfileSettings from '@/components/settings/ShopProfileSettings';
import AppearanceSettings from '@/components/settings/AppearanceSettings';
import MpesaC2BSettings from '@/components/settings/MpesaC2BSettings';
import { Settings as SettingsIcon, Store, Palette, Smartphone } from 'lucide-react';

// Memoize tab data to prevent recreation on every render
const TABS_CONFIG = [
  {
    value: "store",
    label: "Store Info", 
    shortLabel: "Store",
    icon: Store,
    borderColor: "border-green-600",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    textColor: "text-green-600"
  },
  {
    value: "display",
    label: "Display Settings",
    shortLabel: "Display", 
    icon: Palette,
    borderColor: "border-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
    textColor: "text-orange-600"
  },
  {
    value: "mpesa",
    label: "M-Pesa Integration",
    shortLabel: "M-Pesa",
    icon: Smartphone, 
    borderColor: "border-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    textColor: "text-blue-600"
  }
];

// Memoized tab trigger component to prevent unnecessary re-renders
const TabTriggerMemo = memo(({ tab }: { tab: typeof TABS_CONFIG[0] }) => (
  <TabsTrigger 
    value={tab.value}
    className={`flex items-center gap-2 py-3 px-4 text-sm font-mono font-bold uppercase tracking-wider border-2 ${tab.borderColor} ${tab.bgColor} ${tab.textColor} data-[state=active]:bg-opacity-100 hover:bg-opacity-100 rounded-xl transition-all duration-200`}
  >
    <div className={`w-5 h-5 border-2 ${tab.borderColor} rounded-full flex items-center justify-center`}>
      <tab.icon className="w-3 h-3" />
    </div>
    <span className="hidden sm:inline">{tab.label}</span>
    <span className="sm:hidden">{tab.shortLabel}</span>
  </TabsTrigger>
));

// Memoized card wrapper to prevent re-renders
const SettingsCard = memo(({ tab, children }: { tab: typeof TABS_CONFIG[0], children: React.ReactNode }) => (
  <Card className={`border-2 ${tab.borderColor} ${tab.bgColor} rounded-xl shadow-sm`}>
    <CardHeader className={`pb-4 border-b-2 ${tab.borderColor}`}>
      <CardTitle className="flex items-center gap-3 text-lg md:text-xl">
        <div className={`w-8 h-8 border-2 ${tab.borderColor} rounded-full flex items-center justify-center bg-white dark:bg-gray-800`}>
          <tab.icon className={`w-4 h-4 ${tab.textColor}`} />
        </div>
        <span className={`font-mono uppercase tracking-widest ${tab.textColor}`}>
          {tab.value === 'store' ? 'Store Information' : 
           tab.value === 'display' ? 'Display Settings' : 
           'M-Pesa Integration'}
        </span>
      </CardTitle>
      <CardDescription className="text-sm font-mono text-gray-600 dark:text-gray-400">
        {tab.value === 'store' ? 'Update your store details and contact information' :
         tab.value === 'display' ? 'Customize the appearance and theme of your application' :
         'Configure M-Pesa payment integration for your store'}
      </CardDescription>
    </CardHeader>
    <CardContent className="bg-white dark:bg-gray-900 rounded-b-xl">
      {children}
    </CardContent>
  </Card>
));

const Settings = () => {
  return (
    <div className="w-full min-h-screen bg-background p-4 md:p-6">
      <div className="w-full max-w-6xl mx-auto">
        <div className="mb-6 md:mb-8">
          <div className="border-2 border-purple-600 rounded-xl p-4 md:p-6 bg-purple-50 dark:bg-purple-900/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 md:w-10 md:h-10 border-2 border-purple-600 rounded-full flex items-center justify-center bg-white dark:bg-gray-800">
                <SettingsIcon className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold font-mono uppercase tracking-widest text-purple-600">Settings</h1>
                <p className="text-sm md:text-base font-mono text-gray-600 dark:text-gray-400">Manage your shop settings and preferences</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="store" className="space-y-4 md:space-y-6 w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-2 h-auto p-2 border-2 border-gray-600 rounded-xl bg-transparent">
            {TABS_CONFIG.map((tab) => (
              <TabTriggerMemo key={tab.value} tab={tab} />
            ))}
          </TabsList>

          <div className="w-full bg-background">
            <TabsContent value="store" className="w-full mt-6">
              <SettingsCard tab={TABS_CONFIG[0]}>
                <ShopProfileSettings />
              </SettingsCard>
            </TabsContent>

            <TabsContent value="display" className="w-full mt-6">
              <SettingsCard tab={TABS_CONFIG[1]}>
                <AppearanceSettings />
              </SettingsCard>
            </TabsContent>

            <TabsContent value="mpesa" className="w-full mt-6">
              <SettingsCard tab={TABS_CONFIG[2]}>
                <MpesaC2BSettings />
              </SettingsCard>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
