
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ShopProfileSettings from '@/components/settings/ShopProfileSettings';
import AppearanceSettings from '@/components/settings/AppearanceSettings';
import { Store, Monitor } from 'lucide-react';

const Settings = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-8 space-y-8">
        {/* Page Header */}
        <div className="bg-white rounded-3xl shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your shop settings and preferences</p>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="store" className="w-full">
          {/* Segmented Control Tabs */}
          <TabsList className="inline-flex bg-gray-100 rounded-full p-1 border border-gray-200 h-auto">
            <TabsTrigger 
              value="store" 
              className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-700 hover:bg-gray-200"
            >
              <Store className="w-4 h-4" />
              Shop Info
            </TabsTrigger>
            <TabsTrigger 
              value="display" 
              className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-700 hover:bg-gray-200"
            >
              <Monitor className="w-4 h-4" />
              Display Settings
            </TabsTrigger>
          </TabsList>

          {/* Shop Info Tab Content */}
          <TabsContent value="store" className="mt-6">
            <Card className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="text-2xl font-semibold text-gray-900 mb-2">
                  Shop Information
                </CardTitle>
                <CardDescription className="text-sm text-gray-500">
                  Update your shop details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <ShopProfileSettings />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Display Settings Tab Content */}
          <TabsContent value="display" className="mt-6">
            <Card className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="text-2xl font-semibold text-gray-900 mb-2">
                  Display Settings
                </CardTitle>
                <CardDescription className="text-sm text-gray-500">
                  Customize the appearance and theme of your application
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <AppearanceSettings />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
