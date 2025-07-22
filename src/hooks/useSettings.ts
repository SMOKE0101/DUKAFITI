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
  theme: 'light',
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
      console.log('No user found, using default settings');
      setSettings(defaultSettings);
      setLoading(false);
      return;
    }

    try {
      console.log('Loading settings for user:', user.id);
      
      // Load from profiles table - try with shop_address first, fallback without it
      let profile: any = null;
      let profileError: any = null;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('shop_name, location, business_type, sms_notifications_enabled, phone, email, shop_address')
          .eq('id', user.id)
          .single();
        
        profile = data;
        profileError = error;
      } catch (error: any) {
        if (error.message?.includes('shop_address')) {
          console.log('shop_address column not found, trying without it');
          const { data, error: fallbackError } = await supabase
            .from('profiles')
            .select('shop_name, location, business_type, sms_notifications_enabled, phone, email')
            .eq('id', user.id)
            .single();
          
          profile = data;
          profileError = fallbackError;
        } else {
          profileError = error;
        }
      }

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error loading profile:', profileError);
      }

      // Load theme and other settings from shop_settings table
      const { data: shopSettingsData, error: settingsError } = await supabase
        .from('shop_settings')
        .select('settings_key, settings_value')
        .eq('user_id', user.id);

      if (settingsError) {
        console.error('Error loading shop settings:', settingsError);
      }

      // Process shop settings
      let themeValue = 'light';
      let emailNotifications = false;
      let smsNotifications = false;
      
      if (shopSettingsData) {
        shopSettingsData.forEach(setting => {
          if (setting.settings_key === 'theme' && setting.settings_value) {
            const settingsObj = setting.settings_value as { theme?: string };
            themeValue = settingsObj.theme || 'light';
          } else if (setting.settings_key === 'notifications' && setting.settings_value) {
            const notifObj = setting.settings_value as { email?: boolean; sms?: boolean };
            emailNotifications = notifObj.email || false;
            smsNotifications = notifObj.sms || false;
          }
        });
      }

      const loadedSettings: ShopSettings = {
        ...defaultSettings,
        shopName: profile?.shop_name || '',
        location: profile?.location || '',
        businessType: profile?.business_type || '',
        contactPhone: profile?.phone || '',
        shopAddress: profile?.shop_address || '',
        smsNotifications: profile?.sms_notifications_enabled || smsNotifications,
        emailNotifications: emailNotifications,
        theme: themeValue as 'light' | 'dark' | 'system',
      };

      console.log('Loaded settings successfully:', loadedSettings);
      setSettings(loadedSettings);
      
      // Only set theme on first initialization
      if (!hasInitialized) {
        console.log('First initialization - setting theme to:', themeValue);
        setTheme(themeValue);
        setHasInitialized(true);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  // Save settings to Supabase
  const saveSettings = async (newSettings: Partial<ShopSettings>) => {
    if (!user) {
      console.log('No user found, cannot save settings');
      return;
    }

    try {
      const updatedSettings = { ...settings, ...newSettings };
      console.log('Saving settings:', newSettings, 'Updated settings:', updatedSettings);
      
      // Update profile data if any profile fields changed
      const profileFields = ['shopName', 'location', 'businessType', 'contactPhone', 'shopAddress', 'smsNotifications'];
      const hasProfileChanges = profileFields.some(field => newSettings[field as keyof ShopSettings] !== undefined);
      
      if (hasProfileChanges) {
        const profileUpdate: any = {};
        
        if (newSettings.shopName !== undefined) profileUpdate.shop_name = updatedSettings.shopName;
        if (newSettings.location !== undefined) profileUpdate.location = updatedSettings.location;
        if (newSettings.businessType !== undefined) profileUpdate.business_type = updatedSettings.businessType;
        if (newSettings.contactPhone !== undefined) profileUpdate.phone = updatedSettings.contactPhone;
        if (newSettings.smsNotifications !== undefined) profileUpdate.sms_notifications_enabled = updatedSettings.smsNotifications;
        
        // Handle shop_address separately with fallback
        if (newSettings.shopAddress !== undefined) {
          try {
            const updateWithAddress = { ...profileUpdate, shop_address: updatedSettings.shopAddress };
            const { error: addressError } = await supabase
              .from('profiles')
              .update(updateWithAddress)
              .eq('id', user.id);

            if (addressError && addressError.message?.includes('shop_address')) {
              console.log('shop_address column not found, updating without it');
              const { error: fallbackError } = await supabase
                .from('profiles')
                .update(profileUpdate)
                .eq('id', user.id);
              
              if (fallbackError) {
                throw fallbackError;
              }
            } else if (addressError) {
              throw addressError;
            }
          } catch (error) {
            console.error('Error updating profile with address:', error);
            throw error;
          }
        } else {
          // Update without shop_address
          const { error: profileError } = await supabase
            .from('profiles')
            .update(profileUpdate)
            .eq('id', user.id);

          if (profileError) {
            console.error('Error updating profile:', profileError);
            throw profileError;
          }
        }
      }

      // Update theme setting if changed
      if (newSettings.theme !== undefined && newSettings.theme !== settings.theme) {
        console.log('Theme change requested:', newSettings.theme, 'Previous:', settings.theme);
        
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

        // Apply theme change immediately
        console.log('Applying theme change to:', updatedSettings.theme);
        setTheme(updatedSettings.theme);
      }

      // Update notification settings if changed
      if (newSettings.emailNotifications !== undefined || newSettings.smsNotifications !== undefined) {
        const { error: notifError } = await supabase
          .from('shop_settings')
          .upsert({
            user_id: user.id,
            settings_key: 'notifications',
            settings_value: { 
              email: updatedSettings.emailNotifications,
              sms: updatedSettings.smsNotifications 
            },
          }, {
            onConflict: 'user_id,settings_key'
          });

        if (notifError) {
          console.error('Error updating notifications:', notifError);
          throw notifError;
        }
      }

      // Update local state after successful save
      setSettings(updatedSettings);

      toast({
        title: "Settings Updated",
        description: "Your settings have been saved successfully.",
      });
      
      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Load settings on mount and when user changes
  useEffect(() => {
    if (user) {
      console.log('User changed, loading settings for:', user.id);
      loadSettings();
    } else {
      console.log('No user, resetting to defaults');
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
