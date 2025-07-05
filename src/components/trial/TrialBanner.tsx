
import { AlertTriangle, Crown, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTrialSystem } from '../../hooks/useTrialSystem';
import { Progress } from '@/components/ui/progress';

const TrialBanner = () => {
  const { trialInfo, setShowUpgrade } = useTrialSystem();

  if (!trialInfo) return null;

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100);
  };

  const isNearLimit = (used: number, limit: number) => {
    return (used / limit) > 0.8; // 80% threshold
  };

  if (trialInfo.isExpired) {
    return (
      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-lg shadow-lg border-l-4 border-red-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <h3 className="font-semibold">Trial Expired</h3>
              <p className="text-sm opacity-90">
                Your 14-day trial has ended. Upgrade to DukaFiti Standard to continue.
              </p>
            </div>
          </div>
          <Button 
            onClick={() => setShowUpgrade(true)}
            variant="secondary"
            className="bg-white text-red-600 hover:bg-gray-100"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade Now
          </Button>
        </div>
      </div>
    );
  }

  const showWarning = trialInfo.daysRemaining <= 3 || 
    isNearLimit(trialInfo.featuresUsed.sales, trialInfo.limits.sales) ||
    isNearLimit(trialInfo.featuresUsed.products, trialInfo.limits.products) ||
    isNearLimit(trialInfo.featuresUsed.customers, trialInfo.limits.customers);

  if (!showWarning && trialInfo.daysRemaining > 7) return null;

  return (
    <div className={`p-4 rounded-lg shadow-lg border-l-4 ${
      showWarning 
        ? 'bg-gradient-to-r from-orange-500 to-red-500 border-orange-700 text-white' 
        : 'bg-gradient-to-r from-blue-500 to-purple-600 border-blue-700 text-white'
    }`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Clock className="w-6 h-6" />
            <div>
              <h3 className="font-semibold">
                DukaFiti Trial - {trialInfo.daysRemaining} Days Left
              </h3>
              <p className="text-sm opacity-90">
                Upgrade to unlock unlimited features
              </p>
            </div>
          </div>
          <Button 
            onClick={() => setShowUpgrade(true)}
            variant="secondary"
            className="bg-white text-blue-600 hover:bg-gray-100"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade - KSh 200/month
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Sales</span>
              <span>{trialInfo.featuresUsed.sales}/{trialInfo.limits.sales}</span>
            </div>
            <Progress 
              value={getUsagePercentage(trialInfo.featuresUsed.sales, trialInfo.limits.sales)} 
              className="h-2 bg-white/20"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Products</span>
              <span>{trialInfo.featuresUsed.products}/{trialInfo.limits.products}</span>
            </div>
            <Progress 
              value={getUsagePercentage(trialInfo.featuresUsed.products, trialInfo.limits.products)} 
              className="h-2 bg-white/20"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Customers</span>
              <span>{trialInfo.featuresUsed.customers}/{trialInfo.limits.customers}</span>
            </div>
            <Progress 
              value={getUsagePercentage(trialInfo.featuresUsed.customers, trialInfo.limits.customers)} 
              className="h-2 bg-white/20"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialBanner;
