
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Package, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseProducts } from '@/hooks/useSupabaseProducts';
import InventoryModal from './inventory/InventoryModal';
import AddProductModal from './inventory/AddProductModal';
import InventoryProductGrid from './inventory/InventoryProductGrid';
import { Product } from '../types';
import FeatureLimitModal from './trial/FeatureLimitModal';

const ProductManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [isFeatureLimitModalOpen, setIsFeatureLimitModalOpen] = useState(false);

  // Fetch products using Supabase hook
  const { 
    products, 
    loading, 
    error, 
    createProduct,
    updateProduct,
    deleteProduct,
    refreshProducts
  } = useSupabaseProducts();

  // Product operations
  const handleSaveProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    const dbProduct = {
      user_id: user.id,
      name: productData.name,
      category: productData.category,
      cost_price: productData.cost_price,
      selling_price: productData.selling_price,
      current_stock: productData.current_stock,
      low_stock_threshold: productData.low_stock_threshold || 10,
    };

    try {
      await createProduct(dbProduct);
      toast({
        title: "Product Added",
        description: "Product has been added successfully",
      });
      setIsAddProductModalOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive",
      });
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsAddProductModalOpen(true);
  };

  const handleDeleteProduct = async (product: Product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      try {
        await deleteProduct(product.id);
        toast({
          title: "Product Deleted",
          description: "Product has been deleted successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete product",
          variant: "destructive",
        });
      }
    }
  };

  const handleAddStock = async (productId: string, quantity: number, buyingPrice: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const updatedProduct = {
      current_stock: product.current_stock + quantity,
      cost_price: buyingPrice,
      updated_at: new Date().toISOString()
    };

    try {
      await updateProduct(product.id, updatedProduct);
      toast({
        title: "Stock Updated",
        description: "Product stock has been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update stock",
        variant: "destructive",
      });
    }
  };

  const handleRestock = async (product: Product, quantity: number, buyingPrice: number) => {
    await handleAddStock(product.id, quantity, buyingPrice);
  };

  // Filtering logic
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    const matchesLowStock = !showLowStock || product.current_stock <= (product.low_stock_threshold || 10);
    
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  // Get unique categories
  const categories = [...new Set(products.map(product => product.category))];

  // Calculate stats
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.current_stock <= (p.low_stock_threshold || 10)).length;
  const totalValue = products.reduce((sum, p) => sum + (p.current_stock * p.cost_price), 0);
  const totalProfit = products.reduce((sum, p) => sum + (p.current_stock * (p.selling_price - p.cost_price)), 0);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Inventory Management</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <span>Error loading products: {error}</span>
            </div>
            <Button onClick={refreshProducts} className="mt-4">Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventory Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your products, track stock levels, and monitor inventory value
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsInventoryModalOpen(true)}
            variant="outline"
            className="shadow-lg"
            disabled={loading}
          >
            <Package className="w-4 h-4 mr-2" />
            Add Stock
          </Button>
          <Button 
            onClick={() => setIsAddProductModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white shadow-lg"
            disabled={loading}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total Products</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{totalProducts}</p>
              </div>
              <div className="bg-blue-200 dark:bg-blue-800/50 p-3 rounded-full">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">Low Stock Items</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{lowStockProducts}</p>
              </div>
              <div className="bg-orange-200 dark:bg-orange-800/50 p-3 rounded-full">
                <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 dark:text-green-400 text-sm font-medium">Inventory Value</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  KSh {totalValue.toLocaleString()}
                </p>
              </div>
              <div className="bg-green-200 dark:bg-green-800/50 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Potential Profit</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  KSh {totalProfit.toLocaleString()}
                </p>
              </div>
              <div className="bg-purple-200 dark:bg-purple-800/50 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <Button
              variant={showLowStock ? "default" : "outline"}
              onClick={() => setShowLowStock(!showLowStock)}
              className="whitespace-nowrap"
            >
              <Filter className="w-4 h-4 mr-2" />
              Low Stock Only
              {lowStockProducts > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {lowStockProducts}
                </Badge>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <InventoryProductGrid
        products={filteredProducts}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
        onRestock={handleRestock}
      />

      {/* Modals */}
      <InventoryModal
        isOpen={isInventoryModalOpen}
        onClose={() => setIsInventoryModalOpen(false)}
        products={products}
        onAddStock={handleAddStock}
      />

      <AddProductModal
        isOpen={isAddProductModalOpen}
        onClose={() => {
          setIsAddProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        existingProduct={editingProduct}
      />

      <FeatureLimitModal
        open={isFeatureLimitModalOpen}
        onOpenChange={setIsFeatureLimitModalOpen}
        feature="Products"
        currentUsage={totalProducts}
        limit={50}
      />
    </div>
  );
};

export default ProductManagement;
