import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { Sale } from '@/types';

interface SalesReportTableProps {
  sales: Sale[];
  loading?: boolean;
}

type TimeFrameType = 'today' | 'week' | 'month';

const SalesReportTable: React.FC<SalesReportTableProps> = ({
  sales,
  loading = false
}) => {
  const [timeFrame, setTimeFrame] = useState<TimeFrameType>('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter sales based on timeframe
  const filteredSalesByTime = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let startDate: Date;
    
    switch (timeFrame) {
      case 'today':
        startDate = today;
        break;
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        break;
      default:
        startDate = today;
    }
    
    return sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      return saleDate >= startDate && saleDate <= now;
    });
  }, [sales, timeFrame]);

  // Filter sales based on search term
  const filteredSales = useMemo(() => {
    if (!searchTerm) return filteredSalesByTime;
    
    return filteredSalesByTime.filter(sale =>
      sale.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.customerName && sale.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      sale.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [filteredSalesByTime, searchTerm]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSales.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSales, currentPage]);

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);

  // CSV Export function
  const handleCSVExport = () => {
    const csvData = [
      ['Date', 'Time', 'Customer', 'Product', 'Quantity', 'Amount', 'Payment Method'],
      ...filteredSales.map(sale => {
        const saleDate = new Date(sale.timestamp);
        return [
          saleDate.toLocaleDateString(),
          saleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sale.customerName || 'Walk-in Customer',
          sale.productName,
          sale.quantity.toString(),
          formatCurrency(sale.total).replace('KSh ', 'Ksh '),
          sale.paymentMethod.toUpperCase()
        ];
      })
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `sales-report-${timeFrame}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      cash: 'default',
      mpesa: 'secondary',
      debt: 'destructive',
      partial: 'outline'
    };
    
    return (
      <Badge variant={variants[method] || 'outline'} className="font-medium">
        {method.toUpperCase()}
      </Badge>
    );
  };

  // Reset to first page when search or timeframe changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, timeFrame]);

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Sales Report</CardTitle>
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
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-xl font-bold text-foreground">
            Sales Report
          </CardTitle>
          <Button
            onClick={handleCSVExport}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Download CSV
          </Button>
        </div>
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          {/* Timeframe Selector */}
          <div className="flex bg-muted rounded-lg p-1">
            {[
              { value: 'today', label: 'Today' },
              { value: 'week', label: 'This Week' },
              { value: 'month', label: 'This Month' }
            ].map((option) => (
              <Button
                key={option.value}
                variant="ghost"
                size="sm"
                onClick={() => setTimeFrame(option.value as TimeFrameType)}
                className={`
                  text-sm font-medium rounded-md transition-all duration-200 px-3 py-1.5
                  ${timeFrame === option.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background"
                  }
                `}
              >
                {option.label}
              </Button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by customer or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-96">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50">
              <TableRow>
                <TableHead className="font-bold text-foreground">DATE</TableHead>
                <TableHead className="font-bold text-foreground">TIME</TableHead>
                <TableHead className="font-bold text-foreground">CUSTOMER</TableHead>
                <TableHead className="font-bold text-foreground">PRODUCT</TableHead>
                <TableHead className="font-bold text-foreground text-center">QUANTITY</TableHead>
                <TableHead className="font-bold text-foreground text-right">AMOUNT</TableHead>
                <TableHead className="font-bold text-foreground text-center">PAYMENT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No sales found matching your search criteria' : 
                     `No sales found for ${timeFrame === 'today' ? 'today' : timeFrame === 'week' ? 'this week' : 'this month'}`}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((sale, index) => {
                  const saleDate = new Date(sale.timestamp);
                  return (
                    <TableRow 
                      key={sale.id} 
                      className={`hover:bg-muted/50 transition-colors ${
                        index % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                      }`}
                    >
                      <TableCell className="font-medium">
                        {saleDate.toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {saleDate.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: true 
                        })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {sale.customerName || 'Walk-in Customer'}
                      </TableCell>
                      <TableCell>{sale.productName}</TableCell>
                      <TableCell className="text-center font-bold">
                        {sale.quantity}
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-600">
                        {formatCurrency(sale.total)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getPaymentMethodBadge(sale.paymentMethod)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </ScrollArea>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredSales.length)} of {filteredSales.length} entries
              {searchTerm && ` (filtered from ${filteredSalesByTime.length} total)`}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  const isActive = page === currentPage;
                  return (
                    <Button
                      key={page}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="h-8 w-8 p-0"
                    >
                      {page}
                    </Button>
                  );
                })}
                {totalPages > 5 && (
                  <>
                    <span className="text-muted-foreground px-2">...</span>
                    <Button
                      variant={currentPage === totalPages ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      className="h-8 w-8 p-0"
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SalesReportTable;