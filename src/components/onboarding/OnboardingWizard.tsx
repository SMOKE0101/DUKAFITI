
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Store, Package, Users, Target, ArrowRight, ArrowLeft } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ShopProfile {
  shopName: string;
  ownerName: string;
  phone: string;
  location: string;
  businessType: string;
  description: string;
  goals: string[];
}

const OnboardingWizard = ({ onComplete }: { onComplete: () => void }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<ShopProfile>({
    shopName: '',
    ownerName: '',
    phone: '',
    location: '',
    businessType: 'general',
    description: '',
    goals: [],
  });

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to DukaFiti!',
      description: 'Let\'s set up your shop for success',
      icon: Store,
    },
    {
      id: 'shop-details',
      title: 'Shop Information',
      description: 'Tell us about your business',
      icon: Package,
    },
    {
      id: 'goals',
      title: 'Your Goals',
      description: 'What do you want to achieve?',
      icon: Target,
    },
    {
      id: 'complete',
      title: 'All Set!',
      description: 'Your shop is ready to go',
      icon: CheckCircle,
    },
  ];

  const businessTypes = [
    { value: 'general', label: 'General Store' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'clothing', label: 'Clothing & Fashion' },
    { value: 'food', label: 'Food & Beverages' },
    { value: 'pharmacy', label: 'Pharmacy' },
    { value: 'hardware', label: 'Hardware Store' },
    { value: 'other', label: 'Other' },
  ];

  const goalOptions = [
    'Track sales and profits',
    'Manage inventory efficiently',
    'Handle customer debts',
    'Generate business reports',
    'Accept mobile payments',
    'Grow customer base',
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Save profile to Supabase profiles table
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          shop_name: profile.shopName,
          business_type: profile.businessType,
          location: profile.location,
          phone: profile.phone,
          email: user?.email
        });

      if (error) throw error;

      // Save onboarding completion flag to localStorage for UI state
      localStorage.setItem(`dts_onboarding_completed_${user?.id}`, 'true');
      
      toast({
        title: "Welcome to DukaFiti!",
        description: `${profile.shopName} is now set up and ready to use.`,
      });
      
      onComplete();
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast({
        title: "Setup Error",
        description: "Failed to save your profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderStepContent = () => {
    const step = steps[currentStep];
    const Icon = step.icon;

    switch (step.id) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
              <Icon className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-4">Welcome to DukaFiti!</h2>
              <p className="text-gray-600 text-lg">
                The complete shop management solution designed for Kenyan businesses.
                Let's get your shop set up in just a few minutes.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="p-4 bg-blue-50 rounded-lg">
                <Package className="w-8 h-8 text-blue-600 mb-2" />
                <h3 className="font-semibold">Inventory Management</h3>
                <p className="text-sm text-gray-600">Track products and stock levels</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <Users className="w-8 h-8 text-green-600 mb-2" />
                <h3 className="font-semibold">Customer Management</h3>
                <p className="text-sm text-gray-600">Manage customers and debts</p>
              </div>
            </div>
          </div>
        );

      case 'shop-details':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Tell us about your shop</h2>
              <p className="text-gray-600">This information helps us customize your experience</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shopName">Shop Name *</Label>
                <Input
                  id="shopName"
                  value={profile.shopName}
                  onChange={(e) => setProfile({ ...profile, shopName: e.target.value })}
                  placeholder="e.g., Mama Grace General Store"
                />
              </div>
              <div>
                <Label htmlFor="ownerName">Owner Name *</Label>
                <Input
                  id="ownerName"
                  value={profile.ownerName}
                  onChange={(e) => setProfile({ ...profile, ownerName: e.target.value })}
                  placeholder="Your full name"
                />
              </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="0712345678"
                  />
                </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  placeholder="e.g., Nairobi, Kibera"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="businessType">Business Type</Label>
              <select
                id="businessType"
                value={profile.businessType}
                onChange={(e) => setProfile({ ...profile, businessType: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {businessTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="description">Shop Description (Optional)</Label>
              <Textarea
                id="description"
                value={profile.description}
                onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                placeholder="Brief description of your business..."
                rows={3}
              />
            </div>
          </div>
        );

      case 'goals':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Icon className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">What are your goals?</h2>
              <p className="text-gray-600">Select what you want to achieve with DukaFiti</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {goalOptions.map((goal) => (
                <div
                  key={goal}
                  onClick={() => {
                    const newGoals = profile.goals.includes(goal)
                      ? profile.goals.filter(g => g !== goal)
                      : [...profile.goals, goal];
                    setProfile({ ...profile, goals: newGoals });
                  }}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    profile.goals.includes(goal)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      profile.goals.includes(goal)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {profile.goals.includes(goal) && (
                        <CheckCircle className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className="font-medium">{goal}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto">
              <Icon className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-4">🎉 All Set!</h2>
              <p className="text-gray-600 text-lg mb-6">
                {profile.shopName} is now ready to use DukaFiti!
              </p>
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-4">Your 14-Day Free Trial Includes:</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Up to 100 sales</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Up to 50 products</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Up to 25 customers</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (steps[currentStep].id) {
      case 'shop-details':
        return profile.shopName.trim() && profile.ownerName.trim();
      case 'goals':
        return profile.goals.length > 0;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index <= currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Step {currentStep + 1} of {steps.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          {currentStep === steps.length - 1 ? (
            <Button onClick={handleComplete} className="flex items-center space-x-2">
              <span>Complete Setup</span>
              <CheckCircle className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center space-x-2"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
