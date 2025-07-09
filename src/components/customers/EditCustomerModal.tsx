
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Customer } from '../../types';
import { useSupabaseCustomers } from '../../hooks/useSupabaseCustomers';
import { useToast } from '../../hooks/use-toast';

interface EditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  isOpen,
  onClose,
  customer
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    outstandingDebt: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const { updateCustomer } = useSupabaseCustomers();
  const { toast } = useToast();

  useEffect(() => {
    if (customer && isOpen) {
      setFormData({
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
        address: customer.address || '',
        outstandingDebt: customer.outstandingDebt.toString()
      });
      setErrors({});
    }
  }, [customer, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    
    // Email validation if provided
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }
    
    if (formData.outstandingDebt && isNaN(parseFloat(formData.outstandingDebt))) {
      newErrors.outstandingDebt = 'Valid balance is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!customer || !validateForm()) return;

    setLoading(true);

    try {
      const updatedCustomer = {
        ...customer,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        outstandingDebt: parseFloat(formData.outstandingDebt) || 0
      };

      await updateCustomer(customer.id, updatedCustomer);
      
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
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setErrors({});
    onClose();
  };

  const isFormValid = formData.name && formData.phone;

  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-gray-800 shadow-xl animate-in fade-in-0 scale-in-95 duration-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Edit Customer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold">
              Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`text-base ${errors.name ? 'border-red-500' : ''}`}
              placeholder="Customer name"
              disabled={loading}
              aria-label="Customer name"
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-semibold">
              Phone *
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className={`text-base ${errors.phone ? 'border-red-500' : ''}`}
              placeholder="0712345678"
              disabled={loading}
              aria-label="Customer phone number"
            />
            {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className={`text-base ${errors.email ? 'border-red-500' : ''}`}
              placeholder="customer@example.com"
              disabled={loading}
              aria-label="Customer email address"
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-semibold">
              Address
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="text-base resize-none"
              placeholder="Customer address"
              disabled={loading}
              rows={3}
              aria-label="Customer address"
            />
          </div>

          {/* Outstanding Balance */}
          <div className="space-y-2">
            <Label htmlFor="outstandingDebt" className="text-sm font-semibold">
              Outstanding Balance (KES)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                KES
              </span>
              <Input
                id="outstandingDebt"
                type="number"
                step="0.01"
                value={formData.outstandingDebt}
                onChange={(e) => setFormData(prev => ({ ...prev, outstandingDebt: e.target.value }))}
                className={`pl-12 text-base ${errors.outstandingDebt ? 'border-red-500' : ''}`}
                placeholder="0.00"
                disabled={loading}
                aria-label="Outstanding balance"
              />
            </div>
            {errors.outstandingDebt && <p className="text-red-500 text-sm">{errors.outstandingDebt}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6">
            <Button
              variant="ghost"
              onClick={handleClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!isFormValid || loading}
              className="flex-1 bg-purple-600 hover:bg-purple-500 transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </div>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditCustomerModal;
