
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Customer } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { User, Phone, Mail, MapPin, Calendar, DollarSign, TrendingUp, CreditCard } from 'lucide-react';

interface CustomerDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

const CustomerDetailsDrawer: React.FC<CustomerDetailsDrawerProps> = ({
  isOpen,
  onClose,
  customer
}) => {
  if (!customer) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <SheetTitle className="font-mono text-xl font-black uppercase tracking-wider text-gray-900 dark:text-white">
            CUSTOMER DETAILS
          </SheetTitle>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Basic Info */}
          <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-transparent">
            <h3 className="font-mono text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-white mb-4">
              BASIC INFORMATION
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Name:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{customer.name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Phone:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{customer.phone}</p>
                </div>
              </div>

              {customer.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Email:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{customer.email}</p>
                  </div>
                </div>
              )}

              {customer.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Address:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{customer.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Financial Info */}
          <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-transparent">
            <h3 className="font-mono text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-white mb-4">
              FINANCIAL DETAILS
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Outstanding Debt:</span>
                </div>
                <Badge variant={customer.outstandingDebt > 0 ? "destructive" : "default"} className="rounded-full">
                  {formatCurrency(customer.outstandingDebt)}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Credit Limit:</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(customer.creditLimit || 0)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Purchases:</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(customer.totalPurchases || 0)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Risk Rating:</span>
                <Badge variant={
                  customer.riskRating === 'high' ? 'destructive' : 
                  customer.riskRating === 'medium' ? 'secondary' : 'default'
                } className="rounded-full">
                  {customer.riskRating?.toUpperCase() || 'LOW'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Timeline Info */}
          <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-transparent">
            <h3 className="font-mono text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-white mb-4">
              TIMELINE
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Customer Since:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {customer.createdDate ? new Date(customer.createdDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              {customer.lastPurchaseDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Last Purchase:</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(customer.lastPurchaseDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4">
            <Button
              onClick={onClose}
              className="w-full h-12 bg-gray-600 hover:bg-gray-700 text-white rounded-full font-mono font-bold uppercase tracking-wide"
            >
              CLOSE
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CustomerDetailsDrawer;
