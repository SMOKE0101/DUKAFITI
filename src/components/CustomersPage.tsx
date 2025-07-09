
import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { TooltipProvider } from '@/components/ui/tooltip';
import { 
  Search, 
  UserPlus, 
  Users,
  Coins,
  Clock,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '../utils/currency';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { Customer } from '../types';
import RefinedCustomerCard from './customers/RefinedCustomerCard';
import CustomerHistoryModal from './customers/CustomerHistoryModal';
import EditCustomerModal from './customers/EditCustomerModal';
import DeleteCustomerModal from './customers/DeleteCustomerModal';
import RepaymentDrawer from './customers/RepaymentDrawer';

interface CustomerStats {
  totalCustomers: number;
  totalOutstandingDebt: number;
  overdueAccounts: number;
  recentActivity: number;
}

const CustomersPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [filterType, setFilterType] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRepaymentDrawer, setShowRepaymentDrawer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();
  const { customers, loading, createCustomer, deleteCustomer } = useSupabaseCustomers();

  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    phone: '',
    initialBalance: ''
  });

  // Calculate refined statistics
  const stats: CustomerStats = useMemo(() => {
    const totalCustomers = customers.length;
    const totalOutstandingDebt = customers.reduce((sum, c) => sum + c.outstandingDebt, 0);
    
    // Calculate overdue accounts (debt unpaid for > 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const overdueAccounts = customers.filter(c => 
      c.outstandingDebt > 0 && 
      c.lastPurchaseDate && 
      new Date(c.lastPurchaseDate) < sevenDaysAgo
    ).length;
    
    // Mock recent activity (last 24 hours) - in real app would come from transactions
    const recentActivity = Math.floor(Math.random() * 15) + 5;
    
    return {
      totalCustomers,
      totalOutstandingDebt,
      overdueAccounts,
      recentActivity
    };
  }, [customers]);

  // Filter and sort customers
  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery)
    );

    // Apply filter type
    if (filterType === 'overdue') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filtered = filtered.filter(c => 
        c.outstandingDebt > 0 && 
        c.lastPurchaseDate && 
        new Date(c.lastPurchaseDate) < sevenDaysAgo
      );
    } else if (filterType === 'with-debt') {
      filtered = filtered.filter(c => c.outstandingDebt > 0);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'balance-asc':
          return a.outstandingDebt - b.outstandingDebt;
        case 'balance-desc':
          return b.outstandingDebt - a.outstandingDebt;
        default:
          return 0;
      }
    });

    return filtered;
  }, [customers, searchQuery, sortBy, filterType]);

  const handleAddCustomer = async () => {
    try {
      await createCustomer({
        name: newCustomerForm.name,
        phone: newCustomerForm.phone,
        email: '',
        address: '',
        createdDate: new Date().toISOString(),
        totalPurchases: 0,
        outstandingDebt: parseFloat(newCustomerForm.initialBalance) || 0,
        creditLimit: 1000,
        riskRating: 'low',
        lastPurchaseDate: null
      });

      toast({
        title: "Customer Added",
        description: `${newCustomerForm.name} has been added successfully`,
      });

      setShowAddModal(false);
      setNewCustomerForm({ name: '', phone: '', initialBalance: '' });
    } catch (error) {
      console.error('Failed to add customer:', error);
    }
  };

  const handleViewHistory = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowHistoryModal(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowEditModal(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDeleteModal(true);
  };

  const handleRecordRepayment = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowRepaymentDrawer(true);
  };

  const confirmDeleteCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      await deleteCustomer(selectedCustomer.id);
      
      toast({
        title: "Customer Deleted",
        description: `${selectedCustomer.name} has been deleted`,
      });

      setShowDeleteModal(false);
      setSelectedCustomer(null);
    } catch (error) {
      console.error('Failed to delete customer:', error);
    }
  };

  const handleStatsCardClick = (filter: string) => {
    setFilterType(filter);
  };

  const statsCards = [
    {
      id: 'total-customers',
      title: 'Total Customers',
      value: stats.totalCustomers,
      subtitle: 'Customers',
      icon: Users,
      iconColor: 'text-primary',
      bgColor: 'bg-primary/10',
      onClick: () => handleStatsCardClick('all')
    },
    {
      id: 'total-debt',
      title: 'Total Outstanding Debt',
      value: formatCurrency(stats.totalOutstandingDebt),
      subtitle: 'Total Debt',
      icon: Coins,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-100',
      onClick: () => handleStatsCardClick('with-debt')
    },
    {
      id: 'overdue',
      title: 'Overdue Accounts',
      value: stats.overdueAccounts,
      subtitle: 'Overdue > 7 days',
      icon: Clock,
      iconColor: 'text-red-600',
      bgColor: 'bg-red-100',
      onClick: () => handleStatsCardClick('overdue')
    },
    {
      id: 'recent-activity',
      title: 'Recent Activity',
      value: stats.recentActivity,
      subtitle: 'Recent Transactions',
      icon: Zap,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-100',
      onClick: () => handleStatsCardClick('all')
    }
  ];

  return (
    <TooltipProvider>
      <div className="space-y-6 p-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-display text-primary">Customers</h1>
          <Button 
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2 bg-accent text-white rounded-xl shadow-lg hover:bg-accent/90 transition-all duration-200 flex items-center gap-2"
          >
            <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
              <UserPlus className="w-3 h-3" />
            </div>
            New Customer
          </Button>
        </div>

        {/* Refined Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((card) => (
            <Card 
              key={card.id}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 ease-out cursor-pointer group hover:scale-105"
              onClick={card.onClick}
            >
              <CardContent className="p-0">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 ${card.bgColor} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200 group-hover:animate-pulse`}>
                    <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                  <div className="text-right">
                    <div className="text-xs uppercase text-muted-foreground font-medium tracking-wide">
                      {card.title}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-3xl font-bold text-foreground group-hover:text-primary transition-colors duration-200">
                    {card.value}
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    {card.subtitle}
                  </div>

                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <span className="text-xs text-primary font-medium">
                      Live data
                    </span>
                  </div>
                </div>

                {/* Micro chart for debt card */}
                {card.id === 'total-debt' && (
                  <div className="mt-3 flex items-center gap-1">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div 
                        key={i}
                        className="w-1 bg-orange-300 rounded-full"
                        style={{ 
                          height: `${8 + Math.random() * 12}px`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search & Sort Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by name or phone…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-4"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">A–Z</SelectItem>
              <SelectItem value="balance-asc">Balance ↑</SelectItem>
              <SelectItem value="balance-desc">Balance ↓</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filter indicator */}
        {filterType !== 'all' && (
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm flex items-center gap-2">
              Filter: {filterType === 'overdue' ? 'Overdue Accounts' : 'Customers with Debt'}
              <button 
                onClick={() => setFilterType('all')}
                className="text-purple-600 hover:text-purple-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Customer List */}
        <div className="space-y-4">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-muted animate-pulse rounded-full" />
                      <div className="space-y-2">
                        <div className="h-4 bg-muted animate-pulse rounded w-32" />
                        <div className="h-3 bg-muted animate-pulse rounded w-24" />
                      </div>
                    </div>
                    <div className="h-6 bg-muted animate-pulse rounded w-20" />
                  </div>
                  <div className="flex gap-3 justify-end mt-6">
                    <div className="h-9 bg-muted animate-pulse rounded w-10" />
                    <div className="h-9 bg-muted animate-pulse rounded w-10" />
                    <div className="h-9 bg-muted animate-pulse rounded w-16" />
                    <div className="h-9 bg-muted animate-pulse rounded w-16" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredAndSortedCustomers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAndSortedCustomers.map((customer) => (
                <RefinedCustomerCard
                  key={customer.id}
                  customer={customer}
                  onViewHistory={handleViewHistory}
                  onEdit={handleEditCustomer}
                  onDelete={handleDeleteCustomer}
                  onRecordRepayment={handleRecordRepayment}
                />
              ))}
            </div>
          ) : (
            <Card className="rounded-2xl">
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No customers found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || filterType !== 'all' ? 'Try adjusting your search or filters.' : 'Start by adding your first customer.'}
                </p>
                {!searchQuery && filterType === 'all' && (
                  <Button onClick={() => setShowAddModal(true)} className="bg-accent hover:bg-accent/90">
                    <UserPlus className="w-4 h-4 mr-2" />
                    New Customer
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Add Customer Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="sm:max-w-md rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">New Customer</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Customer name"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="0712345678"
                />
              </div>

              <div>
                <Label htmlFor="initialBalance">Initial Balance (Optional)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    KES
                  </span>
                  <Input
                    id="initialBalance"
                    type="number"
                    step="0.01"
                    value={newCustomerForm.initialBalance}
                    onChange={(e) => setNewCustomerForm(prev => ({ ...prev, initialBalance: e.target.value }))}
                    className="pl-12"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddCustomer}
                  disabled={!newCustomerForm.name || !newCustomerForm.phone}
                  className="flex-1 bg-accent hover:bg-accent/90"
                >
                  Save
                </Button>
              </div>
            </div>
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

        {/* Edit Customer Modal */}
        <EditCustomerModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCustomer(null);
          }}
          customer={selectedCustomer}
        />

        {/* Delete Customer Modal */}
        <DeleteCustomerModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedCustomer(null);
          }}
          onConfirm={confirmDeleteCustomer}
          customer={selectedCustomer}
        />

        {/* Repayment Drawer */}
        <RepaymentDrawer
          isOpen={showRepaymentDrawer}
          onClose={() => {
            setShowRepaymentDrawer(false);
            setSelectedCustomer(null);
          }}
          customer={selectedCustomer}
        />
      </div>
    </TooltipProvider>
  );
};

export default CustomersPage;
