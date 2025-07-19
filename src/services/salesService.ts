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
      
      // Re-throw with more specific error message
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Unknown error occurred while creating sale');
      }
    }
  }

  static async updateProductStock(productId: string, quantitySold: number): Promise<void> {
    console.log('[SalesService] Updating product stock:', productId, quantitySold);

    try {
      // First get current stock
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('current_stock')
        .eq('id', productId)
        .single();

      if (fetchError) {
        console.error('[SalesService] Error fetching product:', fetchError);
        // Don't throw here - stock update is not critical for sale completion
        return;
      }

      if (!product) {
        console.warn('[SalesService] Product not found:', productId);
        return;
      }

      const currentStock = product.current_stock || 0;
      const newStock = Math.max(0, currentStock - quantitySold);

      console.log('[SalesService] Updating stock from', currentStock, 'to', newStock);

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
        console.log('[SalesService] Stock updated successfully');
      }
    } catch (error) {
      console.error('[SalesService] Stock update failed:', error);
      // Don't throw here - stock update is not critical for sale completion
    }
  }

  static async updateCustomerDebt(customerId: string, debtAmount: number): Promise<void> {
    if (!customerId || debtAmount <= 0) {
      console.log('[SalesService] Skipping customer debt update - invalid parameters');
      return;
    }

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

      if (!customer) {
        console.warn('[SalesService] Customer not found:', customerId);
        return;
      }

      const newDebt = (customer.outstanding_debt || 0) + debtAmount;
      const newTotalPurchases = (customer.total_purchases || 0) + debtAmount;

      console.log('[SalesService] Updating customer debt from', customer.outstanding_debt, 'to', newDebt);

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

  // New method to handle offline sales
  static createOfflineSale(userId: string, saleData: CreateSaleRequest): Sale {
    console.log('[SalesService] Creating offline sale:', saleData);
    
    const totalAmount = saleData.sellingPrice * saleData.quantity;
    const profit = (saleData.sellingPrice - saleData.costPrice) * saleData.quantity;
    
    const offlineSale: Sale = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      productId: saleData.productId,
      productName: saleData.productName,
      quantity: saleData.quantity,
      sellingPrice: saleData.sellingPrice,
      costPrice: saleData.costPrice,
      profit: profit,
      timestamp: new Date().toISOString(),
      synced: false,
      customerId: saleData.customerId,
      customerName: saleData.customerName,
      paymentMethod: saleData.paymentMethod,
      paymentDetails: saleData.paymentDetails,
      total: totalAmount,
    };

    console.log('[SalesService] Created offline sale:', offlineSale);
    return offlineSale;
  }
}
