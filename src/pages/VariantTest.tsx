import React from 'react';
import VariantSalesDebug from '../components/debug/VariantSalesDebug';
import VariantStockTest from '../components/debug/VariantStockTest';

const VariantTest = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Variant Sales System Test</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-blue-800 mb-2">Testing Instructions</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
          <li>Check the debug panel below to see current variant data</li>
          <li>Click "Log to Console" to see detailed information in browser console</li>
          <li>Run the stock test to verify variant stock updates work correctly</li>
          <li>Try adding variants to cart in the sales page and completing a sale</li>
          <li>Verify parent product stock decreases by the correct amount</li>
        </ol>
      </div>
      
      <VariantSalesDebug />
      
      <VariantStockTest />
      
      <div className="text-sm text-muted-foreground bg-gray-50 p-4 rounded-lg">
        <p><strong>Access:</strong> Navigate to /variant-test to access this page.</p>
        <p><strong>Console:</strong> Check the browser console for detailed debug information.</p>
        <p><strong>Purpose:</strong> This page helps verify that variant sales and stock updates work correctly.</p>
      </div>
    </div>
  );
};

export default VariantTest;