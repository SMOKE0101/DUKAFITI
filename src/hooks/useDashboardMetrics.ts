
import { useMemo } from 'react';
import { Sale, Product, Customer } from '../types';

interface DashboardMetrics {
  todaySales: {
    totalRevenue: number;
    totalProfit: number;
    orderCount: number;
    averageOrderValue: number;
  };
  customers: {
    total: number;
    active: number;
    withDebt: number;
    totalDebt: number;
  };
  products: {
    total: number;
    lowStock: number;
    outOfStock: number;
  };
}

export const useDashboardMetrics = (
  sales: Sale[],
  products: Product[],
  customers: Customer[]
): DashboardMetrics => {
  const metrics = useMemo(() => {
    console.log('[DashboardMetrics] Calculating metrics with data:', {
      salesCount: sales.length,
      productsCount: products.length,
      customersCount: customers.length
    });

    // Get today's date in the same timezone as the data
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    console.log('[DashboardMetrics] Today range:', {
      start: todayStart.toISOString(),
      end: todayEnd.toISOString()
    });

    // Filter today's sales with comprehensive date checking
    const todaySalesData = sales.filter(sale => {
      if (!sale.timestamp) {
        console.log('[DashboardMetrics] Sale missing timestamp:', sale.id);
        return false;
      }

      const saleDate = new Date(sale.timestamp);
      const isToday = saleDate >= todayStart && saleDate < todayEnd;
      
      if (isToday) {
        console.log('[DashboardMetrics] Today sale found:', {
          id: sale.id,
          timestamp: sale.timestamp,
          total: sale.total,
          productName: sale.productName
        });
      }

      return isToday;
    });

    console.log('[DashboardMetrics] Today sales filtered:', todaySalesData.length);

    // Calculate today's metrics
    const todayTotalRevenue = todaySalesData.reduce((sum, sale) => {
      const total = Number(sale.total) || 0;
      console.log('[DashboardMetrics] Adding sale total:', total);
      return sum + total;
    }, 0);

    // Filter out sales from products without both cost price and selling price for profit calculation
    const validProfitSales = todaySalesData.filter(sale => sale.costPrice > 0 && sale.sellingPrice > 0);
    const todayTotalProfit = validProfitSales.reduce((sum, sale) => {
      const profit = Number(sale.profit) || 0;
      return sum + profit;
    }, 0);

    const todayOrderCount = todaySalesData.length;
    const averageOrderValue = todayOrderCount > 0 ? todayTotalRevenue / todayOrderCount : 0;

    console.log('[DashboardMetrics] Today totals:', {
      revenue: todayTotalRevenue,
      profit: todayTotalProfit,
      orders: todayOrderCount,
      average: averageOrderValue
    });

    // Calculate customer metrics
    const activeCustomers = customers.filter(c => c.totalPurchases > 0).length;
    const customersWithDebt = customers.filter(c => c.outstandingDebt > 0);
    const totalOutstandingDebt = customersWithDebt.reduce((sum, c) => sum + c.outstandingDebt, 0);

    // Calculate product metrics
    const lowStockProducts = products.filter(p => {
      const currentStock = p.currentStock ?? 0;
      const threshold = p.lowStockThreshold ?? 10;
      return currentStock !== -1 && currentStock <= threshold && currentStock > 0;
    });

    const outOfStockProducts = products.filter(p => {
      const currentStock = p.currentStock ?? 0;
      return currentStock === 0;
    });

    const calculatedMetrics: DashboardMetrics = {
      todaySales: {
        totalRevenue: todayTotalRevenue,
        totalProfit: todayTotalProfit,
        orderCount: todayOrderCount,
        averageOrderValue: averageOrderValue,
      },
      customers: {
        total: customers.length,
        active: activeCustomers,
        withDebt: customersWithDebt.length,
        totalDebt: totalOutstandingDebt,
      },
      products: {
        total: products.length,
        lowStock: lowStockProducts.length,
        outOfStock: outOfStockProducts.length,
      },
    };

    console.log('[DashboardMetrics] Final calculated metrics:', calculatedMetrics);
    return calculatedMetrics;
  }, [sales, products, customers]);

  return metrics;
};
