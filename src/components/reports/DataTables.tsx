
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/utils/currency';
import { TimeFrameData } from './TimeFramePicker';
import { Sale } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DataTablesProps {
  sales: Sale[];
  timeFrame: TimeFrameData;
  loading?: boolean;
}

interface OrderRow {
  id: string;
  dateTime: string;
  customer: string;
  product: string;
  quantity: number;
  paymentMethod: string;
  amount: number;
}

interface DebtPaymentRow {
  id: string;
  dateTime: string;
  customer: string;
  amount: number;
  paymentMethod: string;
}

interface ProfitableProductRow {
  productName: string;
  quantitySold: number;
  profit: number;
}

const DataTables: React.FC<DataTablesProps> = ({
  sales,
  timeFrame,
  loading = false
}) => {
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      return saleDate >= timeFrame.startDate && saleDate <= timeFrame.endDate;
    });
  }, [sales, timeFrame]);

  const ordersData = useMemo((): OrderRow[] => {
    return filteredSales.map(sale => ({
      id: sale.id,
      dateTime: new Date(sale.timestamp).toLocaleString(),
      customer: sale.customerName || 'Walk-in Customer',
      product: sale.productName,
      quantity: sale.quantity,
      paymentMethod: sale.paymentMethod,
      amount: sale.total
    }));
  }, [filteredSales]);

  const debtPaymentsData = useMemo((): DebtPaymentRow[] => {
    // Filter for debt/partial payment sales only
    return filteredSales
      .filter(sale => sale.paymentMethod === 'debt' || sale.paymentMethod === 'partial')
      .map(sale => ({
        id: sale.id,
        dateTime: new Date(sale.timestamp).toLocaleString(),
        customer: sale.customerName || 'Unknown Customer',
        amount: sale.paymentDetails?.debtAmount || sale.total,
        paymentMethod: sale.paymentMethod
      }));
  }, [filteredSales]);

  const profitableProductsData = useMemo((): ProfitableProductRow[] => {
    const productMap = new Map<string, { quantitySold: number; profit: number }>();
    
    filteredSales.forEach(sale => {
      const existing = productMap.get(sale.productName) || { quantitySold: 0, profit: 0 };
      productMap.set(sale.productName, {
        quantitySold: existing.quantitySold + sale.quantity,
        profit: existing.profit + (sale.profit || 0)
      });
    });

    return Array.from(productMap.entries())
      .map(([productName, data]) => ({
        productName,
        quantitySold: data.quantitySold,
        profit: data.profit
      }))
      .sort((a, b) => b.profit - a.profit);
  }, [filteredSales]);

  const getPaymentMethodBadge = (method: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      cash: 'default',
      mpesa: 'secondary',
      debt: 'destructive',
      partial: 'outline'
    };
    
    return (
      <Badge variant={variants[method] || 'outline'} className="font-bold">
        {method.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Data Tables</CardTitle>
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
          📊 Detailed Reports
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="orders" className="font-bold">
              Orders ({ordersData.length})
            </TabsTrigger>
            <TabsTrigger value="debt-payments" className="font-bold">
              Debt Payments ({debtPaymentsData.length})
            </TabsTrigger>
            <TabsTrigger value="profitable-products" className="font-bold">
              Top Products ({profitableProductsData.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-6">
            <ScrollArea className="h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Date & Time</TableHead>
                    <TableHead className="font-bold">Customer</TableHead>
                    <TableHead className="font-bold">Product</TableHead>
                    <TableHead className="font-bold">Quantity</TableHead>
                    <TableHead className="font-bold">Payment Method</TableHead>
                    <TableHead className="font-bold text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordersData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No orders found for the selected time period
                      </TableCell>
                    </TableRow>
                  ) : (
                    ordersData.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.dateTime}</TableCell>
                        <TableCell>{order.customer}</TableCell>
                        <TableCell>{order.product}</TableCell>
                        <TableCell>{order.quantity}</TableCell>
                        <TableCell>{getPaymentMethodBadge(order.paymentMethod)}</TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(order.amount)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="debt-payments" className="mt-6">
            <ScrollArea className="h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Date & Time</TableHead>
                    <TableHead className="font-bold">Customer</TableHead>
                    <TableHead className="font-bold">Payment Method</TableHead>
                    <TableHead className="font-bold text-right">Debt Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {debtPaymentsData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No debt payments found for the selected time period
                      </TableCell>
                    </TableRow>
                  ) : (
                    debtPaymentsData.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.dateTime}</TableCell>
                        <TableCell>{payment.customer}</TableCell>
                        <TableCell>{getPaymentMethodBadge(payment.paymentMethod)}</TableCell>
                        <TableCell className="text-right font-bold text-destructive">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="profitable-products" className="mt-6">
            <ScrollArea className="h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Product</TableHead>
                    <TableHead className="font-bold text-center">Quantity Sold</TableHead>
                    <TableHead className="font-bold text-right">Total Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profitableProductsData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No profitable products found for the selected time period
                      </TableCell>
                    </TableRow>
                  ) : (
                    profitableProductsData.map((product, index) => (
                      <TableRow key={product.productName}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {index < 3 && (
                              <Badge variant="secondary" className="text-xs">
                                #{index + 1}
                              </Badge>
                            )}
                            {product.productName}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-bold">
                          {product.quantitySold}
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">
                          {formatCurrency(product.profit)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DataTables;
