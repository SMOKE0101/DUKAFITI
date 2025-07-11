
import React, { useEffect, useState } from 'react';
import { LucideIcon } from 'lucide-react';

interface BlockyMetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  borderColor: string;
  hoverColor: string;
  delay?: number;
}

const BlockyMetricCard: React.FC<BlockyMetricCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor,
  borderColor,
  hoverColor,
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
    <div 
      className={`
        border-2 ${borderColor} rounded-xl bg-transparent cursor-pointer 
        transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group ${hoverColor} p-6
      `}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-mono font-black uppercase tracking-wide text-gray-700 dark:text-gray-300 mb-3 text-xs">
            {title}
          </h3>
          <p className="font-semibold text-gray-900 dark:text-white group-hover:scale-105 transition-transform truncate text-2xl">
            {typeof value === 'string' && value.includes('KES') 
              ? `KES ${displayValue.toLocaleString()}`
              : displayValue.toLocaleString()
            }
          </p>
        </div>
        <div className="w-10 h-10 border border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
};

export default BlockyMetricCard;
