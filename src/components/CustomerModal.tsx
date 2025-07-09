
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
  onSave: (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const CustomerModal = ({ isOpen, onClose, customer, onSave }: CustomerModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  // Update form when customer changes
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
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
    
    onSave({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      address: formData.address.trim(),
      createdDate: customer?.createdDate || new Date().toISOString(),
      totalPurchases: customer?.totalPurchases || 0,
      outstandingDebt: customer?.outstandingDebt || 0,
      creditLimit: customer?.creditLimit || 1000,
      riskRating: customer?.riskRating || 'low',
      lastPurchaseDate: customer?.lastPurchaseDate,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[500px] max-h-[95vh] mx-auto my-auto overflow-y-auto rounded-lg">
        <DialogHeader className="text-center space-y-3 pb-4">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-foreground">
            {customer ? 'Edit Customer' : 'Add New Customer'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {customer ? 'Update customer information below.' : 'Fill in the customer details to add them to your database.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6 px-1">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-foreground">
                Full Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter customer name"
                className="h-11 text-base focus-visible:ring-2 focus-visible:ring-primary"
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
                className="h-11 text-base focus-visible:ring-2 focus-visible:ring-primary"
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
                className="h-11 text-base focus-visible:ring-2 focus-visible:ring-primary"
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
          </div>
          
          <div className="flex flex-col gap-3 pt-6 border-t border-border px-1">
            <Button 
              type="submit" 
              className="w-full h-11 text-base font-medium"
            >
              {customer ? 'Update Customer' : 'Add Customer'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="w-full h-11 text-base font-medium"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerModal;
