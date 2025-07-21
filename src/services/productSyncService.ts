import { supabase } from '@/integrations/supabase/client';
import { PendingOperation } from './syncService';

export class ProductSyncService {
  static async syncProductOperations(operations: PendingOperation[], userId: string): Promise<boolean> {
    if (!operations.length) return true;

    console.log(`[ProductSyncService] Starting sync of ${operations.length} product operations`);
    
    // Deduplicate operations by keeping the latest for each product
    const deduplicatedOps = this.deduplicateOperations(operations);
    console.log(`[ProductSyncService] After deduplication: ${deduplicatedOps.length} operations`);

    let allSuccess = true;

    for (const operation of deduplicatedOps) {
      try {
        console.log(`[ProductSyncService] Syncing ${operation.operation}:`, operation.id);
        
        switch (operation.operation) {
          case 'create':
            await this.syncCreateOperation(operation, userId);
            break;
          case 'update':
            await this.syncUpdateOperation(operation, userId);
            break;
          case 'delete':
            await this.syncDeleteOperation(operation, userId);
            break;
          default:
            console.warn('[ProductSyncService] Unknown operation:', operation.operation);
        }
        
        console.log(`[ProductSyncService] Successfully synced operation:`, operation.id);
      } catch (error) {
        console.error(`[ProductSyncService] Failed to sync operation ${operation.id}:`, error);
        allSuccess = false;
      }
    }

    return allSuccess;
  }

  private static deduplicateOperations(operations: PendingOperation[]): PendingOperation[] {
    const operationMap = new Map<string, PendingOperation>();
    
    // Sort by timestamp to ensure we keep the latest operations
    const sortedOps = operations.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    for (const op of sortedOps) {
      const key = this.getOperationKey(op);
      
      // Only keep the operation if we haven't seen this key yet (latest wins)
      if (!operationMap.has(key)) {
        operationMap.set(key, op);
      }
    }

    return Array.from(operationMap.values());
  }

  private static getOperationKey(operation: PendingOperation): string {
    // For create operations, use name as key to prevent duplicate products with same name
    if (operation.operation === 'create') {
      return `create_${operation.data.name?.toLowerCase()}`;
    }
    
    // For update/delete operations, use the product ID
    if (operation.data.id) {
      return `${operation.operation}_${operation.data.id}`;
    }
    
    // Fallback to operation ID
    return operation.id;
  }

  private static async syncCreateOperation(operation: PendingOperation, userId: string): Promise<void> {
    const { data } = operation;
    
    // Check if product already exists to prevent duplicates
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id, name')
      .eq('name', data.name)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingProduct) {
      console.log('[ProductSyncService] Product already exists, skipping creation:', data.name);
      return;
    }

    const { error } = await supabase
      .from('products')
      .insert({
        name: data.name,
        category: data.category,
        cost_price: data.costPrice,
        selling_price: data.sellingPrice,
        current_stock: data.currentStock || 0,
        low_stock_threshold: data.lowStockThreshold || 10,
        user_id: userId,
      });

    if (error) {
      throw new Error(`Product create failed: ${error.message}`);
    }
  }

  private static async syncUpdateOperation(operation: PendingOperation, userId: string): Promise<void> {
    const { data } = operation;
    
    // Verify the product exists before updating
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('id', data.id)
      .eq('user_id', userId)
      .maybeSingle();
      
    if (!existingProduct) {
      console.warn('[ProductSyncService] Product not found for update:', data.id);
      return;
    }
    
    const updateData: any = {};
    const updates = data.updates;
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.costPrice !== undefined) updateData.cost_price = updates.costPrice;
    if (updates.sellingPrice !== undefined) updateData.selling_price = updates.sellingPrice;
    if (updates.currentStock !== undefined) updateData.current_stock = updates.currentStock;
    if (updates.lowStockThreshold !== undefined) updateData.low_stock_threshold = updates.lowStockThreshold;
    
    updateData.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', data.id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Product update failed: ${error.message}`);
    }
  }

  private static async syncDeleteOperation(operation: PendingOperation, userId: string): Promise<void> {
    const { data } = operation;
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', data.id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Product delete failed: ${error.message}`);
    }
  }
}
