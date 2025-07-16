
import { User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '../utils/currency';
import { Customer } from '../types';
import PaymentMethodSelector from './PaymentMethodSelector';

interface CheckoutPanelProps {
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

const CheckoutPanel = ({
  customers,
  selectedCustomer,
  onCustomerSelect,
  cartTotal,
  onPaymentConfirm
}: CheckoutPanelProps) => {
  return (
    <div className="space-y-6">
      {/* Customer Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User size={20} />
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
            <div className="mt-2 text-xs text-gray-600">
              Outstanding Debt: {formatCurrency(selectedCustomer.outstanding_debt)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Method */}
      <PaymentMethodSelector
        total={cartTotal}
        customers={customers}
        onPaymentConfirm={onPaymentConfirm}
      />
    </div>
  );
};

export default CheckoutPanel;
