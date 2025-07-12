
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ShopProfileSettings from '@/components/settings/ShopProfileSettings';
import BusinessConfigSettings from '@/components/settings/BusinessConfigSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import AppearanceSettings from '@/components/settings/AppearanceSettings';
import SecuritySettings from '@/components/settings/SecuritySettings';
import DataManagementSettings from '@/components/settings/DataManagementSettings';
import { Settings as SettingsIcon, Database } from 'lucide-react';

const Settings = () => {
  return (
    <div className="w-full min-h-screen bg-background p-6">
      <div className="w-full max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground">Manage your shop settings and preferences</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6 w-full">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:grid-cols-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          <div className="w-full bg-background">
            <TabsContent value="profile" className="w-full">
              <ShopProfileSettings />
            </TabsContent>

            <TabsContent value="business" className="w-full">
              <BusinessConfigSettings />
            </TabsContent>

            <TabsContent value="notifications" className="w-full">
              <NotificationSettings />
            </TabsContent>

            <TabsContent value="appearance" className="w-full">
              <AppearanceSettings />
            </TabsContent>

            <TabsContent value="security" className="w-full">
              <SecuritySettings />
            </TabsContent>

            <TabsContent value="data" className="w-full">
              <DataManagementSettings />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
