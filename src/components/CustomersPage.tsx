
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Search, 
  UserPlus, 
  DollarSign,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Filter,
  SortAsc,
  AlertTriangle
} from 'lucide-react';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { formatCurrency } from '../utils/currency';
import { Customer } from '../types';
import AddCustomerModal from './customers/AddCustomerModal';
import EditCustomerModal from './customers/EditCustomerModal';
import DeleteCustomerModal from './customers/DeleteCustomerModal';
import NewRepaymentDrawer from './customers/NewRepaymentDrawer';
import CustomerHistoryModal from './customers/CustomerHistoryModal';

const CustomersPage = () => {
  const { customers, loading, createCustomer, updateCustomer, deleteCustomer } = useSupabaseCustomers();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'debt' | 'date'>('name');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRepaymentDrawer, setShowRepaymentDrawer] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm)
    );

    if (selectedRisk !== 'all') {
      filtered = filtered.filter(customer => customer.riskRating === selectedRisk);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'debt':
          return b.outstandingDebt - a.outstandingDebt;
        case 'date':
          return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
        default:
          return 0;
      }
    });
  }, [customers, searchTerm, selectedRisk, sortBy]);

  const totalCustomers = customers.length;
  const totalDebt = customers.reduce((sum, customer) => sum + customer.outstandingDebt, 0);
  const customersWithDebt = customers.filter(customer => customer.outstandingDebt > 0).length;
  const highRiskCustomers = customers.filter(customer => customer.riskRating === 'high').length;

  const handleAddCustomer = async (customerData: Omit<Customer, 'id' | 'createdDate' | 'lastPurchaseDate'>) => {
    const newCustomerData = {
      ...customerData,
      createdDate: new Date().toISOString(),
      lastPurchaseDate: null
    };
    await createCustomer(newCustomerData);
  };

  const handleEditCustomer = async (id: string, updates: Partial<Customer>) => {
    await updateCustomer(id, updates);
    setShowEditModal(false);
    setSelectedCustomer(null);
  };

  const handleDeleteCustomer = async (id: string) => {
    await deleteCustomer(id);
    setShowDeleteModal(false);
    setSelectedCustomer(null);
  };

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowEditModal(true);
  };

  const openDeleteModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDeleteModal(true);
  };

  const openRepaymentDrawer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowRepaymentDrawer(true);
  };

  const openHistoryModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowHistoryModal(true);
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
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-6">
        <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-mono font-black uppercase tracking-widest text-gray-900 dark:text-white">
                  CUSTOMERS
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 font-normal">
                  Manage your customer relationships and credit
                </p>
              </div>
              
              <Button 
                onClick={() => setShowAddModal(true)}
                className="bg-green-600 hover:bg-green-500 text-white rounded-lg px-6 py-3 font-medium flex items-center gap-2 shadow-md hover:shadow-lg transition-all hover:scale-105"
              >
                <UserPlus className="w-5 h-5" />
                Add Customer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-blue-200 dark:border-blue-700 shadow-sm">
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

          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-red-200 dark:border-red-700 shadow-sm">
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
                  <DollarSign className="w-8 h-8 text-red-600 dark:text-red-400 stroke-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-orange-200 dark:border-orange-700 shadow-sm">
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

          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-purple-200 dark:border-purple-700 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono font-bold uppercase tracking-tight text-purple-600 dark:text-purple-400">
                    HIGH RISK
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {highRiskCustomers}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-xl">
                  <AlertTriangle className="w-8 h-8 text-purple-600 dark:text-purple-400 stroke-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="bg-white dark:bg-gray-800 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search customers by name or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={selectedRisk}
                  onChange={(e) => setSelectedRisk(e.target.value as 'all' | 'low' | 'medium' | 'high')}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                </select>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'debt' | 'date')}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                >
                  <option value="name">Sort by Name</option>
                  <option value="debt">Sort by Debt</option>
                  <option value="date">Sort by Date</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedCustomers.map((customer) => (
            <Card key={customer.id} className="bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                      {customer.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant={
                          customer.riskRating === 'high' ? 'destructive' :
                          customer.riskRating === 'medium' ? 'secondary' : 'default'
                        }
                        className="text-xs"
                      >
                        {customer.riskRating.toUpperCase()} RISK
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{customer.phone}</span>
                  </div>
                  {customer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{customer.email}</span>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{customer.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {new Date(customer.createdDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Outstanding Debt</span>
                    <span className={`font-bold ${customer.outstandingDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(customer.outstandingDebt)}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openHistoryModal(customer)}
                      className="flex-1"
                    >
                      History
                    </Button>
                    {customer.outstandingDebt > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openRepaymentDrawer(customer)}
                        className="flex-1 text-green-600 border-green-600 hover:bg-green-50"
                      >
                        Repay
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(customer)}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredAndSortedCustomers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No customers found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first customer.'}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddCustomerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddCustomer}
      />

      {selectedCustomer && (
        <>
          <EditCustomerModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            customer={selectedCustomer}
            onSave={handleEditCustomer}
          />

          <DeleteCustomerModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            customer={selectedCustomer}
            onDelete={handleDeleteCustomer}
          />

          <NewRepaymentDrawer
            isOpen={showRepaymentDrawer}
            onClose={() => setShowRepaymentDrawer(false)}
            customer={selectedCustomer}
          />

          <CustomerHistoryModal
            isOpen={showHistoryModal}
            onClose={() => setShowHistoryModal(false)}
            customer={selectedCustomer}
          />
        </>
      )}
    </div>
  );
};

export default CustomersPage;
