
import React, { useState, useEffect } from 'react';
import { useSupabaseCustomers } from '../../hooks/useSupabaseCustomers';
import { useOfflineCRUD } from '../../hooks/useOfflineCRUD';
import { Customer } from '../../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  Clock,
  Wifi,
  WifiOff,
  DollarSign
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { formatCurrency } from '../../utils/currency';

interface CustomerFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  creditLimit: number;
}

interface ExtendedCustomer extends Customer {
  synced: boolean;
  offline?: boolean;
  pendingOperation?: 'create' | 'update' | 'delete';
}

const CustomerCRUDManager: React.FC = () => {
  const { customers: serverCustomers, loading: serverLoading, createCustomer, updateCustomer, deleteCustomer } = useSupabaseCustomers();
  const { toast } = useToast();

  const {
    data: customers,
    loading,
    creating,
    updating,
    deleting,
    create,
    update,
    remove,
    refresh,
    isOnline,
    getUnsyncedItems,
  } = useOfflineCRUD<ExtendedCustomer>('customer', serverCustomers?.map(c => ({ ...c, synced: true })) || []);

  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    phone: '',
    email: '',
    address: '',
    creditLimit: 1000,
  });

  // Sync server data when it changes
  useEffect(() => {
    if (serverCustomers) {
      refresh(serverCustomers.map(c => ({ ...c, synced: true })));
    }
  }, [serverCustomers, refresh]);

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      creditLimit: 1000,
    });
    setEditingCustomer(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({
        title: "Validation Error",
        description: "Name and phone are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingCustomer) {
        // Update existing customer
        await update(editingCustomer.id, {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          creditLimit: formData.creditLimit,
          updatedAt: new Date().toISOString(),
        } as Partial<ExtendedCustomer>);

        // If online, also update on server
        if (isOnline) {
          try {
            await updateCustomer(editingCustomer.id, formData);
          } catch (error) {
            console.warn('Server update failed, will retry on sync:', error);
          }
        }

        toast({
          title: "Customer Updated",
          description: `${formData.name} has been updated.`,
        });
      } else {
        // Create new customer with all required fields
        const newCustomerData = {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          creditLimit: formData.creditLimit,
          totalPurchases: 0,
          outstandingDebt: 0,
          riskRating: 'low' as const,
          createdDate: new Date().toISOString(),
          lastPurchaseDate: null,
        };

        const newCustomer = await create(newCustomerData as Omit<ExtendedCustomer, 'id'>);

        // If online, also create on server
        if (isOnline) {
          try {
            await createCustomer({
              name: formData.name,
              phone: formData.phone,
              email: formData.email,
              address: formData.address,
              creditLimit: formData.creditLimit,
              totalPurchases: 0,
              outstandingDebt: 0,
              riskRating: 'low',
            });
          } catch (error) {
            console.warn('Server create failed, will retry on sync:', error);
          }
        }

        toast({
          title: "Customer Created",
          description: `${formData.name} has been created.`,
        });
      }

      resetForm();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleEdit = (customer: Customer) => {
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      creditLimit: customer.creditLimit,
    });
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleDelete = async (customer: Customer) => {
    if (!confirm(`Are you sure you want to delete "${customer.name}"?`)) {
      return;
    }

    try {
      await remove(customer.id);

      // If online, also delete on server
      if (isOnline) {
        try {
          await deleteCustomer(customer.id);
        } catch (error) {
          console.warn('Server delete failed, will retry on sync:', error);
        }
      }

      toast({
        title: "Customer Deleted",
        description: `${customer.name} has been deleted.`,
      });
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const unsyncedCount = getUnsyncedItems().length;

  if (serverLoading || loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Customers</h2>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-orange-600" />
            )}
            <span className="text-sm text-muted-foreground">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          {unsyncedCount > 0 && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              <Clock className="w-3 h-3 mr-1" />
              {unsyncedCount} unsynced
            </Badge>
          )}
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Customer
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Customer Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="creditLimit">Credit Limit</Label>
                  <Input
                    id="creditLimit"
                    type="number"
                    step="0.01"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData(prev => ({ ...prev, creditLimit: parseFloat(e.target.value) || 0 }))}
                    placeholder="1000.00"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter address"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={creating || updating}>
                  <Save className="w-4 h-4 mr-2" />
                  {editingCustomer ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Customers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((customer) => (
          <Card key={customer.id} className="relative">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold truncate flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {customer.name}
                </h3>
                <div className="flex items-center gap-1">
                  {customer.offline && (
                    <Badge variant="secondary" className="text-xs">
                      {customer.pendingOperation === 'create' && <Plus className="w-3 h-3 mr-1" />}
                      {customer.pendingOperation === 'update' && <Edit className="w-3 h-3 mr-1" />}
                      {customer.pendingOperation === 'delete' && <Trash2 className="w-3 h-3 mr-1" />}
                      {customer.pendingOperation || 'Offline'}
                    </Badge>
                  )}
                  {!customer.synced && (
                    <Clock className="w-4 h-4 text-orange-500" />
                  )}
                </div>
              </div>
              
              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2">
                  <Phone className="w-3 h-3 text-muted-foreground" />
                  <span>{customer.phone}</span>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3 text-muted-foreground" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    <span className="truncate">{customer.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <DollarSign className="w-3 h-3 text-muted-foreground" />
                  <span>Credit: {formatCurrency(customer.creditLimit)}</span>
                </div>
                {customer.outstandingDebt > 0 && (
                  <div className="text-red-600 font-medium">
                    Debt: {formatCurrency(customer.outstandingDebt)}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(customer)}
                  disabled={updating || customer.pendingOperation === 'delete'}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(customer)}
                  disabled={deleting || customer.pendingOperation === 'delete'}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {customers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No customers found. Add your first customer to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerCRUDManager;
