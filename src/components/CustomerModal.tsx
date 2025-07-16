
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '../hooks/use-toast';
import { Customer } from '../types';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSave: (customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => void;
}

const CustomerModal = ({ isOpen, onClose, customer, onSave }: CustomerModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    credit_limit: '1000',
    initialDebt: '0',
  });

  // Update form when customer changes
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        credit_limit: customer.credit_limit?.toString() || '1000',
        initialDebt: customer.outstanding_debt?.toString() || '0',
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        credit_limit: '1000',
        initialDebt: '0',
      });
    }
  }, [customer, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({
        title: "Validation Error",
        description: "Name and phone number are required",
        variant: "destructive",
      });
      return;
    }

    const creditLimit = parseFloat(formData.credit_limit) || 1000;
    const initialDebt = parseFloat(formData.initialDebt) || 0;

    if (creditLimit < 0) {
      toast({
        title: "Validation Error",
        description: "Credit limit cannot be negative",
        variant: "destructive",
      });
      return;
    }

    if (initialDebt < 0) {
      toast({
        title: "Validation Error",
        description: "Initial debt cannot be negative",
        variant: "destructive",
      });
      return;
    }
    
    onSave({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      address: formData.address.trim(),
      created_date: customer?.created_date || new Date().toISOString(),
      total_purchases: customer?.total_purchases || 0,
      outstanding_debt: initialDebt,
      credit_limit: creditLimit,
      risk_rating: customer?.risk_rating || 'low',
      last_purchase_date: customer?.last_purchase_date,
      user_id: customer?.user_id || ''
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-[500px] h-[90vh] sm:max-h-[85vh] flex flex-col mx-auto my-auto rounded-lg border-0 p-0">
        <DialogHeader className="flex-shrink-0 text-center space-y-3 p-4 sm:p-6 border-b">
          <DialogTitle className="text-lg sm:text-xl font-bold text-foreground">
            {customer ? 'Edit Customer' : 'Add New Customer'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {customer ? 'Update customer information below.' : 'Fill in the customer details to add them to your database.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-foreground">
                  Full Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter customer name"
                  className="h-12 text-base focus-visible:ring-2 focus-visible:ring-primary"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                  Phone Number *
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 0712345678 or +254712345678"
                  className="h-12 text-base focus-visible:ring-2 focus-visible:ring-primary"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email Address (Optional)
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="customer@example.com"
                  className="h-12 text-base focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium text-foreground">
                  Address (Optional)
                </Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter customer address"
                  className="min-h-[80px] text-base focus-visible:ring-2 focus-visible:ring-primary resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="creditLimit" className="text-sm font-medium text-foreground">
                    Credit Limit (KES)
                  </Label>
                  <Input
                    id="creditLimit"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.credit_limit}
                    onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                    placeholder="1000"
                    className="h-12 text-base focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="initialDebt" className="text-sm font-medium text-foreground">
                    Initial Debt (KES)
                  </Label>
                  <Input
                    id="initialDebt"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.initialDebt}
                    onChange={(e) => setFormData({ ...formData, initialDebt: e.target.value })}
                    placeholder="0"
                    className="h-12 text-base focus-visible:ring-2 focus-visible:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter existing debt amount if customer already owes money
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-3 pt-6 border-t border-border">
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-medium"
              >
                {customer ? 'Update Customer' : 'Add Customer'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                className="w-full h-12 text-base font-medium"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerModal;
