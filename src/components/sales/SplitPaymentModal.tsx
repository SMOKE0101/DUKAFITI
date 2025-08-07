import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import MobileOptimizedModal from '@/components/ui/mobile-optimized-modal';
import { formatCurrency, parseCurrency } from '@/utils/currency';
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
  
  // Direct amount inputs
  const [directAmounts, setDirectAmounts] = useState<{
    cash: string;
    mpesa: string;
    debt: string;
  }>({
    cash: '',
    mpesa: '',
    debt: ''
  });

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setSelectedMethods({ cash: true, mpesa: true, debt: false });
      setSliderValues([50]);
      setMpesaReference('');
      setSelectedCustomerId('');
      setDirectAmounts({
        cash: (total / 2).toFixed(2),
        mpesa: (total / 2).toFixed(2),
        debt: '0.00'
      });
    }
  }, [open, total]);

  const handleMethodToggle = useCallback((method: keyof typeof selectedMethods, enabled: boolean) => {
    setSelectedMethods(prev => {
      const newMethods = { ...prev, [method]: enabled };
      const enabledCount = Object.values(newMethods).filter(Boolean).length;
      
      // Ensure at least 2 methods are selected for split payment
      if (enabledCount < 2) {
        return prev;
      }
      
      // Adjust slider values and amounts based on number of methods
      if (enabledCount === 2) {
        setSliderValues([50]);
        // Redistribute amounts evenly for 2 methods
        const enabledMethodKeys = Object.keys(newMethods).filter(key => newMethods[key as keyof typeof newMethods]);
        const amountPerMethod = (total / 2).toFixed(2);
        const newAmounts = { cash: '0.00', mpesa: '0.00', debt: '0.00' };
        enabledMethodKeys.forEach(key => {
          newAmounts[key as keyof typeof newAmounts] = amountPerMethod;
        });
        setDirectAmounts(newAmounts);
      } else if (enabledCount === 3) {
        setSliderValues([33, 67]);
        // Redistribute amounts evenly for 3 methods
        const amountPerMethod = (total / 3).toFixed(2);
        setDirectAmounts({
          cash: amountPerMethod,
          mpesa: amountPerMethod,
          debt: amountPerMethod
        });
      }
      
      return newMethods;
    });
  }, [total]);

  const calculateAmounts = useCallback(() => {
    const enabledMethods = Object.entries(selectedMethods)
      .filter(([, enabled]) => enabled)
      .map(([method]) => method);

    if (enabledMethods.length < 2) {
      return { methods: {}, total, isValid: false };
    }

    const methods: SplitPaymentData['methods'] = {};
    
    // Use direct amounts from inputs
    enabledMethods.forEach(method => {
      const amount = parseCurrency(directAmounts[method as keyof typeof directAmounts]) || 0;
      const actualTotal = enabledMethods.reduce((sum, m) => 
        sum + (parseCurrency(directAmounts[m as keyof typeof directAmounts]) || 0), 0);
      const percentage = actualTotal > 0 ? (amount / actualTotal) * 100 : 0;
      
      if (method === 'cash') {
        methods.cash = { amount, percentage };
      } else if (method === 'mpesa') {
        methods.mpesa = { amount, percentage, reference: mpesaReference };
      } else if (method === 'debt') {
        methods.debt = { amount, percentage, customerId: selectedCustomerId };
      }
    });

    // Remove customer validation from modal - this will be enforced in checkout
    const isValid = true;

    return { methods, total, isValid };
  }, [selectedMethods, directAmounts, total, mpesaReference, selectedCustomerId]);

  const paymentData = calculateAmounts();
  const enabledMethodsCount = Object.values(selectedMethods).filter(Boolean).length;

  const handleSliderChange = useCallback((values: number[]) => {
    setSliderValues(values);
    
    // Update amounts based on slider values
    const enabledMethods = Object.entries(selectedMethods)
      .filter(([, enabled]) => enabled)
      .map(([method]) => method);

    if (enabledMethods.length === 2) {
      const percentage1 = values[0];
      const percentage2 = 100 - percentage1;
      const amount1 = ((total * percentage1) / 100).toFixed(2);
      const amount2 = ((total * percentage2) / 100).toFixed(2);
      
      const newAmounts = { cash: '0.00', mpesa: '0.00', debt: '0.00' };
      newAmounts[enabledMethods[0] as keyof typeof newAmounts] = amount1;
      newAmounts[enabledMethods[1] as keyof typeof newAmounts] = amount2;
      setDirectAmounts(newAmounts);
    } else if (enabledMethods.length === 3) {
      const percentage1 = values[0];
      const percentage2 = values[1] - values[0];
      const percentage3 = 100 - values[1];
      const amounts = [
        ((total * percentage1) / 100).toFixed(2),
        ((total * percentage2) / 100).toFixed(2),
        ((total * percentage3) / 100).toFixed(2)
      ];
      
      const newAmounts = { cash: '0.00', mpesa: '0.00', debt: '0.00' };
      enabledMethods.forEach((method, index) => {
        newAmounts[method as keyof typeof newAmounts] = amounts[index];
      });
      setDirectAmounts(newAmounts);
    }
  }, [selectedMethods, total]);
  
  const handleAmountChange = useCallback((method: keyof typeof directAmounts, value: string) => {
    const newAmount = parseCurrency(value) || 0;
    const enabledMethods = Object.entries(selectedMethods)
      .filter(([, enabled]) => enabled)
      .map(([method]) => method);
    
    if (enabledMethods.length < 2) return;
    
    // Calculate remaining amount to distribute among other methods
    const remainingAmount = total - newAmount;
    const otherMethods = enabledMethods.filter(m => m !== method);
    
    const newAmounts = { ...directAmounts, [method]: value };
    
    // Auto-distribute remaining amount among other methods
    if (remainingAmount >= 0 && otherMethods.length > 0) {
      const amountPerOtherMethod = remainingAmount / otherMethods.length;
      otherMethods.forEach(otherMethod => {
        newAmounts[otherMethod as keyof typeof newAmounts] = amountPerOtherMethod.toFixed(2);
      });
    } else if (remainingAmount < 0) {
      // If entered amount exceeds total, set other methods to 0
      otherMethods.forEach(otherMethod => {
        newAmounts[otherMethod as keyof typeof newAmounts] = '0.00';
      });
    }
    
    setDirectAmounts(newAmounts);
    
    // Update slider based on new amounts
    const amounts = enabledMethods.map(method => parseCurrency(newAmounts[method as keyof typeof newAmounts]) || 0);
    const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);
    
    if (totalAmount > 0) {
      if (enabledMethods.length === 2) {
        const percentage1 = Math.round((amounts[0] / totalAmount) * 100);
        setSliderValues([Math.max(1, Math.min(99, percentage1))]);
      } else if (enabledMethods.length === 3) {
        const percentage1 = Math.round((amounts[0] / totalAmount) * 100);
        const percentage2 = Math.round(((amounts[0] + amounts[1]) / totalAmount) * 100);
        setSliderValues([
          Math.max(1, Math.min(98, percentage1)),
          Math.max(percentage1 + 1, Math.min(99, percentage2))
        ]);
      }
    }
  }, [directAmounts, selectedMethods, total]);

  const handleConfirm = () => {
    if (paymentData.isValid) {
      // Don't pass customerId from modal - let checkout handle customer selection
      const dataWithoutCustomerId = {
        ...paymentData,
        methods: {
          ...paymentData.methods,
          debt: paymentData.methods.debt ? {
            ...paymentData.methods.debt,
            customerId: undefined
          } : undefined
        }
      };
      onConfirm(dataWithoutCustomerId);
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
        <div className="space-y-2">
          <Label className="text-sm font-medium">Select Payment Methods (choose 2-3)</Label>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(selectedMethods).map(([method, enabled]) => (
              <Button
                key={method}
                variant={enabled ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleMethodToggle(method as keyof typeof selectedMethods, !enabled)}
                disabled={enabled && enabledMethodsCount === 2}
                className="flex-1 h-8 text-xs"
              >
                {paymentMethodIcons[method as keyof typeof paymentMethodIcons]}
                <span className="ml-1">{paymentMethodLabels[method as keyof typeof paymentMethodLabels]}</span>
              </Button>
            ))}
          </div>
          {selectedMethods.debt && (
            <p className="text-xs text-muted-foreground">Customer selection will be required at checkout for debt payment</p>
          )}
        </div>

        {/* Customer Selection for Debt - Removed from modal, will be enforced in checkout */}

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

            {/* Editable Amount Inputs */}
            <div className="space-y-2">
              {Object.entries(selectedMethods)
                .filter(([, enabled]) => enabled)
                .map(([method]) => (
                <div key={method} className="flex items-center gap-2 p-2 rounded bg-muted/30">
                  <div className="flex items-center gap-2 flex-1">
                    {paymentMethodIcons[method as keyof typeof paymentMethodIcons]}
                    <span className="text-sm font-medium min-w-[60px]">
                      {paymentMethodLabels[method as keyof typeof paymentMethodLabels]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-1">
                    <Input
                      type="number"
                      value={directAmounts[method as keyof typeof directAmounts]}
                      onChange={(e) => handleAmountChange(method as keyof typeof directAmounts, e.target.value)}
                      className="h-8 text-sm text-right flex-1 min-w-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      step="0.01"
                      min="0"
                      max={total}
                      placeholder="0.00"
                      onFocus={(e) => e.target.select()}
                    />
                    <div className="text-xs text-muted-foreground w-10 text-right">
                      {paymentData.methods[method as keyof typeof paymentData.methods]?.percentage.toFixed(0) || '0'}%
                    </div>
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
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
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