
import { useState, useEffect, useCallback } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { Sale, Product, Customer } from '../types';

interface ReportsSnapshot {
  timestamp: string;
  sales: Sale[];
  products: Product[];
  customers: Customer[];
  metrics: {
    totalRevenue: number;
    totalOrders: number;
    activeCustomers: number;
    lowStockProducts: number;
  };
  chartData: any[];
}

export const useOfflineReports = () => {
  const { isOnline } = useNetworkStatus();
  const [cachedSnapshot, setCachedSnapshot] = useState<ReportsSnapshot | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isLoadingCache, setIsLoadingCache] = useState(true);

  // Load cached snapshot from localStorage
  const loadCachedSnapshot = useCallback(async () => {
    try {
      setIsLoadingCache(true);
      const cached = localStorage.getItem('reports_snapshot');
      if (cached) {
        const snapshot = JSON.parse(cached);
        setCachedSnapshot(snapshot);
        setLastSyncedAt(snapshot.timestamp);
        console.log('[OfflineReports] Loaded cached snapshot from:', snapshot.timestamp);
      }
    } catch (error) {
      console.error('[OfflineReports] Failed to load cached snapshot:', error);
    } finally {
      setIsLoadingCache(false);
    }
  }, []);

  // Cache reports snapshot with comprehensive metrics
  const cacheSnapshot = useCallback(async (
    sales: Sale[], 
    products: Product[], 
    customers: Customer[]
  ) => {
    try {
      // Calculate comprehensive metrics
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const todaySales = sales.filter(sale => {
        const saleDate = new Date(sale.timestamp);
        return saleDate >= todayStart;
      });

      const totalRevenue = todaySales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);
      const totalOrders = todaySales.length;
      
      const activeCustomers = new Set(
        todaySales.map(sale => sale.customerId).filter(id => id && id.trim() !== '')
      ).size;
      
      const lowStockProducts = products.filter(product => {
        const currentStock = Number(product.currentStock) || 0;
        const threshold = Number(product.lowStockThreshold) || 10;
        return currentStock >= 0 && currentStock <= threshold;
      }).length;

      // Generate chart data for the last 7 days
      const chartData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        
        const daySales = sales.filter(sale => {
          const saleDate = new Date(sale.timestamp);
          return saleDate >= dayStart && saleDate < dayEnd;
        });
        
        const dayRevenue = daySales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);
        
        chartData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: dayRevenue,
          orders: daySales.length
        });
      }
      
      const snapshot: ReportsSnapshot = {
        timestamp: new Date().toISOString(),
        sales,
        products,
        customers,
        metrics: {
          totalRevenue,
          totalOrders,
          activeCustomers,
          lowStockProducts
        },
        chartData
      };
      
      localStorage.setItem('reports_snapshot', JSON.stringify(snapshot));
      setCachedSnapshot(snapshot);
      setLastSyncedAt(snapshot.timestamp);
      console.log('[OfflineReports] Cached new snapshot at:', snapshot.timestamp);
    } catch (error) {
      console.error('[OfflineReports] Failed to cache snapshot:', error);
    }
  }, []);

  // Load cached data on mount
  useEffect(() => {
    loadCachedSnapshot();
  }, [loadCachedSnapshot]);

  return {
    isOnline,
    cachedSnapshot,
    lastSyncedAt,
    cacheSnapshot,
    isLoadingCache,
    readOnly: !isOnline
  };
};
