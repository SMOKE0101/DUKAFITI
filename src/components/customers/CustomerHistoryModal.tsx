
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Customer } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface Transaction {
  id: string;
  date: string;
  type: 'Sale' | 'Payment';
  amount: number;
  description?: string;
}

interface CustomerHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

const CustomerHistoryModal: React.FC<CustomerHistoryModalProps> = ({
  isOpen,
  onClose,
  customer
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock data for now - in real app, fetch from API
  useEffect(() => {
    if (customer && isOpen) {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        const mockTransactions: Transaction[] = [
          {
            id: '1',
            date: '2025-01-07',
            type: 'Sale',
            amount: 250,
            description: 'Rice 2kg, Cooking Oil 1L'
          },
          {
            id: '2',
            date: '2025-01-05',
            type: 'Payment',
            amount: -150,
            description: 'Cash payment'
          },
          {
            id: '3',
            date: '2025-01-03',
            type: 'Sale',
            amount: 180,
            description: 'Bread, Milk'
          },
          {
            id: '4',
            date: '2025-01-01',
            type: 'Payment',
            amount: -100,
            description: 'M-Pesa payment'
          },
          {
            id: '5',
            date: '2024-12-28',
            type: 'Sale',
            amount: 320,
            description: 'Sugar 2kg, Tea leaves'
          }
        ];
        setTransactions(mockTransactions);
        setLoading(false);
      }, 500);
    }
  }, [customer, isOpen]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-gray-800 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            History for {customer.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg animate-pulse">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-20"></div>
                    <div className="h-3 bg-gray-300 rounded w-16"></div>
                  </div>
                  <div className="h-4 bg-gray-300 rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.map((transaction, index) => (
                <div key={transaction.id}>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-sm">
                          {formatDate(transaction.date)}
                        </span>
                        <Badge 
                          className={`text-xs ${
                            transaction.type === 'Sale' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {transaction.type}
                        </Badge>
                      </div>
                      {transaction.description && (
                        <p className="text-xs text-gray-500 mt-1">
                          {transaction.description}
                        </p>
                      )}
                    </div>
                    <div className={`font-medium text-sm ${
                      transaction.type === 'Payment' 
                        ? 'text-green-600' 
                        : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {transaction.type === 'Payment' ? '-' : '+'}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </div>
                  </div>
                  {index < transactions.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No transaction history found
            </div>
          )}
        </div>

        {transactions.length > 0 && (
          <div className="pt-4 border-t">
            <Button
              variant="ghost"
              className="w-full text-purple-600 hover:text-purple-700"
            >
              Load More
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CustomerHistoryModal;
