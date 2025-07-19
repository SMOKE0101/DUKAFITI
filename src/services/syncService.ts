import { supabase } from '@/integrations/supabase/client';

export interface PendingOperation {
  id: string;
  type: 'sale' | 'product' | 'customer' | 'transaction';
  operation: 'create' | 'update' | 'delete';
  data: any;
}

export class SyncService {
  static async syncPendingOperations(operations: PendingOperation[], userId: string): Promise<boolean> {
    if (!operations.length) return true;

    console.log(`[SyncService] Starting sync of ${operations.length} operations`);
    let allSuccess = true;

    for (const operation of operations) {
      try {
        console.log(`[SyncService] Syncing ${operation.type} ${operation.operation}:`, operation.id);
        
        switch (operation.type) {
          case 'sale':
            await this.syncSaleOperation(operation, userId);
            break;
          case 'product':
            await this.syncProductOperation(operation, userId);
            break;
          case 'customer':
            await this.syncCustomerOperation(operation, userId);
            break;
          case 'transaction':
            await this.syncTransactionOperation(operation, userId);
            break;
          default:
            console.warn('[SyncService] Unknown operation type:', operation.type);
        }
        
        console.log(`[SyncService] Successfully synced operation:`, operation.id);
      } catch (error) {
        console.error(`[SyncService] Failed to sync operation ${operation.id}:`, error);
        allSuccess = false;
      }
    }

    if (allSuccess) {
      console.log('[SyncService] All operations synced successfully');
      // Dispatch sync events to notify components
      window.dispatchEvent(new CustomEvent('sync-completed'));
      window.dispatchEvent(new CustomEvent('data-synced'));
    }

    return allSuccess;
  }

  private static async syncSaleOperation(operation: PendingOperation, userId: string): Promise<void> {
    const { data } = operation;
    
    switch (operation.operation) {
      case 'create':
        await supabase
          .from('sales')
          .insert([{
            user_id: userId,
            product_id: data.productId,
            product_name: data.productName,
            customer_id: data.customerId,
            customer_name: data.customerName,
            quantity: data.quantity,
            selling_price: data.sellingPrice,
            cost_price: data.costPrice,
            profit: data.profit,
            total_amount: data.total,
            payment_method: data.paymentMethod,
            payment_details: data.paymentDetails,
            timestamp: data.timestamp,
            synced: true,
          }]);
        break;
      default:
        throw new Error(`Unsupported sale operation: ${operation.operation}`);
    }
  }

  private static async syncProductOperation(operation: PendingOperation, userId: string): Promise<void> {
    const { data } = operation;
    
    switch (operation.operation) {
      case 'create':
        await supabase
          .from('products')
          .insert([{
            user_id: userId,
            ...data,
          }]);
        break;
      case 'update':
        await supabase
          .from('products')
          .update(data.updates)
          .eq('id', data.id)
          .eq('user_id', userId);
        break;
      default:
        throw new Error(`Unsupported product operation: ${operation.operation}`);
    }
  }

  private static async syncCustomerOperation(operation: PendingOperation, userId: string): Promise<void> {
    const { data } = operation;
    
    switch (operation.operation) {
      case 'create':
        await supabase
          .from('customers')
          .insert([{
            user_id: userId,
            ...data,
          }]);
        break;
      case 'update':
        await supabase
          .from('customers')
          .update(data.updates)
          .eq('id', data.id)
          .eq('user_id', userId);
        break;
      default:
        throw new Error(`Unsupported customer operation: ${operation.operation}`);
    }
  }

  private static async syncTransactionOperation(operation: PendingOperation, userId: string): Promise<void> {
    const { data } = operation;
    
    switch (operation.operation) {
      case 'create':
        await supabase
          .from('transactions')
          .insert([{
            user_id: userId,
            ...data,
          }]);
        break;
      case 'update':
        await supabase
          .from('transactions')
          .update(data.updates)
          .eq('id', data.id)
          .eq('user_id', userId);
        break;
      default:
        throw new Error(`Unsupported transaction operation: ${operation.operation}`);
    }
  }
}