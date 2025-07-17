import { supabase } from '../integrations/supabase/client';
import { offlineOrderManager } from './offlineOrderManager';

interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingRecord?: any;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  cleanData?: any;
}

export class SalesDeduplication {
  // Enhanced duplicate checking with multiple strategies
  static async checkForDuplicate(offlineId: string, alternativeChecks: any[] = []): Promise<DuplicateCheckResult> {
    try {
      console.log(`[SalesDeduplication] Checking for duplicate: ${offlineId}`);

      // Primary check: offline_id
      const { data: primaryCheck, error: primaryError } = await supabase
        .from('sales')
        .select('id, offline_id, timestamp, total_amount')
        .eq('offline_id', offlineId)
        .maybeSingle();

      if (primaryError && primaryError.code !== 'PGRST116') {
        console.error('[SalesDeduplication] Primary check error:', primaryError);
        return { isDuplicate: false };
      }

      if (primaryCheck) {
        console.log(`[SalesDeduplication] Found duplicate by offline_id: ${offlineId}`);
        return { isDuplicate: true, existingRecord: primaryCheck };
      }

      // Secondary checks for data that might have been synced without offline_id
      for (const altCheck of alternativeChecks) {
        const { data: altData } = await supabase
          .from('sales')
          .select('id, offline_id, timestamp, total_amount')
          .eq('user_id', altCheck.user_id)
          .eq('product_id', altCheck.product_id)
          .eq('quantity', altCheck.quantity)
          .eq('total_amount', altCheck.total_amount)
          .gte('timestamp', new Date(new Date(altCheck.timestamp).getTime() - 60000).toISOString()) // ±1 minute
          .lte('timestamp', new Date(new Date(altCheck.timestamp).getTime() + 60000).toISOString())
          .maybeSingle();

        if (altData) {
          console.log(`[SalesDeduplication] Found potential duplicate by data match`);
          return { isDuplicate: true, existingRecord: altData };
        }
      }

      return { isDuplicate: false };

    } catch (error) {
      console.error('[SalesDeduplication] Error checking duplicate:', error);
      return { isDuplicate: false };
    }
  }

  // Validate and clean order data before sync
  static validateOrderData(orderData: any): ValidationResult {
    const errors: string[] = [];
    
    // Required fields validation
    if (!orderData.user_id) errors.push('Missing user_id');
    if (!orderData.product_id) errors.push('Missing product_id');
    if (!orderData.product_name) errors.push('Missing product_name');
    if (!orderData.quantity || orderData.quantity <= 0) errors.push('Invalid quantity');
    if (!orderData.selling_price || orderData.selling_price < 0) errors.push('Invalid selling_price');
    if (!orderData.total_amount || orderData.total_amount < 0) errors.push('Invalid total_amount');
    if (!orderData.payment_method) errors.push('Missing payment_method');
    if (!orderData.offline_id) errors.push('Missing offline_id');

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // Clean and normalize data
    const cleanData = {
      user_id: orderData.user_id,
      product_id: orderData.product_id,
      product_name: String(orderData.product_name || 'Unknown Product'),
      quantity: Math.floor(Number(orderData.quantity)),
      selling_price: Number(orderData.selling_price),
      cost_price: Number(orderData.cost_price || 0),
      profit: (Number(orderData.selling_price) - Number(orderData.cost_price || 0)) * Math.floor(Number(orderData.quantity)),
      total_amount: Number(orderData.total_amount),
      payment_method: String(orderData.payment_method),
      customer_id: orderData.customer_id || null,
      customer_name: orderData.customer_name || null,
      timestamp: orderData.timestamp || new Date().toISOString(),
      offline_id: orderData.offline_id,
      synced: true
    };

    return { isValid: true, errors: [], cleanData };
  }

  // Comprehensive cleanup of duplicate records
  static async validateAndCleanup(): Promise<{ duplicatesRemoved: number; errors: string[] }> {
    try {
      console.log('[SalesDeduplication] Starting comprehensive cleanup...');

      const { data: allSales, error } = await supabase
        .from('sales')
        .select('*')
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('[SalesDeduplication] Error fetching sales for cleanup:', error);
        return { duplicatesRemoved: 0, errors: [error.message] };
      }

      if (!allSales || allSales.length === 0) {
        return { duplicatesRemoved: 0, errors: [] };
      }

      // Group by offline_id to find duplicates
      const groupedByOfflineId = new Map<string, any[]>();
      const noOfflineId: any[] = [];

      for (const sale of allSales) {
        if (sale.offline_id) {
          if (!groupedByOfflineId.has(sale.offline_id)) {
            groupedByOfflineId.set(sale.offline_id, []);
          }
          groupedByOfflineId.get(sale.offline_id)!.push(sale);
        } else {
          noOfflineId.push(sale);
        }
      }

      const toDelete: string[] = [];

      // Process groups with offline_id
      for (const [offlineId, sales] of groupedByOfflineId) {
        if (sales.length > 1) {
          console.log(`[SalesDeduplication] Found ${sales.length} duplicates for offline_id: ${offlineId}`);
          
          // Keep the first one (oldest timestamp), mark others for deletion
          const sorted = sales.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          for (let i = 1; i < sorted.length; i++) {
            toDelete.push(sorted[i].id);
          }
        }
      }

      // Process sales without offline_id (look for data-based duplicates)
      const dataBasedDuplicates = new Map<string, any[]>();
      
      for (const sale of noOfflineId) {
        const key = `${sale.user_id}_${sale.product_id}_${sale.quantity}_${sale.total_amount}_${new Date(sale.timestamp).toISOString().substring(0, 16)}`; // minute precision
        
        if (!dataBasedDuplicates.has(key)) {
          dataBasedDuplicates.set(key, []);
        }
        dataBasedDuplicates.get(key)!.push(sale);
      }

      for (const [key, sales] of dataBasedDuplicates) {
        if (sales.length > 1) {
          console.log(`[SalesDeduplication] Found ${sales.length} data-based duplicates for key: ${key}`);
          
          // Keep the first one, mark others for deletion
          const sorted = sales.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          for (let i = 1; i < sorted.length; i++) {
            toDelete.push(sorted[i].id);
          }
        }
      }

      // Delete duplicates
      if (toDelete.length > 0) {
        console.log(`[SalesDeduplication] Deleting ${toDelete.length} duplicate records`);
        
        const { error: deleteError } = await supabase
          .from('sales')
          .delete()
          .in('id', toDelete);

        if (deleteError) {
          console.error('[SalesDeduplication] Error deleting duplicates:', deleteError);
          return { duplicatesRemoved: 0, errors: [deleteError.message] };
        }
      }

      console.log(`[SalesDeduplication] Cleanup completed: ${toDelete.length} duplicates removed`);
      return { duplicatesRemoved: toDelete.length, errors: [] };

    } catch (error) {
      console.error('[SalesDeduplication] Cleanup error:', error);
      return { duplicatesRemoved: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] };
    }
  }
}
