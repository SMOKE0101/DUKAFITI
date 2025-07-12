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
  defaultDebtLimit: number;
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

// Debounce function for theme changes
const debounce = <T extends (...args: any[]) => void>(func: T, delay: number): T => {
  let timeoutId: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  }) as T;
};

export const useSettings = () => {
  const [settings, setSettings] = useState<ShopSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const isInitialized = useRef(false);
  const themeChangeTimeoutRef = useRef<NodeJS.Timeout>();

  const settingsKey = user ? `dukafiti_settings_${user.id}` : 'dukafiti_settings_guest';

  // Debounced theme setter to prevent rapid changes
  const debouncedSetTheme = debounce((newTheme: 'light' | 'dark' | 'system') => {
    console.log('Setting theme via debounced function:', newTheme);
    setTheme(newTheme);
  }, 100);

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    try {
      console.log('Loading settings for user:', user?.id);
      
      if (user) {
        // Load from Supabase with improved query - get latest record only
        const { data, error } = await supabase
          .from('shop_settings')
          .select('settings_value, updated_at')
          .eq('user_id', user.id)
          .eq('settings_key', 'shop_settings')
          .order('updated_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error loading settings from Supabase:', error);
          throw error;
        }

        if (data && data.length > 0) {
          const latestRecord = data[0];
          console.log('Loaded settings from Supabase:', latestRecord);
          
          const savedSettings = latestRecord.settings_value as Partial<ShopSettings>;
          const settingsWithDefaults = { 
            ...defaultSettings, 
            ...savedSettings,
            theme: safeTheme(savedSettings.theme)
          };
          
          setSettings(settingsWithDefaults);
          
          // Only sync theme on true initialization (first load)
          if (!isInitialized.current) {
            const savedTheme = safeTheme(savedSettings.theme);
            console.log('Initializing theme from settings:', savedTheme, 'Current theme:', theme);
            
            // Only set theme if it's different and we have a valid saved theme
            if (savedTheme && theme !== savedTheme) {
              console.log('Setting theme on initialization:', savedTheme);
              debouncedSetTheme(savedTheme);
            }
            isInitialized.current = true;
          }
        } else {
          console.log('No settings found in Supabase, checking localStorage');
          // Fallback to localStorage
          await loadFromLocalStorage();
        }
      } else {
        // Guest mode - use localStorage only
        console.log('Guest mode - loading from localStorage');
        await loadFromLocalStorage();
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings. Using defaults.",
        variant: "destructive",
      });
      
      // Only sync theme on initialization
      if (!isInitialized.current) {
        if (theme !== 'light') {
          console.log('Setting default theme on error');
          debouncedSetTheme('light');
        }
        isInitialized.current = true;
      }
    } finally {
      setLoading(false);
    }
  };

  const loadFromLocalStorage = async () => {
    const stored = localStorage.getItem(settingsKey);
    if (stored) {
      const parsedSettings = JSON.parse(stored);
      const settingsWithDefaults = { 
        ...defaultSettings, 
        ...parsedSettings,
        theme: safeTheme(parsedSettings.theme)
      };
      setSettings(settingsWithDefaults);
      
      // Only sync theme on initialization
      if (!isInitialized.current) {
        const currentTheme = safeTheme(parsedSettings.theme);
        console.log('Loading theme from localStorage:', currentTheme);
        if (theme !== currentTheme) {
          debouncedSetTheme(currentTheme);
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
      
      if (!isInitialized.current) {
        if (theme !== 'light') {
          debouncedSetTheme('light');
        }
        isInitialized.current = true;
      }
    } else {
      // Pure defaults
      if (!isInitialized.current) {
        if (theme !== 'light') {
          debouncedSetTheme('light');
        }
        isInitialized.current = true;
      }
    }
  };

  const updateSettings = async (newSettings: Partial<ShopSettings>) => {
    try {
      console.log('Updating settings:', newSettings);
      
      const updatedSettings = { 
        ...settings, 
        ...newSettings,
        // Ensure theme is properly typed
        theme: newSettings.theme ? safeTheme(newSettings.theme) : settings.theme
      };
      
      // Update local state immediately
      setSettings(updatedSettings);
      
      // If theme is being updated, sync with ThemeProvider immediately
      if (newSettings.theme) {
        const safeNewTheme = safeTheme(newSettings.theme);
        console.log('Theme change requested:', safeNewTheme);
        
        // Clear any pending theme changes
        if (themeChangeTimeoutRef.current) {
          clearTimeout(themeChangeTimeoutRef.current);
        }
        
        // Set theme immediately for user changes (not during initialization)
        if (isInitialized.current) {
          setTheme(safeNewTheme);
        }
      }
      
      // Save to localStorage (always)
      localStorage.setItem(settingsKey, JSON.stringify(updatedSettings));
      
      // Save to Supabase if user is logged in using UPSERT
      if (user) {
        console.log('Saving settings to Supabase');
        
        const { error } = await supabase
          .from('shop_settings')
          .upsert({
            user_id: user.id,
            settings_key: 'shop_settings',
            settings_value: updatedSettings,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,settings_key'
          });

        if (error) {
          console.error('Error saving to Supabase:', error);
          throw error;
        }

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
      
      // Revert local state on error
      setSettings(settings);
      
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetSettings = async () => {
    console.log('Resetting settings to defaults');
    setSettings(defaultSettings);
    localStorage.removeItem(settingsKey);
    
    // Set theme to default
    debouncedSetTheme('light');
    
    if (user) {
      await supabase
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
