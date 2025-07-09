
import { useState } from 'react';
import { User, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '../utils/currency';
import { Customer } from '../types';
import PaymentMethodSelector from './PaymentMethodSelector';

interface CheckoutSlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  selectedCustomer: Customer | null;
  onCustomerSelect: (customer: Customer | null) => void;
  cartTotal: number;
  onPaymentConfirm: (paymentData: {
    method: string;
    customerId?: string;
    cashAmount?: number;
    mpesaAmount?: number;
    debtAmount?: number;
    mpesaReference?: string;
  }) => void;
}

const CheckoutSlidePanel = ({
  isOpen,
  onClose,
  customers,
  selectedCustomer,
  onCustomerSelect,
  cartTotal,
  onPaymentConfirm
}: CheckoutSlidePanelProps) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Slide Panel */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-96 max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <h2 className="text-base sm:text-lg font-semibold">Checkout</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 space-y-4 sm:space-y-6 h-full overflow-y-auto pb-20">
          {/* Cart Total Display */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 sm:p-4 rounded-lg border">
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-600">Total Amount</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">{formatCurrency(cartTotal)}</p>
            </div>
          </div>

          {/* Customer Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User size={18} />
                Customer (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select 
                value={selectedCustomer?.id || ''} 
                onValueChange={(value) => {
                  const customer = customers.find(c => c.id === value) || null;
                  onCustomerSelect(customer);
                  console.log('Selected customer:', customer?.name || 'None');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Walk-in Customer</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCustomer && (
                <div className="mt-2 text-xs text-gray-600 bg-yellow-50 p-2 rounded">
                  Outstanding Debt: {formatCurrency(selectedCustomer.outstandingDebt)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Method */}
          <PaymentMethodSelector
            total={cartTotal}
            customers={customers}
            onPaymentConfirm={(paymentData) => {
              onPaymentConfirm(paymentData);
              onClose();
            }}
          />
        </div>
      </div>
    </>
  );
};

export default CheckoutSlidePanel;
