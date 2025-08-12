
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Shield, Smartphone } from 'lucide-react';

interface DarajaCredentials {
  consumer_key: string;
  consumer_secret: string;
  business_short_code: string;
  passkey: string;
  is_sandbox: boolean;
}

const DarajaSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<DarajaCredentials>({
    consumer_key: '',
    consumer_secret: '',
    business_short_code: '',
    passkey: '',
    is_sandbox: true,
  });

  useEffect(() => {
    loadCredentials();
  }, [user]);

  const loadCredentials = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('secure-daraja', {
        body: { action: 'get' }
      });

      if (error) {
        throw error;
      }

      if (data) {
        setCredentials({
          consumer_key: '', // not revealed; re-enter to change
          consumer_secret: '', // not revealed; re-enter to change
          business_short_code: data.business_short_code || '',
          passkey: '', // not revealed; re-enter to change
          is_sandbox: data.is_sandbox ?? true,
        });
      }
    } catch (error) {
      console.error('Error loading Daraja credentials:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const payload = {
        user_id: user.id,
        consumer_key: credentials.consumer_key || null,
        consumer_secret: credentials.consumer_secret || null,
        business_short_code: credentials.business_short_code || null,
        passkey: credentials.passkey || null,
        is_sandbox: credentials.is_sandbox,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.functions.invoke('secure-daraja', {
        body: { action: 'upsert', data: payload }
      });

      if (error) throw error;

      toast({
        title: "Daraja Settings Saved",
        description: "Your M-Pesa integration settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving Daraja credentials:', error);
      toast({
        title: "Error",
        description: "Failed to save Daraja settings. Please try again.",
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
            M-Pesa Daraja API Configuration
          </CardTitle>
          <CardDescription>
            Configure your Safaricom Daraja API credentials to enable M-Pesa payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business_short_code">Business Short Code</Label>
                <Input
                  id="business_short_code"
                  value={credentials.business_short_code}
                  onChange={(e) => setCredentials({ ...credentials, business_short_code: e.target.value })}
                  placeholder="Enter your Business Short Code"
                />
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
              {loading ? 'Saving...' : 'Save Daraja Settings'}
            </Button>
          </form>
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
              <strong>Important:</strong> Your Daraja API credentials are encrypted and stored securely. 
              Never share these credentials with anyone. If you suspect they've been compromised, 
              regenerate new credentials from your Safaricom Developer Portal immediately.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DarajaSettings;
