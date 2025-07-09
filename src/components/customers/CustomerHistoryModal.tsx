
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Package, CreditCard, Smartphone, Banknote } from 'lucide-react';
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
}

interface Payment {
  id: string;
  date: string;
  method: 'cash' | 'mpesa';
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
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isOpen && customer) {
      fetchData();
    }
  }, [isOpen, customer]);

  const fetchData = async () => {
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

      // Mock payment data (in a real app, fetch from payments table)
      const mockPayments: Payment[] = [
        {
          id: '1',
          date: new Date().toISOString(),
          method: 'mpesa',
          amount: 1500,
          reference: 'ABC123XYZ'
        },
        {
          id: '2',
          date: new Date(Date.now() - 86400000).toISOString(),
          method: 'cash',
          amount: 2000
        }
      ];
      setPayments(mockPayments);

    } catch (error) {
      console.error('Error fetching customer history:', error);
    } finally {
      setLoading(false);
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

  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`
          ${isMobile 
            ? 'fixed inset-x-0 bottom-0 top-[10%] rounded-t-2xl max-w-none w-full h-[90%] p-0'
            : 'max-w-lg rounded-2xl p-0'
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

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('orders')}
              className={`
                flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all duration-150
                ${activeTab === 'orders'
                  ? 'bg-purple-600 text-white'
                  : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                }
              `}
              role="tab"
              aria-selected={activeTab === 'orders'}
            >
              <Package className="w-4 h-4 inline mr-2" />
              Orders
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`
                flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all duration-150
                ${activeTab === 'payments'
                  ? 'bg-purple-600 text-white'
                  : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                }
              `}
              role="tab"
              aria-selected={activeTab === 'payments'}
            >
              <CreditCard className="w-4 h-4 inline mr-2" />
              Payments
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {/* Orders Panel */}
            {activeTab === 'orders' && (
              <div 
                className="h-full overflow-y-auto fade-in"
                role="tabpanel"
                aria-labelledby="orders-tab"
              >
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
                  <div className="space-y-4">
                    {orders.map((order, index) => (
                      <div 
                        key={order.id} 
                        className="pb-4 border-b border-gray-100 last:border-b-0 animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm text-gray-500">
                            {formatDate(order.date)}
                          </span>
                          <span className="font-semibold">
                            {order.orderNumber}
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(order.total)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {order.items}
                        </div>
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
              <div 
                className="h-full overflow-y-auto fade-in"
                role="tabpanel"
                aria-labelledby="payments-tab"
              >
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
                  <div className="space-y-4">
                    {payments.map((payment, index) => (
                      <div 
                        key={payment.id} 
                        className="pb-4 border-b border-gray-100 last:border-b-0 animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm text-gray-500">
                            {formatDate(payment.date)}
                          </span>
                          <div className="flex items-center gap-2">
                            {payment.method === 'mpesa' ? (
                              <Smartphone className="w-4 h-4 text-green-600" />
                            ) : (
                              <Banknote className="w-4 h-4 text-blue-600" />
                            )}
                            <span className="text-sm capitalize">
                              {payment.method === 'mpesa' ? 'M-Pesa' : 'Cash'}
                            </span>
                          </div>
                          <span className="font-semibold text-green-700">
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
