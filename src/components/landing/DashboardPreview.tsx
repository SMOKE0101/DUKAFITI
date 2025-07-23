import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  Package, 
  AlertTriangle, 
  DollarSign,
  Plus,
  UserPlus,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const DashboardPreview = () => {
  return (
    <div className="relative max-w-4xl mx-auto">
      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative bg-background/95 backdrop-blur-sm rounded-3xl p-6 border border-border/50 shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:scale-[1.02] group">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground">DASHBOARD</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-muted-foreground">Live</span>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Sales Today */}
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20 hover:shadow-green-500/20 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">
                  TOTAL SALES TODAY
                </CardTitle>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-2xl font-bold text-foreground">Ksh 306.00</div>
              <p className="text-xs text-muted-foreground">Avg: Ksh 102.00</p>
            </CardContent>
          </Card>

          {/* Orders Today */}
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20 hover:shadow-blue-500/20 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">
                  ORDERS TODAY
                </CardTitle>
                <ShoppingCart className="w-4 h-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-2xl font-bold text-foreground">3</div>
            </CardContent>
          </Card>

          {/* Active Customers */}
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20 hover:shadow-purple-500/20 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-400">
                  ACTIVE CUSTOMERS
                </CardTitle>
                <Users className="w-4 h-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-2xl font-bold text-foreground">8</div>
            </CardContent>
          </Card>

          {/* Low Stock Products */}
          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20 hover:shadow-orange-500/20 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400">
                  LOW STOCK PRODUCTS
                </CardTitle>
                <Package className="w-4 h-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-2xl font-bold text-foreground">0</div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts and Quick Actions */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Low Stock Alerts */}
          <Card className="lg:col-span-1 bg-gradient-to-br from-orange-500/5 to-red-500/5 border-orange-500/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400">
                  LOW STOCK ALERTS
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-center py-8">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">All products are well stocked! 🎉</p>
            </CardContent>
          </Card>

          {/* Outstanding Debts */}
          <Card className="lg:col-span-1 bg-gradient-to-br from-red-500/5 to-pink-500/5 border-red-500/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-red-500" />
                <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">
                  OUTSTANDING DEBTS
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-center py-8">
              <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No outstanding debts! 💚</p>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="lg:col-span-1 bg-gradient-to-br from-primary/5 to-blue-500/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-primary">
                QUICK ACTIONS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                size="sm" 
                className="w-full bg-green-600 hover:bg-green-700 text-white transition-all hover:scale-105"
              >
                <Plus className="w-4 h-4 mr-2" />
                RECORD SALE
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full border-blue-500/50 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all hover:scale-105"
              >
                <Package className="w-4 h-4 mr-2" />
                ADD PRODUCT
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full border-purple-500/50 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all hover:scale-105"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                ADD CUSTOMER
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Floating indicators */}
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
        
        <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center shadow-lg">
          <TrendingUp className="w-3 h-3 text-white" />
        </div>
      </div>
    </div>
  );
};

export default DashboardPreview;