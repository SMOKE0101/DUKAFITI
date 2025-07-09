
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, User, Phone, Mail, MapPin } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { Customer } from '../types';
import { useToast } from '../hooks/use-toast';

const CustomerManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Mock data for now to prevent loading issues
  const [customers] = useState<Customer[]>([
    {
      id: '1',
      name: 'John Doe',
      phone: '+254700000000',
      email: 'john@example.com',
      address: '123 Main St, Nairobi',
      totalPurchases: 15000,
      outstandingDebt: 2500,
      creditLimit: 10000,
      riskRating: 'low',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Jane Smith',
      phone: '+254711111111',
      email: 'jane@example.com',
      address: '456 Oak Ave, Mombasa',
      totalPurchases: 8500,
      outstandingDebt: 500,
      creditLimit: 5000,
      riskRating: 'low',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Bob Wilson',
      phone: '+254722222222',
      email: 'bob@example.com',
      address: '789 Pine Rd, Kisumu',
      totalPurchases: 3200,
      outstandingDebt: 1200,
      creditLimit: 2000,
      riskRating: 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRiskBadgeColor = (rating: string) => {
    switch (rating) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddCustomer = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Customer management features are being implemented",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customer Management</h1>
          <p className="text-muted-foreground">Manage your customer database and credit accounts</p>
        </div>
        <Button onClick={handleAddCustomer} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Customer
        </Button>
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

      {/* Customer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{customers.length}</div>
              <div className="text-sm text-muted-foreground">Total Customers</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(customers.reduce((sum, c) => sum + c.totalPurchases, 0))}
              </div>
              <div className="text-sm text-muted-foreground">Total Sales</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(customers.reduce((sum, c) => sum + c.outstandingDebt, 0))}
              </div>
              <div className="text-sm text-muted-foreground">Outstanding Debt</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{customer.name}</CardTitle>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskBadgeColor(customer.riskRating)}`}>
                      {customer.riskRating} risk
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4" />
                {customer.phone}
              </div>
              {customer.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  {customer.email}
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {customer.address}
                </div>
              )}
              
              <div className="pt-3 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Purchases:</span>
                  <span className="font-medium text-green-600">{formatCurrency(customer.totalPurchases)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Outstanding:</span>
                  <span className={`font-medium ${customer.outstandingDebt > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {formatCurrency(customer.outstandingDebt)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Credit Limit:</span>
                  <span className="font-medium">{formatCurrency(customer.creditLimit)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No customers found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try adjusting your search terms.' : 'Start by adding your first customer.'}
            </p>
            {!searchQuery && (
              <Button onClick={handleAddCustomer}>
                <Plus className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerManagement;
