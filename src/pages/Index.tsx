import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  User, 
  Search,
  DollarSign,
  CreditCard,
  Smartphone
} from 'lucide-react';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { useSupabaseSales } from '../hooks/useSupabaseSales';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { formatCurrency } from '../utils/currency';
import { Product, Customer, Sale } from '../types';

interface CartItem {
  product: Product;
  quantity: number;
}

const Index = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'debt' | 'partial'>('cash');
  const [cashAmount, setCashAmount] = useState('');
  const [mpesaAmount, setMpesaAmount] = useState('');
  const [mpesaReference, setMpesaReference] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { products, loading: productsLoading } = useSupabaseProducts();
  const { customers, loading: customersLoading } = useSupabaseCustomers();
  const { createSales } = useSupabaseSales();
  const { user } = useAuth();
  const { toast } = useToast();

  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      customer.phone.toLowerCase().includes(customerSearch.toLowerCase())
    );
  }, [customers, customerSearch]);

  const totalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.product.sellingPrice * item.quantity), 0);
  }, [cart]);

  const totalAmount = useMemo(() => {
    return subtotal;
  }, [subtotal]);

  const processSale = async () => {
    if (!user || cart.length === 0) return;

    setIsProcessing(true);

    try {
      const timestamp = new Date().toISOString();
      
      // Create sales records with proper type mapping
      const salesData: Omit<Sale, 'id'>[] = cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        sellingPrice: item.product.sellingPrice,
        costPrice: item.product.costPrice,
        profit: (item.product.sellingPrice - item.product.costPrice) * item.quantity,
        timestamp,
        synced: true,
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer?.name,
        paymentMethod,
        paymentDetails: {
          cashAmount: parseFloat(cashAmount) || 0,
          mpesaAmount: parseFloat(mpesaAmount) || 0,
          debtAmount: paymentMethod === 'debt' ? totalAmount : 0,
          mpesaReference: mpesaReference || undefined,
        },
        total: item.product.sellingPrice * item.quantity,
      }));

      await createSales(salesData);

      toast({
        title: "Success",
        description: "Sale processed successfully!",
      });

      // Reset form
      setCart([]);
      setSelectedCustomer(null);
      setPaymentMethod('cash');
      setCashAmount('');
      setMpesaAmount('');
      setMpesaReference('');
    } catch (error) {
      console.error('Error processing sale:', error);
      toast({
        title: "Error",
        description: "Failed to process sale",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    if (existingItem) {
      const updatedCart = cart.map(item =>
        item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
      setCart(updatedCart);
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const removeFromCart = (product: Product) => {
    const updatedCart = cart.filter(item => item.product.id !== product.id);
    setCart(updatedCart);
  };

  const increaseQuantity = (product: Product) => {
    const updatedCart = cart.map(item =>
      item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
    );
    setCart(updatedCart);
  };

  const decreaseQuantity = (product: Product) => {
    const updatedCart = cart.map(item =>
      item.product.id === product.id ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item
    );
    setCart(updatedCart);
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDropdown(false);
  };

  if (productsLoading || customersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-mono font-black uppercase tracking-widest text-gray-900 dark:text-white">
                  POINT OF SALE
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 font-normal">
                  Process sales quickly and efficiently
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Grid and Cart */}
      <div className="container mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Product Grid */}
        <div className="lg:col-span-2">
          <Card className="bg-white dark:bg-gray-800 shadow-sm">
            <CardContent className="p-6">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Product List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="bg-gray-50 dark:bg-gray-900/40 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => addToCart(product)}>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{product.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{product.category}</p>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">{formatCurrency(product.sellingPrice)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cart */}
        <div>
          <Card className="bg-white dark:bg-gray-800 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">
                <ShoppingCart className="w-5 h-5 mr-2 inline-block" />
                Your Cart ({totalItems})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {cart.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">Your cart is empty.</p>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{item.product.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{formatCurrency(item.product.sellingPrice)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => decreaseQuantity(item.product)}>
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="text-sm text-gray-900 dark:text-white">{item.quantity}</span>
                        <Button variant="outline" size="icon" onClick={() => increaseQuantity(item.product)}>
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.product)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="py-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Subtotal:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Total:</span>
                      <span className="text-lg font-semibold text-green-600 dark:text-green-400">{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>

                  {/* Customer Select */}
                  <div className="relative">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                    >
                      <User className="w-4 h-4" />
                      {selectedCustomer ? selectedCustomer.name : 'Select Customer'}
                    </Button>
                    {showCustomerDropdown && (
                      <Card className="absolute left-0 mt-1 w-full z-10">
                        <CardContent className="p-3">
                          <Input
                            placeholder="Search customers..."
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            className="mb-2"
                          />
                          <div className="max-h-40 overflow-y-auto">
                            {filteredCustomers.map((customer) => (
                              <Button
                                key={customer.id}
                                variant="ghost"
                                className="w-full justify-start"
                                onClick={() => handleCustomerSelect(customer)}
                              >
                                {customer.name}
                              </Button>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Payment Methods */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Payment Method:</h4>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                        onClick={() => setPaymentMethod('cash')}
                        className="flex-1"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Cash
                      </Button>
                      <Button
                        variant={paymentMethod === 'mpesa' ? 'default' : 'outline'}
                        onClick={() => setPaymentMethod('mpesa')}
                        className="flex-1"
                      >
                        <Smartphone className="w-4 h-4 mr-2" />
                        M-Pesa
                      </Button>
                      <Button
                        variant={paymentMethod === 'debt' ? 'default' : 'outline'}
                        onClick={() => setPaymentMethod('debt')}
                        className="flex-1"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Debt
                      </Button>
                    </div>
                  </div>

                  {/* Payment Details */}
                  {paymentMethod === 'cash' && (
                    <div>
                      <Input
                        type="number"
                        placeholder="Cash Amount"
                        value={cashAmount}
                        onChange={(e) => setCashAmount(e.target.value)}
                      />
                    </div>
                  )}

                  {paymentMethod === 'mpesa' && (
                    <div>
                      <Input
                        type="number"
                        placeholder="M-Pesa Amount"
                        value={mpesaAmount}
                        onChange={(e) => setMpesaAmount(e.target.value)}
                      />
                      <Input
                        placeholder="M-Pesa Reference"
                        value={mpesaReference}
                        onChange={(e) => setMpesaReference(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Process Sale Button */}
                  <Button
                    className="w-full bg-green-600 hover:bg-green-500 text-white"
                    onClick={processSale}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : 'Process Sale'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
