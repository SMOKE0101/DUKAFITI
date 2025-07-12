
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSettings } from '../../hooks/useSettings';
import { Smartphone, Shield, Info, Settings } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const MpesaC2BSettings = () => {
  const { settings, loading } = useSettings();

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6 opacity-60">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            M-Pesa Integration Status
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>This integration is coming soon</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-sm font-medium">Production in Progress</span>
              <Badge variant="secondary">Coming Soon</Badge>
            </div>
            <Button variant="outline" size="sm" disabled>
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Form - Disabled */}
      <div className="space-y-6 pointer-events-none">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              M-Pesa Setup (Production in progress)
            </CardTitle>
            <CardDescription>
              Configure your M-Pesa settings to accept mobile payments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Till Number */}
            <div className="space-y-2">
              <Label htmlFor="mpesaTillNumber" className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                M-Pesa Till Number
              </Label>
              <Input
                id="mpesaTillNumber"
                name="mpesaTillNumber"
                type="text"
                defaultValue={settings.mpesaTillNumber}
                placeholder="Enter your M-Pesa till number"
                disabled
              />
              <p className="text-sm text-gray-600">
                This is your M-Pesa business till number for receiving payments
              </p>
            </div>

            {/* Paybill Number */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                M-Pesa Paybill Number
              </Label>
              <Input
                type="text"
                placeholder="Enter your M-Pesa paybill number"
                disabled
              />
              <p className="text-sm text-gray-600">
                Alternative to till number for business accounts
              </p>
            </div>

            {/* Callback URL */}
            <div className="space-y-2">
              <Label>Callback URL</Label>
              <Input
                type="url"
                placeholder="https://yourdomain.com/mpesa/callback"
                disabled
              />
              <p className="text-sm text-gray-600">
                URL where M-Pesa will send payment confirmations
              </p>
            </div>

            {/* Auto-confirmation Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Auto-confirm Payments</Label>
                <p className="text-sm text-gray-600">
                  Automatically mark orders as paid when M-Pesa payment is received
                </p>
              </div>
              <Switch disabled defaultChecked={true} />
            </div>

            {/* SMS Notifications Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">SMS Notifications</Label>
                <p className="text-sm text-gray-600">
                  Send SMS confirmations for M-Pesa payments
                </p>
              </div>
              <Switch disabled defaultChecked={false} />
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Notice:</strong> Your M-Pesa credentials will be encrypted and stored securely. 
            We never store your M-Pesa PIN or sensitive authentication details.
          </AlertDescription>
        </Alert>

        {/* Integration Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Integration Steps</CardTitle>
            <CardDescription>
              Follow these steps to complete your M-Pesa integration (Coming Soon)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Get M-Pesa Till Number</h4>
                  <p className="text-sm text-gray-600">Register for M-Pesa business account and get your till number</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <h4 className="font-medium">Configure Settings</h4>
                  <p className="text-sm text-gray-600">Enter your till number and configure payment settings</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <h4 className="font-medium">Test Integration</h4>
                  <p className="text-sm text-gray-600">Test the connection and verify payments are working</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button - Disabled */}
        <div className="flex justify-end">
          <Button type="submit" className="px-8" disabled>
            Save M-Pesa Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MpesaC2BSettings;
