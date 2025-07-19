
import React from 'react';

interface PremiumAppLayoutProps {
  children: React.ReactNode;
}

const PremiumAppLayout: React.FC<PremiumAppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {children}
      </div>
    </div>
  );
};

export default PremiumAppLayout;
