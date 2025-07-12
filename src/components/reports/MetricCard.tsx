
import React, { useEffect, useState } from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  delay?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBgColor,
  delay = 0
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d.]/g, '')) || 0 : value;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    const duration = 1000;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.floor(numericValue * easeOutQuart));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, numericValue]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm uppercase font-black font-mono tracking-tight text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <div className="relative">
            <p className="text-4xl font-bold text-gray-900 dark:text-white">
              {typeof value === 'string' && value.includes('KES') 
                ? `KES ${displayValue.toLocaleString()}`
                : displayValue.toLocaleString()
              }
            </p>
          </div>
        </div>
        <div className={`p-4 ${iconBgColor} rounded-2xl shadow-lg hover:shadow-xl transition-shadow group`}>
          <Icon className={`w-8 h-8 ${iconColor} group-hover:scale-110 transition-transform`} />
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
