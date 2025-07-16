
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ShopProfileSettings from '@/components/settings/ShopProfileSettings';
import AppearanceSettings from '@/components/settings/AppearanceSettings';
import MpesaC2BSettings from '@/components/settings/MpesaC2BSettings';
import { Settings as SettingsIcon, Store, Palette, Smartphone } from 'lucide-react';

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
            <TabsTrigger 
              value="store" 
              className="flex items-center gap-2 py-3 px-4 text-sm font-mono font-bold uppercase tracking-wider border-2 border-green-600 bg-green-50 text-green-600 data-[state=active]:bg-green-100 hover:bg-green-100 rounded-xl transition-all duration-200"
            >
              <div className="w-5 h-5 border-2 border-green-600 rounded-full flex items-center justify-center">
                <Store className="w-3 h-3" />
              </div>
              <span className="hidden sm:inline">Store Info</span>
              <span className="sm:hidden">Store</span>
            </TabsTrigger>
            <TabsTrigger 
              value="display" 
              className="flex items-center gap-2 py-3 px-4 text-sm font-mono font-bold uppercase tracking-wider border-2 border-orange-600 bg-orange-50 text-orange-600 data-[state=active]:bg-orange-100 hover:bg-orange-100 rounded-xl transition-all duration-200"
            >
              <div className="w-5 h-5 border-2 border-orange-600 rounded-full flex items-center justify-center">
                <Palette className="w-3 h-3" />
              </div>
              <span className="hidden sm:inline">Display Settings</span>
              <span className="sm:hidden">Display</span>
            </TabsTrigger>
            <TabsTrigger 
              value="mpesa" 
              className="flex items-center gap-2 py-3 px-4 text-sm font-mono font-bold uppercase tracking-wider border-2 border-blue-600 bg-blue-50 text-blue-600 data-[state=active]:bg-blue-100 hover:bg-blue-100 rounded-xl transition-all duration-200"
            >
              <div className="w-5 h-5 border-2 border-blue-600 rounded-full flex items-center justify-center">
                <Smartphone className="w-3 h-3" />
              </div>
              <span className="hidden sm:inline">M-Pesa Integration</span>
              <span className="sm:hidden">M-Pesa</span>
            </TabsTrigger>
          </TabsList>

          <div className="w-full bg-background">
            <TabsContent value="store" className="w-full mt-6">
              <Card className="border-2 border-green-600 bg-green-50 dark:bg-green-900/20 rounded-xl shadow-sm">
                <CardHeader className="pb-4 border-b-2 border-green-600">
                  <CardTitle className="flex items-center gap-3 text-lg md:text-xl">
                    <div className="w-8 h-8 border-2 border-green-600 rounded-full flex items-center justify-center bg-white dark:bg-gray-800">
                      <Store className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="font-mono uppercase tracking-widest text-green-600">Store Information</span>
                  </CardTitle>
                  <CardDescription className="text-sm font-mono text-gray-600 dark:text-gray-400">
                    Update your store details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="bg-white dark:bg-gray-900 rounded-b-xl">
                  <ShopProfileSettings />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="display" className="w-full mt-6">
              <Card className="border-2 border-orange-600 bg-orange-50 dark:bg-orange-900/20 rounded-xl shadow-sm">
                <CardHeader className="pb-4 border-b-2 border-orange-600">
                  <CardTitle className="flex items-center gap-3 text-lg md:text-xl">
                    <div className="w-8 h-8 border-2 border-orange-600 rounded-full flex items-center justify-center bg-white dark:bg-gray-800">
                      <Palette className="w-4 h-4 text-orange-600" />
                    </div>
                    <span className="font-mono uppercase tracking-widest text-orange-600">Display Settings</span>
                  </CardTitle>
                  <CardDescription className="text-sm font-mono text-gray-600 dark:text-gray-400">
                    Customize the appearance and theme of your application
                  </CardDescription>
                </CardHeader>
                <CardContent className="bg-white dark:bg-gray-900 rounded-b-xl">
                  <AppearanceSettings />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mpesa" className="w-full mt-6">
              <Card className="border-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-xl shadow-sm">
                <CardHeader className="pb-4 border-b-2 border-blue-600">
                  <CardTitle className="flex items-center gap-3 text-lg md:text-xl">
                    <div className="w-8 h-8 border-2 border-blue-600 rounded-full flex items-center justify-center bg-white dark:bg-gray-800">
                      <Smartphone className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-mono uppercase tracking-widest text-blue-600">M-Pesa Integration</span>
                  </CardTitle>
                  <CardDescription className="text-sm font-mono text-gray-600 dark:text-gray-400">
                    Configure M-Pesa payment integration for your store
                  </CardDescription>
                </CardHeader>
                <CardContent className="bg-white dark:bg-gray-900 rounded-b-xl">
                  <MpesaC2BSettings />
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
