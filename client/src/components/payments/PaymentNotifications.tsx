
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '../../hooks/use-toast';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/currency';
import { Bell, CheckCircle, Clock, AlertCircle, Smartphone } from 'lucide-react';
import { format } from 'date-fns';

interface PaymentNotification {
  id: string;
  amount: number;
  phone_number: string;
  mpesa_receipt_number: string;
  transaction_date: string;
  customer_name?: string;
  status: 'pending' | 'processed' | 'failed';
  created_at: string;
  processed_at?: string;
}

const PaymentNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<PaymentNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      // TODO: Replace with actual M-Pesa notifications table when available
      // For now, using mock data
      const mockNotifications: PaymentNotification[] = [
        {
          id: '1',
          amount: 1500,
          phone_number: '254700000000',
          mpesa_receipt_number: 'QDJ7LTXA12',
          transaction_date: new Date().toISOString(),
          customer_name: 'John Doe',
          status: 'processed',
          created_at: new Date().toISOString(),
          processed_at: new Date().toISOString(),
        },
        {
          id: '2',
          amount: 2500,
          phone_number: '254711111111',
          mpesa_receipt_number: 'QDJ7LTXA13',
          transaction_date: new Date(Date.now() - 3600000).toISOString(),
          status: 'pending',
          created_at: new Date(Date.now() - 3600000).toISOString(),
        }
      ];
      
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error loading payment notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load payment notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async (notificationId: string) => {
    try {
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, status: 'processed', processed_at: new Date().toISOString() }
            : n
        )
      );

      toast({
        title: "Payment Processed",
        description: "Payment has been marked as processed",
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Error",
        description: "Failed to process payment",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>;
      case 'processed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Processed
        </Badge>;
      case 'failed':
        return <Badge variant="destructive">
          <AlertCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600" />
          M-Pesa Payment Notifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No payment notifications yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Payments to your till number will appear here automatically
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-lg text-green-600">
                      {formatCurrency(notification.amount)}
                    </span>
                    {getStatusBadge(notification.status)}
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">From:</span>
                      <span>{notification.phone_number}</span>
                      {notification.customer_name && (
                        <span className="text-blue-600">({notification.customer_name})</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="font-medium">M-Pesa Receipt:</span>
                      <span className="font-mono">{notification.mpesa_receipt_number}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Time:</span>
                      <span>{format(new Date(notification.created_at), 'PPp')}</span>
                    </div>
                  </div>
                </div>
                
                {notification.status === 'pending' && (
                  <Button
                    size="sm"
                    onClick={() => processPayment(notification.id)}
                    className="ml-4"
                  >
                    Mark as Processed
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentNotifications;
