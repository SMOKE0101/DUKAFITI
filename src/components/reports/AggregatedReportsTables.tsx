import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { Sale } from '../../types';

interface AggregatedReportsTablesProps {
  sales: Sale[];
  dateRange: { from: string; to: string };
}

interface AggregatedSale {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
  customer_name?: string;
  payment_method: string;
  latest_date: string;
  sale_count: number;
}

interface AggregatedPayment {
  customer_name: string;
  total_amount: number;
  payment_method: string;
  latest_date: string;
  payment_count: number;
}

const AggregatedReportsTables: React.FC<AggregatedReportsTablesProps> = ({ sales, dateRange }) => {
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

  // Aggregate sales by product, customer, and payment method
  const aggregatedSalesData = useMemo(() => {
    const salesMap = new Map<string, AggregatedSale>();
    
    filteredSales.forEach(sale => {
      // Create a unique key for aggregation: product + customer + payment method
      const key = `${sale.productId}_${sale.customerName || 'walk-in'}_${sale.paymentMethod}`;
      
      if (salesMap.has(key)) {
        const existing = salesMap.get(key)!;
        existing.total_quantity += sale.quantity;
        existing.total_revenue += sale.total;
        existing.sale_count += 1;
        
        // Keep the latest date
        if (new Date(sale.timestamp) > new Date(existing.latest_date)) {
          existing.latest_date = sale.timestamp;
        }
      } else {
        salesMap.set(key, {
          product_id: sale.productId,
          product_name: sale.productName,
          total_quantity: sale.quantity,
          total_revenue: sale.total,
          customer_name: sale.customerName || 'Walk-in',
          payment_method: sale.paymentMethod,
          latest_date: sale.timestamp,
          sale_count: 1
        });
      }
    });
    
    return Array.from(salesMap.values())
      .filter(aggregatedSale => 
        aggregatedSale.product_name.toLowerCase().includes(salesSearchTerm.toLowerCase()) ||
        aggregatedSale.customer_name.toLowerCase().includes(salesSearchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.latest_date).getTime() - new Date(a.latest_date).getTime());
  }, [filteredSales, salesSearchTerm]);

  // Aggregate payments by customer and payment method
  const aggregatedPaymentsData = useMemo(() => {
    const paymentsMap = new Map<string, AggregatedPayment>();
    
    filteredSales
      .filter(sale => sale.customerName) // Only sales with customers
      .forEach(sale => {
        const key = `${sale.customerName}_${sale.paymentMethod}`;
        
        if (paymentsMap.has(key)) {
          const existing = paymentsMap.get(key)!;
          existing.total_amount += sale.total;
          existing.payment_count += 1;
          
          if (new Date(sale.timestamp) > new Date(existing.latest_date)) {
            existing.latest_date = sale.timestamp;
          }
        } else {
          paymentsMap.set(key, {
            customer_name: sale.customerName!,
            total_amount: sale.total,
            payment_method: sale.paymentMethod,
            latest_date: sale.timestamp,
            payment_count: 1
          });
        }
      });
    
    return Array.from(paymentsMap.values())
      .filter(payment => 
        payment.customer_name.toLowerCase().includes(paymentsSearchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.latest_date).getTime() - new Date(a.latest_date).getTime());
  }, [filteredSales, paymentsSearchTerm]);

  // Pagination logic
  const salesTableData = aggregatedSalesData.slice(
    (salesCurrentPage - 1) * itemsPerPage, 
    salesCurrentPage * itemsPerPage
  );
  
  const paymentsTableData = aggregatedPaymentsData.slice(
    (paymentsCurrentPage - 1) * itemsPerPage, 
    paymentsCurrentPage * itemsPerPage
  );

  const salesTotalPages = Math.ceil(aggregatedSalesData.length / itemsPerPage);
  const paymentsTotalPages = Math.ceil(aggregatedPaymentsData.length / itemsPerPage);

  const handleExportSalesCSV = () => {
    const csvData = salesTableData.map(sale => ({
      'Product Name': sale.product_name,
      'Total Quantity Sold': sale.total_quantity,
      'Total Revenue': sale.total_revenue,
      'Number of Sales': sale.sale_count,
      'Customer': sale.customer_name,
      'Payment Method': sale.payment_method,
      'Latest Sale Date': new Date(sale.latest_date).toLocaleDateString()
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
    a.download = `aggregated-sales-report-${dateRange.from}-to-${dateRange.to}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportPaymentsCSV = () => {
    const csvData = paymentsTableData.map(payment => ({
      'Customer': payment.customer_name,
      'Total Amount Paid': payment.total_amount,
      'Number of Payments': payment.payment_count,
      'Payment Method': payment.payment_method,
      'Latest Payment Date': new Date(payment.latest_date).toLocaleDateString()
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
    a.download = `aggregated-payments-report-${dateRange.from}-to-${dateRange.to}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Aggregated Sales Report Table */}
      <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              Aggregated Sales Report
              <span className="text-sm text-muted-foreground ml-2">
                ({aggregatedSalesData.length} unique products)
              </span>
            </CardTitle>
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
                  <TableHead>Total Qty</TableHead>
                  <TableHead>Total Revenue</TableHead>
                  <TableHead>Sales Count</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Latest Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesTableData.map((sale, index) => (
                  <TableRow key={`${sale.product_id}_${sale.customer_name}_${sale.payment_method}_${index}`}>
                    <TableCell className="font-medium">{sale.product_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {sale.total_quantity}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {formatCurrency(sale.total_revenue)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {sale.sale_count} {sale.sale_count === 1 ? 'sale' : 'sales'}
                      </Badge>
                    </TableCell>
                    <TableCell>{sale.customer_name}</TableCell>
                    <TableCell>
                      {new Date(sale.latest_date).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {(salesCurrentPage - 1) * itemsPerPage + 1} to {Math.min(salesCurrentPage * itemsPerPage, aggregatedSalesData.length)} of {aggregatedSalesData.length}
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

      {/* Aggregated Payments Report Table */}
      <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              Aggregated Payments Report
              <span className="text-sm text-muted-foreground ml-2">
                ({aggregatedPaymentsData.length} unique customers)
              </span>
            </CardTitle>
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
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Payment Count</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Latest Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentsTableData.map((payment, index) => (
                  <TableRow key={`${payment.customer_name}_${payment.payment_method}_${index}`}>
                    <TableCell className="font-medium">{payment.customer_name}</TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {formatCurrency(payment.total_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {payment.payment_count} {payment.payment_count === 1 ? 'payment' : 'payments'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          payment.payment_method === 'cash' ? 'default' :
                          payment.payment_method === 'mpesa' ? 'secondary' : 'destructive'
                        }
                      >
                        {payment.payment_method.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(payment.latest_date).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {(paymentsCurrentPage - 1) * itemsPerPage + 1} to {Math.min(paymentsCurrentPage * itemsPerPage, aggregatedPaymentsData.length)} of {aggregatedPaymentsData.length}
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

export default AggregatedReportsTables;
