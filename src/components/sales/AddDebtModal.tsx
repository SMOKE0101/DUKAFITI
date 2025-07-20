
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '../../hooks/use-toast';
import { Customer } from '../../types';
import { CreditCard, Loader2 } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface AddDebtModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onDebtAdded?: () => void;
}

const AddDebtModal = ({ open, onOpenChange, customer, onDebtAdded }: AddDebtModalProps) => {
  const [formData, setFormData] = useState({
    amount: 0,
    description: '',
    dueDate: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { toast } = useToast();

  const validateField = (name: string, value: string | number) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'amount':
        if (Number(value) <= 0) {
          newErrors.amount = 'Amount must be greater than 0';
        } else {
          delete newErrors.amount;
        }
        break;
      case 'description':
        if (!String(value).trim()) {
          newErrors.description = 'Description is required';
        } else {
          delete newErrors.description;
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    validateField(field, value);
  };

  const isFormValid = () => {
    return formData.amount > 0 && 
           formData.description.trim() && 
           Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customer) {
      toast({
        title: "Error",
        description: "No customer selected",
        variant: "destructive",
      });
      return;
    }

    // Final validation
    validateField('amount', formData.amount);
    validateField('description', formData.description);

    if (!isFormValid()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('[AddDebtModal] Recording debt for customer:', customer.name, formData);
      
      // Simulate debt recording - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Success!",
        description: `Debt of ${formatCurrency(formData.amount)} recorded for ${customer.name}.`,
      });

      // Reset form
      setFormData({
        amount: 0,
        description: '',
        dueDate: '',
      });
      setErrors({});

      // Close modal and notify parent
      onOpenChange(false);
      onDebtAdded?.();

    } catch (error) {
      console.error('[AddDebtModal] Error recording debt:', error);
      
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "Error",
        description: `Failed to record debt: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    
    setFormData({
      amount: 0,
      description: '',
      dueDate: '',
    });
    setErrors({});
    onOpenChange(false);
  };

  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md w-[95vw] max-h-[95vh] overflow-y-auto bg-white dark:bg-slate-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-orange-600" />
            Record Debt for {customer.name}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Customer Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Name:</span>
                <span className="ml-2 font-medium">{customer.name}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                <span className="ml-2 font-medium">{customer.phone}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Current Debt:</span>
                <span className="ml-2 font-medium text-red-600">
                  {formatCurrency(customer.outstandingDebt || 0)}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Credit Limit:</span>
                <span className="ml-2 font-medium text-green-600">
                  {formatCurrency(customer.creditLimit || 0)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="amount" className="text-sm font-bold text-gray-700">
                Debt Amount (KES) *
              </Label>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleChange('amount', Number(e.target.value))}
                placeholder="Enter amount"
                required
                className={`mt-1 border-2 ${errors.amount ? 'border-red-500' : 'border-orange-200'} focus:border-orange-400 rounded-xl h-12`}
                style={{ fontSize: '16px' }}
                disabled={isSubmitting}
              />
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
            </div>
            
            <div>
              <Label htmlFor="description" className="text-sm font-bold text-gray-700">
                Description *
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe what this debt is for..."
                required
                className={`mt-1 border-2 ${errors.description ? 'border-red-500' : 'border-orange-200'} focus:border-orange-400 rounded-xl min-h-[80px]`}
                disabled={isSubmitting}
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>
            
            <div>
              <Label htmlFor="dueDate" className="text-sm font-bold text-gray-700">
                Due Date (Optional)
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
                className="mt-1 border-2 border-orange-200 focus:border-orange-400 rounded-xl"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Summary */}
          {formData.amount > 0 && (
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-2">Debt Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>New debt amount:</span>
                  <span className="font-medium">{formatCurrency(formData.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current debt:</span>
                  <span className="font-medium">{formatCurrency(customer.outstandingDebt || 0)}</span>
                </div>
                <div className="border-t border-orange-200 dark:border-orange-700 pt-1 mt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total debt after:</span>
                    <span className="text-red-600">
                      {formatCurrency((customer.outstandingDebt || 0) + formData.amount)}
                    </span>
                  </div>
                </div>
                {((customer.outstandingDebt || 0) + formData.amount) > (customer.creditLimit || 0) && (
                  <p className="text-red-600 text-xs mt-2">
                    ⚠️ This will exceed the customer's credit limit of {formatCurrency(customer.creditLimit || 0)}
                  </p>
                )}
              </div>
            </div>
          )}
          
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-2 border-gray-300 hover:border-gray-400 rounded-xl h-12"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold rounded-xl h-12"
              disabled={!isFormValid() || isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Recording...
                </div>
              ) : (
                'Record Debt'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddDebtModal;
