
import React, { useState } from 'react';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { Customer } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Plus, 
  Filter,
  SortAsc,
  SortDesc,
  Users,
  CreditCard,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { AddCustomerModal } from './customers/AddCustomerModal';
import { EditCustomerModal } from './customers/EditCustomerModal';
import { DeleteCustomerModal } from './customers/DeleteCustomerModal';
import { CustomerHistoryModal } from './customers/CustomerHistoryModal';
import NewRepaymentDrawer from './customers/NewRepaymentDrawer';
import { RefinedCustomerCard } from './customers/RefinedCustomerCard';

const CustomersPage = () => {
  const { customers, isLoading } = useSupabaseCustomers();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterBy, setFilterBy] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const [repaymentCustomer, setRepaymentCustomer] = useState<Customer | null>(null);

  // Filter and sort customers
  const filteredAndSortedCustomers = React.useMemo(() => {
    let filtered = customers.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Apply filter
    if (filterBy === 'debt') {
      filtered = filtered.filter(customer => customer.outstandingDebt > 0);
    } else if (filterBy === 'no-debt') {
      filtered = filtered.filter(customer => customer.outstandingDebt === 0);
    }

    // Apply sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'debt':
          aValue = a.outstandingDebt;
          bValue = b.outstandingDebt;
          break;
        case 'total-purchases':
          aValue = a.totalPurchases;
          bValue = b.totalPurchases;
          break;
        case 'last-purchase':
          aValue = a.lastPurchaseDate ? new Date(a.lastPurchaseDate).getTime() : 0;
          bValue = b.lastPurchaseDate ? new Date(b.lastPurchaseDate).getTime() : 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [customers, searchTerm, sortBy, sortOrder, filterBy]);

  // Calculate summary stats
  const totalCustomers = customers.length;
  const customersWithDebt = customers.filter(c => c.outstandingDebt > 0).length;
  const totalOutstandingDebt = customers.reduce((sum, c) => sum + c.outstandingDebt, 0);
  const totalPurchasesValue = customers.reduce((sum, c) => sum + c.totalPurchases, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Customer Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your customer relationships and track outstanding debts
            </p>
          </div>
          
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalCustomers}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                With Outstanding Debt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {customersWithDebt}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Total Outstanding Debt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(totalOutstandingDebt)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Total Sales Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(totalPurchasesValue)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search customers by name, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                />
              </div>

              {/* Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger className="w-40 bg-white/50 dark:bg-gray-700/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    <SelectItem value="debt">With Debt</SelectItem>
                    <SelectItem value="no-debt">No Debt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40 bg-white/50 dark:bg-gray-700/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="debt">Outstanding Debt</SelectItem>
                    <SelectItem value="total-purchases">Total Purchases</SelectItem>
                    <SelectItem value="last-purchase">Last Purchase</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="bg-white/50 dark:bg-gray-700/50"
                >
                  {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredAndSortedCustomers.length} of {totalCustomers} customers
          </p>
        </div>

        {/* Customer Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAndSortedCustomers.map((customer) => (
            <RefinedCustomerCard
              key={customer.id}
              customer={customer}
              onEdit={() => setEditingCustomer(customer)}
              onDelete={() => setDeletingCustomer(customer)}
              onViewHistory={() => setHistoryCustomer(customer)}
              onRecordPayment={() => setRepaymentCustomer(customer)}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredAndSortedCustomers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
              {searchTerm || filterBy !== 'all' ? 'No customers found' : 'No customers yet'}
            </h3>
            <p className="text-gray-500 dark:text-gray-500 mb-6">
              {searchTerm || filterBy !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Add your first customer to get started'
              }
            </p>
            {!searchTerm && filterBy === 'all' && (
              <Button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
            )}
          </div>
        )}

        {/* Modals */}
        <AddCustomerModal 
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
        
        {editingCustomer && (
          <EditCustomerModal
            isOpen={!!editingCustomer}
            onClose={() => setEditingCustomer(null)}
            customer={editingCustomer}
          />
        )}
        
        {deletingCustomer && (
          <DeleteCustomerModal
            isOpen={!!deletingCustomer}
            onClose={() => setDeletingCustomer(null)}
            customer={deletingCustomer}
          />
        )}
        
        {historyCustomer && (
          <CustomerHistoryModal
            isOpen={!!historyCustomer}
            onClose={() => setHistoryCustomer(null)}
            customer={historyCustomer}
          />
        )}
        
        {repaymentCustomer && (
          <NewRepaymentDrawer
            isOpen={!!repaymentCustomer}
            onClose={() => setRepaymentCustomer(null)}
            customer={repaymentCustomer}
          />
        )}
      </div>
    </div>
  );
};

export default CustomersPage;
