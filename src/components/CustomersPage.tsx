
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, User, Search } from 'lucide-react';
import { useUnifiedCustomers } from '../hooks/useUnifiedCustomers';
import { useCustomerOperations } from '../hooks/useCustomerOperations';
import { Customer } from '../types';
import { useToast } from '../hooks/use-toast';
import RefinedCustomerCard from './customers/RefinedCustomerCard';
import CustomerHistoryModal from './customers/CustomerHistoryModal';
import NewRepaymentDrawer from './customers/NewRepaymentDrawer';
import DeleteCustomerModal from './customers/DeleteCustomerModal';

const CustomersPage = () => {
  const { customers, loading, createCustomer, updateCustomer, isOnline, pendingOperations } = useUnifiedCustomers();
  const { deleteCustomer, isDeleting } = useCustomerOperations();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showRepaymentDrawer, setShowRepaymentDrawer] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    creditLimit: 1000,
    riskRating: 'low' as 'low' | 'medium' | 'high',
    totalPurchases: 0,
    outstandingDebt: 0,
    lastPurchaseDate: null as string | null,
  });

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedCustomer) {
        await updateCustomer(selectedCustomer.id, formData);
        toast({
          title: "Success",
          description: "Customer updated successfully",
        });
      } else {
        await createCustomer(formData);
        toast({
          title: "Success",
          description: "Customer created successfully",
        });
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save customer:', error);
      toast({
        title: "Error",
        description: "Failed to save customer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      creditLimit: 1000,
      riskRating: 'low',
      totalPurchases: 0,
      outstandingDebt: 0,
      lastPurchaseDate: null,
    });
    setSelectedCustomer(null);
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      creditLimit: customer.creditLimit || 1000,
      riskRating: customer.riskRating || 'low',
      totalPurchases: customer.totalPurchases || 0,
      outstandingDebt: customer.outstandingDebt || 0,
      lastPurchaseDate: customer.lastPurchaseDate,
    });
    setIsDialogOpen(true);
  };

  const handleViewHistory = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowHistoryModal(true);
  };

  const handleRecordPayment = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowRepaymentDrawer(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async (customerId: string) => {
    try {
      await deleteCustomer(customerId);
      setShowDeleteModal(false);
      setSelectedCustomer(null);
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
    } catch (error) {
      console.error('Delete customer failed:', error);
      toast({
        title: "Error",
        description: "Failed to delete customer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePaymentComplete = () => {
    setShowRepaymentDrawer(false);
    setSelectedCustomer(null);
    toast({
      title: "Success",
      description: "Payment recorded successfully",
    });
  };

  const handleAddCustomer = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
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
            <Badge variant="outline">
              {pendingOperations} pending sync
            </Badge>
          )}
          {!isOnline && (
            <Badge variant="secondary">
              Working Offline
            </Badge>
          )}
          <Button onClick={handleAddCustomer}>
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>
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

      <div className="grid gap-6">
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
              <RefinedCustomerCard
                key={customer.id}
                customer={customer}
                onViewHistory={handleViewHistory}
                onEdit={handleEdit}
                onDelete={handleDeleteCustomer}
                onRecordRepayment={handleRecordPayment}
                isUpdating={isDeleting === customer.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Customer Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="creditLimit">Credit Limit</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData(prev => ({ ...prev, creditLimit: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="riskRating">Risk Rating</Label>
                <Select 
                  value={formData.riskRating} 
                  onValueChange={(value: 'low' | 'medium' | 'high') => 
                    setFormData(prev => ({ ...prev, riskRating: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Risk</SelectItem>
                    <SelectItem value="medium">Medium Risk</SelectItem>
                    <SelectItem value="high">High Risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {selectedCustomer ? 'Update' : 'Create'} Customer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Customer History Modal */}
      <CustomerHistoryModal
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
      />

      {/* Repayment Drawer */}
      <NewRepaymentDrawer
        isOpen={showRepaymentDrawer}
        onClose={handlePaymentComplete}
        customer={selectedCustomer}
      />

      {/* Delete Customer Modal */}
      {selectedCustomer && (
        <DeleteCustomerModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedCustomer(null);
          }}
          customer={selectedCustomer}
          onDelete={handleConfirmDelete}
        />
      )}
    </div>
  );
};

export default CustomersPage;
