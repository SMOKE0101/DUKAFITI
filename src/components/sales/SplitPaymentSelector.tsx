import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency } from '@/utils/currency';
import { CreditCard, Banknote, UserX, Split } from 'lucide-react';
import { Customer } from '@/types';
import { SplitPaymentData } from '@/types/cart';

interface PaymentMethod {
  id: 'cash' | 'mpesa' | 'debt';
  label: string;
  icon: React.ReactNode;
  color: string;
}


interface SplitPaymentSelectorProps {
  total: number;
  customers: Customer[];
  onPaymentChange: (data: SplitPaymentData) => void;
  selectedCustomerId?: string;
  onCustomerChange?: (customerId: string | undefined) => void;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'cash',
    label: 'Cash',
    icon: <Banknote size={16} />,
    color: 'hsl(var(--chart-1))'
  },
  {
    id: 'mpesa',
    label: 'M-Pesa',
    icon: <CreditCard size={16} />,
    color: 'hsl(var(--chart-2))'
  },
  {
    id: 'debt',
    label: 'Debt',
    icon: <UserX size={16} />,
    color: 'hsl(var(--chart-3))'
  }
];

export const SplitPaymentSelector: React.FC<SplitPaymentSelectorProps> = ({
  total,
  customers,
  onPaymentChange,
  selectedCustomerId,
  onCustomerChange
}) => {
  const [selectedMethods, setSelectedMethods] = useState<Set<string>>(new Set(['cash']));
  const [percentages, setPercentages] = useState<Record<string, number>>({ cash: 100 });
  const [mpesaReference, setMpesaReference] = useState('');

  const methodsArray = Array.from(selectedMethods);
  const isMultiplePayments = selectedMethods.size > 1;

  // Calculate amounts based on percentages
  const calculateAmounts = useCallback((currentPercentages: Record<string, number>) => {
    const methods: SplitPaymentData['methods'] = {};
    let totalPercentage = 0;

    methodsArray.forEach(methodId => {
      const percentage = currentPercentages[methodId] || 0;
      const amount = Math.round((total * percentage / 100) * 100) / 100;
      totalPercentage += percentage;

      if (methodId === 'cash') {
        methods.cash = { amount, percentage };
      } else if (methodId === 'mpesa') {
        methods.mpesa = { amount, percentage, reference: mpesaReference || undefined };
      } else if (methodId === 'debt') {
        methods.debt = { amount, percentage, customerId: selectedCustomerId };
      }
    });

    const isValid = Math.abs(totalPercentage - 100) < 0.01 && 
                   (!methods.debt || !!selectedCustomerId);

    return { methods, total, isValid };
  }, [methodsArray, total, mpesaReference, selectedCustomerId]);

  // Handle method selection changes
  const handleMethodToggle = useCallback((methodId: string, checked: boolean) => {
    const newSelectedMethods = new Set(selectedMethods);
    
    if (checked) {
      newSelectedMethods.add(methodId);
    } else {
      newSelectedMethods.delete(methodId);
    }

    // Ensure at least one method is selected
    if (newSelectedMethods.size === 0) {
      newSelectedMethods.add('cash');
    }

    setSelectedMethods(newSelectedMethods);

    // Redistribute percentages equally
    const methodCount = newSelectedMethods.size;
    const equalPercentage = Math.round((100 / methodCount) * 100) / 100;
    const newPercentages: Record<string, number> = {};
    
    Array.from(newSelectedMethods).forEach((method, index) => {
      if (index === newSelectedMethods.size - 1) {
        // Last method gets the remainder to ensure total is 100%
        const usedPercentage = (methodCount - 1) * equalPercentage;
        newPercentages[method] = Math.round((100 - usedPercentage) * 100) / 100;
      } else {
        newPercentages[method] = equalPercentage;
      }
    });

    setPercentages(newPercentages);
  }, [selectedMethods]);

  // Handle slider changes for 2 methods
  const handleTwoMethodSlider = useCallback((values: number[]) => {
    if (methodsArray.length !== 2) return;
    
    const [method1, method2] = methodsArray;
    const percentage1 = values[0];
    const percentage2 = 100 - percentage1;
    
    setPercentages({
      [method1]: Math.round(percentage1 * 100) / 100,
      [method2]: Math.round(percentage2 * 100) / 100
    });
  }, [methodsArray]);

  // Handle slider changes for 3 methods
  const handleThreeMethodSlider = useCallback((values: number[]) => {
    if (methodsArray.length !== 3) return;
    
    const [method1, method2, method3] = methodsArray;
    const slider1 = values[0]; // First divider position
    const slider2 = values[1]; // Second divider position
    
    // Ensure slider2 is always greater than slider1
    const adjustedSlider2 = Math.max(slider2, slider1 + 5);
    
    const percentage1 = slider1;
    const percentage2 = adjustedSlider2 - slider1;
    const percentage3 = 100 - adjustedSlider2;
    
    setPercentages({
      [method1]: Math.round(percentage1 * 100) / 100,
      [method2]: Math.round(percentage2 * 100) / 100,
      [method3]: Math.round(percentage3 * 100) / 100
    });
  }, [methodsArray]);

  // Update payment data when percentages change
  useEffect(() => {
    const paymentData = calculateAmounts(percentages);
    onPaymentChange(paymentData);
  }, [percentages, calculateAmounts, onPaymentChange]);

  // Get method info by id
  const getMethodInfo = (methodId: string) => 
    PAYMENT_METHODS.find(m => m.id === methodId);

  // Render slider for multiple payments
  const renderPaymentSlider = () => {
    if (!isMultiplePayments) return null;

    const methodCount = methodsArray.length;

    if (methodCount === 2) {
      const method1 = getMethodInfo(methodsArray[0]);
      const method2 = getMethodInfo(methodsArray[1]);
      const percentage1 = percentages[methodsArray[0]] || 0;

      return (
        <div className="space-y-4">
          <div className="px-1 py-2">
            <Slider
              value={[percentage1]}
              onValueChange={handleTwoMethodSlider}
              max={100}
              min={0}
              step={1}
              className="w-full touch-target"
            />
          </div>
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: method1?.color }}
              />
              <span className="font-medium">{method1?.label}</span>
              <Badge variant="secondary" className="text-xs">
                {percentage1.toFixed(1)}%
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{method2?.label}</span>
              <Badge variant="secondary" className="text-xs">
                {(100 - percentage1).toFixed(1)}%
              </Badge>
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: method2?.color }}
              />
            </div>
          </div>
        </div>
      );
    }

    if (methodCount === 3) {
      const percentage1 = percentages[methodsArray[0]] || 0;
      const percentage2 = percentages[methodsArray[1]] || 0;
      const slider1Value = percentage1;
      const slider2Value = percentage1 + percentage2;

      return (
        <div className="space-y-4">
          <div className="px-1 py-2">
            <Slider
              value={[slider1Value, slider2Value]}
              onValueChange={handleThreeMethodSlider}
              max={100}
              min={0}
              step={1}
              className="w-full touch-target"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            {methodsArray.map((methodId, index) => {
              const method = getMethodInfo(methodId);
              const percentage = percentages[methodId] || 0;
              const amount = Math.round((total * percentage / 100) * 100) / 100;
              
              return (
                <div key={methodId} className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: method?.color }}
                    />
                    <span className="font-medium text-xs">{method?.label}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {percentage.toFixed(1)}%
                  </Badge>
                  <span className="text-xs font-semibold text-foreground">
                    {formatCurrency(amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-4">
        {/* Payment Method Selection */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Payment Methods</Label>
          <div className="grid grid-cols-3 gap-3">
            {PAYMENT_METHODS.map((method) => (
              <div key={method.id} className="flex items-center space-x-2">
                <Checkbox
                  id={method.id}
                  checked={selectedMethods.has(method.id)}
                  onCheckedChange={(checked) => 
                    handleMethodToggle(method.id, checked as boolean)
                  }
                  className="touch-target"
                />
                <label
                  htmlFor={method.id}
                  className="flex items-center gap-2 text-sm font-medium cursor-pointer touch-target"
                >
                  {method.icon}
                  {method.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Split Payment Slider */}
        {isMultiplePayments && (
        <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Split size={16} />
              Payment Split
            </Label>
            <div className="bg-muted/50 p-3 rounded-lg">
              {renderPaymentSlider()}
            </div>
          </div>
        )}

        {/* Single Payment Amount Display */}
        {!isMultiplePayments && (
          <div className="bg-muted p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">
                {getMethodInfo(methodsArray[0])?.label} Payment:
              </span>
              <span className="font-semibold">{formatCurrency(total)}</span>
            </div>
          </div>
        )}

        {/* M-Pesa Reference Input */}
        {selectedMethods.has('mpesa') && (
          <div>
            <Label htmlFor="mpesa-ref" className="text-sm font-medium">
              M-Pesa Reference (Optional)
            </Label>
            <Input
              id="mpesa-ref"
              type="text"
              value={mpesaReference}
              onChange={(e) => setMpesaReference(e.target.value)}
              placeholder="Enter M-Pesa reference"
              className="mt-1"
            />
          </div>
        )}

        {/* Customer Selection for Debt */}
        {selectedMethods.has('debt') && (
          <div>
            <Label className="text-sm font-medium text-destructive">
              Customer Required for Debt Payment *
            </Label>
            {!selectedCustomerId && (
              <p className="text-xs text-destructive mt-1">
                Please select a customer above for debt payments
              </p>
            )}
          </div>
        )}

        {/* Payment Summary */}
        <div className="bg-muted p-3 rounded-lg space-y-2">
          <div className="flex justify-between items-center font-semibold">
            <span>Total:</span>
            <span>{formatCurrency(total)}</span>
          </div>
          
          {isMultiplePayments && (
            <div className="space-y-1 text-sm">
              {methodsArray.map(methodId => {
                const method = getMethodInfo(methodId);
                const percentage = percentages[methodId] || 0;
                const amount = Math.round((total * percentage / 100) * 100) / 100;
                
                return (
                  <div key={methodId} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: method?.color }}
                      />
                      <span>{method?.label}:</span>
                    </div>
                    <span>{formatCurrency(amount)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SplitPaymentSelector;