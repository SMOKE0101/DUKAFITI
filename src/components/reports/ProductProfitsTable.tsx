
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Download, Search, ArrowUpDown, WifiOff } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { Sale } from '@/types';

interface ProductProfitsTableProps {
  sales: Sale[];
  loading?: boolean;
  readOnly?: boolean;
}

interface ProductProfit {
  productName: string;
  totalSales: number;
  totalProfit: number;
  unitsSold: number;
  averageProfit: number;
  profitMargin: number;
}

const ProductProfitsTable: React.FC<ProductProfitsTableProps> = ({ 
  sales, 
  loading = false,
  readOnly = false 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof ProductProfit>('totalProfit');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const productProfits = useMemo(() => {
    const productMap = new Map<string, ProductProfit>();

    sales.forEach(sale => {
      const productName = sale.productName || 'Unknown Product';
      const profit = Number(sale.profit) || 0;
      const total = Number(sale.total) || 0;
      const quantity = Number(sale.quantity) || 0;

      if (!productMap.has(productName)) {
        productMap.set(productName, {
          productName,
          totalSales: 0,
          totalProfit: 0,
          unitsSold: 0,
          averageProfit: 0,
          profitMargin: 0
        });
      }

      const product = productMap.get(productName)!;
      product.totalSales += total;
      product.totalProfit += profit;
      product.unitsSold += quantity;
    });

    // Calculate derived values
    productMap.forEach(product => {
      product.averageProfit = product.unitsSold > 0 ? product.totalProfit / product.unitsSold : 0;
      product.profitMargin = product.totalSales > 0 ? (product.totalProfit / product.totalSales) * 100 : 0;
    });

    return Array.from(productMap.values());
  }, [sales]);

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = productProfits.filter(product => 
      product.productName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [productProfits, searchTerm, sortField, sortDirection]);

  const handleSort = (field: keyof ProductProfit) => {
    if (readOnly) return;
    
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleExportCSV = () => {
    if (readOnly) {
      console.log('[ProductProfitsTable] CSV export disabled in offline mode');
      return;
    }

    try {
      const csvContent = [
        ['Product', 'Units Sold', 'Total Sales', 'Total Profit', 'Average Profit', 'Profit Margin %'],
        ...filteredAndSortedProducts.map(product => [
          product.productName,
          product.unitsSold.toString(),
          formatCurrency(product.totalSales),
          formatCurrency(product.totalProfit),
          formatCurrency(product.averageProfit),
          `${product.profitMargin.toFixed(1)}%`
        ])
      ].map(row => row.join(',')).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `product-profits-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('[ProductProfitsTable] Error exporting CSV:', error);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <CardTitle>Product Profits</CardTitle>
            {readOnly && (
              <Badge variant="secondary" className="text-xs">
                <WifiOff className="w-3 h-3 mr-1" />
                Offline
              </Badge>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
                disabled={readOnly}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={readOnly}
              className={`flex items-center gap-2 ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th 
                  className={`text-left p-3 ${readOnly ? '' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  onClick={() => handleSort('productName')}
                >
                  <div className="flex items-center gap-1">
                    Product
                    {!readOnly && <ArrowUpDown className="w-3 h-3" />}
                  </div>
                </th>
                <th 
                  className={`text-right p-3 ${readOnly ? '' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  onClick={() => handleSort('unitsSold')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Units Sold
                    {!readOnly && <ArrowUpDown className="w-3 h-3" />}
                  </div>
                </th>
                <th 
                  className={`text-right p-3 ${readOnly ? '' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  onClick={() => handleSort('totalSales')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Total Sales
                    {!readOnly && <ArrowUpDown className="w-3 h-3" />}
                  </div>
                </th>
                <th 
                  className={`text-right p-3 ${readOnly ? '' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  onClick={() => handleSort('totalProfit')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Total Profit
                    {!readOnly && <ArrowUpDown className="w-3 h-3" />}
                  </div>
                </th>
                <th 
                  className={`text-right p-3 ${readOnly ? '' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  onClick={() => handleSort('profitMargin')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Margin %
                    {!readOnly && <ArrowUpDown className="w-3 h-3" />}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedProducts.map((product, index) => (
                <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-3 text-sm font-medium">
                    {product.productName}
                  </td>
                  <td className="p-3 text-sm text-right">
                    {product.unitsSold}
                  </td>
                  <td className="p-3 text-sm text-right font-medium">
                    {formatCurrency(product.totalSales)}
                  </td>
                  <td className="p-3 text-sm text-right font-medium text-green-600">
                    {formatCurrency(product.totalProfit)}
                  </td>
                  <td className="p-3 text-right">
                    <Badge 
                      variant={product.profitMargin > 20 ? "default" : product.profitMargin > 10 ? "secondary" : "destructive"}
                      className="text-xs"
                    >
                      {product.profitMargin.toFixed(1)}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredAndSortedProducts.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No products found matching your criteria
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductProfitsTable;
