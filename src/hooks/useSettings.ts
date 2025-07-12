
import { useState, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useTheme } from 'next-themes';
import { supabase } from '@/integrations/supabase/client';

export interface ShopSettings {
  // Shop Profile
  shopName: string;
  shopDescription: string;
  shopAddress: string;
  contactPhone: string;
  contactEmail: string;
  businessRegistration: string;
  
  // Business Configuration
  currency: string;
  lowStockThreshold: number;
  businessHours: {
    open: string;
    close: string;
  };
  receiptNumberFormat: string;
  
  // Financial
  defaultPaymentMethods: string[];
  mpesaTillNumber: string;
  defaultDebtLimit: number; // Renamed from defaultCreditLimit
  interestRate: number;
  paymentReminderDays: number;
  enablePenalty: boolean;
  penaltyRate: number;
  penaltyGraceDays: number;
  
  // SMS & Notifications
  lowStockAlerts: boolean;
  dailySummary: boolean;
  debtReminders: boolean;
  paymentNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  smsPhoneNumber: string;
  debtReminderMessage: string;
  paymentConfirmationMessage: string;
  lowStockMessage: string;
  
  // Appearance
  theme: 'light' | 'dark' | 'system';
  currencyFormat: string;
  dateFormat: string;
  language: string;
  dashboardLayout: 'compact' | 'spacious';
}

const defaultSettings: ShopSettings = {
  shopName: '',
  shopDescription: '',
  shopAddress: '',
  contactPhone: '',
  contactEmail: '',
  businessRegistration: '',
  currency: 'KES',
  lowStockThreshold: 10,
  businessHours: { open: '08:00', close: '18:00' },
  receiptNumberFormat: 'RCP-{number}',
  defaultPaymentMethods: ['cash', 'mpesa'],
  mpesaTillNumber: '',
  defaultDebtLimit: 10000,
  interestRate: 0,
  paymentReminderDays: 7,
  enablePenalty: false,
  penaltyRate: 5,
  penaltyGraceDays: 7,
  lowStockAlerts: true,
  dailySummary: true,
  debtReminders: true,
  paymentNotifications: true,
  emailNotifications: false,
  smsNotifications: false,
  smsPhoneNumber: '',
  debtReminderMessage: 'Hello {customerName}, you have an outstanding debt of KSh {amount}. Please settle by {dueDate}. Thank you.',
  paymentConfirmationMessage: 'Thank you {customerName}! Payment of KSh {amount} received. Outstanding balance: KSh {balance}.',
  lowStockMessage: 'Alert: {productName} is running low. Current stock: {currentStock}',
  theme: 'light',
  currencyFormat: 'KSh {amount}',
  dateFormat: 'DD/MM/YYYY',
  language: 'en',
  dashboardLayout: 'compact',
};

// Type-safe theme casting function
const safeTheme = (theme: string | undefined): 'light' | 'dark' | 'system' => {
  if (theme === 'dark' || theme === 'light' || theme === 'system') return theme;
  return 'light';
};

export const useSettings = () => {
  const [settings, setSettings] = useState<ShopSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const isInitialized = useRef(false);

  const settingsKey = user ? `dukafiti_settings_${user.id}` : 'dukafiti_settings_guest';

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    try {
      if (user) {
        // Load from Supabase first
        const { data, error } = await supabase
          .from('shop_settings')
          .select('settings_value')
          .eq('user_id', user.id)
          .eq('settings_key', 'shop_settings')
          .single();

        if (data && data.settings_value) {
          const savedSettings = data.settings_value as Partial<ShopSettings>;
          const settingsWithDefaults = { 
            ...defaultSettings, 
            ...savedSettings,
            theme: safeTheme(savedSettings.theme)
          };
          setSettings(settingsWithDefaults);
          
          // Only sync theme on initial load
          if (!isInitialized.current) {
            const currentTheme = safeTheme(savedSettings.theme);
            if (theme !== currentTheme) {
              setTheme(currentTheme);
            }
            isInitialized.current = true;
          }
        } else {
          // Fallback to localStorage
          const stored = localStorage.getItem(settingsKey);
          if (stored) {
            const parsedSettings = JSON.parse(stored);
            const settingsWithDefaults = { 
              ...defaultSettings, 
              ...parsedSettings,
              theme: safeTheme(parsedSettings.theme)
            };
            setSettings(settingsWithDefaults);
            
            // Only sync theme on initial load
            if (!isInitialized.current) {
              const currentTheme = safeTheme(parsedSettings.theme);
              if (theme !== currentTheme) {
                setTheme(currentTheme);
              }
              isInitialized.current = true;
            }
          } else if (user?.user_metadata?.shop_name) {
            // Initialize with shop name from user metadata
            const initialSettings = {
              ...defaultSettings,
              shopName: user.user_metadata.shop_name,
              theme: 'light' as const
            };
            setSettings(initialSettings);
            
            // Only sync theme on initial load
            if (!isInitialized.current) {
              if (theme !== 'light') {
                setTheme('light');
              }
              isInitialized.current = true;
            }
          }
        }
      } else {
        // Guest mode - use localStorage only
        const stored = localStorage.getItem(settingsKey);
        if (stored) {
          const parsedSettings = JSON.parse(stored);
          const settingsWithDefaults = { 
            ...defaultSettings, 
            ...parsedSettings,
            theme: safeTheme(parsedSettings.theme)
          };
          setSettings(settingsWithDefaults);
          
          // Only sync theme on initial load
          if (!isInitialized.current) {
            const currentTheme = safeTheme(parsedSettings.theme);
            if (theme !== currentTheme) {
              setTheme(currentTheme);
            }
            isInitialized.current = true;
          }
        } else {
          // Only sync theme on initial load
          if (!isInitialized.current) {
            if (theme !== 'light') {
              setTheme('light');
            }
            isInitialized.current = true;
          }
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings. Using defaults.",
        variant: "destructive",
      });
      
      // Only sync theme on initial load
      if (!isInitialized.current) {
        if (theme !== 'light') {
          setTheme('light');
        }
        isInitialized.current = true;
      }
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<ShopSettings>) => {
    try {
      const updatedSettings = { 
        ...settings, 
        ...newSettings,
        // Ensure theme is properly typed
        theme: newSettings.theme ? safeTheme(newSettings.theme) : settings.theme
      };
      setSettings(updatedSettings);
      
      // If theme is being updated, sync with ThemeProvider immediately
      if (newSettings.theme) {
        const safeNewTheme = safeTheme(newSettings.theme);
        setTheme(safeNewTheme);
      }
      
      // Save to localStorage (always)
      localStorage.setItem(settingsKey, JSON.stringify(updatedSettings));
      
      // Save to Supabase if user is logged in
      if (user) {
        await supabase
          .from('shop_settings')
          .upsert({
            user_id: user.id,
            settings_key: 'shop_settings',
            settings_value: updatedSettings,
          });

        // Update user metadata if shop name changed
        if (newSettings.shopName) {
          await supabase.auth.updateUser({
            data: { shop_name: newSettings.shopName }
          });
        }
      }

      toast({
        title: "Settings Updated",
        description: "Your settings have been saved successfully.",
      });
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem(settingsKey);
    
    if (user) {
      supabase
        .from('shop_settings')
        .delete()
        .eq('user_id', user.id)
        .eq('settings_key', 'shop_settings');
    }
    
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to defaults.",
    });
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dukafiti-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        updateSettings(importedSettings);
        toast({
          title: "Settings Imported",
          description: "Settings have been imported successfully.",
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Invalid settings file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  return {
    settings,
    loading,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings,
  };
};
