import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SplitPaymentSelector, { PaymentMethodType, PaymentSplit } from '../sales/SplitPaymentSelector';
import { formatCurrency } from '@/utils/currency';

const SplitPaymentTest: React.FC = () => {
  const [selectedMethods, setSelectedMethods] = useState<PaymentMethodType[]>(['cash']);
  const [paymentSplits, setPaymentSplits] = useState<PaymentSplit[]>([]);
  const [testTotal] = useState(1500); // Test amount of KSh 1,500
  const [hasCustomer, setHasCustomer] = useState(false);

  const handlePaymentSplitChange = (splits: PaymentSplit[]) => {
    console.log('[SplitPaymentTest] Payment splits changed:', splits);
    setPaymentSplits(splits);
  };

  const handleMethodsChange = (methods: PaymentMethodType[]) => {
    console.log('[SplitPaymentTest] Selected methods changed:', methods);
    setSelectedMethods(methods);
  };

  // Calculate totals for validation
  const splitTotal = paymentSplits.reduce((sum, split) => sum + split.amount, 0);
  const isValidSplit = Math.abs(splitTotal - testTotal) < 0.01;

  return (
    <div className="space-y-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Split Payment Test - {formatCurrency(testTotal)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Controls */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={hasCustomer}
                onChange={(e) => setHasCustomer(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm">Has Customer Selected</span>
            </label>
          </div>

          {/* Split Payment Selector */}
          <SplitPaymentSelector
            total={testTotal}
            selectedMethods={selectedMethods}
            onPaymentSplitChange={handlePaymentSplitChange}
            onMethodsChange={handleMethodsChange}
            requiresCustomer={!hasCustomer}
          />

          {/* Debug Information */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-sm">Debug Information</h4>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-medium">Selected Methods:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedMethods.map(method => (
                    <Badge key={method} variant="outline" className="text-xs">
                      {method}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <span className="font-medium">Total Validation:</span>
                <div className="mt-1">
                  <span className={isValidSplit ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(splitTotal)} / {formatCurrency(testTotal)}
                  </span>
                  {isValidSplit ? ' ✓' : ' ✗'}
                </div>
              </div>
            </div>

            {/* Payment Splits Breakdown */}
            {paymentSplits.length > 0 && (
              <div>
                <span className="font-medium text-xs">Payment Breakdown:</span>
                <div className="space-y-1 mt-1">
                  {paymentSplits.map((split, index) => (
                    <div key={split.method} className="flex justify-between text-xs">
                      <span className="capitalize">{split.method}:</span>
                      <span>
                        {formatCurrency(split.amount)} ({split.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-border pt-1 flex justify-between text-xs font-medium">
                    <span>Total:</span>
                    <span>{formatCurrency(splitTotal)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Validation Status */}
            <div className="text-xs">
              <span className="font-medium">Validation Status:</span>
              <ul className="mt-1 space-y-1 text-muted-foreground">
                <li className={selectedMethods.length > 0 ? 'text-green-600' : 'text-red-600'}>
                  • Methods selected: {selectedMethods.length > 0 ? '✓' : '✗'}
                </li>
                <li className={paymentSplits.length > 0 ? 'text-green-600' : 'text-red-600'}>
                  • Payment splits configured: {paymentSplits.length > 0 ? '✓' : '✗'}
                </li>
                <li className={isValidSplit ? 'text-green-600' : 'text-red-600'}>
                  • Amounts match total: {isValidSplit ? '✓' : '✗'}
                </li>
                <li className={!selectedMethods.includes('debt') || hasCustomer ? 'text-green-600' : 'text-red-600'}>
                  • Customer requirement: {!selectedMethods.includes('debt') || hasCustomer ? '✓' : '✗'}
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SplitPaymentTest;