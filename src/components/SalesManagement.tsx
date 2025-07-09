
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, ShoppingCart, DollarSign, TrendingUp, Users } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { useToast } from '../hooks/use-toast';
import { Product, Sale, Customer } from '../types';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { useSupabaseSales } from '../hooks/useSupabaseSales';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';

const SalesManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const { toast } = useToast();
  
  const { products, loading: productsLoading } = useSupabaseProducts();
  const { sales, loading: salesLoading, createSale } = useSupabaseSales();
  const { customers, loading: customersLoading } = useSupabaseCustomers();

  // Mock customer data for demonstration (until real customer system is implemented)
  const mockCustomers: Customer[] = [
    {
      id: '1',
      name: 'John Doe',
      phone: '+254700000000',
      email: 'john@example.com',
      address: '123 Main St, Nairobi',
      totalPurchases: 15000,
      outstandingDebt: 2500,
      creditLimit: 10000,
      riskRating: 'low',
      createdDate: new Date().toISOString(),
      lastPurchaseDate: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Jane Smith',
      phone: '+254711111111',
      email: 'jane@example.com',
      address: '456 Oak Ave, Mombasa',
      totalPurchases: 8500,
      outstandingDebt: 500,
      creditLimit: 5000,
      riskRating: 'low',
      createdDate: new Date().toISOString(),
      lastPurchaseDate: new Date().toISOString()
    }
  ];

  const allCustomers = customers.length > 0 ? customers : mockCustomers;

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const todaysSales = sales.filter(sale => {
    const today = new Date().toDateString();
    const saleDate = new Date(sale.timestamp).toDateString();
    return today === saleDate;
  });

  const totalRevenue = todaysSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalProfit = todaysSales.reduce((sum, sale) => sum + sale.profit, 0);

  const handleAddToCart = () => {
    if (!selectedProduct) {
      toast({
        title: "Error",
        description: "Please select a product",
        variant: "destructive",
      });
      return;
    }

    if (quantity <= 0) {
      toast({
        title: "Error",
        description: "Quantity must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (quantity > selectedProduct.currentStock) {
      toast({
        title: "Error",
        description: "Not enough stock available",
        variant: "destructive",
      });
      return;
    }

    // Process the sale
    handleSale();
  };

  const handleSale = async () => {
    if (!selectedProduct) return;

    const saleData: Omit<Sale, 'id'> = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity,
      sellingPrice: selectedProduct.sellingPrice,
      costPrice: selectedProduct.costPrice,
      profit: (selectedProduct.sellingPrice - selectedProduct.costPrice) * quantity,
      timestamp: new Date().toISOString(),
      synced: true,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name,
      paymentMethod: paymentMethod as 'cash' | 'mpesa' | 'debt' | 'partial',
      paymentDetails: {
        cashAmount: paymentMethod === 'cash' ? selectedProduct.sellingPrice * quantity : 0,
        mpesaAmount: paymentMethod === 'mpesa' ? selectedProduct.sellingPrice * quantity : 0,
        debtAmount: paymentMethod === 'debt' ? selectedProduct.sellingPrice * quantity : 0,
      },
      total: selectedProduct.sellingPrice * quantity,
    };

    try {
      await createSale(saleData);
      
      toast({
        title: "Sale Completed",
        description: `Sold ${quantity} × ${selectedProduct.name} for ${formatCurrency(saleData.total)}`,
      });

      // Reset form
      setSelectedProduct(null);
      setQuantity(1);
      setSelectedCustomer(null);
      setPaymentMethod('cash');
    } catch (error) {
      console.error('Failed to create sale:', error);
    }
  };

  if (productsLoading || salesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Sales Management</h2>
          <p className="text-gray-600">Process sales and track daily performance</p>
        </div>
      </div>

      {/* Sales Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Today's Sales</p>
                <p className="text-2xl font-bold">{todaysSales.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Profit</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalProfit)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Products Sold</p>
                <p className="text-2xl font-bold">{todaysSales.reduce((sum, sale) => sum + sale.quantity, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="new-sale" className="space-y-6">
        <TabsList>
          <TabsTrigger value="new-sale">New Sale</TabsTrigger>
          <TabsTrigger value="recent-sales">Recent Sales</TabsTrigger>
        </TabsList>

        <TabsContent value="new-sale" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Sale</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Product Selection */}
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
                  {filteredProducts.map(product => (
                    <Card
                      key={product.id}
                      className={`cursor-pointer transition-colors ${
                        selectedProduct?.id === product.id ? 'border-primary bg-primary/5' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedProduct(product)}
                    >
                      <CardContent className="p-4">
                       <div className="space-y-2">
                          <h3 className="font-medium">{product.name}</h3>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Price:</span>
                            <span className="font-medium">{formatCurrency(product.sellingPrice)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Stock:</span>
                            <Badge variant={product.currentStock > product.lowStockThreshold ? "default" : "destructive"}>
                              {product.currentStock}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {selectedProduct && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium">Selected: {selectedProduct.name}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        max={selectedProduct.currentStock}
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customer">Customer (Optional)</Label>
                      <Select onValueChange={(value) => {
                        const customer = allCustomers.find(c => c.id === value);
                        setSelectedCustomer(customer || null);
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {allCustomers.map(customer => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name} - {customer.phone}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="payment">Payment Method</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="mpesa">M-Pesa</SelectItem>
                          <SelectItem value="debt">Credit/Debt</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-white rounded border">
                    <span className="text-lg font-medium">Total:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedProduct.sellingPrice * quantity)}
                    </span>
                  </div>

                  <Button onClick={handleAddToCart} className="w-full" size="lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Complete Sale
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent-sales">
          <Card>
            <CardHeader>
              <CardTitle>Recent Sales</CardTitle>
            </CardHeader>
            <CardContent>
              {sales.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No sales recorded yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sales.slice(0, 10).map(sale => (
                    <div key={sale.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{sale.productName}</h3>
                        <p className="text-sm text-gray-600">
                          {sale.quantity} × {formatCurrency(sale.sellingPrice)} - {sale.paymentMethod}
                          {sale.customerName && ` - ${sale.customerName}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(sale.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">{formatCurrency(sale.total)}</p>
                        <p className="text-sm text-gray-600">Profit: {formatCurrency(sale.profit)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SalesManagement;
