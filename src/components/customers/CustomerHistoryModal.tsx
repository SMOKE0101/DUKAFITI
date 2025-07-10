
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
  expanded?: boolean;
}

interface Payment {
  id: string;
  date: string;
  method: 'cash' | 'mpesa' | 'bank';
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
          total: sale.total_amount
        })) || [];
        setOrders(ordersData);
      }

      // Fetch payment data (including negative sales entries which represent payments)
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('sales')
        .select('*')
        .eq('customer_id', customer.id)
        .lt('total_amount', 0) // Negative amounts are payments
        .order('timestamp', { ascending: false })
        .limit(20);

      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
      } else {
        const paymentsFormatted = paymentsData?.map(payment => ({
          id: payment.id,
          date: payment.timestamp || payment.created_at || '',
          method: payment.payment_method as 'cash' | 'mpesa' | 'bank' || 'cash',
          amount: Math.abs(payment.total_amount), // Convert negative to positive for display
          reference: payment.payment_details?.reference || undefined
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

    // Set up real-time subscription for sales (orders)
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
              // Positive amount = order
              const newOrder: Order = {
                id: newSale.id,
                date: newSale.timestamp || newSale.created_at || '',
                orderNumber: `ORD-${String(orders.length + 1).padStart(3, '0')}`,
                items: newSale.product_name,
                total: newSale.total_amount
              };
              
              setOrders(prev => {
                // Avoid duplicates
                if (prev.some(order => order.id === newOrder.id)) return prev;
                return [newOrder, ...prev].slice(0, 20); // Keep only latest 20
              });
            } else {
              // Negative amount = payment
              const newPayment: Payment = {
                id: newSale.id,
                date: newSale.timestamp || newSale.created_at || '',
                method: newSale.payment_method as 'cash' | 'mpesa' | 'bank' || 'cash',
                amount: Math.abs(newSale.total_amount),
                reference: newSale.payment_details?.reference || undefined
              };
              
              setPayments(prev => {
                // Avoid duplicates
                if (prev.some(payment => payment.id === newPayment.id)) return prev;
                return [newPayment, ...prev].slice(0, 20); // Keep only latest 20
              });
            }
          }
          
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedSale = payload.new;
            
            if (updatedSale.total_amount >= 0) {
              // Update order
              setOrders(prev => prev.map(order => 
                order.id === updatedSale.id 
                  ? {
                      ...order,
                      items: updatedSale.product_name,
                      total: updatedSale.total_amount,
                      date: updatedSale.timestamp || updatedSale.created_at || order.date
                    }
                  : order
              ));
            } else {
              // Update payment
              setPayments(prev => prev.map(payment => 
                payment.id === updatedSale.id 
                  ? {
                      ...payment,
                      method: updatedSale.payment_method as 'cash' | 'mpesa' | 'bank' || 'cash',
                      amount: Math.abs(updatedSale.total_amount),
                      date: updatedSale.timestamp || updatedSale.created_at || payment.date,
                      reference: updatedSale.payment_details?.reference || undefined
                    }
                  : payment
              ));
            }
          }
          
          if (payload.eventType === 'DELETE' && payload.old) {
            const deletedId = payload.old.id;
            setOrders(prev => prev.filter(order => order.id !== deletedId));
            setPayments(prev => prev.filter(payment => payment.id !== deletedId));
          }
        }
      )
      .subscribe();

    // Cleanup subscription when modal closes
    return () => {
      supabase.removeChannel(salesChannel);
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
            ? 'fixed inset-x-0 bottom-0 top-[10%] rounded-t-2xl max-w-none w-full h-[90%] p-0'
            : 'max-w-2xl rounded-2xl p-0'
          } 
          bg-white dark:bg-gray-800 shadow-xl
        `}
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

        <div className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              History for {customer.name}
            </h2>
          </div>

          {/* Clean two-tab header */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
            <button
              onClick={() => setActiveTab('orders')}
              className={`
                flex-1 px-6 py-3 text-sm font-medium transition-all duration-200 relative
                ${activeTab === 'orders'
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }
              `}
            >
              <Package className="w-4 h-4 inline mr-2" />
              Orders ({orders.length})
              {activeTab === 'orders' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`
                flex-1 px-6 py-3 text-sm font-medium transition-all duration-200 relative
                ${activeTab === 'payments'
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }
              `}
            >
              <CreditCard className="w-4 h-4 inline mr-2" />
              Payments ({payments.length})
              {activeTab === 'payments' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400" />
              )}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {/* Orders Panel */}
            {activeTab === 'orders' && (
              <div className="h-full overflow-y-auto">
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="flex justify-between items-start mb-2">
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                        </div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                      </div>
                    ))}
                  </div>
                ) : orders.length > 0 ? (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <div 
                        key={order.id} 
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(order.date)}
                          </span>
                          <span className="font-medium text-sm">
                            {order.orderNumber}
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(order.total)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600 dark:text-gray-300 flex-1">
                            {order.items}
                          </div>
                          <button
                            onClick={() => toggleOrderExpansion(order.id)}
                            className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                          >
                            {expandedOrders.has(order.id) ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {expandedOrders.has(order.id) && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              <strong>Items:</strong> {order.items}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Package className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">No orders found</p>
                  </div>
                )}
              </div>
            )}

            {/* Payments Panel */}
            {activeTab === 'payments' && (
              <div className="h-full overflow-y-auto">
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="flex justify-between items-start mb-2">
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                        </div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                      </div>
                    ))}
                  </div>
                ) : payments.length > 0 ? (
                  <div className="space-y-3">
                    {payments.map((payment) => (
                      <div 
                        key={payment.id} 
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(payment.date)}
                          </span>
                          <div className="flex items-center gap-2">
                            {payment.method === 'mpesa' ? (
                              <Smartphone className="w-4 h-4 text-green-600" />
                            ) : (
                              <Banknote className="w-4 h-4 text-blue-600" />
                            )}
                            <span className="text-sm capitalize">
                              {payment.method === 'mpesa' ? 'M-Pesa' : payment.method}
                            </span>
                          </div>
                          <span className="font-semibold text-green-700 dark:text-green-400">
                            {formatCurrency(payment.amount)}
                          </span>
                        </div>
                        {payment.reference && (
                          <div className="text-xs text-gray-400">
                            Ref: {payment.reference}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <CreditCard className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">No payments found</p>
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
