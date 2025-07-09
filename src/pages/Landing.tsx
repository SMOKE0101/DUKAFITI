
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Store, BarChart3, Users, Package, ShoppingCart, TrendingUp } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <Store className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              DukaFiti
            </span>
          </div>
          <Button asChild>
            <Link to="/auth">Get Started</Link>
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Jua Duka Yako
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Smart Business Management
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Transform your shop with smart inventory management, customer tracking, and M-Pesa integration designed for Kenyan entrepreneurs.
          </p>
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link to="/auth">Start Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Inventory Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Track stock levels, set low-stock alerts, and manage your products with ease.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <ShoppingCart className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Sales Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Process sales quickly with multiple payment options including M-Pesa integration.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Customer Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Build customer relationships and track purchase history for better service.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle>Business Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Get insights into your business performance with detailed reports and analytics.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-teal-600" />
              </div>
              <CardTitle>Profit Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Monitor your profits in real-time and make data-driven business decisions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Store className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle>Offline Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Continue working even without internet - data syncs when you're back online.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of Kenyan entrepreneurs already using DukaFiti.
          </p>
          <Button size="lg" asChild>
            <Link to="/auth">Start Your Free Trial</Link>
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-gray-200 mt-16">
        <div className="text-center text-gray-600">
          <p>&copy; 2024 DukaFiti. Built for Kenyan entrepreneurs.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
