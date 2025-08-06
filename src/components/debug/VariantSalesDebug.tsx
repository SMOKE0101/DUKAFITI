import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUnifiedProducts } from '../../hooks/useUnifiedProducts';
import { usePersistedCart } from '../../hooks/usePersistedCart';

const VariantSalesDebug: React.FC = () => {
  const { products } = useUnifiedProducts();
  const { cart } = usePersistedCart();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const parents = products.filter(p => p.is_parent);
    const variants = products.filter(p => p.parent_id);
    const regular = products.filter(p => !p.is_parent && !p.parent_id);
    
    const cartVariants = cart.filter(item => item.parent_id);
    const cartRegular = cart.filter(item => !item.parent_id);

    setDebugInfo({
      totalProducts: products.length,
      parents: parents.length,
      variants: variants.length,
      regular: regular.length,
      cartItems: cart.length,
      cartVariants: cartVariants.length,
      cartRegular: cartRegular.length,
      parentsList: parents.map(p => ({
        id: p.id,
        name: p.name,
        stock: p.currentStock,
        variants: variants.filter(v => v.parent_id === p.id).length
      })),
      variantsList: variants.map(v => ({
        id: v.id,
        name: v.name,
        variantName: v.variant_name,
        parentId: v.parent_id,
        multiplier: v.variant_multiplier,
        stock: v.currentStock,
        parentName: parents.find(p => p.id === v.parent_id)?.name || 'Unknown',
        parentStock: parents.find(p => p.id === v.parent_id)?.currentStock || 0
      })),
      cartVariantsList: cartVariants.map(item => ({
        id: item.id,
        name: item.name,
        variantName: item.variant_name,
        parentId: item.parent_id,
        quantity: item.quantity,
        multiplier: item.variant_multiplier,
        stockDerivationQty: item.stock_derivation_quantity
      }))
    });
  }, [products, cart]);

  const handleConsoleDebug = () => {
    console.log('=== VARIANT SALES DEBUG INFO ===');
    console.log('Products Summary:', {
      total: debugInfo.totalProducts,
      parents: debugInfo.parents,
      variants: debugInfo.variants,
      regular: debugInfo.regular
    });
    console.log('Cart Summary:', {
      total: debugInfo.cartItems,
      variants: debugInfo.cartVariants,
      regular: debugInfo.cartRegular
    });
    console.log('Parent Products:', debugInfo.parentsList);
    console.log('Variant Products:', debugInfo.variantsList);
    console.log('Cart Variants:', debugInfo.cartVariantsList);
    console.log('=== END DEBUG INFO ===');
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Variant Sales Debug Panel
          <Button onClick={handleConsoleDebug} variant="outline" size="sm">
            Log to Console
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{debugInfo.totalProducts}</div>
            <div className="text-sm text-muted-foreground">Total Products</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{debugInfo.parents}</div>
            <div className="text-sm text-muted-foreground">Parent Products</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{debugInfo.variants}</div>
            <div className="text-sm text-muted-foreground">Variant Products</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{debugInfo.cartVariants}</div>
            <div className="text-sm text-muted-foreground">Cart Variants</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Parent Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {debugInfo.parentsList?.slice(0, 5).map((parent: any) => (
                  <div key={parent.id} className="flex justify-between items-center text-sm">
                    <span className="truncate">{parent.name}</span>
                    <div className="flex gap-1">
                      <Badge variant="outline">{parent.variants}v</Badge>
                      <Badge variant="secondary">{parent.stock}s</Badge>
                    </div>
                  </div>
                ))}
                {debugInfo.parentsList?.length > 5 && (
                  <div className="text-xs text-muted-foreground">
                    +{debugInfo.parentsList.length - 5} more...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Variant Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                 {debugInfo.variantsList?.slice(0, 5).map((variant: any) => (
                   <div key={variant.id} className="text-sm">
                     <div className="font-medium truncate">{variant.variantName}</div>
                     <div className="text-xs text-muted-foreground">
                       Parent: {variant.parentName} ({variant.parentStock})
                     </div>
                     <div className="text-xs text-muted-foreground">
                       Multiplier: {variant.multiplier}x
                     </div>
                   </div>
                 ))}
                {debugInfo.variantsList?.length > 5 && (
                  <div className="text-xs text-muted-foreground">
                    +{debugInfo.variantsList.length - 5} more...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cart Variants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {debugInfo.cartVariantsList?.map((cartItem: any) => (
                  <div key={cartItem.id} className="text-sm">
                    <div className="font-medium truncate">{cartItem.variantName}</div>
                    <div className="text-xs text-muted-foreground">
                      Qty: {cartItem.quantity} × {cartItem.multiplier}x
                    </div>
                  </div>
                ))}
                {debugInfo.cartVariantsList?.length === 0 && (
                  <div className="text-xs text-muted-foreground">No variants in cart</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default VariantSalesDebug;