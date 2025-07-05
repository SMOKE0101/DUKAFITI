
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Plug, Check, X, Settings } from 'lucide-react';

const IntegrationSettings = () => {
  const [apiSettings, setApiSettings] = useState({
    webhookUrl: '',
    smsApiKey: '',
    emailService: 'disabled',
  });

  const integrations = [
    {
      name: 'Supabase Database',
      status: 'connected',
      description: 'Data storage and authentication',
      type: 'database'
    },
    {
      name: 'M-Pesa API',
      status: 'disconnected',
      description: 'Mobile payment integration',
      type: 'payment'
    },
    {
      name: 'SMS Service',
      status: 'disabled',
      description: 'Customer notifications via SMS',
      type: 'communication'
    },
    {
      name: 'Email Service',
      status: 'disabled',
      description: 'Email notifications and receipts',
      type: 'communication'
    },
    {
      name: 'Backup Service',
      status: 'disabled',
      description: 'Automated data backups',
      type: 'utility'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800"><Check className="w-3 h-3 mr-1" />Connected</Badge>;
      case 'disconnected':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Disconnected</Badge>;
      default:
        return <Badge variant="secondary">Disabled</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Service Integrations</CardTitle>
          <CardDescription>
            Manage connections to external services and APIs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {integrations.map((integration) => (
              <div key={integration.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Plug className="h-5 w-5 text-gray-400" />
                  <div>
                    <h4 className="font-medium">{integration.name}</h4>
                    <p className="text-sm text-gray-500">{integration.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {getStatusBadge(integration.status)}
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-1" />
                    Configure
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>
            Configure API endpoints and authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhookUrl">Webhook URL</Label>
            <Input
              id="webhookUrl"
              value={apiSettings.webhookUrl}
              onChange={(e) => setApiSettings({ ...apiSettings, webhookUrl: e.target.value })}
              placeholder="https://your-webhook-url.com/endpoint"
            />
            <p className="text-sm text-gray-500">
              URL to receive real-time notifications about sales and transactions
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="smsApiKey">SMS API Key</Label>
            <Input
              id="smsApiKey"
              type="password"
              value={apiSettings.smsApiKey}
              onChange={(e) => setApiSettings({ ...apiSettings, smsApiKey: e.target.value })}
              placeholder="Enter your SMS service API key"
            />
            <p className="text-sm text-gray-500">
              API key for sending SMS notifications to customers
            </p>
          </div>

          <Button className="w-full md:w-auto">
            Save API Settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integration Status</CardTitle>
          <CardDescription>
            Real-time status of all integrated services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">1</div>
              <div className="text-sm text-gray-500">Active Connections</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">1</div>
              <div className="text-sm text-gray-500">Pending Setup</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-gray-600">3</div>
              <div className="text-sm text-gray-500">Available Services</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegrationSettings;
