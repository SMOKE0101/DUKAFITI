
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Crown, Check, Zap, Shield, Smartphone, BarChart3, Users, Package } from 'lucide-react';
import { useTrialSystem } from '../../hooks/useTrialSystem';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UpgradeModal = ({ isOpen, onClose }: UpgradeModalProps) => {
  const { trialInfo } = useTrialSystem();

  const features = [
    { icon: Package, text: 'Unlimited Products & Sales' },
    { icon: Users, text: 'Unlimited Customers' },
    { icon: Smartphone, text: 'SMS Notifications' },
    { icon: Shield, text: 'Advanced Security' },
    { icon: BarChart3, text: 'Detailed Reports' },
    { icon: Zap, text: 'Offline Sync' },
  ];

  const handleUpgrade = () => {
    // For now, we'll show contact information
    // In the future, this would integrate with payment processing
    window.open('mailto:support@dukafiti.com?subject=Upgrade to DukaFiti Standard', '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Crown className="w-8 h-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Upgrade to DukaFiti Standard
          </DialogTitle>
        </DialogHeader>

        <div className="text-center space-y-6">
          {trialInfo && (
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-red-800 font-medium">
                {trialInfo.isExpired 
                  ? "Your trial has expired" 
                  : `${trialInfo.daysRemaining} days left in your trial`
                }
              </p>
              <p className="text-sm text-red-600 mt-1">
                Upgrade now to continue using all features without interruption
              </p>
            </div>
          )}

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-gray-900">KSh 200</div>
              <div className="text-sm text-gray-600">per month</div>
            </div>

            <div className="space-y-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <feature.icon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleUpgrade}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              size="lg"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade Now - KSh 200/month
            </Button>
            
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full"
            >
              Continue with Trial
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              ✓ 30-day money-back guarantee<br/>
              ✓ Cancel anytime<br/>
              ✓ 24/7 customer support
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
