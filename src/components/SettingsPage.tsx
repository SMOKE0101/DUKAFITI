
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Store, 
  User, 
  Bell, 
  Shield, 
  CreditCard, 
  Mail,
  Phone,
  MapPin,
  Building,
  Moon,
  Sun
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { PWAInstallButton } from '@/components/PWAInstallButton';
import { OfflineBanner } from '@/components/OfflineBanner';
import { OfflineDataManager } from '@/components/OfflineDataManager';

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  // Settings state
  const [shopSettings, setShopSettings] = useState({
    shopName: '',
    ownerName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    businessType: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    lowStockAlerts: true,
    salesReports: true
  });

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // Simulate save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Settings Saved",
        description: "Your settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <OfflineBanner />
      
      {/* Modern Top Bar */}
      <div className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center">
            <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="font-mono text-lg md:text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">
            SETTINGS
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <OfflineDataManager />
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="grid gap-6">
          {/* Display Mode Toggle */}
          <div className="border-2 border-purple-600 rounded-xl p-6 bg-transparent">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 border border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center">
                {theme === 'dark' ? (
                  <Moon className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                ) : (
                  <Sun className="w-3 h-3 text-purple-600" />
                )}
              </div>
              <h3 className="font-mono text-lg font-black uppercase tracking-wider text-gray-900 dark:text-white">
                DISPLAY MODE
              </h3>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="font-medium">Dark Mode</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">Switch between light and dark themes</p>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            </div>
          </div>

          {/* Shop Information */}
          <Card className="bg-transparent border-2 border-blue-600 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <Store className="h-5 w-5 text-blue-600" />
                Shop Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shopName">Shop Name</Label>
                  <Input
                    id="shopName"
                    placeholder="Enter shop name"
                    value={shopSettings.shopName}
                    onChange={(e) => setShopSettings(prev => ({ ...prev, shopName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Type</Label>
                  <Input
                    id="businessType"
                    placeholder="e.g., General Store, Electronics"
                    value={shopSettings.businessType}
                    onChange={(e) => setShopSettings(prev => ({ ...prev, businessType: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Shop Address</Label>
                <Input
                  id="address"
                  placeholder="Enter complete shop address"
                  value={shopSettings.address}
                  onChange={(e) => setShopSettings(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card className="bg-transparent border-2 border-green-600 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <User className="h-5 w-5 text-green-600" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Full Name</Label>
                  <Input
                    id="ownerName"
                    placeholder="Enter your full name"
                    value={shopSettings.ownerName}
                    onChange={(e) => setShopSettings(prev => ({ ...prev, ownerName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="Enter phone number"
                    value={shopSettings.phone}
                    onChange={(e) => setShopSettings(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={shopSettings.email}
                  onChange={(e) => setShopSettings(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* M-Pesa Integration - Production Ready */}
          <div className="border-2 border-gray-400 rounded-xl p-6 bg-gray-50/50 dark:bg-gray-800/50 opacity-60">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 border border-gray-400 rounded-full flex items-center justify-center">
                <CreditCard className="w-3 h-3 text-gray-400" />
              </div>
              <h3 className="font-mono text-lg font-black uppercase tracking-wider text-gray-600 dark:text-gray-400">
                M-PESA INTEGRATION
              </h3>
              <div className="ml-auto">
                <span className="px-3 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 rounded-full text-xs font-mono font-bold uppercase">
                  Production in Progress
                </span>
              </div>
            </div>
            
            <div className="space-y-4 text-gray-500 dark:text-gray-400">
              <p className="text-sm">
                M-Pesa C2B and B2C integrations are currently being finalized for production deployment.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-500">Business Short Code</Label>
                  <Input disabled placeholder="Will be configured in production" />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500">Till Number</Label>
                  <Input disabled placeholder="Will be configured in production" />
                </div>
              </div>
              <div className="text-xs bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <strong>Coming Soon:</strong> Automatic payment notifications, transaction reconciliation, and real-time payment confirmations.
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <Card className="bg-transparent border-2 border-orange-600 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <Bell className="h-5 w-5 text-orange-600" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Receive updates via email</p>
                </div>
                <Switch
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS Notifications</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Receive alerts via SMS</p>
                </div>
                <Switch
                  checked={notificationSettings.smsNotifications}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, smsNotifications: checked }))
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Low Stock Alerts</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Get notified when inventory is low</p>
                </div>
                <Switch
                  checked={notificationSettings.lowStockAlerts}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, lowStockAlerts: checked }))
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Daily Sales Reports</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Receive daily sales summaries</p>
                </div>
                <Switch
                  checked={notificationSettings.salesReports}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, salesReports: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Security & Privacy */}
          <Card className="bg-transparent border-2 border-red-600 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <Shield className="h-5 w-5 text-red-600" />
                Security & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Two-Factor Authentication
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Download Data
              </Button>
              <Separator />
              <Button variant="destructive" className="w-full">
                Delete Account
              </Button>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSaveSettings}
              disabled={isLoading}
              className="px-8 py-2 bg-transparent border-2 border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg font-mono text-sm font-bold uppercase"
            >
              {isLoading ? 'SAVING...' : 'SAVE CHANGES'}
            </Button>
          </div>
        </div>
      </div>
      
      <PWAInstallButton />
    </div>
  );
};

export default SettingsPage;
