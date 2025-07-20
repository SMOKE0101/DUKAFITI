
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Package, Users, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { cn } from '@/lib/utils';
import { Product, Customer } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AlwaysCurrentPanelsProps {
  products: Product[];
  customers: Customer[];
  loading?: boolean;
}

const AlwaysCurrentPanels: React.FC<AlwaysCurrentPanelsProps> = ({
  products,
  customers,
  loading = false
}) => {
  const lowStockProducts = React.useMemo(() => {
    return products
      .filter(product => (product.currentStock || 0) <= (product.lowStockThreshold || 10))
      .sort((a, b) => (a.currentStock || 0) - (b.currentStock || 0))
      .slice(0, 10);
  }, [products]);

  const outstandingDebts = React.useMemo(() => {
    return customers
      .filter(customer => (customer.outstandingDebt || 0) > 0)
      .sort((a, b) => (b.outstandingDebt || 0) - (a.outstandingDebt || 0))
      .slice(0, 10);
  }, [customers]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index} className="border-0 shadow-lg animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-40"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Low Stock Products */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-black text-foreground">
                Low Stock Alert
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Products running low (current stock levels)
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-80">
            {lowStockProducts.length > 0 ? (
              <div className="space-y-4">
                {lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-white/70 dark:bg-gray-800/50 rounded-xl border border-orange-200 dark:border-orange-800"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-orange-600" />
                      <div>
                        <p className="font-bold text-foreground text-sm">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Threshold: {product.lowStockThreshold || 10}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={(product.currentStock || 0) <= 0 ? "destructive" : "secondary"}
                        className="font-bold"
                      >
                        {product.currentStock || 0} left
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl inline-block mb-3">
                  <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm font-bold text-muted-foreground">
                  All products are well stocked! 🎉
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Outstanding Debts */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-black text-foreground">
                Outstanding Debts
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Customers with pending payments
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-80">
            {outstandingDebts.length > 0 ? (
              <div className="space-y-4">
                {outstandingDebts.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-3 bg-white/70 dark:bg-gray-800/50 rounded-xl border border-red-200 dark:border-red-800"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-red-600" />
                      <div>
                        <p className="font-bold text-foreground text-sm">
                          {customer.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {customer.phone}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive" className="font-bold">
                        {formatCurrency(customer.outstandingDebt || 0)}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Risk: {customer.riskRating}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 rounded-xl">
                  <p className="text-sm font-bold text-red-700 dark:text-red-400">
                    Total Outstanding: {formatCurrency(outstandingDebts.reduce((sum, customer) => sum + (customer.outstandingDebt || 0), 0))}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl inline-block mb-3">
                  <CreditCard className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm font-bold text-muted-foreground">
                  No outstanding debts! 💚
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlwaysCurrentPanels;
