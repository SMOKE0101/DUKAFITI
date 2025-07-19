
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useNetworkStatus } from './useNetworkStatus';
import { useUnifiedOfflineManager } from './useUnifiedOfflineManager';
import { Customer } from '../types';

export const useCustomerOperations = () => {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isRecordingPayment, setIsRecordingPayment] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();
  const { addOfflineOperation } = useUnifiedOfflineManager();

  const deleteCustomer = async (customerId: string): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setIsDeleting(customerId);
    
    try {
      if (isOnline) {
        // Delete from database
        const { error } = await supabase
          .from('customers')
          .delete()
          .eq('id', customerId)
          .eq('user_id', user.id);

        if (error) {
          throw new Error(error.message);
        }

        toast({
          title: "Success",
          description: "Customer deleted successfully",
        });
      } else {
        // Queue for offline sync
        await addOfflineOperation('customer', 'delete', { id: customerId }, 'high');
        
        toast({
          title: "Offline Mode",
          description: "Customer will be deleted when connection is restored",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error('Failed to delete customer:', error);
      toast({
        title: "Error",
        description: "Failed to delete customer. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsDeleting(null);
    }
  };

  const recordPayment = async (
    customerId: string, 
    paymentAmount: number, 
    paymentMethod: string,
    notes?: string
  ): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setIsRecordingPayment(customerId);

    try {
      if (isOnline) {
        // First get current customer data
        const { data: customer, error: fetchError } = await supabase
          .from('customers')
          .select('outstanding_debt')
          .eq('id', customerId)
          .eq('user_id', user.id)
          .single();

        if (fetchError || !customer) {
          throw new Error('Customer not found');
        }

        const newOutstandingDebt = Math.max(0, customer.outstanding_debt - paymentAmount);

        // Update customer debt
        const { error: updateError } = await supabase
          .from('customers')
          .update({
            outstanding_debt: newOutstandingDebt,
            last_purchase_date: new Date().toISOString()
          })
          .eq('id', customerId)
          .eq('user_id', user.id);

        if (updateError) {
          throw new Error(updateError.message);
        }

        toast({
          title: "Payment Recorded",
          description: `Payment of KES ${paymentAmount.toLocaleString()} recorded successfully`,
        });
      } else {
        // Queue for offline sync
        await addOfflineOperation('customer', 'payment', {
          customerId,
          paymentAmount,
          paymentMethod,
          notes
        }, 'high');

        toast({
          title: "Offline Mode",
          description: "Payment will be recorded when connection is restored",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error('Failed to record payment:', error);
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsRecordingPayment(null);
    }
  };

  return {
    deleteCustomer,
    recordPayment,
    isDeleting,
    isRecordingPayment,
  };
};
