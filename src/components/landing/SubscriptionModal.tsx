
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Phone, Loader2, AlertCircle } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: {
    id: string;
    name: string;
    price: number;
    features: string[];
  } | null;
}

const SubscriptionModal = ({ isOpen, onClose, selectedPlan }: SubscriptionModalProps) => {
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(120);
  const [error, setError] = useState('');

  useEffect(() => {
    if (step === 2 && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, countdown]);

  const formatPhoneNumber = (phone: string) => {
    // Remove any non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Handle different formats
    if (cleaned.startsWith('0')) {
      return `254${cleaned.substring(1)}`;
    } else if (cleaned.startsWith('254')) {
      return cleaned;
    } else if (cleaned.length === 9) {
      return `254${cleaned}`;
    }
    
    return cleaned;
  };

  const validatePhoneNumber = (phone: string) => {
    const formatted = formatPhoneNumber(phone);
    return /^254[17]\d{8}$/.test(formatted);
  };

  const handlePayment = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid Kenyan phone number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: selectedPlan?.id,
          phoneNumber: formatPhoneNumber(phoneNumber),
          amount: selectedPlan?.price,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStep(2);
        setCountdown(120);
      } else {
        setError(result.message || 'Payment initiation failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = () => {
    setStep(3);
  };

  const resetModal = () => {
    setStep(1);
    setPhoneNumber('');
    setError('');
    setCountdown(120);
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!selectedPlan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={resetModal}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 text-white">
        
        {/* Step 1: Plan Confirmation & Phone Input */}
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                Confirm Your Subscription
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Plan Summary */}
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{selectedPlan.name} Plan</h3>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-400">
                        KSh {selectedPlan.price.toLocaleString()}
                      </div>
                      <div className="text-sm text-slate-400">/month</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {selectedPlan.features.slice(0, 3).map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-slate-300">{feature}</span>
                      </div>
                    ))}
                    {selectedPlan.features.length > 3 && (
                      <div className="text-sm text-slate-400">
                        +{selectedPlan.features.length - 3} more features
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Phone Input */}
              <div className="space-y-3">
                <Label htmlFor="phone" className="text-sm font-medium">
                  M-Pesa Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0712345678 or 254712345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>
                <p className="text-xs text-slate-400">
                  Enter your M-Pesa registered phone number
                </p>
                {error && (
                  <div className="flex items-center space-x-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={resetModal}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handlePayment}
                  disabled={isLoading || !phoneNumber}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Pay with M-Pesa'
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Step 2: STK Push Waiting */}
        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                Complete Payment
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 text-center">
              {/* M-Pesa Animation */}
              <div className="w-24 h-24 mx-auto bg-green-600 rounded-full flex items-center justify-center">
                <Phone className="w-12 h-12 text-white animate-pulse" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Payment Request Sent</h3>
                <p className="text-slate-300">
                  Check your phone ({formatPhoneNumber(phoneNumber)}) for M-Pesa payment request
                </p>
              </div>

              <Card className="bg-slate-800 border-slate-700 text-left">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3">Complete these steps:</h4>
                  <ol className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-center space-x-2">
                      <span className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center text-xs text-white">1</span>
                      <span>Enter your M-Pesa PIN</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-5 h-5 bg-slate-600 rounded-full flex items-center justify-center text-xs">2</span>
                      <span>Confirm the payment</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-5 h-5 bg-slate-600 rounded-full flex items-center justify-center text-xs">3</span>
                      <span>Wait for confirmation</span>
                    </li>
                  </ol>
                </CardContent>
              </Card>

              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                <div className="text-orange-400 font-medium">
                  Request expires in: {formatTime(countdown)}
                </div>
              </div>

              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={resetModal}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={handlePayment}
                  className="flex-1 text-blue-400 hover:bg-blue-400/10"
                >
                  Resend Request
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-center">
                Welcome to ShopSmart!
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 text-center">
              {/* Success Animation */}
              <div className="w-24 h-24 mx-auto bg-green-600 rounded-full flex items-center justify-center">
                <Check className="w-12 h-12 text-white" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-green-400">
                  Subscription Activated!
                </h3>
                <p className="text-slate-300">
                  Your ShopSmart {selectedPlan.name} subscription is now active
                </p>
              </div>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Plan:</span>
                    <span className="text-white font-medium">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amount:</span>
                    <span className="text-white font-medium">KSh {selectedPlan.price.toLocaleString()}/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Next billing:</span>
                    <span className="text-white font-medium">
                      {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Button 
                onClick={() => window.location.href = '/dashboard'}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-6 text-lg"
              >
                Start Using ShopSmart
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionModal;
