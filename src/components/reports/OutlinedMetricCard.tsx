
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface OutlinedMetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  iconBg: string;
  iconColor: string;
  delay?: number;
}

const OutlinedMetricCard: React.FC<OutlinedMetricCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  iconBg,
  iconColor,
  delay = 0
}) => {
  return (
    <Card 
      className={`border-2 ${color} rounded-xl bg-white dark:bg-gray-800 hover:shadow-lg transition-all duration-200 cursor-pointer group`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white group-hover:scale-105 transition-transform">
              {value}
            </p>
          </div>
          <div className={`p-3 ${iconBg} rounded-full group-hover:scale-110 transition-transform`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OutlinedMetricCard;
