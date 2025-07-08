
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '../../hooks/use-toast';
import { useAuth } from '../../hooks/useAuth';
import { Globe, CheckCircle, XCircle, AlertTriangle, Copy, RefreshCw } from 'lucide-react';

interface WebhookStatus {
  id: string;
  url: string;
  status: 'active' | 'inactive' | 'error';
  last_ping: string;
  error_message?: string;
  total_requests: number;
  successful_requests: number;
}

const WebhookStatus = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus | null>(null);
  const [testUrl, setTestUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const generateWebhookUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/api/webhooks/mpesa/${user?.id}`;
  };

  useEffect(() => {
    if (user) {
      loadWebhookStatus();
    }
  }, [user]);

  const loadWebhookStatus = async () => {
    try {
      // TODO: Replace with actual webhook_status table when available
      // For now, using mock data
      const mockStatus: WebhookStatus = {
        id: '1',
        url: generateWebhookUrl(),
        status: 'active',
        last_ping: new Date().toISOString(),
        total_requests: 25,
        successful_requests: 23,
      };
      
      setWebhookStatus(mockStatus);
    } catch (error) {
      console.error('Error loading webhook status:', error);
    }
  };

  const testWebhook = async () => {
    if (!testUrl) {
      toast({
        title: "Error",
        description: "Please enter a webhook URL to test",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const testPayload = {
        TransactionType: "Pay Bill",
        TransID: "TEST123456789",
        TransTime: new Date().toISOString(),
        TransAmount: "100.00",
        BusinessShortCode: "123456",
        BillRefNumber: "TEST-REF",
        InvoiceNumber: "",
        OrgAccountBalance: "1000.00",
        ThirdPartyTransID: "",
        MSISDN: "254700000000",
        FirstName: "Test",
        MiddleName: "",
        LastName: "Customer"
      };

      const response = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      });

      if (response.ok) {
        toast({
          title: "Webhook Test Successful",
          description: "Test payload was sent successfully",
        });
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Webhook test failed:', error);
      toast({
        title: "Webhook Test Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyWebhookUrl = () => {
    const url = generateWebhookUrl();
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied to Clipboard",
      description: "Webhook URL has been copied to your clipboard",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </Badge>;
      case 'inactive':
        return <Badge variant="secondary">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Inactive
        </Badge>;
      case 'error':
        return <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Error
        </Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            Webhook Configuration
          </CardTitle>
          <CardDescription>
            Monitor and test your M-Pesa payment webhook endpoints
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Your Webhook URL</Label>
            <div className="flex items-center gap-2">
              <Input
                value={generateWebhookUrl()}
                readOnly
                className="font-mono text-sm"
              />
              <Button onClick={copyWebhookUrl} variant="outline" size="sm">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              Use this URL in your Safaricom Daraja dashboard for C2B callback
            </p>
          </div>

          {webhookStatus && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium">Webhook Status</span>
                {getStatusBadge(webhookStatus.status)}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Requests:</span>
                  <span className="ml-2 font-medium">{webhookStatus.total_requests}</span>
                </div>
                <div>
                  <span className="text-gray-600">Successful:</span>
                  <span className="ml-2 font-medium text-green-600">
                    {webhookStatus.successful_requests}
                  </span>
                </div>
              </div>

              {webhookStatus.error_message && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  <strong>Last Error:</strong> {webhookStatus.error_message}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Webhook</CardTitle>
          <CardDescription>
            Send a test M-Pesa notification to verify your webhook is working
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-url">Webhook URL to Test</Label>
            <Input
              id="test-url"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder={generateWebhookUrl()}
            />
          </div>
          
          <Button onClick={testWebhook} disabled={loading} className="w-full">
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Globe className="w-4 h-4 mr-2" />
            )}
            {loading ? 'Testing...' : 'Send Test Webhook'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebhookStatus;
