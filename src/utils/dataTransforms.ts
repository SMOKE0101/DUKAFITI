
import { Product, Customer, Sale, Transaction } from '../types';

// Database types (snake_case from Supabase)
export interface DatabaseProduct {
  id: string;
  user_id: string;
  name: string;
  category: string;
  cost_price: number;
  selling_price: number;
  current_stock: number;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface DatabaseCustomer {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  credit_limit: number;
  outstanding_debt: number;
  total_purchases: number;
  last_purchase_date: string | null;
  risk_rating: 'low' | 'medium' | 'high';
  created_date: string;
  updated_at?: string;
}

export interface DatabaseSale {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  customer_id?: string;
  customer_name?: string;
  quantity: number;
  selling_price: number;
  cost_price: number;
  profit: number;
  total_amount: number;
  payment_method: 'cash' | 'mpesa' | 'debt' | 'partial';
  payment_details: any;
  timestamp: string;
  created_at: string;
  synced: boolean;
}

export interface DatabaseTransaction {
  id: string;
  user_id: string;
  customer_id: string;
  item_id?: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  notes?: string;
  date: string;
  paid: boolean;
  paid_date?: string;
  created_at: string;
}

// Transform functions: Database -> UI
export const transformDatabaseProduct = (dbProduct: DatabaseProduct): Product => ({
  id: dbProduct.id,
  name: dbProduct.name,
  category: dbProduct.category,
  costPrice: dbProduct.cost_price,
  sellingPrice: dbProduct.selling_price,
  currentStock: dbProduct.current_stock,
  lowStockThreshold: dbProduct.low_stock_threshold,
  createdAt: dbProduct.created_at,
  updatedAt: dbProduct.updated_at,
});

export const transformDatabaseCustomer = (dbCustomer: DatabaseCustomer): Customer => ({
  id: dbCustomer.id,
  name: dbCustomer.name,
  phone: dbCustomer.phone,
  email: dbCustomer.email,
  address: dbCustomer.address,
  creditLimit: dbCustomer.credit_limit,
  outstandingDebt: dbCustomer.outstanding_debt,
  totalPurchases: dbCustomer.total_purchases,
  lastPurchaseDate: dbCustomer.last_purchase_date,
  riskRating: dbCustomer.risk_rating,
  createdDate: dbCustomer.created_date,
});

export const transformDatabaseSale = (dbSale: DatabaseSale): Sale => ({
  id: dbSale.id,
  productId: dbSale.product_id,
  productName: dbSale.product_name,
  customerId: dbSale.customer_id,
  customerName: dbSale.customer_name,
  quantity: dbSale.quantity,
  sellingPrice: dbSale.selling_price,
  costPrice: dbSale.cost_price,
  profit: dbSale.profit,
  total: dbSale.total_amount,
  paymentMethod: dbSale.payment_method,
  paymentDetails: dbSale.payment_details,
  timestamp: dbSale.timestamp,
  synced: dbSale.synced,
});

export const transformDatabaseTransaction = (dbTransaction: DatabaseTransaction): Transaction => ({
  id: dbTransaction.id,
  customerId: dbTransaction.customer_id,
  itemId: dbTransaction.item_id || '',
  quantity: dbTransaction.quantity,
  unitPrice: dbTransaction.unit_price,
  totalAmount: dbTransaction.total_amount,
  notes: dbTransaction.notes || '',
  date: dbTransaction.date,
  paid: dbTransaction.paid,
  paidDate: dbTransaction.paid_date,
});

// Transform functions: UI -> Database
export const transformProductToDatabase = (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Omit<DatabaseProduct, 'id' | 'created_at' | 'updated_at'> => ({
  user_id: userId,
  name: product.name,
  category: product.category,
  cost_price: product.costPrice,
  selling_price: product.sellingPrice,
  current_stock: product.currentStock,
  low_stock_threshold: product.lowStockThreshold,
});

export const transformCustomerToDatabase = (customer: Omit<Customer, 'id' | 'createdDate'>, userId: string): Omit<DatabaseCustomer, 'id' | 'created_date' | 'updated_at'> => ({
  user_id: userId,
  name: customer.name,
  phone: customer.phone,
  email: customer.email,
  address: customer.address,
  credit_limit: customer.creditLimit,
  outstanding_debt: customer.outstandingDebt,
  total_purchases: customer.totalPurchases,
  last_purchase_date: customer.lastPurchaseDate,
  risk_rating: customer.riskRating,
});

export const transformSaleToDatabase = (sale: Omit<Sale, 'id' | 'timestamp' | 'synced'>, userId: string): Omit<DatabaseSale, 'id' | 'timestamp' | 'created_at'> => ({
  user_id: userId,
  product_id: sale.productId,
  product_name: sale.productName,
  customer_id: sale.customerId,
  customer_name: sale.customerName,
  quantity: sale.quantity,
  selling_price: sale.sellingPrice,
  cost_price: sale.costPrice,
  profit: sale.profit,
  total_amount: sale.total,
  payment_method: sale.paymentMethod,
  payment_details: sale.paymentDetails,
  synced: true,
});

export const transformTransactionToDatabase = (transaction: Omit<Transaction, 'id' | 'date' | 'paidDate'>, userId: string): Omit<DatabaseTransaction, 'id' | 'date' | 'paid_date' | 'created_at'> => ({
  user_id: userId,
  customer_id: transaction.customerId,
  item_id: transaction.itemId,
  quantity: transaction.quantity,
  unit_price: transaction.unitPrice,
  total_amount: transaction.totalAmount,
  notes: transaction.notes,
  paid: transaction.paid,
});

// Utility functions
export const ensureArray = <T>(data: T | T[] | null | undefined): T[] => {
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
};

export const validateProductData = (product: any): boolean => {
  return !!(
    product?.name?.trim() &&
    product?.category?.trim() &&
    typeof product?.costPrice === 'number' && product.costPrice >= 0 &&
    typeof product?.sellingPrice === 'number' && product.sellingPrice >= 0 &&
    typeof product?.currentStock === 'number' && product.currentStock >= 0
  );
};

export const validateCustomerData = (customer: any): boolean => {
  return !!(
    customer?.name?.trim() &&
    customer?.phone?.trim() &&
    typeof customer?.creditLimit === 'number' && customer.creditLimit >= 0
  );
};
