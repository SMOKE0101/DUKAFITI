import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, User, Users, DollarSign } from 'lucide-react';
import { useUnifiedCustomers } from '../../hooks/useUnifiedCustomers';
import { Customer } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { useToast } from '../../hooks/use-toast';
import { TooltipWrapper } from '../TooltipWrapper';
import CustomerCard from './CustomerCard';
import CustomerFormModal from './CustomerFormModal';
import PaymentModal from './PaymentModal';
import DeleteCustomerModal from './DeleteCustomerModal';
import { useSupabaseDebtPayments } from '../../hooks/useSupabaseDebtPayments';
import { useAuth } from '../../hooks/useAuth';

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
  const { createDebtPayment } = useSupabaseDebtPayments();
  const { user } = useAuth();
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
      
      // Create debt payment record
      await createDebtPayment({
        user_id: user?.id || '',
        customer_id: selectedCustomer.id,
        customer_name: selectedCustomer.name,
        amount: paymentData.amount,
        payment_method: paymentData.method,
        reference: paymentData.notes || undefined,
        timestamp: new Date().toISOString(),
      });
      
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
      <div className="min-h-screen bg-[#F4F6F8] font-['Inter']">
        <div className="container mx-auto px-6 py-8 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-['Inter']">
                Customer Management
              </h1>
              <p className="text-base text-gray-700 mt-2 font-['Inter']">
                Manage your customer relationships and credit limits
              </p>
            </div>

            <div className="flex items-center gap-4">
              {pendingOperations > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-amber-700">
                    {pendingOperations} pending sync
                  </span>
                </div>
              )}
              {!isOnline && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium text-red-700">
                    Working Offline
                  </span>
                </div>
              )}
              <Button 
                onClick={handleAddCustomer}
                className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 font-['Inter']"
              >
                <Plus className="w-5 h-5 mr-2" strokeWidth={2} />
                Add Customer
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-lg p-6 flex items-center transition-all duration-200 hover:-translate-y-1">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mr-4">
                <Users className="w-6 h-6 text-purple-600" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900 font-['Inter']">{totalCustomers}</div>
                <div className="text-base text-gray-700 font-['Inter']">Total Customers</div>
              </div>
            </Card>

            <Card className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-lg p-6 flex items-center transition-all duration-200 hover:-translate-y-1">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mr-4">
                <DollarSign className="w-6 h-6 text-red-600" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900 font-['Inter']">
                  {formatCurrency(totalOutstandingDebt)}
                </div>
                <div className="text-base text-gray-700 font-['Inter']">Outstanding Debt</div>
              </div>
            </Card>
          </div>

          {/* Search Bar */}
          <Card className="bg-white rounded-3xl border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" strokeWidth={1.5} />
                <Input
                  type="search"
                  placeholder="Search customers by name, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-100 rounded-xl pl-12 pr-4 py-4 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 border-0 text-base font-['Inter']"
                />
              </div>
            </CardContent>
          </Card>

          {/* Customer List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-base text-gray-700 font-['Inter']">Loading customers...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <Card className="bg-white rounded-3xl border border-gray-200 shadow-sm">
              <CardContent className="text-center py-12">
                <User className="mx-auto h-12 w-12 text-gray-400 mb-4" strokeWidth={1.5} />
                <h3 className="text-xl font-semibold text-gray-900 mb-2 font-['Inter']">
                  {searchQuery ? 'No customers found' : 'No customers yet'}
                </h3>
                <p className="text-base text-gray-700 font-['Inter']">
                  {searchQuery ? 'Try adjusting your search terms' : 'Get started by adding your first customer'}
                </p>
                {!searchQuery && (
                  <Button onClick={handleAddCustomer} className="mt-6 bg-purple-600 hover:bg-purple-700 font-['Inter']">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Customer
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
      </div>
    </TooltipWrapper>
  );
};

export default CustomersPage;
