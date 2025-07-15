
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, Package, AlertTriangle, Edit, Trash2, PackagePlus } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { formatCurrency } from '../utils/currency';
import FeatureLimitModal from './trial/FeatureLimitModal';
import InventoryModal from './InventoryModal';
import { useTrialSystem } from '../hooks/useTrialSystem';
import { useOfflineAwareData } from '../hooks/useOfflineAwareData';
import { useOfflineAwareMutation } from '../hooks/useOfflineAwareMutation';
import { PRODUCT_CATEGORIES } from '../constants/categories';

interface Product {
  id: string;
  user_id: string;
  name: string;
  category: string;
  cost_price: number;
  selling_price: number;
  current_stock: number;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
}

const ProductManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showFeatureLimitModal, setShowFeatureLimitModal] = useState(false);
  const { toast } = useToast();
  const { trialInfo, updateFeatureUsage, checkFeatureAccess } = useTrialSystem();

  // Use offline-aware data hooks
  const { data: products, loading, refetch } = useOfflineAwareData<Product>({
    table: 'products',
    select: '*'
  });

  // Use offline-aware mutations
  const createProductMutation = useOfflineAwareMutation({
    table: 'products',
    operation: 'insert',
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product added successfully",
      });
      refetch();
      resetForm();
    }
  });

  const updateProductMutation = useOfflineAwareMutation({
    table: 'products',
    operation: 'update',
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      refetch();
      resetForm();
    }
  });

  const deleteProductMutation = useOfflineAwareMutation({
    table: 'products',
    operation: 'delete',
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      refetch();
    }
  });

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    costPrice: '',
    sellingPrice: '',
    currentStock: '',
    lowStockThreshold: '',
  });

  const categories = ['all', ...PRODUCT_CATEGORIES];

  // Memoize filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // Memoize low stock products
  const lowStockProducts = useMemo(() => {
    return products.filter(product => product.current_stock <= product.low_stock_threshold);
  }, [products]);

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      costPrice: '',
      sellingPrice: '',
      currentStock: '',
      lowStockThreshold: '',
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check trial limits for new products
    if (!editingProduct && trialInfo && trialInfo.isTrialActive) {
      const canCreateProduct = checkFeatureAccess('products');
      if (!canCreateProduct) {
        setShowFeatureLimitModal(true);
        return;
      }
    }

    if (!formData.name || !formData.category || !formData.costPrice || !formData.sellingPrice) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const costPrice = parseFloat(formData.costPrice);
    const sellingPrice = parseFloat(formData.sellingPrice);
    const currentStock = parseInt(formData.currentStock) || 0;
    const lowStockThreshold = parseInt(formData.lowStockThreshold) || 10;

    if (costPrice < 0 || sellingPrice < 0 || currentStock < 0) {
      toast({
        title: "Validation Error",
        description: "Prices and stock cannot be negative",
        variant: "destructive",
      });
      return;
    }

    const productData = {
      name: formData.name,
      category: formData.category,
      cost_price: costPrice,
      selling_price: sellingPrice,
      current_stock: currentStock,
      low_stock_threshold: lowStockThreshold,
    };

    try {
      if (editingProduct) {
        updateProductMutation.mutate(productData, { id: editingProduct.id });
      } else {
        createProductMutation.mutate(productData);
        
        // Update trial usage for new products
        if (trialInfo && trialInfo.isTrialActive) {
          updateFeatureUsage('products', 1);
        }
      }
    } catch (error) {
      console.error('Failed to save product:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      costPrice: product.cost_price.toString(),
      sellingPrice: product.selling_price.toString(),
      currentStock: product.current_stock.toString(),
      lowStockThreshold: product.low_stock_threshold.toString(),
    });
    setShowForm(true);
  };

  const handleDelete = async (product: Product) => {
    if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
      try {
        deleteProductMutation.mutate({ id: product.id });
      } catch (error) {
        console.error('Failed to delete product:', error);
      }
    }
  };

  const handleAddProduct = () => {
    // Check trial limits before showing form
    if (trialInfo && trialInfo.isTrialActive) {
      const canCreateProduct = checkFeatureAccess('products');
      if (!canCreateProduct) {
        setShowFeatureLimitModal(true);
        return;
      }
    }
    setShowForm(true);
  };

  const handleAddStock = async (productId: string, quantity: number, buyingPrice: number, supplier?: string) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      // Update the product stock
      updateProductMutation.mutate({
        current_stock: product.current_stock + quantity,
        cost_price: buyingPrice, // Update cost price with latest buying price
      }, { id: productId });

      toast({
        title: "Stock Added Successfully",
        description: `Stock recorded: ${quantity} × ${product.name} at KES ${buyingPrice.toFixed(2)} each.`,
      });

      setShowInventoryModal(false);
    } catch (error) {
      console.error('Failed to add stock:', error);
      toast({
        title: "Error",
        description: "Failed to add stock. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
          <p className="text-gray-600">Manage your inventory and product catalog</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowInventoryModal(true)} 
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full transition-all hover:shadow-lg"
            title="Record new stock arrival"
          >
            <PackagePlus className="w-4 h-4" />
            <span>Add Inventory</span>
          </Button>
          <Button onClick={handleAddProduct} className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Products ({products.length})</TabsTrigger>
          <TabsTrigger value="low-stock">
            Low Stock ({lowStockProducts.length})
            {lowStockProducts.length > 0 && <AlertTriangle className="w-4 h-4 ml-2 text-orange-500" />}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {product.category}
                      </Badge>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(product)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Cost Price:</span>
                      <span className="font-medium">{formatCurrency(product.cost_price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Selling Price:</span>
                      <span className="font-medium">{formatCurrency(product.selling_price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Stock:</span>
                      <Badge variant={product.current_stock <= product.low_stock_threshold ? "destructive" : "default"}>
                        {product.current_stock} units
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Profit Margin:</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(product.selling_price - product.cost_price)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm ? "No products match your search" : "No products added yet"}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="low-stock">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lowStockProducts.map(product => (
              <Card key={product.id} className="border-orange-200 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                  </div>
                  <Badge variant="secondary">{product.category}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Current Stock:</span>
                      <Badge variant="destructive">{product.current_stock} units</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Low Stock Alert:</span>
                      <span className="text-sm">{product.low_stock_threshold} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Selling Price:</span>
                      <span className="font-medium">{formatCurrency(product.selling_price)}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleEdit(product)}
                    className="w-full mt-4"
                    variant="outline"
                  >
                    Update Stock
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {lowStockProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600">All products are well stocked!</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Product Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="w-[95vw] sm:w-[90vw] max-w-2xl h-[90vh] sm:max-h-[85vh] flex flex-col mx-auto my-auto rounded-lg border-0 p-0">
          <DialogHeader className="flex-shrink-0 p-4 sm:p-6 border-b">
            <DialogTitle className="text-lg sm:text-xl font-bold">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter product name"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="costPrice" className="text-sm font-medium">Cost Price (KES) *</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.costPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, costPrice: e.target.value }))}
                    placeholder="0.00"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellingPrice" className="text-sm font-medium">Selling Price (KES) *</Label>
                  <Input
                    id="sellingPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, sellingPrice: e.target.value }))}
                    placeholder="0.00"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentStock" className="text-sm font-medium">Current Stock</Label>
                  <Input
                    id="currentStock"
                    type="number"
                    min="0"
                    value={formData.currentStock}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentStock: e.target.value }))}
                    placeholder="0"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lowStockThreshold" className="text-sm font-medium">Low Stock Alert</Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    min="0"
                    value={formData.lowStockThreshold}
                    onChange={(e) => setFormData(prev => ({ ...prev, lowStockThreshold: e.target.value }))}
                    placeholder="10"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1" disabled={createProductMutation.loading || updateProductMutation.loading}>
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feature Limit Modal */}
      <FeatureLimitModal 
        open={showFeatureLimitModal}
        onOpenChange={setShowFeatureLimitModal}
        feature="products"
        currentUsage={trialInfo?.usage?.products || 0}
        limit={trialInfo?.limits?.products || 0}
      />

      {/* Inventory Modal */}
      <InventoryModal 
        open={showInventoryModal}
        onOpenChange={setShowInventoryModal}
        products={products}
        onAddStock={handleAddStock}
      />
    </div>
  );
};

export default ProductManagement;
