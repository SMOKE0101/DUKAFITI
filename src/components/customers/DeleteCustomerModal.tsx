
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Customer } from '../../types';
import { useSupabaseCustomers } from '../../hooks/useSupabaseCustomers';
import { useToast } from '../../hooks/use-toast';

interface DeleteCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

const DeleteCustomerModal: React.FC<DeleteCustomerModalProps> = ({
  isOpen,
  onClose,
  customer
}) => {
  const { deleteCustomer } = useSupabaseCustomers();
  const { toast } = useToast();

  if (!customer) return null;

  const handleConfirm = async () => {
    try {
      await deleteCustomer(customer.id);
      toast({
        title: "Customer Deleted",
        description: `${customer.name} has been deleted successfully.`,
      });
      onClose();
    } catch (error) {
      console.error('Failed to delete customer:', error);
      toast({
        title: "Error",
        description: "Failed to delete customer. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <div className="text-center space-y-4">
          {/* Red trash icon */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <Trash2 className="w-8 h-8 text-red-600" />
          </div>
          
          {/* Confirmation text */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Delete Customer
            </h3>
            <p className="text-muted-foreground">
              Are you sure you want to delete <span className="font-medium text-foreground">{customer.name}</span>?
            </p>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone.
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={onClose}
              className="flex-1 text-gray-500 hover:text-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteCustomerModal;
