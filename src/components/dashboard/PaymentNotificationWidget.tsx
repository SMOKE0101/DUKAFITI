
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/currency';
import { Bell, Smartphone, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface RecentPayment {
  id: string;
  amount: number;
  phone_number: string;
  status: string;
  created_at: string;
}

const PaymentNotificationWidget = () => {
  const { user } = useAuth();
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadRecentPayments();
      setupRealtimeSubscription();
    }
  }, [user]);

  const loadRecentPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('mpesa_notifications')
        .select('id, amount, phone_number, status, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentPayments(data || []);
    } catch (error) {
      console.error('Error loading recent payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('payment-widget')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mpesa_notifications',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          loadRecentPayments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="w-5 h-5 text-green-600" />
          Recent M-Pesa Payments
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentPayments.length === 0 ? (
          <div className="text-center py-6">
            <Smartphone className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No recent payments</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-green-600">
                      {formatCurrency(payment.amount)}
                    </span>
                    <Badge variant={payment.status === 'processed' ? 'default' : 'secondary'} className="text-xs">
                      {payment.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600">
                    <span>{payment.phone_number}</span>
                    <span className="ml-2">
                      {format(new Date(payment.created_at), 'MMM d, HH:mm')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            <Button variant="outline" size="sm" className="w-full mt-3">
              <span>View All Payments</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentNotificationWidget;
