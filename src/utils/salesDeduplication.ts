import { supabase } from '../integrations/supabase/client';

export class SalesDeduplication {
  
  /**
   * Check if a sale with the given offline_id already exists
   */
  static async checkDuplicateOfflineId(offlineId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('id')
        .eq('offline_id', offlineId)
        .maybeSingle();

      if (error) {
        console.error('[SalesDeduplication] Error checking duplicate:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('[SalesDeduplication] Error checking duplicate:', error);
      return false;
    }
  }

  /**
   * Get all sales with duplicate offline_ids for cleanup
   */
  static async findDuplicateSales(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('offline_id, COUNT(*) as count')
        .not('offline_id', 'is', null)
        .group('offline_id')
        .having('COUNT(*) > 1');

      if (error) {
        console.error('[SalesDeduplication] Error finding duplicates:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[SalesDeduplication] Error finding duplicates:', error);
      return [];
    }
  }

  /**
   * Remove duplicate sales, keeping only the first occurrence
   */
  static async removeDuplicateSales(): Promise<number> {
    try {
      // First, find all sales with duplicate offline_ids
      const { data: allSales, error: fetchError } = await supabase
        .from('sales')
        .select('id, offline_id, created_at')
        .not('offline_id', 'is', null)
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.error('[SalesDeduplication] Error fetching sales:', fetchError);
        return 0;
      }

      if (!allSales || allSales.length === 0) {
        return 0;
      }

      // Group by offline_id and identify duplicates
      const salesByOfflineId = new Map<string, any[]>();
      
      allSales.forEach(sale => {
        if (!salesByOfflineId.has(sale.offline_id)) {
          salesByOfflineId.set(sale.offline_id, []);
        }
        salesByOfflineId.get(sale.offline_id)!.push(sale);
      });

      let deletedCount = 0;
      
      // For each group with duplicates, keep the first and delete the rest
      for (const [offlineId, sales] of salesByOfflineId) {
        if (sales.length > 1) {
          console.log(`[SalesDeduplication] Found ${sales.length} duplicates for offline_id: ${offlineId}`);
          
          // Keep the first (oldest) sale, delete the rest
          const toDelete = sales.slice(1);
          const idsToDelete = toDelete.map(sale => sale.id);
          
          const { error: deleteError } = await supabase
            .from('sales')
            .delete()
            .in('id', idsToDelete);

          if (deleteError) {
            console.error(`[SalesDeduplication] Error deleting duplicates for ${offlineId}:`, deleteError);
          } else {
            deletedCount += idsToDelete.length;
            console.log(`[SalesDeduplication] Deleted ${idsToDelete.length} duplicates for ${offlineId}`);
          }
        }
      }

      console.log(`[SalesDeduplication] Total duplicates removed: ${deletedCount}`);
      return deletedCount;

    } catch (error) {
      console.error('[SalesDeduplication] Error removing duplicates:', error);
      return 0;
    }
  }

  /**
   * Validate and clean up the sales table
   */
  static async validateAndCleanup(): Promise<{
    duplicatesFound: number;
    duplicatesRemoved: number;
  }> {
    try {
      const duplicates = await this.findDuplicateSales();
      const duplicatesFound = duplicates.length;
      
      if (duplicatesFound > 0) {
        console.log(`[SalesDeduplication] Found ${duplicatesFound} sets of duplicate sales`);
        const duplicatesRemoved = await this.removeDuplicateSales();
        
        return {
          duplicatesFound,
          duplicatesRemoved
        };
      }

      return {
        duplicatesFound: 0,
        duplicatesRemoved: 0
      };

    } catch (error) {
      console.error('[SalesDeduplication] Error in validation and cleanup:', error);
      return {
        duplicatesFound: 0,
        duplicatesRemoved: 0
      };
    }
  }
}
