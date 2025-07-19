
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, User, Users, TrendingUp, DollarSign } from 'lucide-react';
import { useUnifiedCustomers } from '../../hooks/useUnifiedCustomers';
import { Customer } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { useToast } from '../../hooks/use-toast';
import { TooltipWrapper } from '../TooltipWrapper';
import CustomerCard from './CustomerCard';
import CustomerFormModal from './CustomerFormModal';
import PaymentModal from './PaymentModal';
import DeleteCustomerModal from './DeleteCustomerModal';

const CustomersPage = () => {
  const { 
    customers, 
    loading, 
    createCustomer, 
    updateCustomer, 
    deleteCustomer,
    isOnline, 
    pendingOperations 
  } = useUnifiedCustomers();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [operationsInProgress, setOperationsInProgress] = useState<{
    deleting: string | null;
    recordingPayment: string | null;
  }>({
    deleting: null,
    recordingPayment: null,
  });

  // Filter customers based on search query
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats
  const totalCustomers = customers.length;
  const totalSales = customers.reduce((sum, c) => sum + (c.totalPurchases || 0), 0);
  const totalOutstandingDebt = customers.reduce((sum, c) => sum + (c.outstandingDebt || 0), 0);

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setIsEditing(false);
    setShowFormModal(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditing(true);
    setShowFormModal(true);
  };

  const handleRecordPayment = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowPaymentModal(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDeleteModal(true);
  };

  const handleSaveCustomer = async (customerData: Omit<Customer, 'id' | 'createdDate'>) => {
    try {
      if (isEditing && selectedCustomer) {
        await updateCustomer(selectedCustomer.id, customerData);
        toast({
          title: "Success",
          description: isOnline ? "Customer updated successfully" : "Customer updated (will sync when online)",
        });
      } else {
        await createCustomer(customerData);
        toast({
          title: "Success",
          description: isOnline ? "Customer created successfully" : "Customer created (will sync when online)",
        });
      }
      setShowFormModal(false);
      setSelectedCustomer(null);
    } catch (error) {
      console.error('Failed to save customer:', error);
      toast({
        title: "Error",
        description: "Failed to save customer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedCustomer) return;
    
    setOperationsInProgress(prev => ({ ...prev, deleting: selectedCustomer.id }));
    try {
      await deleteCustomer(selectedCustomer.id);
      toast({
        title: "Success",
        description: isOnline ? "Customer deleted successfully" : "Customer deleted (will sync when online)",
      });
      setShowDeleteModal(false);
      setSelectedCustomer(null);
    } catch (error) {
      console.error('Failed to delete customer:', error);
      toast({
        title: "Error",
        description: "Failed to delete customer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setOperationsInProgress(prev => ({ ...prev, deleting: null }));
    }
  };

  const handlePaymentComplete = async (paymentData: { amount: number; method: string; notes?: string }) => {
    if (!selectedCustomer) return;
    
    setOperationsInProgress(prev => ({ ...prev, recordingPayment: selectedCustomer.id }));
    try {
      // Calculate new outstanding debt
      const newOutstandingDebt = Math.max(0, selectedCustomer.outstandingDebt - paymentData.amount);
      
      // Update customer with new debt amount
      await updateCustomer(selectedCustomer.id, {
        outstandingDebt: newOutstandingDebt,
        lastPurchaseDate: new Date().toISOString()
      });

      toast({
        title: "Payment Recorded",
        description: isOnline 
          ? `Payment of ${formatCurrency(paymentData.amount)} recorded successfully`
          : `Payment of ${formatCurrency(paymentData.amount)} recorded (will sync when online)`,
      });
      
      setShowPaymentModal(false);
      setSelectedCustomer(null);
    } catch (error) {
      console.error('Failed to record payment:', error);
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setOperationsInProgress(prev => ({ ...prev, recordingPayment: null }));
    }
  };

  return (
    <TooltipWrapper>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Customers
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Manage your customer relationships and credit limits
            </p>
          </div>

          <div className="flex items-center gap-3">
            {pendingOperations > 0 && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                {pendingOperations} pending sync
              </Badge>
            )}
            {!isOnline && (
              <Badge variant="secondary" className="bg-red-50 text-red-800 border-red-200">
                Working Offline
              </Badge>
            )}
            <Button onClick={handleAddCustomer}>
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{totalCustomers}</div>
                  <div className="text-sm text-blue-700">Total Customers</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalSales)}
                  </div>
                  <div className="text-sm text-green-700">Total Sales</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(totalOutstandingDebt)}
                  </div>
                  <div className="text-sm text-orange-700">Outstanding Debt</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search customers by name, phone, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Customer List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Loading customers...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <User className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                {searchQuery ? 'No customers found' : 'No customers yet'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {searchQuery ? 'Try adjusting your search terms' : 'Get started by adding your first customer'}
              </p>
              {!searchQuery && (
                <Button onClick={handleAddCustomer} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Customer
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCustomers.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                onEdit={handleEditCustomer}
                onDelete={handleDeleteCustomer}
                onRecordPayment={handleRecordPayment}
                isDeleting={operationsInProgress.deleting === customer.id}
                isRecordingPayment={operationsInProgress.recordingPayment === customer.id}
              />
            ))}
          </div>
        )}

        {/* Modals */}
        <CustomerFormModal
          isOpen={showFormModal}
          onClose={() => {
            setShowFormModal(false);
            setSelectedCustomer(null);
          }}
          customer={selectedCustomer}
          isEditing={isEditing}
          onSave={handleSaveCustomer}
        />

        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedCustomer(null);
          }}
          customer={selectedCustomer}
          onPayment={handlePaymentComplete}
          isRecording={operationsInProgress.recordingPayment === selectedCustomer?.id}
        />

        <DeleteCustomerModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedCustomer(null);
          }}
          customer={selectedCustomer}
          onDelete={handleConfirmDelete}
          isDeleting={operationsInProgress.deleting === selectedCustomer?.id}
        />
      </div>
    </TooltipWrapper>
  );
};

export default CustomersPage;
