
import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { Sale } from '../../types';

interface ReportsTablesProps {
  sales: Sale[];
  dateRange: { from: string; to: string };
}

const ReportsTables: React.FC<ReportsTablesProps> = ({ sales, dateRange }) => {
  const [salesSearchTerm, setSalesSearchTerm] = useState('');
  const [paymentsSearchTerm, setPaymentsSearchTerm] = useState('');
  const [salesCurrentPage, setSalesCurrentPage] = useState(1);
  const [paymentsCurrentPage, setPaymentsCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.timestamp).toISOString().split('T')[0];
      return saleDate >= dateRange.from && saleDate <= dateRange.to;
    });
  }, [sales, dateRange]);

  // Sales Report Table Data
  const salesTableData = useMemo(() => {
    return filteredSales
      .filter(sale => 
        sale.productName.toLowerCase().includes(salesSearchTerm.toLowerCase()) ||
        (sale.customerName && sale.customerName.toLowerCase().includes(salesSearchTerm.toLowerCase()))
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice((salesCurrentPage - 1) * itemsPerPage, salesCurrentPage * itemsPerPage);
  }, [filteredSales, salesSearchTerm, salesCurrentPage]);

  // Payments Report Table Data
  const paymentsTableData = useMemo(() => {
    return filteredSales
      .filter(sale => sale.customerName) // Only sales with customers
      .filter(sale => 
        (sale.customerName && sale.customerName.toLowerCase().includes(paymentsSearchTerm.toLowerCase()))
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice((paymentsCurrentPage - 1) * itemsPerPage, paymentsCurrentPage * itemsPerPage);
  }, [filteredSales, paymentsSearchTerm, paymentsCurrentPage]);

  const salesTotalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const paymentsTotalPages = Math.ceil(paymentsTableData.length / itemsPerPage);

  const handleExportSalesCSV = () => {
    const csvData = salesTableData.map(sale => ({
      'Product Name': sale.productName,
      'Quantity Sold': sale.quantity,
      'Revenue': sale.total,
      'Customer': sale.customerName || 'Walk-in',
      'Date': new Date(sale.timestamp).toLocaleDateString()
    }));
    
    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${dateRange.from}-to-${dateRange.to}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportPaymentsCSV = () => {
    const csvData = paymentsTableData.map(sale => ({
      'Customer': sale.customerName,
      'Amount Paid': sale.total,
      'Payment Method': sale.paymentMethod,
      'Date': new Date(sale.timestamp).toLocaleDateString()
    }));
    
    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-report-${dateRange.from}-to-${dateRange.to}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Sales Report Table */}
      <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Sales Report</CardTitle>
            <Button onClick={handleExportSalesCSV} size="sm" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products or customers..."
              value={salesSearchTerm}
              onChange={(e) => setSalesSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Qty Sold</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesTableData.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.productName}</TableCell>
                    <TableCell>{sale.quantity}</TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {formatCurrency(sale.total)}
                    </TableCell>
                    <TableCell>{sale.customerName || 'Walk-in'}</TableCell>
                    <TableCell>
                      {new Date(sale.timestamp).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {(salesCurrentPage - 1) * itemsPerPage + 1} to {Math.min(salesCurrentPage * itemsPerPage, filteredSales.length)} of {filteredSales.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSalesCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={salesCurrentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm">{salesCurrentPage} of {salesTotalPages}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSalesCurrentPage(prev => Math.min(salesTotalPages, prev + 1))}
                disabled={salesCurrentPage === salesTotalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Report Table */}
      <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Payments Report</CardTitle>
            <Button onClick={handleExportPaymentsCSV} size="sm" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={paymentsSearchTerm}
              onChange={(e) => setPaymentsSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount Paid</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentsTableData.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.customerName}</TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {formatCurrency(sale.total)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          sale.paymentMethod === 'cash' ? 'default' :
                          sale.paymentMethod === 'mpesa' ? 'secondary' : 'destructive'
                        }
                      >
                        {sale.paymentMethod.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(sale.timestamp).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {(paymentsCurrentPage - 1) * itemsPerPage + 1} to {Math.min(paymentsCurrentPage * itemsPerPage, paymentsTableData.length)} of {paymentsTableData.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaymentsCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={paymentsCurrentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm">{paymentsCurrentPage} of {paymentsTotalPages}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaymentsCurrentPage(prev => Math.min(paymentsTotalPages, prev + 1))}
                disabled={paymentsCurrentPage === paymentsTotalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsTables;
