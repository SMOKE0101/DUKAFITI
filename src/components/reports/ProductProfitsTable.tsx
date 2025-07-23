import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Product Profits Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-black text-foreground">
          📈 Product Profits Report
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Select value={timeFrame} onValueChange={(value: 'today' | 'week' | 'month') => {
              setTimeFrame(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
          
          <Button 
            onClick={exportToCSV}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <div className="text-sm text-muted-foreground mb-4">
          Showing {searchedData.length} products for <span className="font-semibold">{getTimeFrameLabel()}</span>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Product</TableHead>
                <TableHead className="font-bold text-center">Quantity Sold</TableHead>
                <TableHead className="font-bold text-right">Sales Amount</TableHead>
                <TableHead className="font-bold text-right">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No products found matching your search' : `No products found for ${getTimeFrameLabel().toLowerCase()}`}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((product, index) => (
                  <TableRow key={`${product.productName}-${index}`} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{product.productName}</TableCell>
                    <TableCell className="text-center font-semibold">{product.quantitySold}</TableCell>
                    <TableCell className="text-right font-semibold text-blue-600">
                      {formatCurrency(product.salesAmount)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-600">
                      {formatCurrency(product.profit)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages} ({searchedData.length} total products)
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
      </CardContent>
    </Card>
  );
};

export default ProductProfitsTable;