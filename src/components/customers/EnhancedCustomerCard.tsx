
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { History, Edit, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { Customer } from '../../types';

interface EnhancedCustomerCardProps {
  customer: Customer;
  onViewHistory: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

const EnhancedCustomerCard: React.FC<EnhancedCustomerCardProps> = ({
  customer,
  onViewHistory,
  onEdit,
  onDelete
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
    <Card className="bg-card rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-shadow duration-200">
      <CardContent className="p-0">
        {/* Top Row */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <Avatar className={`w-12 h-12 ${balanceStatus.avatarColor}`}>
              <AvatarFallback className="font-semibold">
                {getInitials(customer.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{customer.name}</h3>
              <p className="text-sm text-muted-foreground">{customer.phone}</p>
            </div>
          </div>

          {/* Balance Badge */}
          <Badge className={`px-3 py-1 rounded-full text-sm ${balanceStatus.color}`}>
            KES {customer.outstandingDebt.toLocaleString()}
          </Badge>
        </div>

        {/* Action Row */}
        <div className="flex gap-3 justify-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => onViewHistory(customer)}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2"
              >
                <History className="w-4 h-4" />
                View History
              </Button>
            </TooltipTrigger>
            <TooltipContent>See purchase & payment history</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => onEdit(customer)}
                variant="outline"
                className="border border-border text-foreground px-3 py-2 rounded hover:bg-muted flex items-center gap-2"
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
                variant="ghost"
                className="text-destructive px-3 py-2 rounded hover:bg-destructive/10 flex items-center gap-2"
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

export default EnhancedCustomerCard;
