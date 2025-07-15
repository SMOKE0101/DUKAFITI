
import { useState, useCallback } from 'react';
import { offlineDB } from '@/utils/indexedDB';
import { useToast } from './use-toast';

interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  stats?: Record<string, any>;
  timestamp: string;
}

export const useOfflineValidator = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidation, setLastValidation] = useState<ValidationResult | null>(null);
  const { toast } = useToast();

  const validateAndReport = useCallback(async () => {
    setIsValidating(true);
    
    try {
      console.log('[OfflineValidator] 🚀 Starting comprehensive validation...');
      
      const errors: string[] = [];
      const warnings: string[] = [];
      
      // 1. Test IndexedDB initialization
      try {
        await offlineDB.init();
        console.log('[OfflineValidator] ✅ IndexedDB initialization passed');
      } catch (error) {
        errors.push(`IndexedDB initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // 2. Test data storage and retrieval
      try {
        const testResult = await offlineDB.testOfflineCapabilities();
        if (!testResult.success) {
          errors.push(`Offline capabilities test failed: ${testResult.details.error}`);
        } else {
          console.log('[OfflineValidator] ✅ Offline capabilities test passed');
        }
      } catch (error) {
        errors.push(`Offline capabilities test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // 3. Test Service Worker
      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          if (!registration) {
            warnings.push('Service Worker not registered - offline caching may not work');
          } else {
            console.log('[OfflineValidator] ✅ Service Worker registered');
          }
        } else {
          errors.push('Service Worker not supported in this browser');
        }
      } catch (error) {
        warnings.push(`Service Worker check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // 4. Test network status detection
      try {
        const isOnline = navigator.onLine;
        console.log('[OfflineValidator] ✅ Network status detection working:', isOnline ? 'online' : 'offline');
      } catch (error) {
        warnings.push('Network status detection may not work properly');
      }
      
      // 5. Get storage statistics
      let stats = {};
      try {
        stats = await offlineDB.getDataStats();
        console.log('[OfflineValidator] ✅ Storage statistics retrieved:', stats);
      } catch (error) {
        warnings.push('Unable to retrieve storage statistics');
      }
      
      const result: ValidationResult = {
        success: errors.length === 0,
        errors,
        warnings,
        stats,
        timestamp: new Date().toISOString()
      };
      
      setLastValidation(result);
      
      // Show toast notification
      toast({
        title: result.success ? "✅ Validation Passed" : "❌ Validation Failed",
        description: result.success 
          ? "Offline functionality is working correctly"
          : `${result.errors.length} error(s) detected`,
        variant: result.success ? "default" : "destructive",
      });
      
      console.log('[OfflineValidator] 📊 Validation complete:', result);
      
    } catch (error) {
      console.error('[OfflineValidator] ❌ Validation failed:', error);
      
      const result: ValidationResult = {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown validation error'],
        warnings: [],
        timestamp: new Date().toISOString()
      };
      
      setLastValidation(result);
      
      toast({
        title: "Validation Error",
        description: "Failed to run validation tests",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  }, [toast]);

  return {
    isValidating,
    lastValidation,
    validateAndReport
  };
};
