
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Package, CreditCard } from 'lucide-react';
import { Customer } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { supabase } from '../../integrations/supabase/client';

interface CustomerHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

interface Order {
  id: string;
  date: string;
  orderNumber: string;
  items: string[];
  total: number;
}

interface Payment {
  id: string;
  date: string;
  method: string;
  amount: number;
  reference?: string;
}

const CustomerHistoryModal: React.FC<CustomerHistoryModalProps> = ({
  isOpen,
  onClose,
  customer
}) => {
  const [activeTab, setActiveTab] = useState('orders');
  const [realOrders, setRealOrders] = useState<Order[]>([]);
  const [realPayments, setRealPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && customer) {
      fetchRealData();
    }
  }, [isOpen, customer]);

  const fetchRealData = async () => {
    if (!customer) return;
    
    setLoading(true);
    try {
      // Fetch real sales data for this customer
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .eq('customer_id', customer.id)
        .order('timestamp', { ascending: false })
        .limit(20);

      if (salesError) {
        console.error('Error fetching sales:', salesError);
      } else {
        // Transform sales data to orders format
        const orders = salesData?.map((sale, index) => ({
          id: sale.id,
          date: sale.timestamp || sale.created_at || '',
          orderNumber: `ORD-${String(index + 1).padStart(3, '0')}`,
          items: [sale.product_name],
          total: sale.total_amount
        })) || [];
        setRealOrders(orders);
      }

      // For now, we don't have a separate payments table, so we'll show empty
      // In a real app, you'd fetch from a payments/transactions table
      setRealPayments([]);

    } catch (error) {
      console.error('Error fetching customer history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case 'm-pesa':
      case 'mpesa':
        return 'bg-green-100 text-green-800';
      case 'cash':
        return 'bg-blue-100 text-blue-800';
      case 'bank':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-gray-800 shadow-xl animate-in fade-in-0 slide-in-from-bottom-4 duration-200">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-xl font-display font-semibold">
            History for {customer.name}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-accent/10"
            aria-label="Close history modal"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Payments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-6 space-y-3">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading orders...</p>
                </div>
              ) : realOrders.length > 0 ? (
                realOrders.map((order) => (
                  <Card key={order.id} className="p-4 transition-all duration-150 hover:shadow-md">
                    <CardContent className="p-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-sm">{order.orderNumber}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(order.date)}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {formatCurrency(order.total)}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p className="truncate">{order.items.join(', ')}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No orders found</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="payments" className="mt-6 space-y-3">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading payments...</p>
                </div>
              ) : realPayments.length > 0 ? (
                realPayments.map((payment) => (
                  <Card key={payment.id} className="p-4 transition-all duration-150 hover:shadow-md">
                    <CardContent className="p-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-sm">{formatCurrency(payment.amount)}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(payment.date)}</p>
                        </div>
                        <Badge className={`text-xs ${getPaymentMethodColor(payment.method)}`}>
                          {payment.method}
                        </Badge>
                      </div>
                      {payment.reference && (
                        <div className="text-sm text-muted-foreground">
                          <p className="text-xs">Ref: {payment.reference}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No payments found</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerHistoryModal;
