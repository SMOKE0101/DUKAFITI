
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Sale, Product } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface EnhancedChartsProps {
  sales: Sale[];
  products: Product[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const EnhancedCharts: React.FC<EnhancedChartsProps> = ({ sales, products }) => {
  // Process sales data for trend chart
  const salesTrendData = React.useMemo(() => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const daySales = sales.filter(sale => 
        sale.timestamp?.startsWith(dateStr)
      );
      
      const totalRevenue = daySales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
      const totalProfit = daySales.reduce((sum, sale) => sum + sale.profit, 0);
      
      last7Days.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: totalRevenue,
        profit: totalProfit,
        sales: daySales.length
      });
    }
    return last7Days;
  }, [sales]);

  // Process category data for pie chart
  const categoryData = React.useMemo(() => {
    const categoryMap = new Map();
    
    products.forEach(product => {
      const category = product.category || 'Uncategorized';
      if (categoryMap.has(category)) {
        categoryMap.set(category, categoryMap.get(category) + product.current_stock);
      } else {
        categoryMap.set(category, product.current_stock);
      }
    });

    return Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value
    }));
  }, [products]);

  // Process top products data
  const topProductsData = React.useMemo(() => {
    const productSales = new Map();
    
    sales.forEach(sale => {
      const productName = sale.product_name;
      if (productSales.has(productName)) {
        productSales.set(productName, {
          ...productSales.get(productName),
          quantity: productSales.get(productName).quantity + sale.quantity,
          revenue: productSales.get(productName).revenue + sale.total_amount
        });
      } else {
        productSales.set(productName, {
          name: productName,
          quantity: sale.quantity,
          revenue: sale.total_amount
        });
      }
    });

    return Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [sales]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* Sales Trend Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Sales Trend (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesTrendData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => `KES ${value}`} />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip 
                formatter={(value, name) => [`KES ${value}`, name === 'revenue' ? 'Revenue' : 'Profit']}
                labelFormatter={(label) => `Day: ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#8884d8" 
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
              <Area 
                type="monotone" 
                dataKey="profit" 
                stroke="#82ca9d" 
                fillOpacity={1} 
                fill="url(#colorProfit)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Products by Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProductsData} layout="horizontal">
              <XAxis type="number" tickFormatter={(value) => `KES ${value}`} />
              <YAxis dataKey="name" type="category" width={80} />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip formatter={(value) => [`KES ${value}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Product Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Stock by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedCharts;
