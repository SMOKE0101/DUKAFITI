
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ShopProfileSettings from '@/components/settings/ShopProfileSettings';
import AppearanceSettings from '@/components/settings/AppearanceSettings';
import MpesaC2BSettings from '@/components/settings/MpesaC2BSettings';
import { Settings as SettingsIcon, Store, Palette, Smartphone } from 'lucide-react';

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

        <Tabs defaultValue="store" className="space-y-6 w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
            <TabsTrigger value="store" className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              Store Info
            </TabsTrigger>
            <TabsTrigger value="display" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Display Settings
            </TabsTrigger>
            <TabsTrigger value="mpesa" className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              M-Pesa Integration
            </TabsTrigger>
          </TabsList>

          <div className="w-full bg-background">
            <TabsContent value="store" className="w-full">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="w-5 h-5" />
                    Store Information
                  </CardTitle>
                  <CardDescription>
                    Update your store details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ShopProfileSettings />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="display" className="w-full">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Display Settings
                  </CardTitle>
                  <CardDescription>
                    Customize the appearance and theme of your application
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AppearanceSettings />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mpesa" className="w-full">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5" />
                    M-Pesa Integration
                  </CardTitle>
                  <CardDescription>
                    Configure M-Pesa payment integration for your store
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
