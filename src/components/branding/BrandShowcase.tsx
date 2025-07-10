
import React from 'react';
import { Store } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const BrandShowcase = () => {
  return (
    <div className="space-y-8 p-6">
      {/* Brand Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-success rounded-xl flex items-center justify-center shadow-lg">
            <Store className="h-9 w-9 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="brand-title">DukaFiti</h1>
            <p className="brand-tagline">DUKAFITI NI DUKABORA</p>
          </div>
        </div>
        <p className="brand-subtitle max-w-2xl mx-auto">
          Mfumo wa kisasa zaidi wa usimamizi wa maduka nchini Kenya. 
          Uongozaji wa hisa, ufuatiliaji wa wateja, na uunganishaji wa M-Pesa.
        </p>
      </div>

      {/* Brand Colors */}
      <Card className="dukafiti-card">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Brand Colors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-primary rounded-lg mx-auto shadow-sm"></div>
              <p className="text-sm font-medium">Primary Blue</p>
              <p className="text-xs text-muted-foreground">Professional & Tech</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-success rounded-lg mx-auto shadow-sm"></div>
              <p className="text-sm font-medium">Success Green</p>
              <p className="text-xs text-muted-foreground">Trust & Growth</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-warning rounded-lg mx-auto shadow-sm"></div>
              <p className="text-sm font-medium">Warning Orange</p>
              <p className="text-xs text-muted-foreground">Alerts & Attention</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-destructive rounded-lg mx-auto shadow-sm"></div>
              <p className="text-sm font-medium">Error Red</p>
              <p className="text-xs text-muted-foreground">Critical Issues</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brand Components */}
      <Card className="dukafiti-card">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Brand Components</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Buttons */}
          <div className="space-y-3">
            <h3 className="font-semibold">Branded Buttons</h3>
            <div className="flex flex-wrap gap-3">
              <Button className="dukafiti-button-primary">Primary Action</Button>
              <Button className="dukafiti-button-success">Success Action</Button>
              <Button variant="outline" className="border-primary/20 hover:bg-primary/5">
                Secondary Action
              </Button>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="space-y-3">
            <h3 className="font-semibold">Status Indicators</h3>
            <div className="flex flex-wrap gap-3">
              <span className="status-success">✓ Iko Mtandaoni</span>
              <span className="status-warning">⚠ Onyo la Hisa</span>
              <span className="status-error">✗ Hitilafu</span>
            </div>
          </div>

          {/* Input */}
          <div className="space-y-3">
            <h3 className="font-semibold">Branded Input</h3>
            <input 
              type="text"
              placeholder="Tafuta bidhaa..."
              className="dukafiti-input max-w-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card className="dukafiti-card">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Typography Hierarchy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h1 className="brand-title">Brand Title</h1>
            <p className="text-sm text-muted-foreground">Used for main headings and hero sections</p>
          </div>
          <div>
            <p className="brand-subtitle">Brand Subtitle</p>
            <p className="text-sm text-muted-foreground">Used for descriptive text and explanations</p>
          </div>
          <div>
            <p className="brand-tagline">BRAND TAGLINE</p>
            <p className="text-sm text-muted-foreground">Used for the main tagline "DUKAFITI NI DUKABORA"</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrandShowcase;
