
export interface Sale {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  selling_price: number;
  cost_price: number;
  profit: number;
  total_amount: number;
  payment_method: string;
  customer_id?: string;
  customer_name?: string;
  payment_details?: any;
  timestamp: string;
  synced: boolean;
  created_at?: string;
}

export interface Product {
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

export interface Customer {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  credit_limit: number;
  outstanding_debt: number;
  total_purchases?: number;
  created_date: string;
  updated_at?: string;
  last_purchase_date?: string;
  risk_rating?: 'low' | 'medium' | 'high';
}

export interface Transaction {
  id: string;
  user_id: string;
  customer_id: string;
  item_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  notes?: string;
  date: string;
  paid: boolean;
  paid_date?: string;
  created_at?: string;
}

export interface SyncQueueItem {
  id: string;
  type: 'sale' | 'product' | 'customer' | 'transaction';
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
  attempts: number;
  synced: boolean;
}

export interface OfflineData {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  transactions: Transaction[];
  lastSync: string;
}

export interface SyncProgress {
  isOnline: boolean;
  isSyncing: boolean;
  queueLength: number;
  lastSyncTime?: string;
  syncError?: string;
}

export interface PWAInstallPrompt {
  canInstall: boolean;
  prompt: () => void;
  dismiss: () => void;
}

export interface NetworkStatus {
  isOnline: boolean;
  connectionType?: string;
  effectiveType?: string;
}
