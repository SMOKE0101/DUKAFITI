import { useState, useEffect } from 'react';
import { useToast } from './use-toast';
import { useSettings } from './useSettings';

interface SMSSendResult {
  success: boolean;
  message: string;
}

export const useSMS = () => {
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const { toast } = useToast();
  const { settings, saveSettings } = useSettings();

  // Check if SMS API is supported and permissions status
  useEffect(() => {
    const checkSMSsupport = async () => {
      // Check if we're in a secure context (HTTPS or localhost)
      if (!window.isSecureContext) {
        setIsSupported(false);
        return;
      }

      // Check if SMS API is available
      if ('sms' in navigator) {
        setIsSupported(true);
        
        // Check current permission status
        try {
          if ('permissions' in navigator) {
            const permissionStatus = await navigator.permissions.query({ name: 'sms' as any });
            setHasPermissions(permissionStatus.state === 'granted');
          }
        } catch (error) {
          console.log('SMS permission check failed:', error);
        }
      } else {
        setIsSupported(false);
      }
    };

    checkSMSsupport();
  }, []);

  // Request SMS permissions
  const requestPermissions = async (): Promise<boolean> => {
    try {
      // Try to request SMS permission
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

  // Send SMS using Web SMS API
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

      // Check if SMS API is supported
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

      // Use Web SMS API if available
      if ('sms' in navigator) {
        // @ts-ignore - SMS API might not be fully typed
        await navigator.sms.send({
          recipients: [phoneNumber],
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

  return {
    isSupported,
    hasPermissions,
    sendSMS,
    enableSMSReceipts,
    disableSMSReceipts,
    requestPermissions
  };
};
