
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
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-lg flex items-center justify-center">
              <SettingsIcon className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Settings</h1>
              <p className="text-sm md:text-base text-muted-foreground">Manage your shop settings and preferences</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="store" className="space-y-4 md:space-y-6 w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-2 h-auto p-1 bg-muted/50">
            <TabsTrigger 
              value="store" 
              className="flex items-center gap-2 py-3 px-4 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Store className="w-4 h-4" />
              <span className="hidden sm:inline">Store Info</span>
              <span className="sm:hidden">Store</span>
            </TabsTrigger>
            <TabsTrigger 
              value="display" 
              className="flex items-center gap-2 py-3 px-4 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Display Settings</span>
              <span className="sm:hidden">Display</span>
            </TabsTrigger>
            <TabsTrigger 
              value="mpesa" 
              className="flex items-center gap-2 py-3 px-4 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">M-Pesa Integration</span>
              <span className="sm:hidden">M-Pesa</span>
            </TabsTrigger>
          </TabsList>

          <div className="w-full bg-background">
            <TabsContent value="store" className="w-full mt-6">
              <Card className="border border-border/50 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Store className="w-5 h-5 text-primary" />
                    Store Information
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Update your store details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ShopProfileSettings />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="display" className="w-full mt-6">
              <Card className="border border-border/50 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Palette className="w-5 h-5 text-primary" />
                    Display Settings
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Customize the appearance and theme of your application
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AppearanceSettings />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mpesa" className="w-full mt-6">
              <Card className="border border-border/50 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Smartphone className="w-5 h-5 text-primary" />
                    M-Pesa Integration
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
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
