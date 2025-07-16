
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
  const { theme, setTheme } = useTheme();
  const [themeInitialized, setThemeInitialized] = useState(false);

  // Load settings from cache first, then network
  const loadSettings = async () => {
    if (!user) {
      setSettings(defaultSettings);
      setLoading(false);
      return;
    }

    try {
      // Try to load from IndexedDB first for instant loading
      const cachedSettings = await loadFromCache(user.id);
      if (cachedSettings) {
        setSettings(cachedSettings);
        setLoading(false);
        
        // Only set theme if not already initialized to prevent auto-change
        if (!themeInitialized && cachedSettings.theme) {
          setTheme(cachedSettings.theme);
          setThemeInitialized(true);
        }
      }

      // Load from Supabase in background
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('shop_name, location, business_type, sms_notifications_enabled')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error loading profile:', profileError);
        return;
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

      setSettings(loadedSettings);
      
      // Cache the settings for offline use
      await cacheSettings(user.id, loadedSettings);
      
      // Only update theme if explicitly different and not during initial load
      if (themeInitialized && loadedSettings.theme !== theme) {
        setTheme(loadedSettings.theme);
      } else if (!themeInitialized) {
        setTheme(loadedSettings.theme);
        setThemeInitialized(true);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      
      // Fallback to cached settings if network fails
      const cachedSettings = await loadFromCache(user.id);
      if (cachedSettings) {
        setSettings(cachedSettings);
      }
    } finally {
      setLoading(false);
    }
  };

  // Save settings with immediate cache update
  const saveSettings = async (newSettings: Partial<ShopSettings>) => {
    if (!user) return;

    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      // Update local state immediately for instant feedback
      setSettings(updatedSettings);
      
      // Cache immediately for offline access
      await cacheSettings(user.id, updatedSettings);

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
        // Only update theme if user explicitly changed it
        setTheme(updatedSettings.theme);
        setThemeInitialized(true);
        
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
      
      // Queue for offline sync if network fails
      await queueSettingsUpdate(user.id, newSettings);
      
      toast({
        title: "Settings Queued",
        description: "Settings saved locally and will sync when online.",
      });
    }
  };

  // Load settings on mount
  useEffect(() => {
    loadSettings();
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
    updateSettings: saveSettings,
    refreshSettings: loadSettings,
    exportSettings,
    importSettings,
    resetSettings,
  };
};

// Cache management functions
const loadFromCache = async (userId: string): Promise<ShopSettings | null> => {
  try {
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      const db = await openDB();
      const transaction = db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const result = await store.get(`settings_${userId}`);
      return result?.data || null;
    }
  } catch (error) {
    console.error('Error loading settings from cache:', error);
  }
  return null;
};

const cacheSettings = async (userId: string, settings: ShopSettings): Promise<void> => {
  try {
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      const db = await openDB();
      const transaction = db.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      await store.put({
        id: `settings_${userId}`,
        data: settings,
        timestamp: Date.now()
      });
    }
  } catch (error) {
    console.error('Error caching settings:', error);
  }
};

const queueSettingsUpdate = async (userId: string, settings: Partial<ShopSettings>): Promise<void> => {
  try {
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      const db = await openDB();
      const transaction = db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      await store.add({
        id: `settings_update_${Date.now()}`,
        type: 'settings_update',
        userId,
        data: settings,
        timestamp: Date.now()
      });
    }
  } catch (error) {
    console.error('Error queuing settings update:', error);
  }
};

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DukaSmartOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id' });
      }
    };
  });
};
