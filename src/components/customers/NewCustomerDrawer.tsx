
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Customer } from '../../types';
import { X, User, Phone, Mail, MapPin, CreditCard, DollarSign } from 'lucide-react';

interface NewCustomerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const NewCustomerDrawer: React.FC<NewCustomerDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    creditLimit: 1000,
    riskRating: 'low' as 'low' | 'medium' | 'high',
    initialDebt: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.creditLimit < 0) {
      newErrors.creditLimit = 'Credit limit cannot be negative';
    }

    if (formData.initialDebt < 0) {
      newErrors.initialDebt = 'Initial debt cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const customerData = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || null,
      address: formData.address.trim() || null,
      creditLimit: formData.creditLimit,
      riskRating: formData.riskRating,
      outstandingDebt: formData.initialDebt,
      totalPurchases: 0,
      createdDate: new Date().toISOString(),
      lastPurchaseDate: null,
    };

    onSave(customerData);
    handleReset();
  };

  const handleReset = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      creditLimit: 1000,
      riskRating: 'low',
      initialDebt: 0,
    });
    setErrors({});
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border-2 border-green-300 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <SheetTitle className="font-mono text-lg font-black uppercase tracking-wider">
                Add New Customer
              </SheetTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-mono text-sm font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <User className="w-4 h-4" />
              Basic Information
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="name" className="font-medium">
                Customer Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter customer name"
                className={`h-11 ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="font-medium flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number *
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
                className={`h-11 ${errors.phone ? 'border-red-500' : ''}`}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-medium flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address (optional)"
                className={`h-11 ${errors.email ? 'border-red-500' : ''}`}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Address
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter address (optional)"
                className="min-h-[80px]"
              />
            </div>
          </div>

          {/* Credit Information */}
          <div className="space-y-4">
            <h3 className="font-mono text-sm font-bold uppercase tracking-wide text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Credit Information
            </h3>

            <div className="space-y-2">
              <Label htmlFor="creditLimit" className="font-medium">
                Credit Limit
              </Label>
              <Input
                id="creditLimit"
                type="number"
                min="0"
                step="0.01"
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                placeholder="Enter credit limit"
                className={`h-11 ${errors.creditLimit ? 'border-red-500' : ''}`}
              />
              {errors.creditLimit && (
                <p className="text-sm text-red-500">{errors.creditLimit}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="initialDebt" className="font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Initial Debt Amount
              </Label>
              <Input
                id="initialDebt"
                type="number"
                min="0"
                step="0.01"
                value={formData.initialDebt}
                onChange={(e) => setFormData({ ...formData, initialDebt: parseFloat(e.target.value) || 0 })}
                placeholder="Enter initial debt amount"
                className={`h-11 ${errors.initialDebt ? 'border-red-500' : ''}`}
              />
              {errors.initialDebt && (
                <p className="text-sm text-red-500">{errors.initialDebt}</p>
              )}
              <p className="text-xs text-gray-500">
                If this customer already owes money, enter the amount here
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="riskRating" className="font-medium">
                Risk Rating
              </Label>
              <Select
                value={formData.riskRating}
                onValueChange={(value: 'low' | 'medium' | 'high') => 
                  setFormData({ ...formData, riskRating: value })
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select risk rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-11 border-2"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 h-11 bg-green-600 hover:bg-green-700 text-white"
            >
              Add Customer
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default NewCustomerDrawer;
