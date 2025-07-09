
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Package, CreditCard, Plus, ChevronRight, Smartphone, Banknote } from 'lucide-react';
import { Customer } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '../../hooks/use-toast';
import { useIsMobile } from '../../hooks/use-mobile';

interface CustomerHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

interface Order {
  id: string;
  date: string;
  orderNumber: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  total: number;
  expanded?: boolean;
}

interface Payment {
  id: string;
  date: string;
  method: 'cash' | 'mpesa';
  amount: number;
  reference?: string;
  notes?: string;
}

const CustomerHistoryModal: React.FC<CustomerHistoryModalProps> = ({
  isOpen,
  onClose,
  customer
}) => {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  
  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'cash' as 'cash' | 'mpesa',
    reference: '',
    notes: ''
  });

  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isOpen && customer) {
      fetchData();
      setupRealtimeSubscription();
    }
  }, [isOpen, customer]);

  const setupRealtimeSubscription = () => {
    if (!customer) return;

    const channel = supabase
      .channel(`customer-${customer.id}-history`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales',
          filter: `customer_id=eq.${customer.id}`
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchData = async () => {
    if (!customer) return;
    
    setLoading(true);
    try {
      // Fetch sales data for orders
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .eq('customer_id', customer.id)
        .order('timestamp', { ascending: false })
        .limit(20);

      if (salesError) {
        console.error('Error fetching sales:', salesError);
      } else {
        const ordersData = salesData?.map((sale, index) => ({
          id: sale.id,
          date: sale.timestamp || sale.created_at || '',
          orderNumber: `ORD-${String(index + 1).padStart(3, '0')}`,
          items: [{
            name: sale.product_name,
            quantity: sale.quantity,
            unitPrice: sale.selling_price
          }],
          total: sale.total_amount
        })) || [];
        setOrders(ordersData);
      }

      // For now, create mock payment data since we don't have a payments table
      // In a real app, you'd fetch from a payments/transactions table
      const mockPayments: Payment[] = [
        {
          id: '1',
          date: new Date().toISOString(),
          method: 'mpesa',
          amount: 1500,
          reference: 'ABC123XYZ',
          notes: 'Partial payment'
        },
        {
          id: '2',
          date: new Date(Date.now() - 86400000).toISOString(),
          method: 'cash',
          amount: 2000,
          reference: '',
          notes: 'Full payment'
        }
      ];
      setPayments(mockPayments);

    } catch (error) {
      console.error('Error fetching customer history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!customer || !paymentForm.amount) return;

    try {
      const newPayment: Payment = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        method: paymentForm.method,
        amount: parseFloat(paymentForm.amount),
        reference: paymentForm.reference,
        notes: paymentForm.notes
      };

      setPayments(prev => [newPayment, ...prev]);
      setShowPaymentSheet(false);
      setPaymentForm({ amount: '', method: 'cash', reference: '', notes: '' });

      toast({
        title: "Payment Recorded",
        description: `Payment of ${formatCurrency(newPayment.amount)} recorded successfully`,
      });
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const toggleOrderExpanded = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  if (!customer) return null;

  const ModalContent = () => (
    <>
      <DialogHeader className="pb-6">
        <div className="flex items-center justify-between">
          <DialogTitle className="text-2xl font-semibold font-display">
            History for {customer.name}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-8 h-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </DialogHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger 
            value="orders" 
            className="text-base font-medium data-[state=active]:bg-purple-600 data-[state=active]:text-white"
          >
            <Package className="w-4 h-4 mr-2" />
            Orders
          </TabsTrigger>
          <TabsTrigger 
            value="payments" 
            className="text-base font-medium data-[state=active]:bg-purple-600 data-[state=active]:text-white"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-0">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : orders.length > 0 ? (
              orders.map((order) => (
                <div key={order.id}>
                  <Card 
                    className="cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => toggleOrderExpanded(order.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold">{order.orderNumber}</span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {formatCurrency(order.total)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">{formatDate(order.date)}</span>
                            <ChevronRight 
                              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                                expandedOrderId === order.id ? 'rotate-90' : ''
                              }`}
                            />
                          </div>
                          <div className="text-sm text-gray-600 mt-1 truncate">
                            {order.items.map(item => item.name).join(', ')}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {expandedOrderId === order.id && (
                    <Card className="ml-4 mt-2 border-l-4 border-purple-500">
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2">Order Details</h4>
                        <div className="space-y-2">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{item.name} (x{item.quantity})</span>
                              <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No orders found</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="payments" className="mt-0">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : payments.length > 0 ? (
              payments.map((payment) => (
                <Card key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        {payment.method === 'mpesa' ? (
                          <Smartphone className="w-5 h-5 text-green-600" />
                        ) : (
                          <Banknote className="w-5 h-5 text-blue-600" />
                        )}
                        <div>
                          <div className="font-semibold text-green-700">
                            {formatCurrency(payment.amount)}
                          </div>
                          <div className="text-sm text-gray-500">{formatDate(payment.date)}</div>
                          {payment.reference && (
                            <div className="text-xs text-gray-400">Ref: {payment.reference}</div>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {payment.method === 'mpesa' ? 'M-Pesa' : 'Cash'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No payments found</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Floating Action Button for Recording Payment */}
      <Button
        onClick={() => setShowPaymentSheet(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-green-600 hover:bg-green-700 shadow-lg z-50"
        size="icon"
      >
        <Plus className="w-6 h-6" />
      </Button>
    </>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-xl rounded-2xl p-8 bg-white dark:bg-gray-800 shadow-lg">
          <ModalContent />
        </DialogContent>
      </Dialog>

      {/* Payment Recording Sheet */}
      <Sheet open={showPaymentSheet} onOpenChange={setShowPaymentSheet}>
        <SheetContent side={isMobile ? "bottom" : "right"} className="w-full sm:max-w-md">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl font-semibold">Record Payment</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-6">
            <div>
              <Label htmlFor="amount" className="text-sm font-semibold mb-2 block">
                Amount *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  KES
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="pl-12"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="method" className="text-sm font-semibold mb-2 block">
                Payment Method *
              </Label>
              <Select 
                value={paymentForm.method} 
                onValueChange={(value: 'cash' | 'mpesa') => 
                  setPaymentForm(prev => ({ ...prev, method: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentForm.method === 'mpesa' && (
              <div>
                <Label htmlFor="reference" className="text-sm font-semibold mb-2 block">
                  M-Pesa Reference
                </Label>
                <Input
                  id="reference"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, reference: e.target.value }))}
                  placeholder="e.g., ABC123XYZ"
                />
              </div>
            )}

            <div>
              <Label htmlFor="notes" className="text-sm font-semibold mb-2 block">
                Notes (Optional)
              </Label>
              <Input
                id="notes"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes"
              />
            </div>

            <div className="flex gap-3 pt-6">
              <Button
                variant="outline"
                onClick={() => setShowPaymentSheet(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRecordPayment}
                disabled={!paymentForm.amount}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Record Payment
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default CustomerHistoryModal;
