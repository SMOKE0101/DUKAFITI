
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Zap, Crown } from 'lucide-react';
import { useTrialSystem } from '../../hooks/useTrialSystem';

interface FeatureLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: 'sales' | 'products' | 'customers';
  limit: number;
}

const FeatureLimitModal = ({ isOpen, onClose, feature, limit }: FeatureLimitModalProps) => {
  const { setShowUpgrade } = useTrialSystem();

  const featureLabels = {
    sales: 'Sales',
    products: 'Products', 
    customers: 'Customers'
  };

  const handleUpgrade = () => {
    onClose();
    setShowUpgrade(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            {featureLabels[feature]} Limit Reached
          </DialogTitle>
        </DialogHeader>

        <div className="text-center space-y-4">
          <p className="text-gray-600">
            You've reached your trial limit of <strong>{limit} {featureLabels[feature].toLowerCase()}</strong>.
            Upgrade to continue adding more.
          </p>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Crown className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-purple-600">Professional Plan</span>
            </div>
            <p className="text-sm text-gray-700">
              Get unlimited {featureLabels[feature].toLowerCase()} and access to all premium features
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleUpgrade}
              className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>Upgrade Now</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full"
            >
              Continue with Trial
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            30-day money-back guarantee • Cancel anytime
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeatureLimitModal;
