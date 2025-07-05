import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Users, Phone, MapPin, Calendar, DollarSign, Edit, Trash2, Eye } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { Customer } from '../types';
import { formatCurrency } from '../utils/currency';
import FeatureLimitModal from './trial/FeatureLimitModal';
import { useTrialSystem } from '../hooks/useTrialSystem';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import CustomerModal from './CustomerModal';
import CustomerDetailsModal from './CustomerDetailsModal';
import LoadingSkeleton from './ui/loading-skeleton';
import ErrorState from './ui/error-state';
import EmptyState from './ui/empty-state';
import { TouchFriendlyButton } from '@/components/ui/touch-friendly-button';

const CustomerManagement = () => {
  const { 
    customers, 
    loading: customersLoading, 
    error: customersError,
    createCustomer, 
    updateCustomer, 
    deleteCustomer 
  } = useSupabaseCustomers();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showFeatureLimitModal, setShowFeatureLimitModal] = useState(false);
  const { toast } = useToast();
  const { trialInfo, updateFeatureUsage, checkFeatureAccess } = useTrialSystem();

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  const debtorCustomers = customers.filter(customer => customer.outstandingDebt > 0);

  const handleSaveCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingCustomer && trialInfo && trialInfo.isTrialActive) {
      const canCreateCustomer = checkFeatureAccess('customers');
      if (!canCreateCustomer) {
        setShowFeatureLimitModal(true);
        return;
      }
    }

    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, customerData);
        toast({
          title: "Success",
          description: "Customer updated successfully",
        });
      } else {
        await createCustomer(customerData);
        
        if (trialInfo && trialInfo.isTrialActive) {
          updateFeatureUsage('customers', 1);
        }
        
        toast({
          title: "Success",
          description: "Customer added successfully",
        });
      }

      setShowCustomerModal(false);
      setEditingCustomer(null);
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowCustomerModal(true);
  };

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailsModal(true);
  };

  const handleDelete = async (customer: Customer) => {
    if (window.confirm(`Are you sure you want to delete ${customer.name}?`)) {
      try {
        await deleteCustomer(customer.id);
        toast({
          title: "Success",
          description: "Customer deleted successfully",
        });
      } catch (error) {
        // Error is already handled in the hook
      }
    }
  };

  const handleAddCustomer = () => {
    if (trialInfo && trialInfo.isTrialActive) {
      const canCreateCustomer = checkFeatureAccess('customers');
      if (!canCreateCustomer) {
        setShowFeatureLimitModal(true);
        return;
      }
    }
    setEditingCustomer(null);
    setShowCustomerModal(true);
  };

  const handleClearDebt = async (customer: Customer) => {
    if (window.confirm(`Clear ${formatCurrency(customer.outstandingDebt)} debt for ${customer.name}?`)) {
      try {
        await updateCustomer(customer.id, { outstandingDebt: 0 });
        toast({
          title: "Success",
          description: "Debt cleared successfully",
        });
      } catch (error) {
        // Error is already handled in the hook
      }
    }
  };

  if (customersLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton variant="card" className="h-24" />
        <LoadingSkeleton variant="grid" count={6} />
      </div>
    );
  }

  if (customersError) {
    return (
      <ErrorState 
        title="Unable to Load Customers"
        message={customersError}
        onRetry={() => window.location.reload()}
        variant="page"
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Customer Management</h2>
          <p className="text-sm sm:text-base text-gray-600">Manage your customer database and track debts</p>
        </div>
        <TouchFriendlyButton 
          onClick={handleAddCustomer} 
          className="w-full sm:w-auto flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </TouchFriendlyButton>
      </div>

      <Tabs defaultValue="all" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all" className="text-xs sm:text-sm">
            All ({customers.length})
          </TabsTrigger>
          <TabsTrigger value="debtors" className="text-xs sm:text-sm">
            <span className="flex items-center gap-1">
              Debtors ({debtorCustomers.length})
              {debtorCustomers.length > 0 && <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 sm:space-y-6">
          {/* Search - Mobile Optimized */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm sm:text-base h-12"
              aria-label="Search customers"
            />
          </div>

          {/* Responsive Customers Grid */}
          {filteredCustomers.length === 0 ? (
            <EmptyState
              icon={searchTerm ? Search : Users}
              title={searchTerm ? "No customers found" : "No customers added yet"}
              description={
                searchTerm 
                  ? "Try adjusting your search terms to find the customer you're looking for."
                  : "Start building your customer database by adding your first customer."
              }
              variant={searchTerm ? "search" : "default"}
              actionLabel={!searchTerm ? "Add Customer" : undefined}
              onAction={!searchTerm ? handleAddCustomer : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {filteredCustomers.map(customer => (
                <Card key={customer.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-2 sm:pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm sm:text-lg truncate">{customer.name}</CardTitle>
                        {customer.outstandingDebt > 0 && (
                          <Badge variant="destructive" className="mt-1 text-xs">
                            Debt: {formatCurrency(customer.outstandingDebt)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex space-x-1 flex-shrink-0">
                        <TouchFriendlyButton
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(customer);
                          }}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                          title="View Details"
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        </TouchFriendlyButton>
                        <TouchFriendlyButton
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(customer);
                          }}
                          className="h-8 w-8 p-0"
                          title="Edit Customer"
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                        </TouchFriendlyButton>
                        <TouchFriendlyButton
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(customer);
                          }}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </TouchFriendlyButton>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent 
                    className="pt-0 cursor-pointer" 
                    onClick={() => handleViewDetails(customer)}
                  >
                    <div className="space-y-2 sm:space-y-3">
                      {customer.email && (
                        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                          <span>📧</span>
                          <span className="truncate">{customer.email}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                        <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span>{customer.phone}</span>
                      </div>
                      {customer.address && (
                        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">{customer.address}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-1 sm:pt-2">
                        <span className="text-xs sm:text-sm text-gray-600">Total:</span>
                        <span className="text-xs sm:text-sm font-medium">{formatCurrency(customer.totalPurchases)}</span>
                      </div>
                      {customer.lastPurchaseDate && (
                        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">Last: {new Date(customer.lastPurchaseDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {customer.outstandingDebt > 0 && (
                        <TouchFriendlyButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearDebt(customer);
                          }}
                          variant="outline"
                          size="sm"
                          className="w-full mt-2 text-xs sm:text-sm h-8"
                        >
                          Clear Debt
                        </TouchFriendlyButton>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="debtors">
          {debtorCustomers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No outstanding debts!"
              description="All customers are up to date with their payments. Great job managing your credit sales!"
              className="text-green-600"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {debtorCustomers.map(customer => (
                <Card key={customer.id} className="border-red-200 hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-2 sm:pb-3">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />
                      <CardTitle className="text-sm sm:text-lg truncate">{customer.name}</CardTitle>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      Debt: {formatCurrency(customer.outstandingDebt)}
                    </Badge>
                  </CardHeader>
                  <CardContent 
                    className="pt-0 cursor-pointer" 
                    onClick={() => handleViewDetails(customer)}
                  >
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                        <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span>{customer.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm text-gray-600">Total:</span>
                        <span className="text-xs sm:text-sm font-medium">{formatCurrency(customer.totalPurchases)}</span>
                      </div>
                      {customer.lastPurchaseDate && (
                        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">Last: {new Date(customer.lastPurchaseDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="flex space-x-2 mt-3 sm:mt-4">
                        <TouchFriendlyButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearDebt(customer);
                          }}
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs sm:text-sm h-8"
                        >
                          Clear Debt
                        </TouchFriendlyButton>
                        <TouchFriendlyButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(customer);
                          }}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                        </TouchFriendlyButton>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CustomerModal
        isOpen={showCustomerModal}
        onClose={() => {
          setShowCustomerModal(false);
          setEditingCustomer(null);
        }}
        customer={editingCustomer}
        onSave={handleSaveCustomer}
      />

      <CustomerDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        onUpdateCustomer={updateCustomer}
      />

      <FeatureLimitModal
        isOpen={showFeatureLimitModal}
        onClose={() => setShowFeatureLimitModal(false)}
        feature="customers"
        limit={trialInfo?.limits.customers || 25}
      />
    </div>
  );
};

export default CustomerManagement;
