
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Package, AlertTriangle, Trash2 } from 'lucide-react';
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
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    costPrice: 0,
    sellingPrice: 0,
    currentStock: 0,
    lowStockThreshold: 10,
  });

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

  // Fixed restock function to properly integrate with unified products
  const handleRestock = async (product: Product, quantity: number, buyingPrice: number) => {
    if (!product) return;
    
    console.log('[InventoryPage] Handling restock:', { productId: product.id, quantity, buyingPrice });
    setIsRestocking(true);
    
    try {
      // Use the unified updateProduct function - it handles both online and offline scenarios
      await updateProduct(product.id, {
        currentStock: product.currentStock + quantity,
        costPrice: buyingPrice, // Update cost price with latest buying price
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

  // Fixed delete function to properly integrate with unified products
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

  const lowStockProducts = products.filter(p => p.currentStock <= (p.lowStockThreshold || 10));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Inventory Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Track and manage your product inventory
          </p>
        </div>

        <div className="flex items-center gap-3">
          {pendingOperations > 0 && (
            <Badge variant="outline">
              {pendingOperations} pending sync
            </Badge>
          )}
          {!isOnline && (
            <Badge variant="secondary">
              Working Offline
            </Badge>
          )}
          {lowStockProducts.length > 0 && (
            <Badge variant="destructive">
              {lowStockProducts.length} low stock
            </Badge>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {selectedProduct ? 'Edit Product' : 'Add New Product'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="costPrice">Cost Price *</Label>
                    <Input
                      id="costPrice"
                      type="number"
                      step="0.01"
                      value={formData.costPrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, costPrice: Number(e.target.value) }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="sellingPrice">Selling Price *</Label>
                    <Input
                      id="sellingPrice"
                      type="number"
                      step="0.01"
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, sellingPrice: Number(e.target.value) }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currentStock">Current Stock *</Label>
                    <Input
                      id="currentStock"
                      type="number"
                      value={formData.currentStock}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentStock: Number(e.target.value) }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lowStockThreshold">Low Stock Alert</Label>
                    <Input
                      id="lowStockThreshold"
                      type="number"
                      value={formData.lowStockThreshold}
                      onChange={(e) => setFormData(prev => ({ ...prev, lowStockThreshold: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {selectedProduct ? 'Update' : 'Create'} Product
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Loading inventory...</p>
          </div>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No products in inventory
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Start by adding your first product to track inventory
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg truncate">{product.name}</CardTitle>
                    {product.currentStock <= (product.lowStockThreshold || 10) && (
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                    )}
                  </div>
                  <Badge variant="outline" className="w-fit">
                    {product.category}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="block font-medium text-slate-600 dark:text-slate-400">Cost Price</span>
                      <span className="text-lg font-semibold">KSh {product.costPrice.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="block font-medium text-slate-600 dark:text-slate-400">Selling Price</span>
                      <span className="text-lg font-semibold">KSh {product.sellingPrice.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Stock Level</span>
                      <span className={`text-lg font-bold ${
                        product.currentStock <= (product.lowStockThreshold || 10) 
                          ? 'text-orange-600' 
                          : 'text-green-600'
                      }`}>
                        {product.currentStock}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      <span className="block">Profit per item: KSh {(product.sellingPrice - product.costPrice).toLocaleString()}</span>
                      <span className="block">Low stock alert: {product.lowStockThreshold || 10}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEdit(product)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="default"
                      size="sm" 
                      onClick={() => openRestockModal(product)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Package className="w-3 h-3 mr-1" />
                      Stock
                    </Button>
                    <Button 
                      variant="destructive"
                      size="sm" 
                      onClick={() => openDeleteModal(product)}
                    >
                      <Trash2 className="w-3 h-3" />
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
  );
};

export default InventoryPage;
