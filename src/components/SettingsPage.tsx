
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
  Building
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
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
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your shop and account preferences</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Shop Information */}
        <Card className="bg-white shadow-sm border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
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
        <Card className="bg-white shadow-sm border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
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

        {/* Notification Settings */}
        <Card className="bg-white shadow-sm border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Bell className="h-5 w-5 text-purple-600" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-gray-600">Receive updates via email</p>
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
                <p className="text-sm text-gray-600">Receive alerts via SMS</p>
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
                <p className="text-sm text-gray-600">Get notified when inventory is low</p>
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
                <p className="text-sm text-gray-600">Receive daily sales summaries</p>
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
        <Card className="bg-white shadow-sm border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Shield className="h-5 w-5 text-orange-600" />
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
            className="bg-blue-600 hover:bg-blue-700 px-8"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
