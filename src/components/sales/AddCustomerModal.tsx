
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUnifiedCustomers } from '../../hooks/useUnifiedCustomers';
import { useToast } from '../../hooks/use-toast';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { UserPlus, Loader2, WifiOff } from 'lucide-react';

interface AddCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerAdded?: (customer: any) => void;
}

const AddCustomerModal = ({ open, onOpenChange, onCustomerAdded }: AddCustomerModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    creditLimit: 1000,
    initialDebt: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createCustomer } = useUnifiedCustomers();
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({
        title: "Validation Error",
        description: "Name and phone are required fields.",
        variant: "destructive",
      });
      return;
    }

    if (formData.creditLimit < 0) {
      toast({
        title: "Validation Error",
        description: "Credit limit cannot be negative.",
        variant: "destructive",
      });
      return;
    }

    if (formData.initialDebt < 0) {
      toast({
        title: "Validation Error", 
        description: "Initial debt cannot be negative.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('[AddCustomerModal] Creating customer with data:', formData);

      const customerData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || '',
        address: formData.address.trim() || '',
        totalPurchases: 0,
        outstandingDebt: formData.initialDebt,
        creditLimit: formData.creditLimit,
        riskRating: 'low' as const,
        lastPurchaseDate: null,
        createdDate: new Date().toISOString(),
      };

      // Create customer using unified hook (handles both online and offline scenarios)
      const newCustomer = await createCustomer(customerData);
      console.log('[AddCustomerModal] Customer created successfully:', newCustomer);
      
      toast({
        title: "Success!",
        description: `Customer ${formData.name} has been ${isOnline ? 'added' : 'saved offline and will sync when online'}.`,
      });

      // Reset form
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        creditLimit: 1000,
        initialDebt: 0,
      });

      // Close modal first
      onOpenChange(false);
      
      // Notify parent component with the new customer
      // Use timeout to ensure modal closes before selecting customer
      setTimeout(() => {
        console.log('[AddCustomerModal] Notifying parent with new customer:', newCustomer);
        onCustomerAdded?.(newCustomer);
      }, 100);

    } catch (error) {
      console.error('[AddCustomerModal] Error creating customer:', error);
      
      // More specific error handling
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "Error",
        description: `Failed to add customer: ${errorMessage}. ${!isOnline ? 'Please check your offline storage.' : 'Please try again.'}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[95vw] max-h-[95vh] overflow-y-auto bg-white dark:bg-slate-800 fixed z-[10002] mx-auto my-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-purple-600" />
            Add New Customer
            {!isOnline && (
              <span className="flex items-center gap-1 text-xs font-normal text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20 px-2 py-1 rounded-full">
                <WifiOff className="w-3 h-3" />
                Offline Mode
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="name" className="text-sm font-bold text-gray-700">
                Name *
              </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Customer name"
                  required
                  className="mt-1 border-2 border-purple-200 focus:border-purple-400 rounded-xl h-12"
                  style={{ fontSize: '16px' }}
                  disabled={isSubmitting}
                />
            </div>
            
            <div>
              <Label htmlFor="phone" className="text-sm font-bold text-gray-700">
                Phone *
              </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="Phone number"
                  required
                  className="mt-1 border-2 border-purple-200 focus:border-purple-400 rounded-xl h-12"
                  style={{ fontSize: '16px' }}
                  disabled={isSubmitting}
                />
            </div>
            
            <div>
              <Label htmlFor="email" className="text-sm font-bold text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Email address (optional)"
                className="mt-1 border-2 border-purple-200 focus:border-purple-400 rounded-xl"
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <Label htmlFor="address" className="text-sm font-bold text-gray-700">
                Address
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Address (optional)"
                className="mt-1 border-2 border-purple-200 focus:border-purple-400 rounded-xl"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="creditLimit" className="text-sm font-bold text-gray-700">
                  Credit Limit (KES)
                </Label>
                <Input
                  id="creditLimit"
                  type="number"
                  value={formData.creditLimit}
                  onChange={(e) => handleChange('creditLimit', Number(e.target.value))}
                  placeholder="1000"
                  min="0"
                  className="mt-1 border-2 border-purple-200 focus:border-purple-400 rounded-xl"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="initialDebt" className="text-sm font-bold text-gray-700">
                  Initial Debt (KES)
                </Label>
                <Input
                  id="initialDebt"
                  type="number"
                  value={formData.initialDebt}
                  onChange={(e) => handleChange('initialDebt', Number(e.target.value))}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="mt-1 border-2 border-purple-200 focus:border-purple-400 rounded-xl"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            
            <p className="text-xs text-gray-500">
              * Enter any existing debt amount if the customer already owes money
            </p>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-2 border-gray-300 hover:border-gray-400 rounded-xl h-12"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl h-12"
              disabled={isSubmitting || !formData.name.trim() || !formData.phone.trim()}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </div>
              ) : (
                'Add Customer'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCustomerModal;
