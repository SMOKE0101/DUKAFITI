
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '../../hooks/use-toast';

const OnboardingWizard = () => {
  const [step, setStep] = useState(1);
  const [shopName, setShopName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  const handleComplete = async () => {
    if (!user) return;
    
    try {
      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          shop_name: shopName,
          business_type: businessType,
          updated_at: new Date().toISOString()
        });
      
      toast({
        title: "Setup Complete!",
        description: "Welcome to DukaFiti. Let's start managing your shop!",
      });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: "Error",
        description: "Failed to complete setup. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Welcome to DukaFiti</CardTitle>
        <p className="text-sm text-gray-600">Let's set up your shop</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="shopName">Shop Name</Label>
          <Input
            id="shopName"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="Enter your shop name"
          />
        </div>
        <div>
          <Label htmlFor="businessType">Business Type</Label>
          <Input
            id="businessType"
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            placeholder="e.g., General Store, Electronics"
          />
        </div>
        <Button onClick={handleComplete} className="w-full">
          Complete Setup
        </Button>
      </CardContent>
    </Card>
  );
};

export default OnboardingWizard;
