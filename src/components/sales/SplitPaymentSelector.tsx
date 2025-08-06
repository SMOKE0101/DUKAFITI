import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Banknote, 
  UserX, 
  Smartphone,
  DollarSign,
  Minus,
  Plus
} from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { cn } from '@/lib/utils';

export type PaymentMethodType = 'cash' | 'mpesa' | 'debt';

export interface PaymentSplit {
  method: PaymentMethodType;
  amount: number;
  percentage: number;
}

interface SplitPaymentSelectorProps {
  total: number;
  selectedMethods: PaymentMethodType[];
  onPaymentSplitChange: (splits: PaymentSplit[]) => void;
  onMethodsChange: (methods: PaymentMethodType[]) => void;
  requiresCustomer: boolean;
  className?: string;
}

const PAYMENT_METHOD_ICONS = {
  cash: Banknote,
  mpesa: Smartphone,
  debt: UserX,
} as const;

const PAYMENT_METHOD_LABELS = {
  cash: 'Cash',
  mpesa: 'M-Pesa',
  debt: 'Credit/Debt',
} as const;

const PAYMENT_METHOD_COLORS = {
  cash: 'bg-green-100 text-green-800 border-green-200',
  mpesa: 'bg-blue-100 text-blue-800 border-blue-200',
  debt: 'bg-orange-100 text-orange-800 border-orange-200',
} as const;

export const SplitPaymentSelector: React.FC<SplitPaymentSelectorProps> = ({
  total,
  selectedMethods,
  onPaymentSplitChange,
  onMethodsChange,
  requiresCustomer,
  className
}) => {
  const [splits, setSplits] = useState<PaymentSplit[]>([]);

  // Initialize splits when methods change
  useEffect(() => {
    if (selectedMethods.length === 0) {
      setSplits([]);
      onPaymentSplitChange([]);
      return;
    }

    if (selectedMethods.length === 1) {
      const singleSplit: PaymentSplit = {
        method: selectedMethods[0],
        amount: total,
        percentage: 100
      };
      setSplits([singleSplit]);
      onPaymentSplitChange([singleSplit]);
      return;
    }

    // Multiple methods: distribute evenly
    const percentagePerMethod = 100 / selectedMethods.length;
    const newSplits = selectedMethods.map((method, index) => {
      const percentage = index === selectedMethods.length - 1 
        ? 100 - (percentagePerMethod * (selectedMethods.length - 1)) // Last method gets remainder
        : percentagePerMethod;
      
      return {
        method,
        amount: (total * percentage) / 100,
        percentage: percentage
      };
    });

    setSplits(newSplits);
    onPaymentSplitChange(newSplits);
  }, [selectedMethods, total, onPaymentSplitChange]);

  const toggleMethod = useCallback((method: PaymentMethodType) => {
    const newMethods = selectedMethods.includes(method)
      ? selectedMethods.filter(m => m !== method)
      : [...selectedMethods, method];
    
    onMethodsChange(newMethods);
  }, [selectedMethods, onMethodsChange]);

  const updateSplitPercentage = useCallback((methodIndex: number, newPercentage: number) => {
    if (selectedMethods.length <= 1) return;

    const newSplits = [...splits];
    const totalOtherPercentages = newSplits
      .filter((_, i) => i !== methodIndex)
      .reduce((sum, split) => sum + split.percentage, 0);

    // Ensure the new percentage doesn't exceed available percentage
    const maxPercentage = Math.min(100, 100 - (totalOtherPercentages - newSplits[methodIndex].percentage));
    const clampedPercentage = Math.max(1, Math.min(maxPercentage, newPercentage));

    // Update the target method
    newSplits[methodIndex] = {
      ...newSplits[methodIndex],
      percentage: clampedPercentage,
      amount: (total * clampedPercentage) / 100
    };

    // Redistribute remaining percentage among other methods proportionally
    const remainingPercentage = 100 - clampedPercentage;
    const otherMethods = newSplits.filter((_, i) => i !== methodIndex);
    
    if (otherMethods.length > 0 && remainingPercentage > 0) {
      const totalOtherCurrent = otherMethods.reduce((sum, split) => sum + split.percentage, 0);
      
      otherMethods.forEach((split, i) => {
        const otherIndex = newSplits.findIndex(s => s.method === split.method && newSplits.indexOf(s) !== methodIndex);
        if (otherIndex !== -1) {
          const proportionalPercentage = totalOtherCurrent > 0 
            ? (split.percentage / totalOtherCurrent) * remainingPercentage
            : remainingPercentage / otherMethods.length;
          
          newSplits[otherIndex] = {
            ...newSplits[otherIndex],
            percentage: proportionalPercentage,
            amount: (total * proportionalPercentage) / 100
          };
        }
      });
    }

    setSplits(newSplits);
    onPaymentSplitChange(newSplits);
  }, [splits, selectedMethods.length, total, onPaymentSplitChange]);

  if (selectedMethods.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CreditCard size={16} />
              <span>Select Payment Methods</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {(['cash', 'mpesa', 'debt'] as PaymentMethodType[]).map((method) => {
                const Icon = PAYMENT_METHOD_ICONS[method];
                const isDisabled = method === 'debt' && requiresCustomer;
                
                return (
                  <Button
                    key={method}
                    variant="outline"
                    size="sm"
                    onClick={() => toggleMethod(method)}
                    disabled={isDisabled}
                    className={cn(
                      "h-12 flex flex-col gap-1 transition-all",
                      isDisabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Icon size={16} />
                    <span className="text-xs">{PAYMENT_METHOD_LABELS[method]}</span>
                  </Button>
                );
              })}
            </div>
            
            {requiresCustomer && (
              <p className="text-xs text-amber-600 text-center">
                Select a customer to enable credit/debt payments
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4 space-y-4">
        {/* Selected Methods Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CreditCard size={16} />
            <span>Payment Split</span>
          </div>
          <div className="text-sm font-semibold text-primary">
            {formatCurrency(total)}
          </div>
        </div>

        {/* Method Selection Pills */}
        <div className="flex flex-wrap gap-2">
          {(['cash', 'mpesa', 'debt'] as PaymentMethodType[]).map((method) => {
            const isSelected = selectedMethods.includes(method);
            const Icon = PAYMENT_METHOD_ICONS[method];
            const isDisabled = method === 'debt' && requiresCustomer;
            
            return (
              <button
                key={method}
                onClick={() => !isDisabled && toggleMethod(method)}
                disabled={isDisabled}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                  isSelected 
                    ? PAYMENT_METHOD_COLORS[method]
                    : "bg-muted text-muted-foreground border-border hover:bg-muted/80",
                  isDisabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <Icon size={12} />
                <span>{PAYMENT_METHOD_LABELS[method]}</span>
                {isSelected && selectedMethods.length > 1 && (
                  <Minus size={10} className="ml-1" />
                )}
                {!isSelected && (
                  <Plus size={10} className="ml-1" />
                )}
              </button>
            );
          })}
        </div>

        {/* Split Controls - Only show for multiple methods */}
        {selectedMethods.length > 1 && (
          <div className="space-y-3">
            <Separator className="my-2" />
            
            {splits.map((split, index) => {
              const Icon = PAYMENT_METHOD_ICONS[split.method];
              
              return (
                <div key={split.method} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon size={14} />
                      <span className="text-sm font-medium">
                        {PAYMENT_METHOD_LABELS[split.method]}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {formatCurrency(split.amount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {split.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-2">
                    <Slider
                      value={[split.percentage]}
                      onValueChange={([value]) => updateSplitPercentage(index, value)}
                      max={100}
                      min={1}
                      step={0.5}
                      className="w-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary for single method */}
        {selectedMethods.length === 1 && splits.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {React.createElement(PAYMENT_METHOD_ICONS[splits[0].method], { size: 16 })}
                <span className="text-sm font-medium">
                  {PAYMENT_METHOD_LABELS[splits[0].method]} Payment
                </span>
              </div>
              <div className="text-sm font-semibold">
                {formatCurrency(splits[0].amount)}
              </div>
            </div>
          </div>
        )}

        {/* Validation */}
        {selectedMethods.length > 1 && (
          <div className="text-xs text-muted-foreground text-center">
            Drag sliders to adjust payment distribution
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SplitPaymentSelector;