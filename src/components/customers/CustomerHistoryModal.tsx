
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Package, CreditCard } from 'lucide-react';
import { Customer } from '../../types';
import { formatCurrency } from '../../utils/currency';

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

  // Mock data - in real app would come from API
  const mockOrders: Order[] = [
    {
      id: '1',
      date: '2024-01-15',
      orderNumber: 'ORD-001',
      items: ['Rice 2kg', 'Sugar 1kg', 'Oil 500ml'],
      total: 1250
    },
    {
      id: '2',
      date: '2024-01-10',
      orderNumber: 'ORD-002',
      items: ['Bread', 'Milk 1L'],
      total: 450
    },
    {
      id: '3',
      date: '2024-01-05',
      orderNumber: 'ORD-003',
      items: ['Maize flour 2kg', 'Beans 1kg', 'Tomatoes'],
      total: 890
    }
  ];

  const mockPayments: Payment[] = [
    {
      id: '1',
      date: '2024-01-14',
      method: 'M-Pesa',
      amount: 1000,
      reference: 'NLJ7RT61SX'
    },
    {
      id: '2',
      date: '2024-01-08',
      method: 'Cash',
      amount: 500
    },
    {
      id: '3',
      date: '2024-01-03',
      method: 'M-Pesa',
      amount: 750,
      reference: 'MLK5QT82PY'
    }
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case 'm-pesa':
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

          <TabsContent value="orders" className="mt-4 space-y-3">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {mockOrders.map((order) => (
                <Card key={order.id} className="p-4">
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
              ))}
            </div>
            <Button variant="ghost" className="w-full text-sm text-primary">
              Load more orders
            </Button>
          </TabsContent>

          <TabsContent value="payments" className="mt-4 space-y-3">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {mockPayments.map((payment) => (
                <Card key={payment.id} className="p-4">
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
              ))}
            </div>
            <Button variant="ghost" className="w-full text-sm text-primary">
              Load more payments
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerHistoryModal;
