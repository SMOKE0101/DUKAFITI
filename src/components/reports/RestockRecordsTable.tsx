import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { Product } from '@/types';

interface RestockRecord {
  id: string;
  productName: string;
  restockDate: string;
  restockTime: string;
  quantity: number;
}

interface RestockRecordsTableProps {
  products: Product[];
  loading?: boolean;
  isOffline?: boolean;
}

const RestockRecordsTable: React.FC<RestockRecordsTableProps> = ({
  products,
  loading = false,
  isOffline = false
}) => {
  const [timeFrame, setTimeFrame] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [customFrom, setCustomFrom] = useState<Date | undefined>(undefined);
  const [customTo, setCustomTo] = useState<Date | undefined>(undefined);

  // Generate restock records from product history (simulated data)
  const restockRecords = useMemo((): RestockRecord[] => {
    const records: RestockRecord[] = [];
    
    // This is a simplified simulation - in a real app, you'd have actual restock history
    products.forEach(product => {
      // Simulate some restock records for each product
      const recordCount = Math.floor(Math.random() * 5) + 1; // 1-5 records per product
      
      for (let i = 0; i < recordCount; i++) {
        const daysAgo = Math.floor(Math.random() * 30); // Random day within last 30 days
        const restockDate = new Date();
        restockDate.setDate(restockDate.getDate() - daysAgo);
        
        const quantity = Math.floor(Math.random() * 50) + 10; // 10-60 units
        const buyingPrice = product.costPrice || (product.sellingPrice * 0.7); // Estimate if not available
        const totalCost = quantity * buyingPrice;
        
        records.push({
          id: `${product.id}-${i}-${Date.now()}`,
          productName: product.name,
          restockDate: restockDate.toISOString().split('T')[0],
          restockTime: `${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
          quantity
        });
      }
    });
    
    // Sort by date descending
    return records.sort((a, b) => 
      new Date(b.restockDate).getTime() - new Date(a.restockDate).getTime()
    );
  }, [products]);

  // Filter records based on timeframe
  const filteredRecordsByTime = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (timeFrame === 'custom' && customFrom && customTo) {
      const start = new Date(customFrom);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customTo);
      end.setHours(23, 59, 59, 999);
      return restockRecords.filter((record) => {
        const recordDate = new Date(record.restockDate);
        return recordDate >= start && recordDate <= end;
      });
    }
    
    let startDate: Date = today;
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
    
    return restockRecords.filter(record => {
      const recordDate = new Date(record.restockDate);
      return recordDate >= startDate && recordDate <= now;
    });
  }, [restockRecords, timeFrame, customFrom, customTo]);

  // Filter by search term
  const filteredRecords = useMemo(() => {
    if (!searchTerm) return filteredRecordsByTime;
    
    return filteredRecordsByTime.filter(record =>
      record.productName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [filteredRecordsByTime, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + itemsPerPage);

  // Reset pagination when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [timeFrame, searchTerm]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Time', 'Product', 'Quantity'];
    const csvData = filteredRecords.map(record => [
      record.restockDate,
      record.restockTime,
      record.productName,
      record.quantity
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `restock-records-${timeFrame}-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Card className="bg-card rounded-lg shadow-sm border border-border">
        <CardHeader>
          <CardTitle>Restock Records</CardTitle>
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
    <div className="bg-card rounded-lg shadow-sm border border-border">
      {/* Header with controls */}
      <div className="p-6 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-xl font-bold text-foreground">
            Restock Records
          </h3>
          <Button
            onClick={exportToCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            size="sm"
            disabled={isOffline || filteredRecords.length === 0}
            title={isOffline ? 'Export not available offline' : 'Export to CSV'}
          >
            <Download className="w-4 h-4 mr-2" />
            Download CSV
            {isOffline && <span className="text-xs ml-1">(offline)</span>}
          </Button>
        </div>
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="flex flex-col gap-2">
            {/* Timeframe Selector */}
            <div className="flex bg-muted rounded-lg p-1 flex-wrap">
              {[
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'This Week' },
                { value: 'month', label: 'This Month' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeFrame(option.value as 'today' | 'week' | 'month' | 'custom')}
                  disabled={isOffline}
                  className={`
                    text-sm font-medium rounded-md transition-all duration-200 px-3 py-1.5
                    ${isOffline ? 'opacity-50 cursor-not-allowed' : ''}
                    ${timeFrame === option.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-background"
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
              <button
                onClick={() => setTimeFrame('custom')}
                disabled={isOffline}
                className={`
                  text-sm font-medium rounded-md transition-all duration-200 px-3 py-1.5
                  ${isOffline ? 'opacity-50 cursor-not-allowed' : ''}
                  ${timeFrame === 'custom'
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background"
                  }
                `}
              >
                Custom
              </button>
            </div>
            {timeFrame === 'custom' && (
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="date"
                  value={customFrom ? customFrom.toISOString().split('T')[0] : ''}
                  onChange={(e) => setCustomFrom(e.target.value ? new Date(e.target.value) : undefined)}
                  className="w-[160px]"
                />
                <Input
                  type="date"
                  value={customTo ? customTo.toISOString().split('T')[0] : ''}
                  onChange={(e) => setCustomTo(e.target.value ? new Date(e.target.value) : undefined)}
                  className="w-[160px]"
                />
                <Button variant="outline" size="sm" onClick={() => { setCustomFrom(undefined); setCustomTo(undefined); }}>
                  Clear
                </Button>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder={isOffline ? "Search (cached data)" : "Search by product name..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isOffline}
              className={`pl-10 ${isOffline ? 'opacity-50' : ''}`}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border">
              <TableHead className="font-semibold text-foreground uppercase tracking-wider text-left py-4 px-6">
                PRODUCT
              </TableHead>
              <TableHead className="font-semibold text-foreground uppercase tracking-wider text-left py-4 px-6">
                DATE & TIME
              </TableHead>
              <TableHead className="font-semibold text-foreground uppercase tracking-wider text-center py-4 px-6">
                QUANTITY
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  No restock records found for the selected period
                </TableCell>
              </TableRow>
            ) : (
              paginatedRecords.map((record) => (
                <TableRow key={record.id} className="border-b border-border hover:bg-muted/50">
                  <TableCell className="py-4 px-6 font-medium text-card-foreground">
                    {record.productName}
                  </TableCell>
                  <TableCell className="py-4 px-6 text-muted-foreground">
                    {record.restockDate} {record.restockTime}
                  </TableCell>
                  <TableCell className="py-4 px-6 text-center font-medium text-blue-600 dark:text-blue-400">
                    {record.quantity}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 md:px-6 py-4 border-t border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-muted-foreground text-center sm:text-left">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredRecords.length)} of {filteredRecords.length} records
            </div>
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3"
              >
                Previous
              </Button>
              <span className="px-3 py-1 text-sm text-foreground bg-muted rounded-md">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestockRecordsTable;
