
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, Plus, AlertTriangle, RefreshCw, TrendingUp, Filter, Search } from 'lucide-react';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import AddProductModal from './inventory/AddProductModal';
import EditProductModal from './inventory/EditProductModal';
import DeleteProductModal from './inventory/DeleteProductModal';
import RestockModal from './inventory/RestockModal';
import ProductCard from './inventory/ProductCard';
import { Product } from '../types';

const InventoryPage: React.FC = () => {
  const { 
    products, 
    loading, 
    error, 
    createProduct, 
    updateProduct, 
    deleteProduct, 
    addStock, 
    refreshProducts,
    isOnline 
  } = useSupabaseProducts();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    return uniqueCategories.sort();
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      
      const matchesStock = stockFilter === 'all' ||
                          (stockFilter === 'low' && product.currentStock <= product.lowStockThreshold) ||
                          (stockFilter === 'out' && product.currentStock === 0) ||
                          (stockFilter === 'in' && product.currentStock > 0);
      
      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchTerm, categoryFilter, stockFilter]);

  // Statistics
  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.currentStock <= p.lowStockThreshold && p.currentStock > 0).length;
  const outOfStockCount = products.filter(p => p.currentStock === 0).length;
  const totalValue = products.reduce((sum, p) => sum + (p.sellingPrice * p.currentStock), 0);

  // Handle actions
  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const handleRestock = async (product: Product, quantity: number, buyingPrice: number) => {
    try {
      await addStock(product.id, quantity, buyingPrice);
    } catch (error) {
      console.error('Failed to add stock:', error);
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshProducts();
    } catch (error) {
      console.error('Failed to refresh products:', error);
    }
  };

  const handleAddProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createProduct(productData);
      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to add product:', error);
    }
  };

  const handleUpdateProduct = async (id: string, productData: Partial<Product>) => {
    try {
      await updateProduct(id, productData);
      setShowEditModal(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Failed to update product:', error);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteProduct(id);
      setShowDeleteModal(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const handleAddStock = async (id: string, quantity: number, buyingPrice: number) => {
    try {
      await addStock(id, quantity, buyingPrice);
      setShowRestockModal(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Failed to add stock:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-muted-foreground">Loading inventory...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-800">Failed to Load Inventory</h3>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                  {!isOnline && (
                    <p className="text-red-500 text-xs mt-1">
                      You're offline. Check your connection and try again.
                    </p>
                  )}
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Modern Top Bar */}
      <div className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center">
            <Package className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="font-mono text-lg md:text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">
            INVENTORY
          </h1>
          {!isOnline && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 font-mono text-xs uppercase">
              Offline Mode
            </Badge>
          )}
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 md:px-6 py-2 bg-transparent border-2 border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full font-mono text-xs md:text-sm font-bold uppercase tracking-wide transition-all duration-200 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">ADD PRODUCT</span>
          <span className="sm:hidden">ADD</span>
        </button>
      </div>

      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Total Products',
              value: totalProducts.toString(),
              icon: Package,
              color: 'border-blue-600',
              iconColor: 'text-blue-600 dark:text-blue-400'
            },
            {
              title: 'Total Value',
              value: `KSh ${totalValue.toLocaleString()}`,
              icon: TrendingUp,
              color: 'border-green-600',
              iconColor: 'text-green-600 dark:text-green-400'
            },
            {
              title: 'Low Stock',
              value: lowStockCount.toString(),
              icon: AlertTriangle,
              color: 'border-orange-600',
              iconColor: 'text-orange-600 dark:text-orange-400'
            },
            {
              title: 'Out of Stock',
              value: outOfStockCount.toString(),
              icon: AlertTriangle,
              color: 'border-red-600',
              iconColor: 'text-red-600 dark:text-red-400'
            }
          ].map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div key={index} className={`border-2 ${metric.color} rounded-xl p-6 bg-transparent`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-mono text-xs font-black uppercase tracking-wide text-gray-700 dark:text-gray-300 mb-3">
                      {metric.title}
                    </h3>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {metric.value}
                    </p>
                  </div>
                  <div className="w-10 h-10 border border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center">
                    <Icon className={`w-5 h-5 ${metric.iconColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-6 bg-transparent">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 border border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center">
              <Filter className="w-3 h-3 text-primary" />
            </div>
            <h3 className="font-mono text-lg font-black uppercase tracking-wider text-gray-900 dark:text-white">
              FILTER & SEARCH
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 transition-colors group-focus-within:text-primary" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 rounded-xl border-2 bg-transparent hover:border-primary/50 focus:border-primary transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            
            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-12 rounded-xl border-2 bg-transparent hover:border-primary/50 focus:border-primary transition-all duration-200">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-primary" />
                  <SelectValue placeholder="All Categories" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-2 bg-white/95 backdrop-blur-xl">
                <SelectItem value="all" className="rounded-lg">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category} className="rounded-lg">
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Stock Filter */}
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="h-12 rounded-xl border-2 bg-transparent hover:border-primary/50 focus:border-primary transition-all duration-200">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  <SelectValue placeholder="All Stock Levels" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-2 bg-white/95 backdrop-blur-xl">
                <SelectItem value="all" className="rounded-lg">All Stock Levels</SelectItem>
                <SelectItem value="in" className="rounded-lg">In Stock</SelectItem>
                <SelectItem value="low" className="rounded-lg">Low Stock</SelectItem>
                <SelectItem value="out" className="rounded-lg">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products List */}
        <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-6 bg-transparent">
          <h3 className="font-mono text-lg font-black uppercase tracking-wider text-gray-900 dark:text-white mb-6">
            PRODUCTS ({filteredProducts.length})
          </h3>
          
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {products.length === 0 
                  ? 'No products yet. Add your first product to get started.'
                  : 'No products found. Try adjusting your search or filter criteria.'
                }
              </p>
              {products.length === 0 && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-2 bg-transparent border-2 border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full font-mono text-sm font-bold uppercase tracking-wide transition-all duration-200 flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Add Your First Product
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onRestock={handleRestock}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddProductModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddProduct}
      />

      {selectedProduct && (
        <>
          <EditProductModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedProduct(null);
            }}
            product={selectedProduct}
            onSave={handleUpdateProduct}
          />

          <DeleteProductModal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setSelectedProduct(null);
            }}
            product={selectedProduct}
            onDelete={handleDeleteProduct}
          />

          <RestockModal
            isOpen={showRestockModal}
            onClose={() => {
              setShowRestockModal(false);
              setSelectedProduct(null);
            }}
            product={selectedProduct}
            onSave={(quantity: number, buyingPrice: number) => 
              selectedProduct ? handleAddStock(selectedProduct.id, quantity, buyingPrice) : Promise.resolve()
            }
          />
        </>
      )}
    </div>
  );
};

export default InventoryPage;
