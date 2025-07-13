
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Customer } from '../../types';

interface EditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  onSave: (id: string, updates: Partial<Customer>) => Promise<void>;
}

const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSave
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    creditLimit: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  // Update form when customer changes
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        creditLimit: customer.creditLimit || 0
      });
    }
  }, [customer, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({
        title: "Validation Error",
        description: "Name and phone number are required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await onSave(customer.id, {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        creditLimit: formData.creditLimit
      });
      
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to update customer:', error);
      toast({
        title: "Error",
        description: "Failed to update customer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-[500px] h-[90vh] sm:max-h-[85vh] flex flex-col mx-auto my-auto rounded-xl border-2 border-blue-600 p-0 bg-white dark:bg-gray-900">
        <DialogHeader className="flex-shrink-0 text-center space-y-3 p-4 sm:p-6 border-b-2 border-blue-600 bg-transparent">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 border-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-blue-600 font-mono uppercase">{customer?.name?.charAt(0) || 'E'}</span>
            </div>
          </div>
          <DialogTitle className="text-lg sm:text-xl font-bold font-mono uppercase tracking-widest text-gray-900 dark:text-white">
            Edit Customer
          </DialogTitle>
          <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
            Update customer information below.
          </p>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-sm font-medium font-mono uppercase tracking-wider text-gray-900 dark:text-white">
                  Full Name *
                </Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter customer name"
                  className="h-12 text-base border-2 border-gray-600 bg-transparent rounded-xl font-mono focus-visible:ring-2 focus-visible:ring-blue-600"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-phone" className="text-sm font-medium font-mono uppercase tracking-wider text-gray-900 dark:text-white">
                  Phone Number *
                </Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 0712345678 or +254712345678"
                  className="h-12 text-base border-2 border-gray-600 bg-transparent rounded-xl font-mono focus-visible:ring-2 focus-visible:ring-blue-600"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-email" className="text-sm font-medium font-mono uppercase tracking-wider text-gray-900 dark:text-white">
                  Email Address (Optional)
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="customer@example.com"
                  className="h-12 text-base border-2 border-gray-600 bg-transparent rounded-xl font-mono focus-visible:ring-2 focus-visible:ring-blue-600"
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-address" className="text-sm font-medium font-mono uppercase tracking-wider text-gray-900 dark:text-white">
                  Address (Optional)
                </Label>
                <Textarea
                  id="edit-address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter customer address"
                  className="min-h-[80px] text-base border-2 border-gray-600 bg-transparent rounded-xl font-mono focus-visible:ring-2 focus-visible:ring-blue-600 resize-none"
                  rows={3}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-creditLimit" className="text-sm font-medium font-mono uppercase tracking-wider text-gray-900 dark:text-white">
                  Credit Limit
                </Label>
                <Input
                  id="edit-creditLimit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                  placeholder="0.00"
                  className="h-12 text-base border-2 border-gray-600 bg-transparent rounded-xl font-mono focus-visible:ring-2 focus-visible:ring-blue-600"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-3 pt-6 border-t-2 border-gray-600">
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-mono font-bold uppercase tracking-wider border-2 border-blue-600 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl"
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Update Customer'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                className="w-full h-12 text-base font-mono font-bold uppercase tracking-wider border-2 border-gray-600 bg-transparent text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl"
                disabled={isLoading}
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

export default EditCustomerModal;
