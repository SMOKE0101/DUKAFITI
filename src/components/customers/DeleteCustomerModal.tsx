
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } = '@/components/ui/button';
import { Customer } from '../../types';

interface DeleteCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  onDelete: (id: string) => Promise<void>;
}

const DeleteCustomerModal: React.FC<DeleteCustomerModalProps> = ({
  isOpen,
  onClose,
  customer,
  onDelete
}) => {
  const handleDelete = async () => {
    await onDelete(customer.id);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Customer</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete {customer.name}? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteCustomerModal;
