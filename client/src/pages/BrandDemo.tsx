
import React from 'react';
import BrandShowcase from '@/components/branding/BrandShowcase';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const BrandDemo = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="outline" asChild className="mb-4">
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <h1 className="text-3xl font-bold mb-2">DukaFiti Brand Elements</h1>
          <p className="text-muted-foreground">Comprehensive branding showcase for the DukaFiti application</p>
        </div>
        
        <BrandShowcase />
      </div>
    </div>
  );
};

export default BrandDemo;
