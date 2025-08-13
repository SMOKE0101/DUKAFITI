
import React, { useState, useRef } from 'react';
import useScrollIntoViewOnFocus from '@/hooks/useScrollIntoViewOnFocus';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '../../hooks/use-toast';
import { Customer } from '../../types';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    creditLimit: '',
    initialDebt: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const containerRef = React.useRef<HTMLDivElement>(null);
  useScrollIntoViewOnFocus(containerRef);

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'name':
        if (!value.trim()) {
          newErrors.name = 'Customer name is required';
        } else {
          delete newErrors.name;
        }
        break;
      case 'phone':
        if (!value.trim()) {
          newErrors.phone = 'Phone number is required';
        } else {
          delete newErrors.phone;
        }
        break;
      case 'creditLimit':
        if (value && parseFloat(value) < 0) {
          newErrors.creditLimit = 'Credit limit must be positive';
        } else {
          delete newErrors.creditLimit;
        }
        break;
      case 'initialDebt':
        if (value && parseFloat(value) < 0) {
          newErrors.initialDebt = 'Initial debt must be positive';
        } else {
          delete newErrors.initialDebt;
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const fieldsToValidate = ['name', 'phone', 'creditLimit', 'initialDebt'];
    fieldsToValidate.forEach(field => {
      validateField(field, formData[field as keyof typeof formData]);
    });

    const hasErrors = !formData.name.trim() || !formData.phone.trim() || 
                     (formData.creditLimit && parseFloat(formData.creditLimit) < 0) ||
                     (formData.initialDebt && parseFloat(formData.initialDebt) < 0);

    if (hasErrors) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const customerData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : 1000,
        outstandingDebt: formData.initialDebt ? parseFloat(formData.initialDebt) : 0,
        totalPurchases: 0,
        lastPurchaseDate: null,
        riskRating: 'low' as const,
        createdDate: new Date().toISOString()
      };

      await onSave(customerData);
      
      toast({
        title: "Customer Added",
        description: `${formData.name} has been added successfully.`,
      });
      
      handleClose();
    } catch (error) {
      console.error('Failed to save customer:', error);
      toast({
        title: "Error",
        description: "Failed to save customer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      creditLimit: '',
      initialDebt: ''
    });
    setErrors({});
    onClose();
  };

  const isFormValid = () => {
    return formData.name.trim() && 
           formData.phone.trim() && 
           (!formData.creditLimit || parseFloat(formData.creditLimit) >= 0) &&
           (!formData.initialDebt || parseFloat(formData.initialDebt) >= 0) &&
           Object.keys(errors).length === 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="kb-aware-modal w-[95vw] sm:max-w-md max-h-[calc(var(--vvh))] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
        </DialogHeader>
        <div ref={containerRef} className="kb-scroll-area flex-1 overflow-y-auto overscroll-contain" style={{ paddingBottom: 'calc(var(--kb, 0px) + env(safe-area-inset-bottom) + 96px)' }}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Customer Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={errors.name ? 'border-red-500' : ''}
              placeholder="Enter customer name"
              disabled={loading}
            />
            {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={errors.phone ? 'border-red-500' : ''}
              placeholder="Enter phone number"
              disabled={loading}
            />
            {errors.phone && <p className="text-red-500 text-xs">{errors.phone}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="creditLimit">Credit Limit (optional)</Label>
              <div className="relative">
                <Input
                  id="creditLimit"
                  type="number"
                  step="0.01"
                  value={formData.creditLimit}
                  onChange={(e) => handleInputChange('creditLimit', e.target.value)}
                  className={`pl-12 ${errors.creditLimit ? 'border-red-500' : ''}`}
                  placeholder="1000"
                  disabled={loading}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  KES
                </span>
              </div>
              {errors.creditLimit && <p className="text-red-500 text-xs">{errors.creditLimit}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="initialDebt">Initial Debt (optional)</Label>
              <div className="relative">
                <Input
                  id="initialDebt"
                  type="number"
                  step="0.01"
                  value={formData.initialDebt}
                  onChange={(e) => handleInputChange('initialDebt', e.target.value)}
                  className={`pl-12 ${errors.initialDebt ? 'border-red-500' : ''}`}
                  placeholder="0"
                  disabled={loading}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  KES
                </span>
              </div>
              {errors.initialDebt && <p className="text-red-500 text-xs">{errors.initialDebt}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (optional)</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter email address"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address (optional)</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter address"
              disabled={loading}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            * Enter any existing debt amount if the customer already owes money
          </p>

          <div className="flex flex-col gap-2 pt-4">
            <Button
              type="submit"
              disabled={!isFormValid() || loading}
              className="w-full"
            >
              {loading ? 'Saving...' : 'Save Customer'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose} 
              className="w-full"
              disabled={loading}
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

export default AddCustomerModal;
