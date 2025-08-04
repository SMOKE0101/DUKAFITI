import { supabase } from '@/integrations/supabase/client';
import { Sale } from '../types';

export interface CreateSaleRequest {
  productId: string;
  productName: string;
  quantity: number;
  sellingPrice: number;
  costPrice: number;
  customerId?: string;
  customerName?: string;
  paymentMethod: 'cash' | 'mpesa' | 'debt' | 'partial';
  paymentDetails: {
    cashAmount: number;
    mpesaAmount: number;
    debtAmount: number;
    mpesaReference?: string;
    tillNumber?: string;
  };
}

// Helper function to safely parse payment details from Supabase
const parsePaymentDetails = (details: any) => {
  try {
    // If it's already an object, use it directly
    if (typeof details === 'object' && details !== null) {
      return {
        cashAmount: Number(details.cashAmount || 0),
        mpesaAmount: Number(details.mpesaAmount || 0),
        debtAmount: Number(details.debtAmount || 0),
        mpesaReference: details.mpesaReference || undefined,
        tillNumber: details.tillNumber || undefined,
      };
    }
    
    // If it's a string, try to parse it as JSON
    if (typeof details === 'string') {
      const parsed = JSON.parse(details);
      return {
        cashAmount: Number(parsed.cashAmount || 0),
        mpesaAmount: Number(parsed.mpesaAmount || 0),
        debtAmount: Number(parsed.debtAmount || 0),
        mpesaReference: parsed.mpesaReference || undefined,
        tillNumber: parsed.tillNumber || undefined,
      };
    }
    
    // Fallback to default values
    return {
      cashAmount: 0,
      mpesaAmount: 0,
      debtAmount: 0,
    };
  } catch (error) {
    console.error('[SalesService] Error parsing payment details:', error);
    return {
      cashAmount: 0,
      mpesaAmount: 0,
      debtAmount: 0,
    };
  }
};

export class SalesService {
  static async createSale(userId: string, saleData: CreateSaleRequest): Promise<Sale> {
    console.log('[SalesService] Creating sale:', saleData);

    try {
      // Validate input data
      if (!userId) {
        throw new Error('User ID is required');
      }

      if (!saleData.productId || !saleData.productName) {
        throw new Error('Product information is required');
      }

      if (saleData.quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }

      if (saleData.sellingPrice < 0 || saleData.costPrice < 0) {
        throw new Error('Prices cannot be negative');
      }

      const totalAmount = saleData.sellingPrice * saleData.quantity;
      const profit = (saleData.sellingPrice - saleData.costPrice) * saleData.quantity;

      // Create the sale record
      const saleRecord = {
        user_id: userId,
        product_id: saleData.productId,
        product_name: saleData.productName,
        quantity: saleData.quantity,
        selling_price: saleData.sellingPrice,
        cost_price: saleData.costPrice,
        profit: profit,
        total_amount: totalAmount,
        customer_id: saleData.customerId || null,
        customer_name: saleData.customerName || null,
        payment_method: saleData.paymentMethod,
        payment_details: saleData.paymentDetails,
        timestamp: new Date().toISOString(),
        synced: true,
      };

      console.log('[SalesService] Inserting sale record:', saleRecord);

      const { data, error } = await supabase
        .from('sales')
        .insert([saleRecord])
        .select()
        .single();

      if (error) {
        console.error('[SalesService] Database error:', error);
        throw new Error(`Failed to create sale: ${error.message}`);
      }

      if (!data) {
        throw new Error('Sale was created but no data returned');
      }

      console.log('[SalesService] Sale created successfully:', data);

      // Transform the response to match our Sale interface
      const sale: Sale = {
        id: data.id,
        productId: data.product_id,
        productName: data.product_name,
        quantity: data.quantity,
        sellingPrice: data.selling_price,
        costPrice: data.cost_price,
        profit: data.profit,
        timestamp: data.timestamp,
        synced: data.synced || true,
        customerId: data.customer_id,
        customerName: data.customer_name,
        paymentMethod: data.payment_method as 'cash' | 'mpesa' | 'debt' | 'partial',
        paymentDetails: parsePaymentDetails(data.payment_details),
        total: data.total_amount,
      };

      return sale;
    } catch (error) {
      console.error('[SalesService] Error creating sale:', error);
      throw error;
    }
  }

  static async updateProductStock(productId: string, quantitySold: number): Promise<void> {
    console.log('[SalesService] Updating product stock:', productId, quantitySold);

    try {
      // First get product details including variant information
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('current_stock, parent_id, variant_multiplier, stock_derivation_quantity')
        .eq('id', productId)
        .single();

      if (fetchError) {
        console.error('[SalesService] Error fetching product:', fetchError);
        // Don't throw here - stock update is not critical for sale completion
        return;
      }

      // Skip stock update for unspecified quantity products (current_stock = -1)
      if (product.current_stock === -1) {
        console.log('[SalesService] Skipping stock update for unspecified quantity product:', productId);
        return;
      }

      // If this is a variant (has parent_id), update parent stock instead
      if (product.parent_id) {
        console.log('[SalesService] Variant detected, updating parent stock:', product.parent_id);
        await this.updateParentStock(product.parent_id, quantitySold, product.variant_multiplier || 1);
        return;
      }

      // For regular products or parent products, update normally
      const newStock = Math.max(0, (product.current_stock || 0) - quantitySold);

      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          current_stock: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (updateError) {
        console.error('[SalesService] Error updating stock:', updateError);
        // Don't throw here - stock update is not critical for sale completion
      } else {
        console.log('[SalesService] Stock updated successfully:', newStock);
      }
    } catch (error) {
      console.error('[SalesService] Stock update failed:', error);
      // Don't throw here - stock update is not critical for sale completion
    }
  }

  static async updateParentStock(parentId: string, variantQuantitySold: number, variantMultiplier: number): Promise<void> {
    console.log('[SalesService] Updating parent stock:', { parentId, variantQuantitySold, variantMultiplier });

    try {
      // Get parent product details
      const { data: parentProduct, error: fetchError } = await supabase
        .from('products')
        .select('current_stock, stock_derivation_quantity')
        .eq('id', parentId)
        .single();

      if (fetchError) {
        console.error('[SalesService] Error fetching parent product:', fetchError);
        return;
      }

      // Skip stock update for unspecified quantity products
      if (parentProduct.current_stock === -1) {
        console.log('[SalesService] Skipping stock update for unspecified quantity parent product:', parentId);
        return;
      }

      // Calculate stock deduction: variant_quantity * variant_multiplier * stock_derivation_quantity
      const stockDerivationQty = parentProduct.stock_derivation_quantity || 1;
      const stockDeduction = variantQuantitySold * variantMultiplier * stockDerivationQty;
      const newStock = Math.max(0, (parentProduct.current_stock || 0) - stockDeduction);

      console.log('[SalesService] Parent stock calculation:', {
        currentStock: parentProduct.current_stock,
        variantQuantitySold,
        variantMultiplier,
        stockDerivationQty,
        stockDeduction,
        newStock
      });

      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          current_stock: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', parentId);

      if (updateError) {
        console.error('[SalesService] Error updating parent stock:', updateError);
      } else {
        console.log('[SalesService] Parent stock updated successfully:', newStock);
      }
    } catch (error) {
      console.error('[SalesService] Parent stock update failed:', error);
    }
  }

  static async updateCustomerDebt(customerId: string, debtAmount: number): Promise<void> {
    if (!customerId || debtAmount <= 0) return;

    console.log('[SalesService] Updating customer debt:', customerId, debtAmount);

    try {
      // Get current customer data
      const { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('outstanding_debt, total_purchases')
        .eq('id', customerId)
        .single();

      if (fetchError) {
        console.error('[SalesService] Error fetching customer:', fetchError);
        return;
      }

      const newDebt = (customer.outstanding_debt || 0) + debtAmount;
      const newTotalPurchases = (customer.total_purchases || 0) + debtAmount;

      const { error: updateError } = await supabase
        .from('customers')
        .update({
          outstanding_debt: newDebt,
          total_purchases: newTotalPurchases,
          last_purchase_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId);

      if (updateError) {
        console.error('[SalesService] Error updating customer:', updateError);
      } else {
        console.log('[SalesService] Customer debt updated successfully');
      }
    } catch (error) {
      console.error('[SalesService] Customer update failed:', error);
    }
  }
}
