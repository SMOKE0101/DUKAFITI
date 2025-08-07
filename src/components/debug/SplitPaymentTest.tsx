import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SplitPaymentModal from '@/components/sales/SplitPaymentModal';
import { SplitPaymentData } from '@/types/cart';
import { Customer } from '@/types';
import { formatCurrency } from '@/utils/currency';

const SplitPaymentTest: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [splitData, setSplitData] = useState<SplitPaymentData | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const mockCustomers: Customer[] = [
    { 
      id: '1', 
      name: 'John Doe', 
      phone: '123-456-7890', 
      email: 'john@example.com',
      outstandingDebt: 0,
      totalPurchases: 500,
      lastPurchaseDate: new Date().toISOString(),
      createdDate: new Date().toISOString(),
      creditLimit: 1000,
      riskRating: 'low' as const
    },
    { 
      id: '2', 
      name: 'Jane Smith', 
      phone: '098-765-4321', 
      email: 'jane@example.com',
      outstandingDebt: 150,
      totalPurchases: 1200,
      lastPurchaseDate: new Date().toISOString(),
      createdDate: new Date().toISOString(),
      creditLimit: 1500,
      riskRating: 'medium' as const
    }
  ];

  const testTotal = 100;

  const handleSplitConfirm = (data: SplitPaymentData) => {
    console.log('Split payment data received:', data);
    setSplitData(data);
    
    // Simulate checkout validation
    if (data.methods.debt && !selectedCustomer) {
      alert('❌ Checkout blocked: Customer required for debt payment!');
      return;
    }
    
    alert('✅ Split payment applied successfully!');
  };

  const handleCheckout = () => {
    if (!splitData) {
      alert('No split payment configured');
      return;
    }

    if (splitData.methods.debt && !selectedCustomer) {
      alert('❌ Checkout failed: Please select a customer for debt payment');
      return;
    }

    alert('✅ Checkout completed successfully!');
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Split Payment Modal Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Total Sale Amount:</span>
            <span className="font-bold">{formatCurrency(testTotal)}</span>
          </div>
          
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="w-full"
          >
            Open Split Payment Modal
          </Button>

          {splitData && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-semibold">Split Payment Applied:</h4>
              {splitData.methods.cash && (
                <div>Cash: {formatCurrency(splitData.methods.cash.amount)} ({splitData.methods.cash.percentage.toFixed(1)}%)</div>
              )}
              {splitData.methods.mpesa && (
                <div>M-Pesa: {formatCurrency(splitData.methods.mpesa.amount)} ({splitData.methods.mpesa.percentage.toFixed(1)}%)</div>
              )}
              {splitData.methods.debt && (
                <div>Debt: {formatCurrency(splitData.methods.debt.amount)} ({splitData.methods.debt.percentage.toFixed(1)}%)</div>
              )}
            </div>
          )}

          {splitData?.methods.debt && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Customer (Required for Debt):</label>
              <select 
                value={selectedCustomer?.id || ''}
                onChange={(e) => {
                  const customer = mockCustomers.find(c => c.id === e.target.value);
                  setSelectedCustomer(customer || null);
                }}
                className="w-full p-2 border rounded"
              >
                <option value="">Choose customer...</option>
                {mockCustomers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phone}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button 
            onClick={handleCheckout}
            disabled={!splitData}
            className="w-full"
            variant={splitData ? 'default' : 'outline'}
          >
            Complete Checkout
          </Button>
        </CardContent>
      </Card>

      <SplitPaymentModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        total={testTotal}
        customers={mockCustomers}
        onConfirm={handleSplitConfirm}
      />
    </div>
  );
};

export default SplitPaymentTest;