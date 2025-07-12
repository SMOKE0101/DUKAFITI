
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
}

const defaultSettings: ShopSettings = {
  shopName: '',
  location: '',
  businessType: '',
  smsNotifications: false,
  emailNotifications: false,
  theme: 'system',
};

export const useSettings = () => {
  const [settings, setSettings] = useState<ShopSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [initialized, setInitialized] = useState(false);

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

      const currentTheme = themeData?.settings_value?.theme || 'system';

      const loadedSettings: ShopSettings = {
        shopName: profile?.shop_name || '',
        location: profile?.location || '',
        businessType: profile?.business_type || '',
        smsNotifications: profile?.sms_notifications_enabled || false,
        emailNotifications: false,
        theme: currentTheme,
      };

      setSettings(loadedSettings);
      
      // Only set theme if not initialized to prevent auto-switching
      if (!initialized) {
        setTheme(currentTheme);
        setInitialized(true);
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

      // Update theme setting
      if (newSettings.theme !== undefined) {
        setTheme(newSettings.theme);
        
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
      }

      toast({
        title: "Settings Updated",
        description: "Your settings have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [user]);

  return {
    settings,
    loading,
    saveSettings,
    refreshSettings: loadSettings,
  };
};
