import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUnifiedProducts } from '../../hooks/useUnifiedProducts';
import { SalesService } from '../../services/salesService';
import { supabase } from '@/integrations/supabase/client';

const VariantStockTest: React.FC = () => {
  const { products, updateProduct } = useUnifiedProducts();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runVariantStockTest = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      // Find a parent product with variants
      const parents = products.filter(p => p.is_parent);
      const variants = products.filter(p => p.parent_id);
      
      if (parents.length === 0 || variants.length === 0) {
        setTestResults([{
          step: 'Prerequisites',
          status: 'failed',
          message: 'No parent products or variants found',
          data: { parents: parents.length, variants: variants.length }
        }]);
        return;
      }

      // Select first parent with variants
      const testParent = parents[0];
      const testVariants = variants.filter(v => v.parent_id === testParent.id);
      
      if (testVariants.length === 0) {
        setTestResults([{
          step: 'Test Setup',
          status: 'failed',
          message: 'Selected parent has no variants',
          data: { parentId: testParent.id, parentName: testParent.name }
        }]);
        return;
      }

      const testVariant = testVariants[0];
      
      console.log('=== STARTING VARIANT STOCK TEST ===');
      
      // Step 1: Record initial state
      const initialParentStock = testParent.currentStock;
      const variantMultiplier = testVariant.variant_multiplier || 1;
      const testQuantity = 2;
      const expectedStockReduction = testQuantity * variantMultiplier;
      
      setTestResults(prev => [...prev, {
        step: 'Initial State',
        status: 'success',
        message: 'Test setup complete',
        data: {
          parentName: testParent.name,
          variantName: testVariant.variant_name,
          parentStock: initialParentStock,
          variantMultiplier,
          testQuantity,
          expectedReduction: expectedStockReduction
        }
      }]);

      // Step 2: Simulate variant sale using SalesService
      console.log('Testing SalesService.updateProductStock with variant');
      await SalesService.updateProductStock(testVariant.id, testQuantity);
      
      setTestResults(prev => [...prev, {
        step: 'SalesService Call',
        status: 'success',
        message: 'SalesService.updateProductStock completed',
        data: { variantId: testVariant.id, quantity: testQuantity }
      }]);

      // Step 3: Check database state
      const { data: updatedParent } = await supabase
        .from('products')
        .select('current_stock')
        .eq('id', testParent.id)
        .single();

      const actualNewStock = updatedParent?.current_stock || 0;
      const expectedNewStock = Math.max(0, initialParentStock - expectedStockReduction);
      const stockUpdateCorrect = actualNewStock === expectedNewStock;

      setTestResults(prev => [...prev, {
        step: 'Database Verification',
        status: stockUpdateCorrect ? 'success' : 'failed',
        message: stockUpdateCorrect ? 'Stock updated correctly' : 'Stock update incorrect',
        data: {
          initialStock: initialParentStock,
          expectedStock: expectedNewStock,
          actualStock: actualNewStock,
          difference: actualNewStock - expectedNewStock
        }
      }]);

      // Step 4: Test direct updateProduct approach
      console.log('Testing direct updateProduct approach');
      const directTestQuantity = 1;
      const directExpectedReduction = directTestQuantity * variantMultiplier;
      const directExpectedStock = Math.max(0, actualNewStock - directExpectedReduction);
      
      await updateProduct(testParent.id, {
        currentStock: directExpectedStock,
        updatedAt: new Date().toISOString()
      });

      setTestResults(prev => [...prev, {
        step: 'Direct Update Test',
        status: 'success',
        message: 'Direct updateProduct completed',
        data: {
          method: 'updateProduct',
          stockBefore: actualNewStock,
          stockAfter: directExpectedStock,
          reduction: directExpectedReduction
        }
      }]);

      console.log('=== VARIANT STOCK TEST COMPLETED ===');

    } catch (error) {
      console.error('Variant stock test failed:', error);
      setTestResults(prev => [...prev, {
        step: 'Error',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        data: { error }
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Variant Stock Update Test
          <Button 
            onClick={runVariantStockTest} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? 'Running Test...' : 'Run Test'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {testResults.length === 0 && !isLoading && (
          <div className="text-center text-muted-foreground py-8">
            Click "Run Test" to test variant stock update functionality
          </div>
        )}

        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <div className="mt-2 text-sm text-muted-foreground">Running variant stock test...</div>
          </div>
        )}

        <div className="space-y-4">
          {testResults.map((result, index) => (
            <Card key={index} className={`border-l-4 ${
              result.status === 'success' ? 'border-l-green-500' : 
              result.status === 'failed' ? 'border-l-red-500' : 'border-l-yellow-500'
            }`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{result.step}</span>
                  <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                    {result.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">{result.message}</p>
                {result.data && (
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default VariantStockTest;