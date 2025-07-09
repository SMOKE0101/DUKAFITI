
import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Search, 
  UserPlus, 
  Users,
  DollarSign,
  AlertCircle,
  Eye,
  CreditCard,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '../utils/currency';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { Customer } from '../types';

interface CustomerStats {
  totalCustomers: number;
  averageBalance: number;
  overdueCount: number;
}

const CustomersPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentDrawer, setShowPaymentDrawer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();
  const { customers, loading, createCustomer, updateCustomer } = useSupabaseCustomers();

  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    phone: '',
    initialBalance: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'cash',
    reference: ''
  });

  // Calculate statistics
  const stats: CustomerStats = useMemo(() => {
    const totalCustomers = customers.length;
    const totalBalance = customers.reduce((sum, c) => sum + c.outstandingDebt, 0);
    const averageBalance = totalCustomers > 0 ? totalBalance / totalCustomers : 0;
    const overdueCount = customers.filter(c => c.outstandingDebt > 0).length; // Simplified - in real app would check dates
    
    return {
      totalCustomers,
      averageBalance,
      overdueCount
    };
  }, [customers]);

  // Filter and sort customers
  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery)
    );

    // Sort customers
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'balance-asc':
          return a.outstandingDebt - b.outstandingDebt;
        case 'balance-desc':
          return b.outstandingDebt - a.outstandingDebt;
        default:
          return 0;
      }
    });

    return filtered;
  }, [customers, searchQuery, sortBy]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isOverdue = (customer: Customer) => {
    // In a real app, you'd check if the debt is older than 7 days
    return customer.outstandingDebt > 0;
  };

  const handleAddCustomer = async () => {
    try {
      await createCustomer({
        name: newCustomerForm.name,
        phone: newCustomerForm.phone,
        email: '',
        address: '',
        createdDate: new Date().toISOString(),
        totalPurchases: 0,
        outstandingDebt: parseFloat(newCustomerForm.initialBalance) || 0,
        creditLimit: 1000,
        riskRating: 'low',
        lastPurchaseDate: undefined
      });

      toast({
        title: "Customer Added",
        description: `${newCustomerForm.name} has been added successfully`,
      });

      setShowAddModal(false);
      setNewCustomerForm({ name: '', phone: '', initialBalance: '' });
    } catch (error) {
      console.error('Failed to add customer:', error);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedCustomer) return;

    try {
      const paymentAmount = parseFloat(paymentForm.amount);
      const newBalance = Math.max(0, selectedCustomer.outstandingDebt - paymentAmount);

      await updateCustomer(selectedCustomer.id, {
        outstandingDebt: newBalance
      });

      toast({
        title: "Payment Recorded",
        description: `Payment of ${formatCurrency(paymentAmount)} recorded for ${selectedCustomer.name}`,
      });

      setShowPaymentDrawer(false);
      setPaymentForm({ amount: '', method: 'cash', reference: '' });
      setSelectedCustomer(null);
    } catch (error) {
      console.error('Failed to record payment:', error);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6 p-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-display text-primary">Customers</h1>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={() => setShowAddModal(true)}
                className="px-6 py-2 bg-accent text-white rounded-xl shadow-lg hover:bg-accent/90 transition-all duration-200 flex items-center gap-2"
              >
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                  <UserPlus className="w-3 h-3" />
                </div>
                New Customer
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add a new customer</TooltipContent>
          </Tooltip>
        </div>

        {/* Search & Sort Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by name or phone…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-4"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">A–Z</SelectItem>
              <SelectItem value="balance-asc">Balance ↑</SelectItem>
              <SelectItem value="balance-desc">Balance ↓</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Customer Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-card rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.totalCustomers}</div>
                <div className="text-sm text-muted-foreground">Total Customers</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{formatCurrency(stats.averageBalance)}</div>
                <div className="text-sm text-muted-foreground">Avg Outstanding</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.overdueCount}</div>
                <div className="text-sm text-muted-foreground">Overdue Count</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer List */}
        <div className="space-y-4">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="rounded-2xl">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-muted animate-pulse rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
                    <div className="h-3 bg-muted animate-pulse rounded w-1/4" />
                  </div>
                  <div className="h-6 bg-muted animate-pulse rounded w-20" />
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="divide-y divide-border">
              {filteredAndSortedCustomers.map((customer) => (
                <Card 
                  key={customer.id} 
                  className="rounded-2xl mb-4 hover:bg-accent/5 hover:border-accent/20 transition-all duration-200"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {getInitials(customer.name)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Customer Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{customer.name}</h3>
                          {isOverdue(customer) && (
                            <Badge className="bg-red-100 text-red-800 text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              Overdue
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{customer.phone}</p>
                      </div>

                      {/* Balance Badge */}
                      <Badge 
                        className={`text-sm ${
                          customer.outstandingDebt === 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        KES {customer.outstandingDebt.toFixed(2)}
                      </Badge>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View History
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowPaymentDrawer(true);
                        }}
                        disabled={customer.outstandingDebt === 0}
                        className="flex-1 flex items-center gap-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        Record Payment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Add Customer Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="sm:max-w-md rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">New Customer</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Customer name"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="0712345678"
                />
              </div>

              <div>
                <Label htmlFor="initialBalance">Initial Balance (Optional)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    KES
                  </span>
                  <Input
                    id="initialBalance"
                    type="number"
                    step="0.01"
                    value={newCustomerForm.initialBalance}
                    onChange={(e) => setNewCustomerForm(prev => ({ ...prev, initialBalance: e.target.value }))}
                    className="pl-12"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddCustomer}
                  disabled={!newCustomerForm.name || !newCustomerForm.phone}
                  className="flex-1 bg-accent hover:bg-accent/90"
                >
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Record Payment Drawer */}
        <Dialog open={showPaymentDrawer} onOpenChange={setShowPaymentDrawer}>
          <DialogContent className="sm:max-w-md rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                Record Payment for {selectedCustomer?.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    KES
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="pl-12"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="method">Payment Method</Label>
                <Select 
                  value={paymentForm.method} 
                  onValueChange={(value) => setPaymentForm(prev => ({ ...prev, method: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentForm.method === 'mpesa' && (
                <div>
                  <Label htmlFor="reference">M-Pesa Reference</Label>
                  <Input
                    id="reference"
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, reference: e.target.value }))}
                    placeholder="Enter transaction code"
                  />
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setShowPaymentDrawer(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRecordPayment}
                  disabled={!paymentForm.amount}
                  className="flex-1 bg-brand-green hover:bg-brand-green-dark"
                >
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default CustomersPage;
