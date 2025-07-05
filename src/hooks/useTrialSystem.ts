
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface TrialInfo {
  isTrialActive: boolean;
  daysRemaining: number;
  trialStartDate: string;
  trialEndDate: string;
  isExpired: boolean;
  featuresUsed: {
    sales: number;
    products: number;
    customers: number;
  };
  limits: {
    sales: number;
    products: number;
    customers: number;
  };
}

export const useTrialSystem = () => {
  const { user } = useAuth();
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadTrialInfo();
    }
  }, [user]);

  const loadTrialInfo = async () => {
    if (!user) return;

    try {
      // Load trial info from Supabase profiles table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('trial_sales_used, trial_products_used, trial_customers_used, trial_start_date, trial_end_date, subscription_status')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const now = new Date();
      const endDate = new Date(profile.trial_end_date || now);
      const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      setTrialInfo({
        isTrialActive: profile.subscription_status === 'trial' && now <= endDate,
        daysRemaining,
        trialStartDate: profile.trial_start_date || new Date().toISOString(),
        trialEndDate: profile.trial_end_date || new Date().toISOString(),
        isExpired: now > endDate,
        featuresUsed: {
          sales: profile.trial_sales_used || 0,
          products: profile.trial_products_used || 0,
          customers: profile.trial_customers_used || 0,
        },
        limits: {
          sales: 1500, // Updated limit
          products: 250, // Updated limit
          customers: 50, // Updated limit
        },
      });
    } catch (error) {
      console.error('Failed to load trial info:', error);
      // Fallback to localStorage for existing users
      initializeFromLocalStorage();
    }
  };

  const initializeFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem(`dts_trial_${user?.id}`);
      
      if (stored) {
        const trialData = JSON.parse(stored);
        const now = new Date();
        const endDate = new Date(trialData.trialEndDate);
        
        const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        
        setTrialInfo({
          ...trialData,
          daysRemaining,
          isExpired: now > endDate,
          isTrialActive: now <= endDate,
          limits: {
            sales: 1500, // Updated limit
            products: 250, // Updated limit
            customers: 50, // Updated limit
          },
        });

        // Migrate to Supabase
        migrateToSupabase(trialData);
      } else {
        initializeTrial();
      }
    } catch (error) {
      console.error('Failed to load trial info:', error);
      initializeTrial();
    }
  };

  const initializeTrial = async () => {
    if (!user) return;

    const now = new Date();
    const trialEndDate = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000)); // 14 days

    const newTrial: TrialInfo = {
      isTrialActive: true,
      daysRemaining: 14,
      trialStartDate: now.toISOString(),
      trialEndDate: trialEndDate.toISOString(),
      isExpired: false,
      featuresUsed: { sales: 0, products: 0, customers: 0 },
      limits: { sales: 1500, products: 250, customers: 50 },
    };

    setTrialInfo(newTrial);

    // Update Supabase profile
    try {
      await supabase
        .from('profiles')
        .update({
          trial_start_date: now.toISOString(),
          trial_end_date: trialEndDate.toISOString(),
          trial_sales_used: 0,
          trial_products_used: 0,
          trial_customers_used: 0,
          subscription_status: 'trial'
        })
        .eq('id', user.id);
    } catch (error) {
      console.error('Failed to initialize trial in database:', error);
    }
  };

  const migrateToSupabase = async (localData: any) => {
    if (!user) return;

    try {
      await supabase
        .from('profiles')
        .update({
          trial_start_date: localData.trialStartDate,
          trial_end_date: localData.trialEndDate,
          trial_sales_used: localData.featuresUsed.sales || 0,
          trial_products_used: localData.featuresUsed.products || 0,
          trial_customers_used: localData.featuresUsed.customers || 0,
        })
        .eq('id', user.id);

      // Clear localStorage after migration
      localStorage.removeItem(`dts_trial_${user.id}`);
    } catch (error) {
      console.error('Failed to migrate trial data:', error);
    }
  };

  const updateFeatureUsage = async (feature: keyof TrialInfo['featuresUsed'], increment: number = 1) => {
    if (!trialInfo || !user) return false;

    const newUsage = trialInfo.featuresUsed[feature] + increment;
    const limit = trialInfo.limits[feature];

    if (newUsage > limit && trialInfo.isTrialActive) {
      // Show upgrade notification
      toast({
        title: "Trial Limit Reached",
        description: `You've reached your trial limit of ${limit} ${feature}. Upgrade to DukaFiti Standard for unlimited access.`,
        variant: "destructive",
      });
      setShowUpgrade(true);
      return false;
    }

    const updatedTrial = {
      ...trialInfo,
      featuresUsed: {
        ...trialInfo.featuresUsed,
        [feature]: newUsage,
      },
    };

    setTrialInfo(updatedTrial);

    // Update in Supabase
    try {
      const updateField = `trial_${feature}_used`;
      await supabase
        .from('profiles')
        .update({ [updateField]: newUsage })
        .eq('id', user.id);
    } catch (error) {
      console.error('Failed to update feature usage:', error);
    }

    return true;
  };

  const checkFeatureAccess = (feature: keyof TrialInfo['featuresUsed']): boolean => {
    if (!trialInfo) return false;
    if (trialInfo.isExpired) {
      toast({
        title: "Trial Expired",
        description: "Your 14-day trial has expired. Upgrade to DukaFiti Standard to continue using all features.",
        variant: "destructive",
      });
      setShowUpgrade(true);
      return false;
    }
    
    return trialInfo.featuresUsed[feature] < trialInfo.limits[feature];
  };

  const extendTrial = async (days: number) => {
    if (!trialInfo || !user) return;

    const newEndDate = new Date(new Date(trialInfo.trialEndDate).getTime() + (days * 24 * 60 * 60 * 1000));
    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((newEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    const updatedTrial = {
      ...trialInfo,
      trialEndDate: newEndDate.toISOString(),
      daysRemaining,
      isTrialActive: now <= newEndDate,
      isExpired: now > newEndDate,
    };

    setTrialInfo(updatedTrial);

    // Update in Supabase
    try {
      await supabase
        .from('profiles')
        .update({ trial_end_date: newEndDate.toISOString() })
        .eq('id', user.id);
    } catch (error) {
      console.error('Failed to extend trial:', error);
    }
  };

  return {
    trialInfo,
    updateFeatureUsage,
    checkFeatureAccess,
    extendTrial,
    showUpgrade,
    setShowUpgrade,
  };
};
