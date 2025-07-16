
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, DollarSign, Package, Users, ShoppingCart } from 'lucide-react';
import { Sale, Product, Customer } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface HybridReportsPageProps {
  sales: Sale[];
  products: Product[];
  customers: Customer[];
}

const HybridReportsPage: React.FC<HybridReportsPageProps> = ({ sales, products, customers }) => {
  const [dateRange, setDateRange] = useState('7');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Filter sales by date range
  const filteredSales = useMemo(() => {
    const days = parseInt(dateRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return sales.filter(sale => {
      const saleDate = new Date(sale.timestamp || '');
      const matchesDate = saleDate >= cutoffDate;
      const matchesCategory = !selectedCategory || 
        (sale.payment_method === selectedCategory) ||
        (products.find(p => p.id === sale.product_id)?.category === selectedCategory);
      
      return matchesDate && matchesCategory;
    });
  }, [sales, dateRange, selectedCategory, products]);

  // Calculate metrics
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const totalSales = filteredSales.length;
  const uniqueCustomers = new Set(filteredSales.filter(sale => sale.customer_id).map(sale => sale.customer_id)).size;
  const lowStockProducts = products.filter(product => 
    product.current_stock <= (product.low_stock_threshold || 10)
  );

  // Payment method breakdown
  const paymentMethodStats = {
    cash: filteredSales.filter(sale => sale.payment_method === 'cash').reduce((sum, sale) => sum + sale.total_amount, 0),
    mpesa: filteredSales.filter(sale => sale.payment_method === 'mpesa').reduce((sum, sale) => sum + sale.total_amount, 0),
    debt: filteredSales.filter(sale => sale.payment_method === 'debt').reduce((sum, sale) => sum + sale.total_amount, 0),
  };

  // Top selling products
  const productSales = filteredSales.reduce((acc, sale) => {
    const productId = sale.product_id;
    if (!acc[productId]) {
      acc[productId] = { quantity: 0, revenue: 0, productName: sale.product_name };
    }
    acc[productId].quantity += sale.quantity;
    acc[productId].revenue += sale.total_amount;
    return acc;
  }, {} as Record<string, { quantity: number; revenue: number; productName: string }>);

  const topProducts = Object.entries(productSales)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Recent transactions
  const recentSales = filteredSales
    .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
    .slice(0, 10);

  const statsCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      change: '+12%',
      positive: true
    },
    {
      title: 'Total Sales',
      value: totalSales.toString(),
      icon: ShoppingCart,
      change: '+8%',
      positive: true
    },
    {
      title: 'Active Customers',
      value: uniqueCustomers.toString(),
      icon: Users,
      change: '+5%',
      positive: true
    },
    {
      title: 'Low Stock Items',
      value: lowStockProducts.length.toString(),
      icon: Package,
      change: lowStockProducts.length > 0 ? 'Attention needed' : 'All good',
      positive: lowStockProducts.length === 0
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business Reports</h1>
          <p className="text-gray-600">Comprehensive analytics and insights</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All categories</SelectItem>
              <SelectItem value="cash">Cash sales</SelectItem>
              <SelectItem value="mpesa">M-Pesa sales</SelectItem>
              <SelectItem value="debt">Credit sales</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index} className="bg-gradient-to-br from-white to-gray-50 border shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    {stat.positive ? (
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                    )}
                    <span className={`text-sm ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className="bg-primary/10 p-3 rounded-full">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Cash</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(paymentMethodStats.cash)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">M-Pesa</span>
                <span className="font-semibold text-blue-600">
                  {formatCurrency(paymentMethodStats.mpesa)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Credit</span>
                <span className="font-semibold text-orange-600">
                  {formatCurrency(paymentMethodStats.debt)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div key={product.id} className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">#{index + 1} {product.productName}</span>
                    <p className="text-sm text-gray-600">{product.quantity} sold</p>
                  </div>
                  <span className="font-semibold text-primary">
                    {formatCurrency(product.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Product</th>
                  <th className="text-left p-3 font-medium">Customer</th>
                  <th className="text-left p-3 font-medium">Amount</th>
                  <th className="text-left p-3 font-medium">Method</th>
                  <th className="text-left p-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale, index) => (
                  <tr key={sale.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="p-3">{sale.product_name}</td>
                    <td className="p-3">{sale.customer_name || 'Walk-in'}</td>
                    <td className="p-3 font-semibold text-green-600">
                      {formatCurrency(sale.total_amount)}
                    </td>
                    <td className="p-3">
                      <Badge variant={sale.payment_method === 'cash' ? 'default' : 'secondary'}>
                        {sale.payment_method}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {sale.timestamp ? new Date(sale.timestamp).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HybridReportsPage;
