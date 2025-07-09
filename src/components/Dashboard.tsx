
import { useState, useEffect } from 'react';
import { Customer, Transaction, Sale, Product } from '../types';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { useSupabaseSales } from '../hooks/useSupabaseSales';
import { useSupabaseTransactions } from '../hooks/useSupabaseTransactions';
import DashboardStats from './dashboard/DashboardStats';
import RecentActivity from './dashboard/RecentActivity';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalDebt: 0,
    customersWithDebt: 0,
    productCount: 0,
    todayTransactions: 0,
    todaySales: 0,
    todayRevenue: 0,
    todayProfit: 0,
    lowStockItems: 0,
  });

  // Use Supabase hooks
  const { customers } = useSupabaseCustomers();
  const { products } = useSupabaseProducts();
  const { sales } = useSupabaseSales();
  const { transactions } = useSupabaseTransactions();

  useEffect(() => {
    calculateStats();
  }, [customers, products, sales, transactions]);

  const calculateStats = () => {
    // Calculate total outstanding debt
    const totalDebt = transactions
      .filter(t => !t.paid)
      .reduce((sum, t) => sum + t.totalAmount, 0);

    // Count customers with outstanding debt
    const customersWithDebt = new Set(
      transactions.filter(t => !t.paid).map(t => t.customerId)
    ).size;

    // Today's data
    const today = new Date().toDateString();
    const todayTransactions = transactions.filter(
      t => new Date(t.date).toDateString() === today
    ).length;

    const todaySalesData = sales.filter(
      s => new Date(s.timestamp).toDateString() === today
    );

    const todaySales = todaySalesData.length;
    const todayRevenue = todaySalesData.reduce((sum, s) => sum + (s.sellingPrice * s.quantity), 0);
    const todayProfit = todaySalesData.reduce((sum, s) => sum + s.profit, 0);

    // Low stock items
    const lowStockItems = products.filter(p => p.currentStock <= p.lowStockThreshold).length;

    setStats({
      totalDebt,
      customersWithDebt,
      productCount: products.length,
      todayTransactions,
      todaySales,
      todayRevenue,
      todayProfit,
      lowStockItems,
    });
  };

  // Recent transactions (last 5)
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Recent sales (last 5)
  const recentSales = sales
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <DashboardStats stats={stats} />
      <RecentActivity 
        recentSales={recentSales}
        recentTransactions={recentTransactions}
        customers={customers}
        products={products}
      />
    </div>
  );
};

export default Dashboard;
