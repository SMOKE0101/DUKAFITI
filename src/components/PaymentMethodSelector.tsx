import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Banknote, UserX, Split } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { Customer } from '../types';

interface PaymentMethodSelectorProps {
  total: number;
  customers: Customer[];
  onPaymentConfirm: (paymentData: {
    method: string;
    customerId?: string;
    cashAmount?: number;
    mpesaAmount?: number;
    debtAmount?: number;
    mpesaReference?: string;
  }) => void;
}

const PaymentMethodSelector = ({ total, customers, onPaymentConfirm }: PaymentMethodSelectorProps) => {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [cashAmount, setCashAmount] = useState(total);
  const [mpesaAmount, setMpesaAmount] = useState(0);
  const [debtAmount, setDebtAmount] = useState(0);
  const [mpesaReference, setMpesaReference] = useState('');

  // Update amounts when total changes
  useEffect(() => {
    if (paymentMethod === 'cash') {
      setCashAmount(total);
    } else if (paymentMethod === 'mpesa') {
      setMpesaAmount(total);
    } else if (paymentMethod === 'debt') {
      setDebtAmount(total);
    }
  }, [total, paymentMethod]);

  const handlePaymentMethodChange = (method: string) => {
    console.log('Payment method changed to:', method);
    setPaymentMethod(method);
    
    // Reset amounts based on selected method
    switch (method) {
      case 'cash':
        setCashAmount(total);
        setMpesaAmount(0);
        setDebtAmount(0);
        break;
      case 'mpesa':
        setCashAmount(0);
        setMpesaAmount(total);
        setDebtAmount(0);
        break;
      case 'debt':
        setCashAmount(0);
        setMpesaAmount(0);
        setDebtAmount(total);
        break;
      case 'partial':
        // Keep current amounts or distribute evenly
        if (cashAmount + mpesaAmount + debtAmount === 0) {
          setCashAmount(Math.round(total / 2 * 100) / 100);
          setMpesaAmount(Math.round((total - cashAmount) * 100) / 100);
          setDebtAmount(0);
        }
        break;
    }
  };

  const handleConfirmPayment = () => {
    console.log('Confirming payment with method:', paymentMethod);
    console.log('Total:', total, 'Cash:', cashAmount, 'Mpesa:', mpesaAmount, 'Debt:', debtAmount);
    
    const paymentData = {
      method: paymentMethod,
      customerId: selectedCustomerId || undefined,
      cashAmount: cashAmount > 0 ? Math.round(cashAmount * 100) / 100 : undefined,
      mpesaAmount: mpesaAmount > 0 ? Math.round(mpesaAmount * 100) / 100 : undefined,
      debtAmount: debtAmount > 0 ? Math.round(debtAmount * 100) / 100 : undefined,
      mpesaReference: mpesaReference.trim() || undefined,
    };

    console.log('Payment data being sent:', paymentData);
    onPaymentConfirm(paymentData);
  };

  const totalEntered = Math.round((cashAmount + mpesaAmount + debtAmount) * 100) / 100;
  const totalRequired = Math.round(total * 100) / 100;
  const isValidPayment = Math.abs(totalEntered - totalRequired) < 0.01;
  
  // Check if customer is required and selected for debt payments
  const isCustomerRequired = (paymentMethod === 'debt' || (paymentMethod === 'partial' && debtAmount > 0));
  const isCustomerSelected = selectedCustomerId && selectedCustomerId !== '';
  
  // Button should be enabled if payment is valid and customer requirements are met
  const isButtonEnabled = total > 0 && isValidPayment && (!isCustomerRequired || isCustomerSelected);

  console.log('Payment validation:', {
    total,
    totalEntered,
    totalRequired,
    isValidPayment,
    isCustomerRequired,
    isCustomerSelected,
    isButtonEnabled,
    paymentMethod
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard size={20} />
          Payment Method - {formatCurrency(total)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payment Method Selection */}
        <div>
          <Label>Payment Method</Label>
          <Select value={paymentMethod} onValueChange={handlePaymentMethodChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">
                <div className="flex items-center gap-2">
                  <Banknote size={16} />
                  Cash Payment
                </div>
              </SelectItem>
              <SelectItem value="mpesa">
                <div className="flex items-center gap-2">
                  <CreditCard size={16} />
                  M-Pesa Payment
                </div>
              </SelectItem>
              <SelectItem value="debt">
                <div className="flex items-center gap-2">
                  <UserX size={16} />
                  Add to Debt
                </div>
              </SelectItem>
              <SelectItem value="partial">
                <div className="flex items-center gap-2">
                  <Split size={16} />
                  Split Payment
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Customer Selection for Debt */}
        {isCustomerRequired && (
          <div>
            <Label>Select Customer *</Label>
            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose customer for debt payment" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!isCustomerSelected && (
              <p className="text-sm text-red-600 mt-1">Customer selection is required for debt payments</p>
            )}
          </div>
        )}

        {/* Payment Amount Inputs */}
        {paymentMethod === 'partial' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Cash Amount</Label>
              <Input
                type="number"
                value={cashAmount}
                onChange={(e) => setCashAmount(Number(e.target.value) || 0)}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label>M-Pesa Amount</Label>
              <Input
                type="number"
                value={mpesaAmount}
                onChange={(e) => setMpesaAmount(Number(e.target.value) || 0)}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label>Debt Amount</Label>
              <Input
                type="number"
                value={debtAmount}
                onChange={(e) => setDebtAmount(Number(e.target.value) || 0)}
                min="0"
                step="0.01"
              />
            </div>
          </div>
        )}

        {/* M-Pesa Reference */}
        {(paymentMethod === 'mpesa' || (paymentMethod === 'partial' && mpesaAmount > 0)) && (
          <div>
            <Label>M-Pesa Reference (Optional)</Label>
            <Input
              type="text"
              value={mpesaReference}
              onChange={(e) => setMpesaReference(e.target.value)}
              placeholder="Enter M-Pesa reference number"
            />
          </div>
        )}

        {/* Payment Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span>Total Required:</span>
            <span className="font-semibold">{formatCurrency(totalRequired)}</span>
          </div>
          {paymentMethod === 'partial' && (
            <>
              <div className="flex justify-between items-center mb-2">
                <span>Total Entered:</span>
                <span className={isValidPayment ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(totalEntered)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Difference:</span>
                <span className={isValidPayment ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(totalEntered - totalRequired)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Debug info for troubleshooting */}
        {!isButtonEnabled && (
          <div className="text-sm text-gray-600 bg-yellow-50 p-2 rounded">
            {total <= 0 && <div>• Cart is empty</div>}
            {!isValidPayment && <div>• Payment amounts don't match total</div>}
            {isCustomerRequired && !isCustomerSelected && <div>• Customer selection required</div>}
          </div>
        )}

        {/* Confirm Payment Button */}
        <Button 
          onClick={handleConfirmPayment}
          disabled={!isButtonEnabled}
          className="w-full"
        >
          {isButtonEnabled ? 'Confirm Payment' : 'Complete Payment Details'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PaymentMethodSelector;
