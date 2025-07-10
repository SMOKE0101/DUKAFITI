
import React, { useState } from 'react';
import { useSupabaseCustomers } from '../hooks/useSupabaseCustomers';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { useSupabaseSales } from '../hooks/useSupabaseSales';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package2,
  AlertTriangle,
  Plus,
  UserPlus,
  TrendingUp,
  Store
} from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { useNavigate } from 'react-router-dom';

const RoughBlockyDashboard = () => {
  const navigate = useNavigate();
  const { customers } = useSupabaseCustomers();
  const { products } = useSupabaseProducts();
  const { sales } = useSupabaseSales();
  const [flippedCard, setFlippedCard] = useState<string | null>(null);

  // Calculate stats
  const today = new Date().toDateString();
  const todaySales = sales.filter(s => new Date(s.timestamp).toDateString() === today);
  
  const totalSalesToday = todaySales.reduce((sum, s) => sum + s.total, 0);
  const totalOrdersToday = todaySales.length;
  const activeCustomers = customers.length;
  const lowStockProducts = products.filter(p => p.currentStock !== -1 && p.currentStock <= (p.lowStockThreshold || 10));
  const overdueCustomers = customers.filter(c => c.outstandingDebt > 0);

  const handleCardFlip = (cardId: string) => {
    setFlippedCard(flippedCard === cardId ? null : cardId);
  };

  const summaryCards = [
    {
      id: 'sales',
      title: 'JUMLA YA MAUZO LEO',
      value: formatCurrency(totalSalesToday),
      icon: DollarSign,
      bgColor: 'bg-success/5',
      iconColor: 'text-success',
      borderColor: 'border-success/20',
      route: '/sales',
      details: `${todaySales.length} miamala ya leo`
    },
    {
      id: 'orders',
      title: 'MAHITAJI YA LEO',
      value: totalOrdersToday.toString(),
      icon: ShoppingCart,
      bgColor: 'bg-primary/5',
      iconColor: 'text-primary',
      borderColor: 'border-primary/20',
      route: '/sales',
      details: `Wastani: ${totalOrdersToday ? (totalSalesToday / totalOrdersToday).toFixed(2) : '0'} kwa oda`
    },
    {
      id: 'customers',
      title: 'WATEJA WAMILIFU',
      value: activeCustomers.toString(),
      icon: Users,
      bgColor: 'bg-chart-4/5',
      iconColor: 'text-chart-4',
      borderColor: 'border-chart-4/20',
      route: '/customers',
      details: `${overdueCustomers.length} wana deni la kulipwa`
    },
    {
      id: 'stock',
      title: 'ONYO LA HISA',
      value: lowStockProducts.length.toString(),
      icon: lowStockProducts.length > 0 ? AlertTriangle : Package2,
      bgColor: lowStockProducts.length > 0 ? 'bg-destructive/5' : 'bg-success/5',
      iconColor: lowStockProducts.length > 0 ? 'text-destructive' : 'text-success',
      borderColor: lowStockProducts.length > 0 ? 'border-destructive/20' : 'border-success/20',
      route: '/inventory',
      details: lowStockProducts.length > 0 ? 'Inahitaji umakini wa haraka' : 'Bidhaa zote zipo vizuri'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10">
      {/* Professional Header with Brand Identity */}
      <header className="h-20 bg-card/80 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="flex items-center justify-between px-6 h-full">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-success rounded-lg flex items-center justify-center shadow-md">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                DASHIBODI
              </h1>
              <p className="brand-tagline text-xs">DUKAFITI NI DUKABORA</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="status-success">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              Iko Mtandaoni
            </div>
            <input 
              type="search" 
              placeholder="Tafuta kitu chochote..." 
              className="dukafiti-input w-64"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6 max-w-7xl mx-auto">
        {/* Summary Cards - Professional 2x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            const isFlipped = flippedCard === card.id;
            
            return (
              <Card 
                key={card.id}
                className={`dukafiti-card relative overflow-hidden cursor-pointer transform hover:-translate-y-1 transition-all duration-300 ${card.bgColor} border ${card.borderColor}`}
                style={{ 
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  transformStyle: 'preserve-3d',
                  transition: 'transform 300ms ease-out, box-shadow 300ms ease-out'
                }}
                onClick={() => handleCardFlip(card.id)}
              >
                <CardContent className="p-6" style={{ backfaceVisibility: 'hidden' }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-bold tracking-wide text-muted-foreground mb-3 uppercase">
                        {card.title}
                      </p>
                      <p className="text-4xl font-bold text-foreground mb-2">
                        {card.value}
                      </p>
                    </div>
                    <div className={`w-14 h-14 rounded-xl ${card.bgColor} border ${card.borderColor} flex items-center justify-center shadow-sm`}>
                      <Icon className={`w-7 h-7 ${card.iconColor}`} strokeWidth={2} />
                    </div>
                  </div>
                </CardContent>
                
                {/* Professional Flipped Content */}
                <div 
                  className={`absolute inset-0 p-6 flex items-center justify-center text-center ${card.bgColor} border ${card.borderColor}`}
                  style={{ 
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)'
                  }}
                >
                  <div>
                    <p className="text-base font-medium text-foreground mb-4">
                      {card.details}
                    </p>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(card.route);
                      }}
                      className="dukafiti-button-primary"
                    >
                      <TrendingUp className="w-4 h-4" />
                      ANGALIA ZAIDI
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Professional Management Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Low Stock Alerts - Professional Design */}
          <Card className="dukafiti-card bg-warning/5 border-warning/20">
            <div className="p-6">
              <h3 className="font-bold text-lg text-foreground mb-4 uppercase tracking-wide flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" strokeWidth={2} />
                ONYO LA HISA
              </h3>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {lowStockProducts.length > 0 ? (
                  lowStockProducts.slice(0, 5).map((product) => (
                    <div key={product.id} className="flex justify-between items-center p-3 bg-warning/10 rounded-lg border border-warning/20">
                      <span className="font-medium text-sm text-foreground truncate">
                        {product.name}
                      </span>
                      <Badge className="status-warning">
                        {product.currentStock}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Package2 className="w-12 h-12 mx-auto text-success mb-2" strokeWidth={2} />
                    <p className="text-sm font-medium text-muted-foreground">
                      Bidhaa zote zipo vizuri!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Outstanding Payments - Professional Design */}
          <Card className="dukafiti-card bg-destructive/5 border-destructive/20">
            <div className="p-6">
              <h3 className="font-bold text-lg text-foreground mb-4 uppercase tracking-wide flex items-center gap-2">
                <Users className="w-5 h-5 text-destructive" strokeWidth={2} />
                MADENI YA KULIPWA
              </h3>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {overdueCustomers.length > 0 ? (
                  overdueCustomers.slice(0, 5).map((customer) => (
                    <div key={customer.id} className="flex justify-between items-center p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                      <span className="font-medium text-sm text-foreground truncate">
                        {customer.name}
                      </span>
                      <span className="font-bold text-sm text-destructive">
                        {formatCurrency(customer.outstandingDebt)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto text-success mb-2" strokeWidth={2} />
                    <p className="text-sm font-medium text-muted-foreground">
                      Madeni yote yameshalipiwa!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Quick Actions - Professional Design */}
          <Card className="dukafiti-card bg-primary/5 border-primary/20">
            <div className="p-6">
              <h3 className="font-bold text-lg text-foreground mb-4 uppercase tracking-wide flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" strokeWidth={2} />
                VITENDO VYA HARAKA
              </h3>
              <div className="space-y-3">
                <Button 
                  className="dukafiti-button w-full justify-start bg-success/10 text-success hover:bg-success hover:text-success-foreground border border-success/20"
                  onClick={() => navigate('/sales')}
                >
                  <ShoppingCart className="w-5 h-5" strokeWidth={2} />
                  Ongeza Mauzo
                </Button>
                
                <Button 
                  className="dukafiti-button w-full justify-start bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20"
                  onClick={() => navigate('/inventory')}
                >
                  <Plus className="w-5 h-5" strokeWidth={2} />
                  Ongeza Bidhaa
                </Button>
                
                <Button 
                  className="dukafiti-button w-full justify-start bg-chart-4/10 text-chart-4 hover:bg-chart-4 hover:text-white border border-chart-4/20"
                  onClick={() => navigate('/customers')}
                >
                  <UserPlus className="w-5 h-5" strokeWidth={2} />
                  Ongeza Mteja
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RoughBlockyDashboard;
