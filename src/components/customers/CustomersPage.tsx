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
import { useIsMobile } from '../../hooks/use-mobile';
import CustomersHeader from './CustomersHeader';
import CustomerCard from './CustomerCard';
import CustomerFormModal from './CustomerFormModal';
import PaymentModal from './PaymentModal';
import DeleteCustomerModal from './DeleteCustomerModal';
import { useCacheManager } from '../../hooks/useCacheManager';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
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
  const { addPendingOperation } = useCacheManager();
  const { isOnline: networkOnline } = useNetworkStatus();
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
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
    if (!selectedCustomer || !user) return;
    
    setOperationsInProgress(prev => ({ ...prev, recordingPayment: selectedCustomer.id }));
    try {
      const paymentAmount = paymentData.amount;
      const newBalance = Math.max(0, selectedCustomer.outstandingDebt - paymentAmount);
      const timestamp = new Date().toISOString();
      
      console.log('[CustomersPage] Recording payment using atomic operation');
      
      // Use atomic operation to ensure payment and balance update happen together
      addPendingOperation({
        type: 'debt_payment',
        operation: 'create',
        data: {
          user_id: user.id,
          customer_id: selectedCustomer.id,
          customer_name: selectedCustomer.name,
          amount: paymentAmount,
          payment_method: paymentData.method,
          reference: paymentData.notes || null,
          timestamp: timestamp,
          // Include customer balance update data for atomic operation
          customer_balance_update: {
            new_outstanding_debt: newBalance,
            last_purchase_date: timestamp
          }
        }
      });
      
      // Update local state immediately for UI responsiveness
      try {
        // Update customer in local storage
        const storedCustomers = localStorage.getItem('customers');
        if (storedCustomers) {
          const customers = JSON.parse(storedCustomers);
          const updatedCustomers = customers.map((c: any) => 
            c.id === selectedCustomer.id 
              ? { ...c, outstandingDebt: newBalance, lastPurchaseDate: timestamp, updated_at: timestamp }
              : c
          );
          localStorage.setItem('customers', JSON.stringify(updatedCustomers));
          console.log('[CustomersPage] Updated customer in localStorage:', { 
            customerId: selectedCustomer.id, 
            oldDebt: selectedCustomer.outstandingDebt, 
            newBalance: newBalance 
          });
        }
        
        // Add to local debt payments for reports
        const storedPayments = localStorage.getItem('debt_payments_offline') || '[]';
        const payments = JSON.parse(storedPayments);
        const newPayment = {
          id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: user.id,
          customer_id: selectedCustomer.id,
          customer_name: selectedCustomer.name,
          amount: paymentAmount,
          payment_method: paymentData.method,
          reference: paymentData.notes || null,
          timestamp: timestamp,
          created_at: timestamp,
          synced: false
        };
        payments.unshift(newPayment);
        localStorage.setItem('debt_payments_offline', JSON.stringify(payments));
        
        // Update the selectedCustomer state immediately
        setSelectedCustomer(prev => prev ? {
          ...prev,
          outstandingDebt: newBalance,
          lastPurchaseDate: timestamp,
          updated_at: timestamp
        } : null);
        
      } catch (localUpdateError) {
        console.warn('[CustomersPage] Failed to update local state:', localUpdateError);
      }

      toast({
        title: "Payment Recorded",
        description: networkOnline && navigator.onLine
          ? `Payment of ${formatCurrency(paymentData.amount)} recorded successfully`
          : `Payment of ${formatCurrency(paymentData.amount)} saved offline. Will sync when online.`,
      });
      
      // Trigger immediate sync if online to persist the payment and balance update
      if (networkOnline && navigator.onLine) {
        console.log('[CustomersPage] Triggering immediate sync for debt payment');
        try {
          // Request sync for debt payments specifically
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('request-sync', {
              detail: { type: 'debt_payment' }
            }));
          }, 100);
        } catch (syncError) {
          console.warn('[CustomersPage] Failed to trigger immediate sync:', syncError);
        }
      }
      
      // Trigger immediate UI refresh with specific event
      window.dispatchEvent(new CustomEvent('customer-payment-recorded', {
        detail: { 
          customerId: selectedCustomer.id, 
          newBalance: newBalance,
          paymentAmount: paymentAmount,
          timestamp: timestamp
        }
      }));
      
      // Also trigger general customer update event
      window.dispatchEvent(new CustomEvent('customer-debt-updated', {
        detail: { customerId: selectedCustomer.id, newBalance: newBalance }
      }));
      
      setShowPaymentModal(false);
    } catch (error) {
      console.error('[CustomersPage] Failed to record payment:', error);
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setOperationsInProgress(prev => ({ ...prev, recordingPayment: null }));
    }
  };

  if (isMobile) {
    return (
      <TooltipWrapper>
        <div className="min-h-screen bg-background">
          <div className="px-4 py-6 space-y-6">
            {/* Mobile Header */}
            <CustomersHeader
              totalCustomers={totalCustomers}
              totalOutstandingDebt={totalOutstandingDebt}
              pendingOperations={pendingOperations}
              isOnline={isOnline}
              onAddCustomer={handleAddCustomer}
            />

            {/* Search Bar */}
            <Card className="bg-card rounded-xl border border-border shadow-sm">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="search"
                    placeholder="Search customers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-background rounded-lg border border-border"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Customer List */}
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="mt-3 text-sm text-muted-foreground">Loading customers...</p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <Card className="bg-card rounded-xl border border-border shadow-sm">
                <CardContent className="text-center py-8">
                  <User className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">
                    {searchQuery ? 'No customers found' : 'No customers yet'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? 'Try adjusting your search terms' : 'Get started by adding your first customer'}
                  </p>
                  {!searchQuery && (
                    <Button onClick={handleAddCustomer} className="mt-4 bg-primary hover:bg-primary/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Customer
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
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
  }

  return (
    <TooltipWrapper>
      <div className="min-h-screen bg-background font-['Inter']">
        <div className="container mx-auto px-6 py-8 space-y-8">
          {/* Desktop Header using CustomersHeader */}
          <CustomersHeader
            totalCustomers={totalCustomers}
            totalOutstandingDebt={totalOutstandingDebt}
            pendingOperations={pendingOperations}
            isOnline={isOnline}
            onAddCustomer={handleAddCustomer}
          />

          {/* Search Bar */}
          <Card className="bg-card rounded-3xl border border-border shadow-sm">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" strokeWidth={1.5} />
                <Input
                  type="search"
                  placeholder="Search customers by name, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-muted rounded-xl pl-12 pr-4 py-4 placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring border-0 text-base font-['Inter']"
                />
              </div>
            </CardContent>
          </Card>

          {/* Customer List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-base text-muted-foreground font-['Inter']">Loading customers...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <Card className="bg-card rounded-3xl border border-border shadow-sm">
              <CardContent className="text-center py-12">
                <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" strokeWidth={1.5} />
                <h3 className="text-xl font-semibold text-card-foreground mb-2 font-['Inter']">
                  {searchQuery ? 'No customers found' : 'No customers yet'}
                </h3>
                <p className="text-base text-muted-foreground font-['Inter']">
                  {searchQuery ? 'Try adjusting your search terms' : 'Get started by adding your first customer'}
                </p>
                {!searchQuery && (
                  <Button onClick={handleAddCustomer} className="mt-6 bg-primary hover:bg-primary/90 font-['Inter']">
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
