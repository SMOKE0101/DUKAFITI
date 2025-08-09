
import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Package, CreditCard, Smartphone, Banknote, ChevronDown, ChevronUp } from 'lucide-react';
import { Customer } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { supabase } from '../../integrations/supabase/client';
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
  items: string;
  total: number;
  quantity: number;
  paymentMethod: 'cash' | 'mpesa' | 'bank' | 'debt' | 'partial' | 'split';
  expanded?: boolean;
}

interface Payment {
  id: string;
  date: string;
  method: 'cash' | 'mpesa' | 'bank' | 'debt';
  amount: number;
  reference?: string;
}

const CustomerHistoryModal: React.FC<CustomerHistoryModalProps> = ({
  isOpen,
  onClose,
  customer
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'payments'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const isMobile = useIsMobile();

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    if (!customer) return;
    
    setLoading(true);
    try {
      // Fetch sales data for orders (latest 20)
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .eq('customer_id', customer.id)
        .gte('total_amount', 0) // Positive amounts = orders
        .order('timestamp', { ascending: false })
        .limit(20);

      if (salesError) {
        console.error('Error fetching sales:', salesError);
      } else {
        const ordersData = salesData?.map((sale, index) => ({
          id: sale.id,
          date: sale.timestamp || sale.created_at || '',
          orderNumber: `ORD-${String(index + 1).padStart(3, '0')}`,
          items: sale.product_name,
          total: sale.total_amount,
          quantity: Number(sale.quantity) || 0,
          paymentMethod: (sale.payment_method as 'cash' | 'mpesa' | 'bank' | 'debt' | 'partial' | 'split') || 'cash'
        })) || [];
        setOrders(ordersData);
      }

      // Fetch debt payments from debt_payments table (latest 20)
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('debt_payments')
        .select('*')
        .eq('customer_id', customer.id)
        .order('timestamp', { ascending: false })
        .limit(20);

      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
      } else {
        const paymentsFormatted = paymentsData?.map(payment => ({
          id: payment.id,
          date: payment.timestamp || payment.created_at || '',
          method: (payment.payment_method as 'cash' | 'mpesa' | 'bank') || 'cash',
          amount: Number(payment.amount),
          reference: payment.reference || undefined
        })) || [];
        setPayments(paymentsFormatted);
      }

    } catch (error) {
      console.error('Error fetching customer history:', error);
    } finally {
      setLoading(false);
    }
  }, [customer]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!isOpen || !customer) return;

    // Fetch initial data
    fetchInitialData();

    // Real-time subscription for sales (orders)
    const salesChannel = supabase
      .channel(`sales-changes-${customer.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales',
          filter: `customer_id=eq.${customer.id}`,
        },
        (payload) => {
          console.log('Sales change detected:', payload);
          if (payload.eventType === 'INSERT' && payload.new) {
            const newSale = payload.new;
            if (newSale.total_amount >= 0) {
              const newOrder: Order = {
                id: newSale.id,
                date: newSale.timestamp || newSale.created_at || '',
                orderNumber: `ORD-${String(orders.length + 1).padStart(3, '0')}`,
                items: newSale.product_name,
                total: newSale.total_amount,
                quantity: Number(newSale.quantity) || 0,
                paymentMethod: (newSale.payment_method as 'cash' | 'mpesa' | 'bank' | 'debt' | 'partial' | 'split') || 'cash'
              };
              setOrders(prev => {
                if (prev.some(order => order.id === newOrder.id)) return prev;
                return [newOrder, ...prev].slice(0, 20);
              });
            }
          }
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedSale = payload.new;
            if (updatedSale.total_amount >= 0) {
              setOrders(prev => prev.map(order => 
                order.id === updatedSale.id 
                  ? {
                      ...order,
                      items: updatedSale.product_name,
                      total: updatedSale.total_amount,
                      date: updatedSale.timestamp || updatedSale.created_at || order.date,
                      quantity: Number(updatedSale.quantity) || order.quantity,
                      paymentMethod: (updatedSale.payment_method as 'cash' | 'mpesa' | 'bank' | 'debt' | 'partial' | 'split') || order.paymentMethod
                    }
                  : order
              ));
            }
          }
          if (payload.eventType === 'DELETE' && payload.old) {
            const deletedId = payload.old.id;
            setOrders(prev => prev.filter(order => order.id !== deletedId));
          }
        }
      )
      .subscribe();

    // Real-time subscription for debt payments
    const paymentsChannel = supabase
      .channel(`debt-payments-changes-${customer.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'debt_payments',
          filter: `customer_id=eq.${customer.id}`,
        },
        (payload) => {
          console.log('Debt payment change detected:', payload);
          if (payload.eventType === 'INSERT' && payload.new) {
            const p = payload.new;
            const newPayment: Payment = {
              id: p.id,
              date: p.timestamp || p.created_at || '',
              method: (p.payment_method as 'cash' | 'mpesa' | 'bank') || 'cash',
              amount: Number(p.amount),
              reference: p.reference || undefined,
            };
            setPayments(prev => {
              if (prev.some(pay => pay.id === newPayment.id)) return prev;
              return [newPayment, ...prev].slice(0, 20);
            });
          }

          if (payload.eventType === 'UPDATE' && payload.new) {
            const up = payload.new;
            setPayments(prev => prev.map(pay =>
              pay.id === up.id
                ? {
                    ...pay,
                    date: up.timestamp || up.created_at || pay.date,
                    method: (up.payment_method as 'cash' | 'mpesa' | 'bank') || 'cash',
                    amount: Number(up.amount),
                    reference: up.reference || undefined,
                  }
                : pay
            ));
          }

          if (payload.eventType === 'DELETE' && payload.old) {
            const deletedId = payload.old.id;
            setPayments(prev => prev.filter(pay => pay.id !== deletedId));
          }
        }
      )
      .subscribe();

    // Cleanup subscription when modal closes
    return () => {
      supabase.removeChannel(salesChannel);
      supabase.removeChannel(paymentsChannel);
    };
  }, [customer, isOpen, fetchInitialData, orders.length]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const toggleOrderExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setOrders([]);
      setPayments([]);
      setExpandedOrders(new Set());
      setActiveTab('orders');
    }
  }, [isOpen]);

  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`
          ${isMobile 
            ? 'fixed inset-0 left-0 right-0 top-0 bottom-0 translate-x-0 translate-y-0 max-w-none w-full h-full p-0 rounded-none'
            : 'max-w-2xl rounded-2xl p-0'
          } 
          bg-white dark:bg-gray-800 shadow-xl
        `}
        style={isMobile ? { left: 0, top: 0, transform: 'none' } : undefined}
      >
        {/* Mobile drag bar */}
        {isMobile && (
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-4" />
        )}
        
        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 p-0 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 z-10"
        >
          <X className="w-4 h-4" />
        </Button>

        <div className="h-full flex flex-col">
          {/* Sticky Header + Tabs + Column Headers */}
          <div className="sticky top-0 z-10 bg-white dark:bg-gray-800">
            {/* Title */}
            <div className="px-6 pt-6 pb-3">
              <h2 className="text-lg font-semibold text-foreground">History for {customer.name}</h2>
            </div>
            {/* Tabs */}
            <div className="px-6 border-b border-border">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`
                    flex-1 px-4 py-2 text-xs sm:text-sm font-medium transition-colors relative
                    ${activeTab === 'orders' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}
                  `}
                >
                  <Package className="w-4 h-4 inline mr-2" />
                  Orders ({orders.length})
                  {activeTab === 'orders' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`
                    flex-1 px-4 py-2 text-xs sm:text-sm font-medium transition-colors relative
                    ${activeTab === 'payments' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}
                  `}
                >
                  <CreditCard className="w-4 h-4 inline mr-2" />
                  Payments ({payments.length})
                  {activeTab === 'payments' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              </div>
            </div>
            {/* Column headers */}
            {activeTab === 'orders' && (
              <div className="px-6 py-2 border-b border-border text-[11px] sm:text-xs text-muted-foreground">
                <div className="grid grid-cols-6 gap-2">
                  <span>Date</span>
                  <span>Time</span>
                  <span>Order #</span>
                  <span>Qty</span>
                  <span>Method</span>
                  <span className="text-right">Total</span>
                </div>
              </div>
            )}
            {activeTab === 'payments' && (
              <div className="px-6 py-2 border-b border-border text-[11px] sm:text-xs text-muted-foreground">
                <div className="grid grid-cols-5 gap-2">
                  <span>Date</span>
                  <span>Time</span>
                  <span>Method</span>
                  <span className="text-right">Amount</span>
                  <span>Ref</span>
                </div>
              </div>
            )}
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 pb-[env(safe-area-inset-bottom,1rem)]">
            {activeTab === 'orders' && (
              <div>
                {loading ? (
                  <div className="divide-y divide-border">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="grid grid-cols-6 gap-2 py-2 text-xs animate-pulse">
                        <div className="h-3 bg-muted rounded" />
                        <div className="h-3 bg-muted rounded" />
                        <div className="h-3 bg-muted rounded" />
                        <div className="h-3 bg-muted rounded" />
                        <div className="h-3 bg-muted rounded" />
                        <div className="h-3 bg-muted rounded" />
                      </div>
                    ))}
                  </div>
                ) : orders.length ? (
                  <div className="divide-y divide-border">
                    {orders.map((o) => (
                      <div key={o.id} className="grid grid-cols-6 gap-2 py-2 text-xs sm:text-sm">
                        <span>{formatDate(o.date)}</span>
                        <span>{formatTime(o.date)}</span>
                        <span className="truncate" title={o.items}>{o.orderNumber}</span>
                        <span>{o.quantity}</span>
                        <span className="capitalize">{o.paymentMethod === 'mpesa' ? 'M-Pesa' : o.paymentMethod}</span>
                        <span className="text-right font-medium">{formatCurrency(o.total)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground text-sm">
                    <Package className="w-10 h-10 mx-auto mb-3 opacity-60" />
                    No orders found
                  </div>
                )}
              </div>
            )}

            {activeTab === 'payments' && (
              <div>
                {loading ? (
                  <div className="divide-y divide-border">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="grid grid-cols-5 gap-2 py-2 text-xs animate-pulse">
                        <div className="h-3 bg-muted rounded" />
                        <div className="h-3 bg-muted rounded" />
                        <div className="h-3 bg-muted rounded" />
                        <div className="h-3 bg-muted rounded" />
                        <div className="h-3 bg-muted rounded" />
                      </div>
                    ))}
                  </div>
                ) : payments.length ? (
                  <div className="divide-y divide-border">
                    {payments.map((p) => (
                      <div key={p.id} className="grid grid-cols-5 gap-2 py-2 text-xs sm:text-sm">
                        <span>{formatDate(p.date)}</span>
                        <span>{formatTime(p.date)}</span>
                        <span className="capitalize flex items-center gap-1">
                          {p.method === 'mpesa' ? <Smartphone className="w-3.5 h-3.5" /> : <Banknote className="w-3.5 h-3.5" />}
                          {p.method === 'mpesa' ? 'M-Pesa' : p.method}
                        </span>
                        <span className="text-right font-medium text-green-600 dark:text-green-400">{formatCurrency(p.amount)}</span>
                        <span className="truncate" title={p.reference}>{p.reference || '-'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground text-sm">
                    <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-60" />
                    No payments found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerHistoryModal;
