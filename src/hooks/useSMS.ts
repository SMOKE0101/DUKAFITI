import { useState, useEffect } from 'react';
import { useToast } from './use-toast';
import { useSettings } from './useSettings';
import { formatPhoneNumberForSMS } from '@/utils/smsReceiptUtils';

// Import Capacitor SMS plugin
let Sms: any = null;
let Capacitor: any = null;

// Try to import Capacitor plugins dynamically
try {
  if (typeof window !== 'undefined') {
    // @ts-ignore
    Sms = window.CapacitorPlugins?.Sms || null;
    // @ts-ignore
    Capacitor = window.Capacitor || null;
  }
} catch (error) {
  console.log('Capacitor plugins not available:', error);
}

interface SMSSendResult {
  success: boolean;
  message: string;
  queued?: boolean;
}

// Check if we're running in a Capacitor environment
const isCapacitor = () => {
  return typeof Capacitor !== 'undefined';
};

// Check if we're on Android
const isAndroid = () => {
  return isCapacitor() && Capacitor.getPlatform() === 'android';
};

export const useSMS = () => {
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isNativeSMSAvailable, setIsNativeSMSAvailable] = useState(false);
  const { toast } = useToast();
  const { settings, saveSettings } = useSettings();

  // Check if SMS API is supported and permissions status
  useEffect(() => {
    const checkSMSsupport = async () => {
      // Check if we're in a secure context (HTTPS or localhost)
      const isSecure = window.isSecureContext;
      
      // Check for Web SMS API
      const hasWebSMS = 'sms' in navigator;
      
      // Check for Capacitor SMS capabilities
      const hasCapacitorSMS = isCapacitor() && Sms !== null;
      
      setIsSupported(isSecure && (hasWebSMS || hasCapacitorSMS));
      setIsNativeSMSAvailable(hasCapacitorSMS);
      
      // Check current permission status for Web SMS
      if (hasWebSMS && 'permissions' in navigator) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'sms' as any });
          setHasPermissions(permissionStatus.state === 'granted');
        } catch (error) {
          console.log('SMS permission check failed:', error);
        }
      }
      
      // For Capacitor platforms, assume permissions are handled by the native layer
      if (hasCapacitorSMS) {
        setHasPermissions(true);
      }
    };

    checkSMSsupport();
  }, []);

  // Request SMS permissions
  const requestPermissions = async (): Promise<boolean> => {
    try {
      // For Capacitor platforms, permissions are handled by the native layer
      if (isNativeSMSAvailable) {
        setHasPermissions(true);
        return true;
      }
      
      // Try to request SMS permission for Web SMS API
      if ('permissions' in navigator && 'sms' in navigator) {
        // @ts-ignore - SMS API might not be fully typed
        const permissionStatus = await navigator.permissions.request({ name: 'sms' });
        const granted = permissionStatus.state === 'granted';
        setHasPermissions(granted);
        return granted;
      }
      
      // Fallback: show toast about manual permission
      toast({
        title: "Permission Required",
        description: "Please allow SMS permissions in your device settings to enable this feature.",
        variant: "destructive",
      });
      return false;
    } catch (error) {
      console.error('Error requesting SMS permissions:', error);
      toast({
        title: "Permission Error",
        description: "Unable to request SMS permissions. Please check your device settings.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Send SMS using Capacitor SMS plugin or service worker
  const sendSMS = async (phoneNumber: string, message: string): Promise<SMSSendResult> => {
    try {
      // Validate phone number
      if (!phoneNumber || phoneNumber.trim() === '') {
        return {
          success: false,
          message: "Customer phone number is required to send an SMS receipt."
        };
      }

      // Validate message
      if (!message || message.trim() === '') {
        return {
          success: false,
          message: "Message content is required."
        };
      }

      // Format phone number
      const formattedNumber = formatPhoneNumberForSMS(phoneNumber);

      // Check if SMS is supported
      if (!isSupported) {
        return {
          success: false,
          message: "SMS functionality is not supported on this device."
        };
      }

      // Check permissions
      if (!hasPermissions) {
        const granted = await requestPermissions();
        if (!granted) {
          return {
            success: false,
            message: "SMS permissions are required to send receipts."
          };
        }
      }

      // Use Capacitor SMS plugin if available
      if (isNativeSMSAvailable && Sms) {
        try {
          console.log('[SMS] Sending via Capacitor plugin to:', formattedNumber);
          await Sms.send({
            phoneNumber: formattedNumber,
            message: message
          });
          
          return {
            success: true,
            message: "SMS receipt sent successfully!"
          };
        } catch (error: any) {
          console.error('[SMS] Capacitor send failed:', error);
          // Fall back to service worker for offline queuing
        }
      }

      // Use service worker for offline support and queuing
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        return new Promise<SMSSendResult>((resolve) => {
          const messageChannel = new MessageChannel();
          messageChannel.port1.onmessage = (event) => {
            resolve(event.data);
          };
          
          navigator.serviceWorker.controller!.postMessage({
            type: 'SEND_SMS',
            data: {
              phoneNumber: formattedNumber,
              message: message
            }
          }, [messageChannel.port2]);
        });
      }

      // Fallback to Web SMS API
      if ('sms' in navigator) {
        // @ts-ignore - SMS API might not be fully typed
        await navigator.sms.send({
          recipients: [formattedNumber],
          text: message
        });
        
        return {
          success: true,
          message: "SMS receipt sent successfully!"
        };
      }

      return {
        success: false,
        message: "SMS functionality is not available on this device."
      };
    } catch (error: any) {
      console.error('Error sending SMS:', error);
      
      // Handle specific error cases
      if (error.name === 'NotAllowedError') {
        return {
          success: false,
          message: "SMS permissions were denied. Please enable permissions in your device settings."
        };
      } else if (error.name === 'TypeError') {
        return {
          success: false,
          message: "Invalid phone number or message format."
        };
      } else {
        return {
          success: false,
          message: `Failed to send SMS: ${error.message || 'Unknown error'}`
        };
      }
    }
  };

  // Enable SMS receipts with permission handling
  const enableSMSReceipts = async (): Promise<boolean> => {
    try {
      // First check if we're on a mobile device
      const isMobile = window.innerWidth < 768;
      if (!isMobile) {
        toast({
          title: "Mobile Only Feature",
          description: "SMS receipts can only be enabled on mobile devices.",
          variant: "destructive",
        });
        return false;
      }

      // Request permissions
      const granted = await requestPermissions();
      if (!granted) {
        toast({
          title: "Permission Required",
          description: "SMS permissions are required to enable this feature.",
          variant: "destructive",
        });
        return false;
      }

      // Save setting
      await saveSettings({ sendSmsReceipts: true });
      
      toast({
        title: "SMS Receipts Enabled",
        description: "You can now send SMS receipts to customers during checkout.",
      });
      
      return true;
    } catch (error) {
      console.error('Error enabling SMS receipts:', error);
      toast({
        title: "Error",
        description: "Failed to enable SMS receipts. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Disable SMS receipts
  const disableSMSReceipts = async (): Promise<void> => {
    try {
      await saveSettings({ sendSmsReceipts: false });
      
      toast({
        title: "SMS Receipts Disabled",
        description: "SMS receipt feature has been disabled.",
      });
    } catch (error) {
      console.error('Error disabling SMS receipts:', error);
      toast({
        title: "Error",
        description: "Failed to disable SMS receipts. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get pending SMS messages
  const getPendingSMS = async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      return new Promise<any>((resolve, reject) => {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data);
        };
        
        navigator.serviceWorker.controller!.postMessage({
          type: 'GET_PENDING_SMS'
        }, [messageChannel.port2]);
      });
    }
    return { success: false, error: 'Service worker not available' };
  };

  return {
    isSupported,
    hasPermissions,
    isNativeSMSAvailable,
    sendSMS,
    enableSMSReceipts,
    disableSMSReceipts,
    requestPermissions,
    getPendingSMS
  };
};
