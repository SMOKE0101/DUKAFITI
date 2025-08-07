import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import MobileOptimizedModal from '@/components/ui/mobile-optimized-modal';
import { formatCurrency } from '@/utils/currency';
import { Customer } from '@/types';
import { Banknote, CreditCard, UserX, Split } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SplitPaymentData {
  methods: {
    cash?: { amount: number; percentage: number };
    mpesa?: { amount: number; percentage: number; reference?: string };
    debt?: { amount: number; percentage: number; customerId?: string };
  };
  total: number;
  isValid: boolean;
}

interface SplitPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  customers: Customer[];
  onConfirm: (data: SplitPaymentData) => void;
}

const SplitPaymentModal: React.FC<SplitPaymentModalProps> = ({
  open,
  onOpenChange,
  total,
  customers,
  onConfirm
}) => {
  const [selectedMethods, setSelectedMethods] = useState({
    cash: false,
    mpesa: false,
    debt: false
  });

  const [sliderValues, setSliderValues] = useState([50]);
  const [mpesaReference, setMpesaReference] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setSelectedMethods({ cash: true, mpesa: true, debt: false });
      setSliderValues([50]);
      setMpesaReference('');
      setSelectedCustomerId('');
    }
  }, [open]);

  const handleMethodToggle = useCallback((method: keyof typeof selectedMethods, enabled: boolean) => {
    setSelectedMethods(prev => {
      const newMethods = { ...prev, [method]: enabled };
      const enabledCount = Object.values(newMethods).filter(Boolean).length;
      
      // Ensure at least 2 methods are selected for split payment
      if (enabledCount < 2) {
        return prev;
      }
      
      // Adjust slider values based on number of methods
      if (enabledCount === 2) {
        setSliderValues([50]);
      } else if (enabledCount === 3) {
        setSliderValues([33, 67]);
      }
      
      return newMethods;
    });
  }, []);

  const calculateAmounts = useCallback(() => {
    const enabledMethods = Object.entries(selectedMethods)
      .filter(([, enabled]) => enabled)
      .map(([method]) => method);

    if (enabledMethods.length < 2) {
      return { methods: {}, total, isValid: false };
    }

    const methods: SplitPaymentData['methods'] = {};

    if (enabledMethods.length === 2) {
      const percentage1 = sliderValues[0];
      const percentage2 = 100 - percentage1;
      const amount1 = (total * percentage1) / 100;
      const amount2 = (total * percentage2) / 100;

      const [method1, method2] = enabledMethods;
      
      if (method1 === 'cash') methods.cash = { amount: amount1, percentage: percentage1 };
      else if (method1 === 'mpesa') methods.mpesa = { amount: amount1, percentage: percentage1, reference: mpesaReference };
      else if (method1 === 'debt') methods.debt = { amount: amount1, percentage: percentage1, customerId: selectedCustomerId };

      if (method2 === 'cash') methods.cash = { amount: amount2, percentage: percentage2 };
      else if (method2 === 'mpesa') methods.mpesa = { amount: amount2, percentage: percentage2, reference: mpesaReference };
      else if (method2 === 'debt') methods.debt = { amount: amount2, percentage: percentage2, customerId: selectedCustomerId };
      
    } else if (enabledMethods.length === 3) {
      const percentage1 = sliderValues[0];
      const percentage2 = sliderValues[1] - sliderValues[0];
      const percentage3 = 100 - sliderValues[1];
      
      const amounts = [
        (total * percentage1) / 100,
        (total * percentage2) / 100,
        (total * percentage3) / 100
      ];

      enabledMethods.forEach((method, index) => {
        if (method === 'cash') methods.cash = { amount: amounts[index], percentage: [percentage1, percentage2, percentage3][index] };
        else if (method === 'mpesa') methods.mpesa = { amount: amounts[index], percentage: [percentage1, percentage2, percentage3][index], reference: mpesaReference };
        else if (method === 'debt') methods.debt = { amount: amounts[index], percentage: [percentage1, percentage2, percentage3][index], customerId: selectedCustomerId };
      });
    }

    const isValid = selectedMethods.debt ? !!selectedCustomerId : true;

    return { methods, total, isValid };
  }, [selectedMethods, sliderValues, total, mpesaReference, selectedCustomerId]);

  const paymentData = calculateAmounts();
  const enabledMethodsCount = Object.values(selectedMethods).filter(Boolean).length;

  const handleSliderChange = useCallback((values: number[]) => {
    setSliderValues(values);
  }, []);

  const handleConfirm = () => {
    if (paymentData.isValid) {
      onConfirm(paymentData);
      onOpenChange(false);
    }
  };

  const paymentMethodIcons = {
    cash: <Banknote className="h-4 w-4" />,
    mpesa: <CreditCard className="h-4 w-4" />,
    debt: <UserX className="h-4 w-4" />
  };

  const paymentMethodLabels = {
    cash: 'Cash',
    mpesa: 'M-Pesa',
    debt: 'Debt'
  };

  return (
    <MobileOptimizedModal
      open={open}
      onOpenChange={onOpenChange}
      title="Split Payment"
      description={`Total: ${formatCurrency(total)}`}
      maxHeight="calc(100vh - 4rem)"
    >
      <div className="space-y-6">
        {/* Payment Method Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Select Payment Methods (choose 2-3)</Label>
          <div className="space-y-3">
            {Object.entries(selectedMethods).map(([method, enabled]) => (
              <div key={method} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-3">
                  {paymentMethodIcons[method as keyof typeof paymentMethodIcons]}
                  <span className="font-medium">{paymentMethodLabels[method as keyof typeof paymentMethodLabels]}</span>
                  {method === 'debt' && enabled && !selectedCustomerId && (
                    <span className="text-xs text-destructive">Customer required</span>
                  )}
                </div>
                <Switch
                  checked={enabled}
                  onCheckedChange={(checked) => handleMethodToggle(method as keyof typeof selectedMethods, checked)}
                  disabled={enabled && enabledMethodsCount === 2}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Customer Selection for Debt */}
        {selectedMethods.debt && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Select Customer *</Label>
            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Choose customer for debt payment" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    <div className="flex flex-col">
                      <span>{customer.name}</span>
                      <span className="text-xs text-muted-foreground">{customer.phone}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Split Ratio Controls */}
        {enabledMethodsCount >= 2 && (
          <div className="space-y-4">
            <Label className="text-sm font-medium">Payment Ratio</Label>
            
            {/* Horizontal Slider */}
            <div className="px-2">
              <Slider
                value={sliderValues}
                onValueChange={handleSliderChange}
                min={1}
                max={99}
                step={1}
                className="w-full"
                thumbs={enabledMethodsCount === 3 ? 2 : 1}
              />
            </div>

            {/* Method Labels and Amounts */}
            <div className="space-y-2">
              {Object.entries(paymentData.methods).map(([method, data]) => (
                <div key={method} className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div className="flex items-center gap-2">
                    {paymentMethodIcons[method as keyof typeof paymentMethodIcons]}
                    <span className="text-sm font-medium">
                      {paymentMethodLabels[method as keyof typeof paymentMethodLabels]}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{formatCurrency(data.amount)}</div>
                    <div className="text-xs text-muted-foreground">{data.percentage.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* M-Pesa Reference */}
        {selectedMethods.mpesa && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">M-Pesa Reference (Optional)</Label>
            <Input
              type="text"
              value={mpesaReference}
              onChange={(e) => setMpesaReference(e.target.value)}
              placeholder="Enter M-Pesa reference number"
              className="h-10"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!paymentData.isValid || enabledMethodsCount < 2}
            className="flex-1"
          >
            <Split className="h-4 w-4 mr-2" />
            Apply Split
          </Button>
        </div>
      </div>
    </MobileOptimizedModal>
  );
};

export default SplitPaymentModal;