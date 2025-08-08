import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ColoredPaymentSlider } from '@/components/ui/colored-payment-slider';
import { Input } from '@/components/ui/input';
import MobileOptimizedModal from '@/components/ui/mobile-optimized-modal';
import { formatCurrency, parseCurrency } from '@/utils/currency';
import { Customer } from '@/types';
import { Banknote, CreditCard, UserX, Split, Percent } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import type { SplitPaymentData } from '@/types/cart';

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
    debt: false,
    discount: false,
  });

  const [sliderValues, setSliderValues] = useState([50]);
  const [mpesaReference, setMpesaReference] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  
  // Direct amount inputs
  const [directAmounts, setDirectAmounts] = useState<{
    cash: string;
    mpesa: string;
    debt: string;
    discount: string;
  }>({
    cash: '',
    mpesa: '',
    debt: '',
    discount: '0.00'
  });

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setSelectedMethods({ cash: true, mpesa: true, debt: false, discount: false });
      setSliderValues([50]);
      setMpesaReference('');
      setSelectedCustomerId('');
      setDirectAmounts({
        cash: (total / 2).toFixed(2),
        mpesa: (total / 2).toFixed(2),
        debt: '0.00',
        discount: '0.00'
      });
    }
  }, [open, total]);

  const handleMethodToggle = useCallback((method: keyof typeof selectedMethods, enabled: boolean) => {
    setSelectedMethods(prev => {
      // Discount doesn't affect slider requirements
      if (method === 'discount') {
        return { ...prev, discount: enabled };
      }

      const newMethods = { ...prev, [method]: enabled };
      const enabledCount = Object.entries(newMethods)
        .filter(([k, v]) => k !== 'discount' && v)
        .length;
      
      // Ensure at least 2 non-discount methods are selected for split payment
      if (enabledCount < 2) {
        return prev;
      }
      
      // Adjust slider values and amounts based on number of methods (excluding discount)
      const activeMethods = Object.keys(newMethods).filter(key => key !== 'discount' && newMethods[key as keyof typeof newMethods]);
      if (enabledCount === 2) {
        setSliderValues([50]);
        const amountPerMethod = (total / 2).toFixed(2);
        const newAmounts = { ...directAmounts, cash: '0.00', mpesa: '0.00', debt: '0.00' };
        activeMethods.forEach(key => { newAmounts[key as keyof typeof newAmounts] = amountPerMethod; });
        setDirectAmounts(newAmounts);
      } else if (enabledCount === 3) {
        setSliderValues([33, 67]);
        const amountPerMethod = (total / 3).toFixed(2);
        setDirectAmounts({
          ...directAmounts,
          cash: amountPerMethod,
          mpesa: amountPerMethod,
          debt: amountPerMethod,
        });
      }
      
      return newMethods;
    });
  }, [total, directAmounts]);

  const calculateAmounts = useCallback(() => {
    const enabledMethods = Object.entries(selectedMethods)
      .filter(([k, enabled]) => enabled && k !== 'discount')
      .map(([method]) => method);

    if (enabledMethods.length < 2) {
      return { methods: {}, total, isValid: false };
    }

    const methods: SplitPaymentData['methods'] = {};
    
    // Use direct amounts from inputs for payment methods
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

    // Discount (optional, separate)
    const discountAmount = parseCurrency(directAmounts.discount) || 0;
    if (selectedMethods.discount && discountAmount > 0) {
      const pct = total > 0 ? (discountAmount / total) * 100 : 0;
      methods.discount = { amount: discountAmount, percentage: pct };
    }

    // Remove customer validation from modal - this will be enforced in checkout
    const isValid = true;

    return { methods, total, isValid };
  }, [selectedMethods, directAmounts, total, mpesaReference, selectedCustomerId]);

  const paymentData = calculateAmounts();
  const enabledMethodsCount = Object.values(selectedMethods).filter(Boolean).length;
  const sliderMethodCount = Object.entries(selectedMethods).filter(([k, v]) => v && k !== 'discount').length;

  const handleSliderChange = useCallback((values: number[]) => {
    setSliderValues(values);
    
    const enabledMethods = Object.entries(selectedMethods)
      .filter(([k, enabled]) => enabled && k !== 'discount')
      .map(([method]) => method);

    if (enabledMethods.length === 2) {
      const percentage1 = values[0];
      const percentage2 = 100 - percentage1;
      const amount1 = ((total * percentage1) / 100).toFixed(2);
      const amount2 = ((total * percentage2) / 100).toFixed(2);
      
      const newAmounts = { ...directAmounts, cash: '0.00', mpesa: '0.00', debt: '0.00' } as typeof directAmounts;
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
      
      const newAmounts = { ...directAmounts, cash: '0.00', mpesa: '0.00', debt: '0.00' } as typeof directAmounts;
      enabledMethods.forEach((method, index) => {
        newAmounts[method as keyof typeof newAmounts] = amounts[index];
      });
      setDirectAmounts(newAmounts);
    }
  }, [selectedMethods, total, directAmounts]);
  
  const handleAmountChange = useCallback((method: keyof typeof directAmounts, value: string) => {
    // Discount is independent from split distribution
    if (method === 'discount') {
      setDirectAmounts(prev => ({ ...prev, discount: value }));
      return;
    }

    const newAmount = parseCurrency(value) || 0;
    const enabledMethods = Object.entries(selectedMethods)
      .filter(([k, enabled]) => enabled && k !== 'discount')
      .map(([method]) => method);
    
    if (enabledMethods.length < 2) return;
    
    // Calculate remaining amount to distribute among other methods
    const remainingAmount = total - newAmount;
    const otherMethods = enabledMethods.filter(m => m !== method);
    
    const newAmounts = { ...directAmounts, [method]: value } as typeof directAmounts;
    
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
    
    // Update slider based on new amounts (excluding discount)
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
    debt: <UserX className="h-4 w-4" />,
    discount: <Percent className="h-4 w-4" />,
  };

  const paymentMethodLabels = {
    cash: 'Cash',
    mpesa: 'M-Pesa',
    debt: 'Debt',
    discount: 'Discount',
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
                disabled={(enabled && ['cash','mpesa','debt'].includes(method) && sliderMethodCount === 2)}
                className={`flex-1 h-8 text-xs ${method === 'discount' && enabled ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}`}
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
        {sliderMethodCount >= 2 && (
          <div className="space-y-4">
            <Label className="text-sm font-medium">Payment Ratio</Label>
            
            {/* Color-Coded Payment Slider */}
            <div className="px-2">
              <ColoredPaymentSlider
                value={sliderValues}
                onValueChange={handleSliderChange}
                min={1}
                max={99}
                step={1}
                className="w-full"
                thumbs={enabledMethodsCount === 3 ? 2 : 1}
                paymentMethods={Object.entries(selectedMethods)
                  .filter(([, enabled]) => enabled)
                  .map(([method]) => method)}
              />
            </div>

            {/* Enhanced Amount Inputs with Better UI */}
            <div className="space-y-3">
              {Object.entries(selectedMethods)
                .filter(([, enabled]) => enabled)
                .map(([method]) => {
                  const isDebt = method === 'debt';
                  const isCash = method === 'cash';
                  const isMpesa = method === 'mpesa';
                  const isDiscount = method === 'discount';
                  
                  return (
                    <div 
                      key={method} 
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 ${
                        isDiscount
                          ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800'
                          : isDebt 
                            ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800' 
                            : isCash 
                              ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                              : 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <div className={`p-2 rounded-full ${
                          isDiscount
                            ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                            : isDebt 
                              ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                              : isCash 
                                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {paymentMethodIcons[method as keyof typeof paymentMethodIcons]}
                        </div>
                        <span className={`text-sm font-semibold min-w-[60px] ${
                          isDiscount
                            ? 'text-amber-700 dark:text-amber-300'
                            : isDebt 
                              ? 'text-red-700 dark:text-red-300' 
                              : isCash 
                                ? 'text-green-700 dark:text-green-300'
                                : 'text-blue-700 dark:text-blue-300'
                        }`}>
                          {paymentMethodLabels[method as keyof typeof paymentMethodLabels]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="number"
                          value={directAmounts[method as keyof typeof directAmounts]}
                          onChange={(e) => handleAmountChange(method as keyof typeof directAmounts, e.target.value)}
                          className={`h-10 text-sm text-right flex-1 min-w-0 border-2 font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                            isDiscount
                              ? 'border-amber-300 focus:border-amber-500 bg-white dark:bg-amber-950/10'
                              : isDebt 
                                ? 'border-red-300 focus:border-red-500 bg-white dark:bg-red-950/10' 
                                : isCash 
                                  ? 'border-green-300 focus:border-green-500 bg-white dark:bg-green-950/10'
                                  : 'border-blue-300 focus:border-blue-500 bg-white dark:bg-blue-950/10'
                          }`}
                          step="0.01"
                          min="0"
                          max={total}
                          placeholder="0.00"
                          onFocus={(e) => e.target.select()}
                        />
                        <div className={`text-xs font-semibold w-12 text-right px-2 py-1 rounded ${
                          isDiscount
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                            : isDebt 
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' 
                              : isCash 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}>
                          {paymentData.methods[method as keyof typeof paymentData.methods]?.percentage.toFixed(0) || '0'}%
                        </div>
                      </div>
                    </div>
                  );
                })}
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