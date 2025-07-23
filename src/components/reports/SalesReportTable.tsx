
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Download, Search, ArrowUpDown, WifiOff } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { Sale } from '@/types';

interface SalesReportTableProps {
  sales: Sale[];
  loading?: boolean;
  readOnly?: boolean;
}

const SalesReportTable: React.FC<SalesReportTableProps> = ({ 
  sales, 
  loading = false,
  readOnly = false 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Sale | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const filteredAndSortedSales = useMemo(() => {
    let filtered = sales.filter(sale => 
      sale.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortField) {
      filtered.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [sales, searchTerm, sortField, sortDirection]);

  const handleSort = (field: keyof Sale) => {
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
      console.log('[SalesReportTable] CSV export disabled in offline mode');
      return;
    }

    try {
      const csvContent = [
        ['Date', 'Product', 'Customer', 'Quantity', 'Unit Price', 'Total', 'Payment Method'],
        ...filteredAndSortedSales.map(sale => [
          new Date(sale.timestamp).toLocaleDateString(),
          sale.productName || 'Unknown',
          sale.customerName || 'Walk-in',
          sale.quantity?.toString() || '0',
          formatCurrency(sale.selling_price || 0),
          formatCurrency(sale.total || 0),
          sale.paymentMethod || 'Cash'
        ])
      ].map(row => row.join(',')).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('[SalesReportTable] Error exporting CSV:', error);
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
            <CardTitle>Sales Report</CardTitle>
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
                placeholder="Search sales..."
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
                  onClick={() => handleSort('timestamp')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    {!readOnly && <ArrowUpDown className="w-3 h-3" />}
                  </div>
                </th>
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
                  className={`text-left p-3 ${readOnly ? '' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  onClick={() => handleSort('customerName')}
                >
                  <div className="flex items-center gap-1">
                    Customer
                    {!readOnly && <ArrowUpDown className="w-3 h-3" />}
                  </div>
                </th>
                <th 
                  className={`text-right p-3 ${readOnly ? '' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  onClick={() => handleSort('quantity')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Qty
                    {!readOnly && <ArrowUpDown className="w-3 h-3" />}
                  </div>
                </th>
                <th 
                  className={`text-right p-3 ${readOnly ? '' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  onClick={() => handleSort('total')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Total
                    {!readOnly && <ArrowUpDown className="w-3 h-3" />}
                  </div>
                </th>
                <th 
                  className={`text-left p-3 ${readOnly ? '' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  onClick={() => handleSort('paymentMethod')}
                >
                  <div className="flex items-center gap-1">
                    Payment
                    {!readOnly && <ArrowUpDown className="w-3 h-3" />}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedSales.map((sale) => (
                <tr key={sale.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-3 text-sm">
                    {new Date(sale.timestamp).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-sm font-medium">
                    {sale.productName || 'Unknown Product'}
                  </td>
                  <td className="p-3 text-sm">
                    {sale.customerName || 'Walk-in Customer'}
                  </td>
                  <td className="p-3 text-sm text-right">
                    {sale.quantity || 0}
                  </td>
                  <td className="p-3 text-sm text-right font-medium">
                    {formatCurrency(sale.total || 0)}
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className="text-xs">
                      {sale.paymentMethod || 'Cash'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredAndSortedSales.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No sales found matching your criteria
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesReportTable;
