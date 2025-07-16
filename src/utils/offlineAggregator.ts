import { Sale } from '../types';

export interface AggregatedSaleData {
  product_id: string;
  product_name: string;
  user_id: string;
  total_quantity: number;
  selling_price: number;
  cost_price: number;
  total_profit: number;
  total_amount: number;
  payment_method: string;
  customer_id?: string;
  customer_name?: string;
  payment_details?: any;
  timestamp: string; // Latest timestamp
  original_operations: string[]; // IDs of original operations
}

export interface SyncQueueItem {
  id: string;
  type: 'sale' | 'product' | 'customer' | 'inventory';
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
  attempts: number;
  synced: boolean;
}

export class OfflineAggregator {
  
  /**
   * Aggregates sale operations by product_id and customer combination
   */
  static aggregateSaleOperations(operations: SyncQueueItem[]): {
    aggregated: AggregatedSaleData[];
    nonSaleOperations: SyncQueueItem[];
  } {
    const saleOperations = operations.filter(op => 
      op.type === 'sale' && op.operation === 'create' && !op.synced
    );
    
    const nonSaleOperations = operations.filter(op => 
      !(op.type === 'sale' && op.operation === 'create') || op.synced
    );

    // Group sales by product_id + customer combination for more precise aggregation
    const saleGroups = new Map<string, SyncQueueItem[]>();
    
    saleOperations.forEach(operation => {
      const saleData = operation.data;
      const groupKey = `${saleData.product_id}_${saleData.customer_id || 'walk-in'}_${saleData.payment_method}`;
      
      if (!saleGroups.has(groupKey)) {
        saleGroups.set(groupKey, []);
      }
      saleGroups.get(groupKey)!.push(operation);
    });

    // Aggregate each group
    const aggregated: AggregatedSaleData[] = [];
    
    saleGroups.forEach((groupOperations, groupKey) => {
      if (groupOperations.length === 0) return;
      
      // Use the first operation as the base
      const baseOperation = groupOperations[0];
      const baseSale = baseOperation.data;
      
      // Calculate totals
      let totalQuantity = 0;
      let totalAmount = 0;
      let totalProfit = 0;
      let latestTimestamp = baseOperation.timestamp;
      const operationIds: string[] = [];
      
      groupOperations.forEach(op => {
        const sale = op.data;
        totalQuantity += sale.quantity || 0;
        totalAmount += sale.total_amount || 0;
        totalProfit += sale.profit || 0;
        operationIds.push(op.id);
        
        // Keep the latest timestamp
        if (new Date(op.timestamp) > new Date(latestTimestamp)) {
          latestTimestamp = op.timestamp;
        }
      });
      
      const aggregatedSale: AggregatedSaleData = {
        product_id: baseSale.product_id,
        product_name: baseSale.product_name,
        user_id: baseSale.user_id,
        total_quantity: totalQuantity,
        selling_price: baseSale.selling_price,
        cost_price: baseSale.cost_price,
        total_profit: totalProfit,
        total_amount: totalAmount,
        payment_method: baseSale.payment_method,
        customer_id: baseSale.customer_id,
        customer_name: baseSale.customer_name,
        payment_details: baseSale.payment_details || {},
        timestamp: latestTimestamp,
        original_operations: operationIds
      };
      
      aggregated.push(aggregatedSale);
    });

    return { aggregated, nonSaleOperations };
  }

  /**
   * Merges inventory operations for the same product
   */
  static aggregateInventoryOperations(operations: SyncQueueItem[]): {
    aggregated: SyncQueueItem[];
    processed: string[];
  } {
    const inventoryOps = operations.filter(op => 
      op.type === 'inventory' && op.operation === 'update' && !op.synced
    );
    
    if (inventoryOps.length === 0) {
      return { aggregated: [], processed: [] };
    }
    
    // Group by product_id
    const inventoryGroups = new Map<string, SyncQueueItem[]>();
    
    inventoryOps.forEach(operation => {
      const productId = operation.data.productId;
      if (!inventoryGroups.has(productId)) {
        inventoryGroups.set(productId, []);
      }
      inventoryGroups.get(productId)!.push(operation);
    });
    
    const aggregated: SyncQueueItem[] = [];
    const processed: string[] = [];
    
    inventoryGroups.forEach((groupOps, productId) => {
      if (groupOps.length <= 1) {
        aggregated.push(...groupOps);
        processed.push(...groupOps.map(op => op.id));
        return;
      }
      
      // Aggregate quantity changes
      let totalQuantityChange = 0;
      let finalStock = 0;
      let latestTimestamp = groupOps[0].timestamp;
      
      groupOps.forEach(op => {
        totalQuantityChange += op.data.quantityChange || 0;
        finalStock = op.data.newStock || 0; // Use the latest stock value
        if (new Date(op.timestamp) > new Date(latestTimestamp)) {
          latestTimestamp = op.timestamp;
        }
        processed.push(op.id);
      });
      
      // Create aggregated operation
      const baseOp = groupOps[0];
      const aggregatedOp: SyncQueueItem = {
        ...baseOp,
        id: `aggregated_inventory_${productId}_${Date.now()}`,
        data: {
          ...baseOp.data,
          quantityChange: totalQuantityChange,
          newStock: finalStock
        },
        timestamp: latestTimestamp
      };
      
      aggregated.push(aggregatedOp);
    });
    
    return { aggregated, processed };
  }
}
