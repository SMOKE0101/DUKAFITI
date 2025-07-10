import React, { useState } from 'react';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Plus, 
  Filter,
  SortAsc,
  SortDesc,
  Users,
  CreditCard,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  Calendar
} from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import AddCustomerModal from './customers/AddCustomerModal';
import EditCustomerModal from './customers/EditCustomerModal';
import DeleteCustomerModal from './customers/DeleteCustomerModal';
import CustomerHistoryModal from './customers/CustomerHistoryModal';
import NewRepaymentDrawer from './customers/NewRepaymentDrawer';
import { Customer } from '../types';

const CustomersPage = () => {
  const { customers, loading, createCustomer, updateCustomer, deleteCustomer } = useSupabaseCustomers();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterBy, setFilterBy] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [viewingHistory, setViewingHistory] = useState<Customer | null>(null);
  const [repaymentCustomer, setRepaymentCustomer] = useState<Customer | null>(null);

  // Filter and sort customers
  const filteredAndSortedCustomers = React.useMemo(() => {
    let filtered = customers.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm)
    );

    // Apply filter
    if (filterBy === 'with-debt') {
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
        case 'lastPurchase':
          aValue = new Date(a.lastPurchaseDate || 0).getTime();
          bValue = new Date(b.lastPurchaseDate || 0).getTime();
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
  const totalDebt = customers.reduce((sum, c) => sum + c.outstandingDebt, 0);
  const averageDebt = customersWithDebt > 0 ? totalDebt / customersWithDebt : 0;

  const handleCreateCustomer = async (customerData: Omit<Customer, 'id' | 'createdDate' | 'lastPurchaseDate'>) => {
    await createCustomer(customerData);
  };

  const handleUpdateCustomer = async (id: string, updates: Partial<Customer>) => {
    await updateCustomer(id, updates);
  };

  const handleDeleteCustomer = async (id: string) => {
    await deleteCustomer(id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page Title - Consistent with other pages */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-6">
        <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-mono font-black uppercase tracking-widest text-gray-900 dark:text-white">
                  CUSTOMERS
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 font-normal">
                  Manage your customer relationships and track credit
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  onClick={() => setIsAddModalOpen(true)}
                  variant="outline"
                  className="bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 border-2 border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 shadow-sm hover:shadow-md transition-all duration-200 font-semibold"
                >
                  <Plus className="w-4 h-4 mr-2 stroke-2" />
                  ADD CUSTOMER
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-blue-200 dark:border-blue-700 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono font-bold uppercase tracking-tight text-blue-600 dark:text-blue-400">
                    TOTAL CUSTOMERS
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {totalCustomers}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl">
                  <Users className="w-8 h-8 text-blue-600 dark:text-blue-400 stroke-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-orange-200 dark:border-orange-700 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono font-bold uppercase tracking-tight text-orange-600 dark:text-orange-400">
                    WITH DEBT
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {customersWithDebt}
                  </p>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-700 rounded-xl">
                  <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400 stroke-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-red-200 dark:border-red-700 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono font-bold uppercase tracking-tight text-red-600 dark:text-red-400">
                    TOTAL DEBT
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatCurrency(totalDebt)}
                  </p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700 rounded-xl">
                  <CreditCard className="w-8 h-8 text-red-600 dark:text-red-400 stroke-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-green-200 dark:border-green-700 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono font-bold uppercase tracking-tight text-green-600 dark:text-green-400">
                    AVERAGE DEBT
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatCurrency(averageDebt)}
                  </p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl">
                  <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400 stroke-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 stroke-2" />
                <Input
                  placeholder="Search customers by name or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600"
                />
              </div>

              {/* Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500 stroke-2" />
                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger className="w-40 bg-white/50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    <SelectItem value="with-debt">With Debt</SelectItem>
                    <SelectItem value="no-debt">No Debt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40 bg-white/50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="debt">Outstanding Debt</SelectItem>
                    <SelectItem value="lastPurchase">Last Purchase</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="bg-white/50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600"
                >
                  {sortOrder === 'asc' ? <SortAsc className="w-4 h-4 stroke-2" /> : <SortDesc className="w-4 h-4 stroke-2" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-mono font-bold uppercase tracking-tight">
            SHOWING {filteredAndSortedCustomers.length} OF {totalCustomers} CUSTOMERS
          </p>
        </div>

        {/* Customer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedCustomers.map((customer) => (
            <Card key={customer.id} className="bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">{customer.name}</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{customer.phone}</p>
                  </div>
                  <Badge className={`text-xs font-mono font-bold uppercase border ${
                    customer.outstandingDebt > 0 
                      ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700' 
                      : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700'
                  }`}>
                    {customer.outstandingDebt > 0 ? 'HAS DEBT' : 'NO DEBT'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Outstanding Debt:</span>
                    <span className={`font-bold ${customer.outstandingDebt > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {formatCurrency(customer.outstandingDebt)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Total Purchases:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(customer.totalPurchases)}</span>
                  </div>
                  {customer.lastPurchaseDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Last Purchase:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {new Date(customer.lastPurchaseDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2 grid grid-cols-4 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-white/50 dark:bg-gray-700/50 border-2 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-semibold"
                    onClick={() => setViewingHistory(customer)}
                  >
                    <Eye className="w-4 h-4 stroke-2" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-white/50 dark:bg-gray-700/50 border-2 border-yellow-200 dark:border-yellow-700 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 font-semibold"
                    onClick={() => setEditingCustomer(customer)}
                  >
                    <Edit className="w-4 h-4 stroke-2" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-white/50 dark:bg-gray-700/50 border-2 border-green-200 dark:border-green-700 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 font-semibold"
                    onClick={() => setRepaymentCustomer(customer)}
                    disabled={customer.outstandingDebt <= 0}
                  >
                    <DollarSign className="w-4 h-4 stroke-2" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-white/50 dark:bg-gray-700/50 border-2 border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-semibold"
                    onClick={() => setDeletingCustomer(customer)}
                  >
                    <Trash2 className="w-4 h-4 stroke-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredAndSortedCustomers.length === 0 && (
          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400 stroke-2" />
              </div>
              <h3 className="text-lg font-mono font-bold uppercase tracking-tight text-gray-600 dark:text-gray-400 mb-2">
                {searchTerm || filterBy !== 'all' ? 'NO CUSTOMERS FOUND' : 'NO CUSTOMERS YET'}
              </h3>
              <p className="text-gray-500 dark:text-gray-500 mb-6 font-medium">
                {searchTerm || filterBy !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Add your first customer to get started'
                }
              </p>
              {!searchTerm && filterBy === 'all' && (
                <Button 
                  onClick={() => setIsAddModalOpen(true)}
                  variant="outline"
                  className="bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 border-2 border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 font-semibold"
                >
                  <Plus className="w-4 h-4 mr-2 stroke-2" />
                  ADD CUSTOMER
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Modals */}
        <AddCustomerModal 
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleCreateCustomer}
        />
        
        {editingCustomer && (
          <EditCustomerModal
            isOpen={!!editingCustomer}
            onClose={() => setEditingCustomer(null)}
            customer={editingCustomer}
            onSave={handleUpdateCustomer}
          />
        )}
        
        {deletingCustomer && (
          <DeleteCustomerModal
            isOpen={!!deletingCustomer}
            onClose={() => setDeletingCustomer(null)}
            customer={deletingCustomer}
            onDelete={handleDeleteCustomer}
          />
        )}

        {viewingHistory && (
          <CustomerHistoryModal
            isOpen={!!viewingHistory}
            onClose={() => setViewingHistory(null)}
            customer={viewingHistory}
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
