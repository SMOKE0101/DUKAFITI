
import React, { useState, useMemo } from 'react';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '../hooks/use-toast';
import { Customer } from '../types';
import { formatCurrency } from '../utils/currency';
import { 
  Search, 
  Filter, 
  SortAsc, 
  Users, 
  UserPlus, 
  TrendingUp, 
  AlertTriangle,
  DollarSign,
  Phone,
  MapPin,
  Calendar,
  Eye,
  CreditCard
} from 'lucide-react';
import NewCustomerDrawer from './customers/NewCustomerDrawer';
import CustomerDetailsDrawer from './customers/CustomerDetailsDrawer';
import NewRepaymentDrawer from './customers/NewRepaymentDrawer';

const CustomersPage = () => {
  const { customers, loading, createCustomer, updateCustomer, deleteCustomer } = useSupabaseCustomers();
  const { toast } = useToast();

  // Modal states
  const [showNewCustomerDrawer, setShowNewCustomerDrawer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [showRepaymentDrawer, setShowRepaymentDrawer] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'debt' | 'no-debt'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'debt' | 'recent'>('name');

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalCustomers = customers.length;
    const customersWithDebt = customers.filter(c => c.outstandingDebt > 0);
    const totalDebt = customers.reduce((sum, c) => sum + c.outstandingDebt, 0);
    const customersWithDebtCount = customersWithDebt.length;

    return {
      totalCustomers,
      customersWithDebtCount,
      totalDebt,
      averageDebt: customersWithDebtCount > 0 ? totalDebt / customersWithDebtCount : 0
    };
  }, [customers]);

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    let filtered = customers.filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesFilter = filterBy === 'all' || 
                           (filterBy === 'debt' && customer.outstandingDebt > 0) ||
                           (filterBy === 'no-debt' && customer.outstandingDebt === 0);
      
      return matchesSearch && matchesFilter;
    });

    // Sort customers
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'debt':
          return b.outstandingDebt - a.outstandingDebt;
        case 'recent':
          return new Date(b.createdDate || 0).getTime() - new Date(a.createdDate || 0).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [customers, searchTerm, filterBy, sortBy]);

  const handleAddCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createCustomer(customerData);
      setShowNewCustomerDrawer(false);
      toast({
        title: "Success",
        description: "Customer added successfully",
      });
    } catch (error) {
      console.error('Failed to add customer:', error);
      toast({
        title: "Error",
        description: "Failed to add customer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailsDrawer(true);
  };

  const handleEditCustomer = async (id: string, updates: Partial<Customer>) => {
    try {
      await updateCustomer(id, updates);
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
      // Update the selected customer if it's currently being viewed
      if (selectedCustomer && selectedCustomer.id === id) {
        setSelectedCustomer({ ...selectedCustomer, ...updates });
      }
    } catch (error) {
      console.error('Failed to update customer:', error);
      toast({
        title: "Error",
        description: "Failed to update customer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    try {
      await deleteCustomer(id);
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
    } catch (error) {
      console.error('Failed to delete customer:', error);
      toast({
        title: "Error",
        description: "Failed to delete customer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRecordPayment = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowRepaymentDrawer(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        {/* Modern Top Bar */}
        <div className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center px-6">
          <h1 className="font-mono text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">
            CUSTOMERS
          </h1>
        </div>
        
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Modern Top Bar */}
      <div className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="font-mono text-lg md:text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">
            CUSTOMERS
          </h1>
        </div>
        <button
          onClick={() => setShowNewCustomerDrawer(true)}
          className="px-4 md:px-6 py-2 bg-transparent border-2 border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full font-mono text-xs md:text-sm font-bold uppercase tracking-wide transition-all duration-200 flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">ADD CUSTOMER</span>
          <span className="sm:hidden">ADD</span>
        </button>
      </div>

      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Total Customers',
              value: metrics.totalCustomers.toString(),
              icon: Users,
              color: 'border-blue-600',
              iconColor: 'text-blue-600 dark:text-blue-400'
            },
            {
              title: 'Customers with Debt',
              value: metrics.customersWithDebtCount.toString(),
              icon: AlertTriangle,
              color: 'border-orange-600',
              iconColor: 'text-orange-600 dark:text-orange-400'
            },
            {
              title: 'Total Outstanding',
              value: formatCurrency(metrics.totalDebt),
              icon: DollarSign,
              color: 'border-red-600',
              iconColor: 'text-red-600 dark:text-red-400'
            },
            {
              title: 'Average Debt',
              value: formatCurrency(metrics.averageDebt),
              icon: TrendingUp,
              color: 'border-purple-600',
              iconColor: 'text-purple-600 dark:text-purple-400'
            }
          ].map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div key={index} className={`border-2 ${metric.color} rounded-xl p-6 bg-transparent`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-mono text-xs font-black uppercase tracking-wide text-gray-700 dark:text-gray-300 mb-3">
                      {metric.title}
                    </h3>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {metric.value}
                    </p>
                  </div>
                  <div className="w-10 h-10 border border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center">
                    <Icon className={`w-5 h-5 ${metric.iconColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-6 bg-transparent">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 border border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center">
              <Filter className="w-3 h-3 text-primary" />
            </div>
            <h3 className="font-mono text-lg font-black uppercase tracking-wider text-gray-900 dark:text-white">
              FILTER & SEARCH
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 transition-colors group-focus-within:text-primary" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 rounded-xl border-2 bg-transparent hover:border-primary/50 focus:border-primary transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            
            {/* Filter */}
            <Select value={filterBy} onValueChange={(value: 'all' | 'debt' | 'no-debt') => setFilterBy(value)}>
              <SelectTrigger className="h-12 rounded-xl border-2 bg-transparent hover:border-primary/50 focus:border-primary transition-all duration-200">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-primary" />
                  <SelectValue placeholder="Filter by" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-2 bg-popover text-popover-foreground backdrop-blur-xl">
                <SelectItem value="all" className="rounded-lg">All Customers</SelectItem>
                <SelectItem value="debt" className="rounded-lg">With Outstanding Debt</SelectItem>
                <SelectItem value="no-debt" className="rounded-lg">No Outstanding Debt</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value: 'name' | 'debt' | 'recent') => setSortBy(value)}>
              <SelectTrigger className="h-12 rounded-xl border-2 bg-transparent hover:border-primary/50 focus:border-primary transition-all duration-200">
                <div className="flex items-center gap-2">
                  <SortAsc className="w-4 h-4 text-primary" />
                  <SelectValue placeholder="Sort by" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-2 bg-popover text-popover-foreground backdrop-blur-xl">
                <SelectItem value="name" className="rounded-lg">Name A-Z</SelectItem>
                <SelectItem value="debt" className="rounded-lg">Debt High-Low</SelectItem>
                <SelectItem value="recent" className="rounded-lg">Recently Added</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Customers List */}
        <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-6 bg-transparent">
          <h3 className="font-mono text-lg font-black uppercase tracking-wider text-gray-900 dark:text-white mb-6">
            CUSTOMERS ({filteredCustomers.length})
          </h3>
          
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No customers found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.map((customer) => (
                <div key={customer.id} className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-transparent hover:border-primary/50 transition-all duration-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{customer.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <Phone className="w-3 h-3" />
                        <span>{customer.phone}</span>
                      </div>
                      {customer.address && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{customer.address}</span>
                        </div>
                      )}
                    </div>
                    {customer.outstandingDebt > 0 && (
                      <Badge variant="destructive" className="rounded-full text-xs">
                        {formatCurrency(customer.outstandingDebt)}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewCustomer(customer)}
                      className="flex-1 border-2 border-blue-300 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg font-mono text-xs font-bold uppercase"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      VIEW
                    </Button>
                    {customer.outstandingDebt > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRecordPayment(customer)}
                        className="flex-1 border-2 border-green-300 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg font-mono text-xs font-bold uppercase"
                      >
                        <CreditCard className="w-3 h-3 mr-1" />
                        PAY
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Drawers */}
      <NewCustomerDrawer
        isOpen={showNewCustomerDrawer}
        onClose={() => setShowNewCustomerDrawer(false)}
        onSave={handleAddCustomer}
      />

      <CustomerDetailsDrawer
        isOpen={showDetailsDrawer}
        onClose={() => setShowDetailsDrawer(false)}
        customer={selectedCustomer}
        onEdit={handleEditCustomer}
        onDelete={handleDeleteCustomer}
      />

      <NewRepaymentDrawer
        isOpen={showRepaymentDrawer}
        onClose={() => setShowRepaymentDrawer(false)}
        customer={selectedCustomer}
      />
    </div>
  );
};

export default CustomersPage;
