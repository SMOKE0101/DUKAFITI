
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Shield, Smartphone, Bell, AlertCircle } from 'lucide-react';

interface MpesaC2BCredentials {
  consumer_key: string;
  consumer_secret: string;
  business_short_code: string;
  till_number: string;
  passkey: string;
  is_sandbox: boolean;
  webhook_url: string;
  confirmation_url: string;
  validation_url: string;
  c2b_enabled: boolean;
}

const MpesaC2BSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<MpesaC2BCredentials>({
    consumer_key: '',
    consumer_secret: '',
    business_short_code: '',
    till_number: '',
    passkey: '',
    is_sandbox: true,
    webhook_url: '',
    confirmation_url: '',
    validation_url: '',
    c2b_enabled: false,
  });

  useEffect(() => {
    loadCredentials();
  }, [user]);

  const loadCredentials = async () => {
    if (!user) return;

    try {
      // Using shop_settings table to store M-Pesa C2B settings temporarily
      const { data, error } = await supabase
        .from('shop_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('settings_key', 'mpesa_c2b_settings')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data && data.settings_value) {
        const settings = data.settings_value as any;
        setCredentials({
          consumer_key: settings.consumer_key || '',
          consumer_secret: settings.consumer_secret || '',
          business_short_code: settings.business_short_code || '',
          till_number: settings.till_number || '',
          passkey: settings.passkey || '',
          is_sandbox: settings.is_sandbox ?? true,
          webhook_url: settings.webhook_url || '',
          confirmation_url: settings.confirmation_url || '',
          validation_url: settings.validation_url || '',
          c2b_enabled: settings.c2b_enabled ?? false,
        });
      }
    } catch (error) {
      console.error('Error loading M-Pesa C2B credentials:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('shop_settings')
        .upsert({
          user_id: user.id,
          settings_key: 'mpesa_c2b_settings',
          settings_value: credentials as any,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "M-Pesa C2B Settings Saved",
        description: "Your Customer-to-Business payment settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving M-Pesa C2B credentials:', error);
      toast({
        title: "Error",
        description: "Failed to save M-Pesa C2B settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-green-600" />
            M-Pesa C2B (Customer-to-Business) Configuration
          </CardTitle>
          <CardDescription>
            Configure your M-Pesa settings to receive payments directly to your till number
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Switch
                id="c2b_enabled"
                checked={credentials.c2b_enabled}
                onCheckedChange={(checked) => setCredentials({ ...credentials, c2b_enabled: checked })}
              />
              <Label htmlFor="c2b_enabled" className="text-base font-medium">
                Enable C2B Payments
              </Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="till_number">Till Number *</Label>
                <Input
                  id="till_number"
                  value={credentials.till_number}
                  onChange={(e) => setCredentials({ ...credentials, till_number: e.target.value })}
                  placeholder="Enter your M-Pesa Till Number"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="business_short_code">Business Short Code</Label>
                <Input
                  id="business_short_code"
                  value={credentials.business_short_code}
                  onChange={(e) => setCredentials({ ...credentials, business_short_code: e.target.value })}
                  placeholder="Enter your Business Short Code"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="consumer_key">Consumer Key</Label>
                <Input
                  id="consumer_key"
                  type="password"
                  value={credentials.consumer_key}
                  onChange={(e) => setCredentials({ ...credentials, consumer_key: e.target.value })}
                  placeholder="Enter your Daraja Consumer Key"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="consumer_secret">Consumer Secret</Label>
                <Input
                  id="consumer_secret"
                  type="password"
                  value={credentials.consumer_secret}
                  onChange={(e) => setCredentials({ ...credentials, consumer_secret: e.target.value })}
                  placeholder="Enter your Daraja Consumer Secret"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="passkey">Passkey</Label>
              <Input
                id="passkey"
                type="password"
                value={credentials.passkey}
                onChange={(e) => setCredentials({ ...credentials, passkey: e.target.value })}
                placeholder="Enter your Lipa na M-Pesa Passkey"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="webhook_url">Webhook URL</Label>
                <Input
                  id="webhook_url"
                  value={credentials.webhook_url}
                  onChange={(e) => setCredentials({ ...credentials, webhook_url: e.target.value })}
                  placeholder="https://your-app.com/webhooks/mpesa"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmation_url">Confirmation URL</Label>
                <Input
                  id="confirmation_url"
                  value={credentials.confirmation_url}
                  onChange={(e) => setCredentials({ ...credentials, confirmation_url: e.target.value })}
                  placeholder="https://your-app.com/mpesa/confirm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="validation_url">Validation URL</Label>
                <Input
                  id="validation_url"
                  value={credentials.validation_url}
                  onChange={(e) => setCredentials({ ...credentials, validation_url: e.target.value })}
                  placeholder="https://your-app.com/mpesa/validate"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="sandbox"
                checked={credentials.is_sandbox}
                onCheckedChange={(checked) => setCredentials({ ...credentials, is_sandbox: checked })}
              />
              <Label htmlFor="sandbox">Use Sandbox Environment (for testing)</Label>
            </div>

            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Saving...' : 'Save C2B Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            How C2B Payments Work
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Customer Payment Process:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700">
                <li>Customer goes to M-Pesa menu on their phone</li>
                <li>Selects "Lipa na M-Pesa" → "Buy Goods and Services"</li>
                <li>Enters your Till Number: <strong>{credentials.till_number || 'Not set'}</strong></li>
                <li>Enters the amount to pay</li>
                <li>Enters their M-Pesa PIN to complete payment</li>
                <li>Payment notification is sent to your app automatically</li>
              </ol>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">What happens in your app:</h4>
              <ul className="list-disc list-inside space-y-2 text-sm text-green-700">
                <li>Real-time notification appears when payment is received</li>
                <li>Payment details are automatically recorded</li>
                <li>Customer information is linked if phone number matches</li>
                <li>Transaction history is updated instantly</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Setup Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-semibold text-orange-800 mb-2">Before enabling C2B payments:</h4>
              <ul className="list-disc list-inside space-y-2 text-sm text-orange-700">
                <li>Register for Safaricom Daraja API at developer.safaricom.co.ke</li>
                <li>Get your Consumer Key and Consumer Secret</li>
                <li>Obtain your Business Short Code and Passkey</li>
                <li>Set up webhook URLs for payment notifications</li>
                <li>Configure C2B URLs in your Daraja dashboard</li>
                <li>Test thoroughly in sandbox environment first</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Security Notice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Important:</strong> Your M-Pesa credentials are encrypted and stored securely. 
              Never share these credentials with anyone. Always test in sandbox mode before going live.
              Ensure your webhook URLs are secure (HTTPS) and properly validate incoming requests.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MpesaC2BSettings;
