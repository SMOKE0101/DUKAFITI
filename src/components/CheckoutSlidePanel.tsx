
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, DollarSign, Smartphone } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { Customer } from '../types';

interface CheckoutSlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  selectedCustomer: Customer | null;
  onCustomerSelect: (customer: Customer | null) => void;
  cartTotal: number;
  onPaymentConfirm: (paymentData: any) => void;
}

const CheckoutSlidePanel: React.FC<CheckoutSlidePanelProps> = ({
  isOpen,
  onClose,
  customers,
  selectedCustomer,
  onCustomerSelect,
  cartTotal,
  onPaymentConfirm
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'credit' | 'partial'>('cash');
  const [cashAmount, setCashAmount] = useState(cartTotal);
  const [mpesaAmount, setMpesaAmount] = useState(0);
  const [mpesaReference, setMpesaReference] = useState('');
  const [debtAmount, setDebtAmount] = useState(0);

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method as any);
    
    switch (method) {
      case 'cash':
        setCashAmount(cartTotal);
        setMpesaAmount(0);
        setDebtAmount(0);
        break;
      case 'mpesa':
        setCashAmount(0);
        setMpesaAmount(cartTotal);
        setDebtAmount(0);
        break;
      case 'credit':
        setCashAmount(0);
        setMpesaAmount(0);
        setDebtAmount(cartTotal);
        break;
    }
  };

  const handleConfirm = () => {
    onPaymentConfirm({
      method: paymentMethod,
      customerId: selectedCustomer?.id,
      cashAmount,
      mpesaAmount,
      debtAmount,
      mpesaReference: mpesaReference || undefined,
    });
    onClose();
  };

  const isValid = () => {
    const total = cashAmount + mpesaAmount + debtAmount;
    return Math.abs(total - cartTotal) < 0.01;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Checkout - {formatCurrency(cartTotal)}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label>Payment Method</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                onClick={() => handlePaymentMethodChange('cash')}
                className="flex items-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                Cash
              </Button>
              <Button
                variant={paymentMethod === 'mpesa' ? 'default' : 'outline'}
                onClick={() => handlePaymentMethodChange('mpesa')}
                className="flex items-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                M-Pesa
              </Button>
              <Button
                variant={paymentMethod === 'credit' ? 'default' : 'outline'}
                onClick={() => handlePaymentMethodChange('credit')}
                className="flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Credit
              </Button>
              <Button
                variant={paymentMethod === 'partial' ? 'default' : 'outline'}
                onClick={() => handlePaymentMethodChange('partial')}
                className="flex items-center gap-2"
              >
                Mixed
              </Button>
            </div>
          </div>

          {/* Payment Amount Inputs */}
          {(paymentMethod === 'cash' || paymentMethod === 'partial') && (
            <div className="space-y-2">
              <Label>Cash Amount</Label>
              <Input
                type="number"
                value={cashAmount}
                onChange={(e) => setCashAmount(Number(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
          )}

          {(paymentMethod === 'mpesa' || paymentMethod === 'partial') && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>M-Pesa Amount</Label>
                <Input
                  type="number"
                  value={mpesaAmount}
                  onChange={(e) => setMpesaAmount(Number(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>M-Pesa Reference (Optional)</Label>
                <Input
                  value={mpesaReference}
                  onChange={(e) => setMpesaReference(e.target.value)}
                  placeholder="Transaction code"
                />
              </div>
            </div>
          )}

          {(paymentMethod === 'credit' || paymentMethod === 'partial') && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select
                  value={selectedCustomer?.id || ''}
                  onValueChange={(value) => {
                    const customer = customers.find(c => c.id === value);
                    onCustomerSelect(customer || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Credit Amount</Label>
                <Input
                  type="number"
                  value={debtAmount}
                  onChange={(e) => setDebtAmount(Number(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
            </div>
          )}

          {/* Payment Summary */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span>Total:</span>
              <span className="font-medium">{formatCurrency(cartTotal)}</span>
            </div>
            {cashAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span>Cash:</span>
                <span>{formatCurrency(cashAmount)}</span>
              </div>
            )}
            {mpesaAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span>M-Pesa:</span>
                <span>{formatCurrency(mpesaAmount)}</span>
              </div>
            )}
            {debtAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span>Credit:</span>
                <span>{formatCurrency(debtAmount)}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!isValid() || (debtAmount > 0 && !selectedCustomer)}
              className="flex-1"
            >
              Complete Sale
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CheckoutSlidePanel;
