
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface ShopSettings {
  shopName: string;
  location: string;
  businessType: string;
  smsNotifications: boolean;
  emailNotifications: boolean;
  theme: 'light' | 'dark' | 'system';
  currency: string;
  lowStockThreshold: number;
  businessHours: {
    open: string;
    close: string;
  };
  receiptNumberFormat: string;
  defaultDebtLimit: number;
  paymentReminderDays: number;
  enablePenalty: boolean;
  penaltyRate: number;
  penaltyGraceDays: number;
  interestRate: number;
  mpesaTillNumber: string;
  lowStockAlerts: boolean;
  dailySummary: boolean;
  debtReminders: boolean;
  paymentNotifications: boolean;
  smsPhoneNumber: string;
  debtReminderMessage: string;
  paymentConfirmationMessage: string;
  lowStockMessage: string;
  contactPhone: string;
  shopAddress: string;
}

const defaultSettings: ShopSettings = {
  shopName: '',
  location: '',
  businessType: '',
  smsNotifications: false,
  emailNotifications: false,
  theme: 'system',
  currency: 'KES',
  lowStockThreshold: 10,
  businessHours: {
    open: '08:00',
    close: '18:00',
  },
  receiptNumberFormat: 'RCP-{number}',
  defaultDebtLimit: 10000,
  paymentReminderDays: 7,
  enablePenalty: false,
  penaltyRate: 5,
  penaltyGraceDays: 7,
  interestRate: 0,
  mpesaTillNumber: '',
  lowStockAlerts: true,
  dailySummary: false,
  debtReminders: true,
  paymentNotifications: true,
  smsPhoneNumber: '',
  debtReminderMessage: 'Dear {name}, you have an outstanding debt of KSh {amount}. Please settle by {date}.',
  paymentConfirmationMessage: 'Payment of KSh {amount} received. Thank you!',
  lowStockMessage: 'Low stock alert: {product} has only {quantity} items left.',
  contactPhone: '',
  shopAddress: '',
};

export const useSettings = () => {
  const [settings, setSettings] = useState<ShopSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { setTheme } = useTheme();
  const [hasInitialized, setHasInitialized] = useState(false);

  // Load settings from Supabase
  const loadSettings = async () => {
    if (!user) {
      setSettings(defaultSettings);
      setLoading(false);
      return;
    }

    try {
      // Load from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('shop_name, location, business_type, sms_notifications_enabled')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error loading profile:', profileError);
      }

      // Load theme from shop_settings table
      const { data: themeData, error: themeError } = await supabase
        .from('shop_settings')
        .select('settings_value')
        .eq('user_id', user.id)
        .eq('settings_key', 'theme')
        .maybeSingle();

      if (themeError) {
        console.error('Error loading theme:', themeError);
      }

      // Safely extract theme from settings_value
      let currentTheme = 'system';
      if (themeData?.settings_value && typeof themeData.settings_value === 'object') {
        const settingsObj = themeData.settings_value as { theme?: string };
        currentTheme = settingsObj.theme || 'system';
      }

      const loadedSettings: ShopSettings = {
        ...defaultSettings,
        shopName: profile?.shop_name || '',
        location: profile?.location || '',
        businessType: profile?.business_type || '',
        smsNotifications: profile?.sms_notifications_enabled || false,
        theme: currentTheme as 'light' | 'dark' | 'system',
      };

      console.log('Loading settings - theme from DB:', currentTheme, 'hasInitialized:', hasInitialized);
      setSettings(loadedSettings);
      
      // Only set theme on first initialization to prevent auto-switching
      if (!hasInitialized) {
        console.log('First initialization - setting theme to:', currentTheme);
        setTheme(currentTheme);
        setHasInitialized(true);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save settings to Supabase
  const saveSettings = async (newSettings: Partial<ShopSettings>) => {
    if (!user) return;

    try {
      const updatedSettings = { ...settings, ...newSettings };
      console.log('Saving settings:', newSettings);
      
      // Update local state first
      setSettings(updatedSettings);

      // Update profile data
      if (newSettings.shopName !== undefined || 
          newSettings.location !== undefined || 
          newSettings.businessType !== undefined ||
          newSettings.smsNotifications !== undefined) {
        
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            shop_name: updatedSettings.shopName,
            location: updatedSettings.location,
            business_type: updatedSettings.businessType,
            sms_notifications_enabled: updatedSettings.smsNotifications,
          })
          .eq('id', user.id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
          throw profileError;
        }
      }

      // Update theme setting - only set theme if explicitly requested
      if (newSettings.theme !== undefined && newSettings.theme !== settings.theme) {
        console.log('Theme change requested:', newSettings.theme, 'Previous:', settings.theme);
        
        // Save to database first
        const { error: themeError } = await supabase
          .from('shop_settings')
          .upsert({
            user_id: user.id,
            settings_key: 'theme',
            settings_value: { theme: updatedSettings.theme },
          }, {
            onConflict: 'user_id,settings_key'
          });

        if (themeError) {
          console.error('Error updating theme:', themeError);
          throw themeError;
        }

        // Only apply theme change after successful database save
        console.log('Applying theme change to:', updatedSettings.theme);
        setTheme(updatedSettings.theme);
      }

      toast({
        title: "Settings Updated",
        description: "Your settings have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      // Revert local state on error
      setSettings(settings);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Load settings on mount and when user changes
  useEffect(() => {
    if (user) {
      loadSettings();
    } else {
      setSettings(defaultSettings);
      setLoading(false);
      setHasInitialized(false);
    }
  }, [user]);

  // Legacy methods for backward compatibility
  const updateSettings = saveSettings;
  
  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `settings-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Settings Exported",
      description: "Your settings have been exported successfully.",
    });
  };

  const importSettings = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        saveSettings(importedSettings);
        toast({
          title: "Settings Imported",
          description: "Your settings have been imported successfully.",
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Failed to import settings. Please check the file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const resetSettings = () => {
    saveSettings(defaultSettings);
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to default values.",
    });
  };

  return {
    settings,
    loading,
    saveSettings,
    updateSettings,
    refreshSettings: loadSettings,
    exportSettings,
    importSettings,
    resetSettings,
  };
};
