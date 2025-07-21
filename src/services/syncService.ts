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
      console.log('[SyncService] All operations synced successfully - dispatching events');
      // Dispatch sync events to notify components
      window.dispatchEvent(new CustomEvent('sync-completed'));
      window.dispatchEvent(new CustomEvent('data-synced'));
      console.log('[SyncService] Events dispatched: sync-completed, data-synced');
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
            name: data.name,
            category: data.category,
            cost_price: data.costPrice,
            selling_price: data.sellingPrice,
            current_stock: data.currentStock || 0,
            low_stock_threshold: data.lowStockThreshold || 10,
          }]);
        break;
      case 'update':
        const updateData: any = {};
        const updates = data.updates;
        
        if (updates.name !== undefined) updateData.name = updates.name;
        if (updates.category !== undefined) updateData.category = updates.category;
        if (updates.costPrice !== undefined) updateData.cost_price = updates.costPrice;
        if (updates.sellingPrice !== undefined) updateData.selling_price = updates.sellingPrice;
        if (updates.currentStock !== undefined) updateData.current_stock = updates.currentStock;
        if (updates.lowStockThreshold !== undefined) updateData.low_stock_threshold = updates.lowStockThreshold;
        if (updates.updatedAt !== undefined) updateData.updated_at = updates.updatedAt;
        
        await supabase
          .from('products')
          .update(updateData)
          .eq('id', data.id)
          .eq('user_id', userId);
        break;
      default:
        throw new Error(`Unsupported product operation: ${operation.operation}`);
    }
  }

  private static async syncCustomerOperation(operation: PendingOperation, userId: string): Promise<void> {
    const { data } = operation;
    console.log('[SyncService] Syncing customer operation:', operation.operation, data);
    
    switch (operation.operation) {
      case 'create':
        // Check if customer already exists to prevent duplicates
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', userId)
          .eq('name', data.name)
          .eq('phone', data.phone)
          .maybeSingle();

        if (existingCustomer) {
          console.log('[SyncService] Customer already exists, skipping creation:', data.name);
          return;
        }

        const createResult = await supabase
          .from('customers')
          .insert([{
            user_id: userId,
            name: data.name,
            phone: data.phone,
            email: data.email,
            address: data.address,
            total_purchases: data.totalPurchases || 0,
            outstanding_debt: data.outstandingDebt || 0,
            credit_limit: data.creditLimit || 1000,
            risk_rating: data.riskRating || 'low',
            last_purchase_date: data.lastPurchaseDate,
          }]);
          
        if (createResult.error) {
          throw new Error(`Customer create failed: ${createResult.error.message}`);
        }
        console.log('[SyncService] Customer created successfully');
        break;
        
      case 'update':
        console.log('[SyncService] Updating customer:', data.id, 'with updates:', data.updates);
        
        // First, verify the customer exists
        const { data: customerExists } = await supabase
          .from('customers')
          .select('id, outstanding_debt, total_purchases')
          .eq('id', data.id)
          .eq('user_id', userId)
          .maybeSingle();
          
        if (!customerExists) {
          console.error('[SyncService] Customer not found for update:', data.id);
          throw new Error(`Customer ${data.id} not found for update`);
        }
        
        console.log('[SyncService] Current customer data before update:', customerExists);
        
        const updateData: any = {};
        const updates = data.updates;
        
        if (updates.name !== undefined) updateData.name = updates.name;
        if (updates.phone !== undefined) updateData.phone = updates.phone;
        if (updates.email !== undefined) updateData.email = updates.email;
        if (updates.address !== undefined) updateData.address = updates.address;
        if (updates.totalPurchases !== undefined) updateData.total_purchases = updates.totalPurchases;
        if (updates.outstandingDebt !== undefined) updateData.outstanding_debt = updates.outstandingDebt;
        if (updates.creditLimit !== undefined) updateData.credit_limit = updates.creditLimit;
        if (updates.riskRating !== undefined) updateData.risk_rating = updates.riskRating;
        if (updates.lastPurchaseDate !== undefined) updateData.last_purchase_date = updates.lastPurchaseDate;
        
        console.log('[SyncService] Preparing to update customer with data:', updateData);
        
        const updateResult = await supabase
          .from('customers')
          .update(updateData)
          .eq('id', data.id)
          .eq('user_id', userId);
          
        if (updateResult.error) {
          throw new Error(`Customer update failed: ${updateResult.error.message}`);
        }
        
        console.log('[SyncService] Customer updated successfully in database');
        
        // Verify the update was applied
        const { data: updatedCustomer } = await supabase
          .from('customers')
          .select('id, outstanding_debt, total_purchases')
          .eq('id', data.id)
          .eq('user_id', userId)
          .maybeSingle();
          
        console.log('[SyncService] Customer data after update:', updatedCustomer);
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