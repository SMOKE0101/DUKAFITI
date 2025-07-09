
import { useState, useEffect } from 'react';

interface TrialLimits {
  sales: number;
  products: number;
  customers: number;
}

interface TrialInfo {
  isTrialActive: boolean;
  daysRemaining: number;
  limits: TrialLimits;
  usage: TrialLimits;
  featuresUsed: TrialLimits;
  isExpired: boolean;
}

export const useTrialSystem = () => {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [trialInfo, setTrialInfo] = useState<TrialInfo>({
    isTrialActive: true,
    daysRemaining: 14,
    limits: {
      sales: 100,
      products: 50,
      customers: 25,
    },
    usage: {
      sales: 0,
      products: 0,
      customers: 0,
    },
    featuresUsed: {
      sales: 0,
      products: 0,
      customers: 0,
    },
    isExpired: false,
  });

  const checkFeatureAccess = (feature: keyof TrialLimits): boolean => {
    if (!trialInfo.isTrialActive) return true;
    return trialInfo.usage[feature] < trialInfo.limits[feature];
  };

  const updateFeatureUsage = (feature: keyof TrialLimits, increment: number = 1) => {
    setTrialInfo(prev => ({
      ...prev,
      usage: {
        ...prev.usage,
        [feature]: prev.usage[feature] + increment,
      },
      featuresUsed: {
        ...prev.featuresUsed,
        [feature]: prev.featuresUsed[feature] + increment,
      },
    }));
  };

  return {
    trialInfo,
    checkFeatureAccess,
    updateFeatureUsage,
    showUpgrade,
    setShowUpgrade,
  };
};
