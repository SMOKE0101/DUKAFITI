import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Package, AlertTriangle, Trash2, Edit, Box, Search, Layers, DollarSign } from 'lucide-react';
import { useUnifiedProducts } from '../hooks/useUnifiedProducts';
import { Product } from '../types';
import RestockModal from './inventory/RestockModal';
import DeleteProductModal from './inventory/DeleteProductModal';

const InventoryPage = () => {
  const { products, loading, createProduct, updateProduct, deleteProduct, isOnline, pendingOperations } = useUnifiedProducts();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isRestocking, setIsRestocking] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    costPrice: 0,
    sellingPrice: 0,
    currentStock: 0,
    lowStockThreshold: 10,
  });

  // Filter products based on search query
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats
  const totalProducts = products.length;
  const lowStockProducts = filteredProducts.filter(p => p.currentStock <= (p.lowStockThreshold || 10));
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.costPrice * p.currentStock), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedProduct) {
        await updateProduct(selectedProduct.id, formData);
      } else {
        await createProduct(formData);
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save product:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      costPrice: 0,
      sellingPrice: 0,
      currentStock: 0,
      lowStockThreshold: 10,
    });
    setSelectedProduct(null);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      currentStock: product.currentStock,
      lowStockThreshold: product.lowStockThreshold || 10,
    });
    setIsDialogOpen(true);
  };

  const handleRestock = async (product: Product, quantity: number, buyingPrice: number) => {
    if (!product) return;
    
    console.log('[InventoryPage] Handling restock:', { productId: product.id, quantity, buyingPrice });
    setIsRestocking(true);
    
    try {
      await updateProduct(product.id, {
        currentStock: product.currentStock + quantity,
        costPrice: buyingPrice,
      });
      
      setShowRestockModal(false);
      setSelectedProduct(null);
      console.log('[InventoryPage] Restock completed successfully');
    } catch (error) {
      console.error('[InventoryPage] Failed to restock product:', error);
    } finally {
      setIsRestocking(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    console.log('[InventoryPage] Handling delete:', id);
    try {
      await deleteProduct(id);
      setShowDeleteModal(false);
      setProductToDelete(null);
      console.log('[InventoryPage] Delete completed successfully');
    } catch (error) {
      console.error('[InventoryPage] Failed to delete product:', error);
    }
  };

  const openRestockModal = (product: Product) => {
    console.log('[InventoryPage] Opening restock modal for product:', product.id);
    setSelectedProduct(product);
    setShowRestockModal(true);
  };

  const openDeleteModal = (product: Product) => {
    console.log('[InventoryPage] Opening delete modal for product:', product.id);
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-['Inter']">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-['Inter']">
              Inventory Management
            </h1>
            <p className="text-base text-gray-700 mt-2 font-['Inter']">
              Track and manage your product inventory
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Network Status Indicator */}
            {pendingOperations > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-amber-700">
                  {pendingOperations} pending sync
                </span>
              </div>
            )}
            {!isOnline && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-red-700">
                  Working Offline
                </span>
              </div>
            )}
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={resetForm}
                  className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 font-['Inter']"
                >
                  <Plus className="w-5 h-5 mr-2" strokeWidth={2} />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-gray-900 font-['Inter']">
                    {selectedProduct ? 'Edit Product' : 'Add New Product'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-base font-medium text-gray-700 font-['Inter']">Product Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category" className="text-base font-medium text-gray-700 font-['Inter']">Category *</Label>
                      <Input
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="costPrice" className="text-base font-medium text-gray-700 font-['Inter']">Cost Price *</Label>
                      <Input
                        id="costPrice"
                        type="number"
                        step="0.01"
                        value={formData.costPrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, costPrice: Number(e.target.value) }))}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sellingPrice" className="text-base font-medium text-gray-700 font-['Inter']">Selling Price *</Label>
                      <Input
                        id="sellingPrice"
                        type="number"
                        step="0.01"
                        value={formData.sellingPrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, sellingPrice: Number(e.target.value) }))}
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="currentStock" className="text-base font-medium text-gray-700 font-['Inter']">Current Stock *</Label>
                      <Input
                        id="currentStock"
                        type="number"
                        value={formData.currentStock}
                        onChange={(e) => setFormData(prev => ({ ...prev, currentStock: Number(e.target.value) }))}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lowStockThreshold" className="text-base font-medium text-gray-700 font-['Inter']">Low Stock Alert</Label>
                      <Input
                        id="lowStockThreshold"
                        type="number"
                        value={formData.lowStockThreshold}
                        onChange={(e) => setFormData(prev => ({ ...prev, lowStockThreshold: Number(e.target.value) }))}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="font-['Inter']">
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-purple-600 hover:bg-purple-700 font-['Inter']">
                      {selectedProduct ? 'Update' : 'Create'} Product
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-lg p-6 flex items-center transition-all duration-200 hover:-translate-y-1">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mr-4">
              <Layers className="w-6 h-6 text-blue-600" strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 font-['Inter']">{totalProducts}</div>
              <div className="text-base text-gray-700 font-['Inter']">Total Products</div>
            </div>
          </Card>

          <Card className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-lg p-6 flex items-center transition-all duration-200 hover:-translate-y-1">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mr-4">
              <AlertTriangle className="w-6 h-6 text-amber-600" strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 font-['Inter']">{lowStockProducts.length}</div>
              <div className="text-base text-gray-700 font-['Inter']">Low Stock Products</div>
            </div>
          </Card>

          <Card className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-lg p-6 flex items-center transition-all duration-200 hover:-translate-y-1">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mr-4">
              <DollarSign className="w-6 h-6 text-green-600" strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 font-['Inter']">
                KSh {totalInventoryValue.toLocaleString()}
              </div>
              <div className="text-base text-gray-700 font-['Inter']">Inventory Value</div>
            </div>
          </Card>
        </div>

        {/* Search Bar */}
        <Card className="bg-white rounded-3xl border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" strokeWidth={1.5} />
              <Input
                type="search"
                placeholder="Search products by name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 rounded-xl pl-12 pr-4 py-4 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 border-0 text-base font-['Inter']"
              />
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <div className="grid gap-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-base text-gray-700 font-['Inter']">Loading inventory...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <Card className="bg-white rounded-3xl shadow-md border border-gray-200">
              <CardContent className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" strokeWidth={1.5} />
                <h3 className="text-xl font-semibold text-gray-900 mb-2 font-['Inter']">
                  {searchQuery ? 'No products found' : 'No products in inventory'}
                </h3>
                <p className="text-base text-gray-700 font-['Inter']">
                  {searchQuery ? 'Try adjusting your search terms' : 'Start by adding your first product to track inventory'}
                </p>
                {!searchQuery && (
                  <Button onClick={resetForm} className="mt-6 bg-purple-600 hover:bg-purple-700 font-['Inter']">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <Card 
                  key={product.id} 
                  className="bg-white rounded-3xl shadow-md hover:shadow-lg border border-gray-200 transition-all duration-200 hover:-translate-y-1"
                >
                  <CardHeader className="pb-4 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-2xl font-semibold text-gray-900 mb-2 truncate font-['Inter']">
                          {product.name}
                        </CardTitle>
                        <span className="text-sm text-gray-500 uppercase tracking-wide font-['Inter']">
                          {product.category}
                        </span>
                      </div>
                      {product.currentStock <= (product.lowStockThreshold || 10) && (
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 ml-2" strokeWidth={1.5} />
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4 p-6 pt-0">
                    <div className="grid grid-cols-2 gap-4 text-base">
                      <div>
                        <span className="block font-medium text-gray-700 mb-1 font-['Inter']">Cost Price</span>
                        <span className="text-xl font-semibold text-gray-900 font-['Inter']">
                          KSh {product.costPrice.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="block font-medium text-gray-700 mb-1 font-['Inter']">Selling Price</span>
                        <span className="text-xl font-semibold text-gray-900 font-['Inter']">
                          KSh {product.sellingPrice.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Stock and Profit Badges */}
                    <div className="flex gap-2 flex-wrap">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-sm font-medium font-['Inter'] ${
                        product.currentStock <= (product.lowStockThreshold || 10) 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        Stock: {product.currentStock}
                      </span>
                      <span className="inline-block bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-sm font-medium font-['Inter']">
                        Profit: KSh {(product.sellingPrice - product.costPrice).toLocaleString()}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                      <div className="text-sm text-gray-500 font-['Inter']">
                        <span className="block">Low stock alert: {product.lowStockThreshold || 10} units</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-3 gap-3 pt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(product)}
                        className="border-purple-600 text-purple-600 hover:bg-purple-50 rounded-xl font-medium font-['Inter'] flex items-center justify-center gap-1.5"
                      >
                        <Edit className="w-4 h-4" strokeWidth={1.5} />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => openRestockModal(product)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium font-['Inter'] flex items-center justify-center gap-1.5"
                      >
                        <Box className="w-4 h-4" strokeWidth={1.5} />
                        Stock
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => openDeleteModal(product)}
                        className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium font-['Inter'] flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Restock Modal */}
        <RestockModal
          isOpen={showRestockModal}
          onClose={() => {
            setShowRestockModal(false);
            setSelectedProduct(null);
          }}
          onSave={(quantity, buyingPrice) => selectedProduct && handleRestock(selectedProduct, quantity, buyingPrice)}
          product={selectedProduct}
          isLoading={isRestocking}
        />

        {/* Delete Product Modal */}
        <DeleteProductModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setProductToDelete(null);
          }}
          onDelete={handleDeleteProduct}
          product={productToDelete}
        />
      </div>
    </div>
  );
};

export default InventoryPage;
