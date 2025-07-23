
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Edit, Trash2, CreditCard } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { Customer } from '../../types';

interface RefinedCustomerCardProps {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onRecordRepayment: (customer: Customer) => void;
  isUpdating?: boolean;
}

const RefinedCustomerCard: React.FC<RefinedCustomerCardProps> = ({
  customer,
  onEdit,
  onDelete,
  onRecordRepayment,
  isUpdating = false
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getBalanceStatus = () => {
    if (customer.outstandingDebt === 0) {
      return { color: 'bg-success/10 text-success border-success/20', avatarColor: 'bg-success/10 text-success' };
    } else if (customer.outstandingDebt <= 1000) {
      return { color: 'bg-warning/10 text-warning border-warning/20', avatarColor: 'bg-warning/10 text-warning' };
    } else {
      return { color: 'bg-destructive/10 text-destructive border-destructive/20', avatarColor: 'bg-destructive/10 text-destructive' };
    }
  };

  const balanceStatus = getBalanceStatus();

  return (
    <Card className={`bg-card rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-200 relative ${
      isUpdating ? 'opacity-75' : ''
    }`}>
      <CardContent className="p-0">
        {/* Loading overlay */}
        {isUpdating && (
          <div className="absolute inset-0 bg-background/50 rounded-2xl flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Top Row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Avatar className={`w-12 h-12 ${balanceStatus.avatarColor} flex-shrink-0`}>
              <AvatarFallback className="font-semibold">
                {getInitials(customer.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-display font-semibold text-foreground truncate">{customer.name}</h3>
              <p className="text-sm text-muted-foreground">{customer.phone}</p>
              
              {/* Email Field */}
              <p className="text-sm text-muted-foreground mt-1">
                {customer.email ? (
                  <span className="truncate block">{customer.email}</span>
                ) : (
                  <span className="italic">No email provided</span>
                )}
              </p>
              
              {/* Address Field */}
              <p className="text-sm text-muted-foreground mt-1">
                {customer.address ? (
                  <span className="line-clamp-2 leading-tight">{customer.address}</span>
                ) : (
                  <span className="italic">No address provided</span>
                )}
              </p>

              {/* Credit Limit Field */}
              <p className="text-sm text-muted-foreground mt-2">
                <span className="font-medium">Credit Limit:</span>{' '}
                {customer.creditLimit ? formatCurrency(customer.creditLimit) : 'Unlimited'}
              </p>
            </div>
          </div>

          {/* Balance Badge - Fixed positioning */}
          <div className="flex-shrink-0 ml-2">
            <Badge className={`px-3 py-1 rounded-full text-sm ${balanceStatus.color}`}>
              {formatCurrency(customer.outstandingDebt)}
            </Badge>
          </div>
        </div>

        {/* Action Row - Icon Only Buttons */}
        <div className="flex gap-3 justify-end mt-6">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => onRecordRepayment(customer)}
                disabled={customer.outstandingDebt === 0}
                className="w-10 h-10 bg-success/10 text-success rounded-full hover:bg-success/20 transition-all duration-200 hover:scale-110 active:scale-95 p-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                aria-label="Record payment"
              >
                <CreditCard className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Record payment</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => onEdit(customer)}
                className="w-10 h-10 bg-muted/50 text-muted-foreground rounded-full hover:bg-muted transition-all duration-200 hover:scale-110 active:scale-95 p-0"
                aria-label="Edit customer"
              >
                <Edit className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit customer</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => onDelete(customer)}
                className="w-10 h-10 bg-destructive/10 text-destructive rounded-full hover:bg-destructive/20 transition-all duration-200 hover:scale-110 active:scale-95 p-0"
                aria-label="Delete customer"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete customer</TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
};

export default RefinedCustomerCard;
