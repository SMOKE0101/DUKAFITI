
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
      return { color: 'bg-green-100 text-green-800', avatarColor: 'bg-green-100 text-green-600' };
    } else if (customer.outstandingDebt <= 1000) {
      return { color: 'bg-yellow-100 text-yellow-800', avatarColor: 'bg-yellow-100 text-yellow-600' };
    } else {
      return { color: 'bg-red-100 text-red-800', avatarColor: 'bg-red-100 text-red-600' };
    }
  };

  const balanceStatus = getBalanceStatus();

  return (
    <Card className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-shadow duration-200">
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
              <p className="text-sm text-gray-500">{customer.phone}</p>
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
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 flex items-center gap-2"
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
                className="border border-gray-300 text-gray-700 px-3 py-2 rounded hover:bg-gray-100 flex items-center gap-2"
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
                className="text-red-600 px-3 py-2 rounded hover:bg-red-50 flex items-center gap-2"
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
