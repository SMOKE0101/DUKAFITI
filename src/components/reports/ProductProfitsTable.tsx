import React, { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Search } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { Sale } from '@/types';

interface ProductProfitsTableProps {
  sales: Sale[];
  loading?: boolean;
}

interface ProductProfitRow {
  productName: string;
  quantitySold: number;
  salesAmount: number;
  profit: number;
}

const ProductProfitsTable: React.FC<ProductProfitsTableProps> = ({
  sales,
  loading = false
}) => {
  const [timeFrame, setTimeFrame] = useState<'today' | 'week' | 'month'>('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getTimeFrameRange = (frame: 'today' | 'week' | 'month') => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (frame) {
      case 'today':
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        return { start: weekStart, end: weekEnd };
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        return { start: monthStart, end: monthEnd };
      default:
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) };
    }
  };

  const filteredSales = useMemo(() => {
    const { start, end } = getTimeFrameRange(timeFrame);
    return sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      return saleDate >= start && saleDate <= end;
    });
  }, [sales, timeFrame]);

  const productProfitsData = useMemo((): ProductProfitRow[] => {
    const productMap = new Map<string, ProductProfitRow>();
    
    filteredSales.forEach(sale => {
      const existing = productMap.get(sale.productName) || {
        productName: sale.productName,
        quantitySold: 0,
        salesAmount: 0,
        profit: 0
      };
      
      productMap.set(sale.productName, {
        productName: sale.productName,
        quantitySold: existing.quantitySold + sale.quantity,
        salesAmount: existing.salesAmount + sale.total,
        profit: existing.profit + (sale.profit || 0)
      });
    });

    return Array.from(productMap.values())
      .sort((a, b) => b.profit - a.profit);
  }, [filteredSales]);

  const searchedData = useMemo(() => {
    if (!searchTerm) return productProfitsData;
    
    return productProfitsData.filter(item =>
      item.productName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [productProfitsData, searchTerm]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return searchedData.slice(startIndex, startIndex + itemsPerPage);
  }, [searchedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(searchedData.length / itemsPerPage);

  const exportToCSV = () => {
    const headers = ['Product', 'Quantity Sold', 'Sales Amount', 'Profit'];
    const csvContent = [
      headers.join(','),
      ...searchedData.map(row => [
        `"${row.productName}"`,
        row.quantitySold,
        row.salesAmount.toFixed(2),
        row.profit.toFixed(2)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `product-profits-${timeFrame}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTimeFrameLabel = () => {
    switch (timeFrame) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      default: return 'Today';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header with controls */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            {/* Time frame selector */}
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                onClick={() => {
                  setTimeFrame('today');
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeFrame === 'today'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => {
                  setTimeFrame('week');
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeFrame === 'week'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => {
                  setTimeFrame('month');
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeFrame === 'month'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                This Month
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 w-64"
              />
            </div>
            
            {/* Export CSV button */}
            <Button 
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Download className="h-4 w-4" />
              Download CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200">
              <TableHead className="font-semibold text-gray-900 uppercase tracking-wider text-left py-4 px-6">
                PRODUCT
              </TableHead>
              <TableHead className="font-semibold text-gray-900 uppercase tracking-wider text-center py-4 px-6">
                QUANTITY SOLD
              </TableHead>
              <TableHead className="font-semibold text-gray-900 uppercase tracking-wider text-center py-4 px-6">
                SALES AMOUNT
              </TableHead>
              <TableHead className="font-semibold text-gray-900 uppercase tracking-wider text-center py-4 px-6">
                PROFIT
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                  {searchTerm ? 'No products found matching your search' : `No products found for ${getTimeFrameLabel().toLowerCase()}`}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((product, index) => (
                <TableRow key={`${product.productName}-${index}`} className="border-b border-gray-100 hover:bg-gray-50">
                  <TableCell className="py-4 px-6 font-medium text-gray-900">
                    {product.productName}
                  </TableCell>
                  <TableCell className="py-4 px-6 text-center font-medium text-gray-900">
                    {product.quantitySold}
                  </TableCell>
                  <TableCell className="py-4 px-6 text-center font-medium text-blue-600">
                    {formatCurrency(product.salesAmount)}
                  </TableCell>
                  <TableCell className="py-4 px-6 text-center font-medium text-emerald-600">
                    {formatCurrency(product.profit)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {searchedData.length} products for <span className="font-medium">{getTimeFrameLabel()}</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="px-3 py-1 text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductProfitsTable;