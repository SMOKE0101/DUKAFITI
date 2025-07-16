import React, { useState, useEffect } from 'react';
import { useSupabaseProducts } from '../../hooks/useSupabaseProducts';
import { useOfflineCRUD } from '../../hooks/useOfflineCRUD';
import { Product } from '../../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Wifi,
  WifiOff,
  Package 
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { formatCurrency } from '../../utils/currency';
import InventoryModal from '../InventoryModal';

interface ProductFormData {
  name: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  lowStockThreshold: number;
}

interface ExtendedProduct extends Product {
  synced: boolean;
  offline?: boolean;
  pendingOperation?: 'create' | 'update' | 'delete';
}

const ProductCRUDManager: React.FC = () => {
  const { products: serverProducts, loading: serverLoading, createProduct, updateProduct, deleteProduct } = useSupabaseProducts();
  const { toast } = useToast();

  const {
    data: products,
    loading,
    creating,
    updating,
    deleting,
    create,
    update,
    remove,
    refresh,
    isOnline,
    getUnsyncedItems,
  } = useOfflineCRUD<ExtendedProduct>('product', serverProducts?.map(p => ({ ...p, synced: true })) || []);

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    category: '',
    costPrice: 0,
    sellingPrice: 0,
    currentStock: 0,
    lowStockThreshold: 10,
  });

  // Sync server data when it changes
  useEffect(() => {
    if (serverProducts) {
      refresh(serverProducts.map(p => ({ ...p, synced: true })));
    }
  }, [serverProducts, refresh]);

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      costPrice: 0,
      sellingPrice: 0,
      currentStock: 0,
      lowStockThreshold: 10,
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent CRUD operations when offline
    if (!isOnline) {
      toast({
        title: "Offline Mode",
        description: "Product management is disabled offline. Only Add Stock is allowed.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name.trim() || !formData.category.trim()) {
      toast({
        title: "Validation Error",
        description: "Name and category are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingProduct) {
        // Update existing product
        await update(editingProduct.id, {
          name: formData.name,
          category: formData.category,
          costPrice: formData.costPrice,
          sellingPrice: formData.sellingPrice,
          currentStock: formData.currentStock,
          lowStockThreshold: formData.lowStockThreshold,
          updatedAt: new Date().toISOString(),
        } as Partial<ExtendedProduct>);

        // If online, also update on server
        if (isOnline) {
          try {
            await updateProduct(editingProduct.id, formData);
          } catch (error) {
            console.warn('Server update failed, will retry on sync:', error);
          }
        }

        toast({
          title: "Product Updated",
          description: `${formData.name} has been updated.`,
        });
      } else {
        // Create new product
        const newProduct = await create({
          name: formData.name,
          category: formData.category,
          costPrice: formData.costPrice,
          sellingPrice: formData.sellingPrice,
          currentStock: formData.currentStock,
          lowStockThreshold: formData.lowStockThreshold,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Omit<ExtendedProduct, 'id'>);

        // If online, also create on server
        if (isOnline) {
          try {
            await createProduct(formData);
          } catch (error) {
            console.warn('Server create failed, will retry on sync:', error);
          }
        }

        toast({
          title: "Product Created",
          description: `${formData.name} has been created.`,
        });
      }

      resetForm();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleEdit = (product: Product) => {
    if (!isOnline) {
      toast({
        title: "Offline Mode",
        description: "Editing products is not available offline. Only Add Stock is allowed.",
        variant: "destructive",
      });
      return;
    }
    
    setFormData({
      name: product.name,
      category: product.category,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      currentStock: product.currentStock,
      lowStockThreshold: product.lowStockThreshold,
    });
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = async (product: Product) => {
    if (!isOnline) {
      toast({
        title: "Offline Mode",
        description: "Deleting products is not available offline. Only Add Stock is allowed.",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    try {
      await remove(product.id);

      // If online, also delete on server
      if (isOnline) {
        try {
          await deleteProduct(product.id);
        } catch (error) {
          console.warn('Server delete failed, will retry on sync:', error);
        }
      }

      toast({
        title: "Product Deleted",
        description: `${product.name} has been deleted.`,
      });
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleAddProduct = () => {
    if (!isOnline) {
      toast({
        title: "Offline Mode",
        description: "Adding products is not available offline. Only Add Stock is allowed.",
        variant: "destructive",
      });
      return;
    }
    setShowForm(true);
  };

  const handleAddStock = (productId: string, quantity: number, buyingPrice: number, supplier?: string) => {
    // Find the product and update its stock locally
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex !== -1) {
      const updatedProducts = [...products];
      updatedProducts[productIndex] = {
        ...updatedProducts[productIndex],
        currentStock: updatedProducts[productIndex].currentStock + quantity,
        synced: isOnline,
        offline: !isOnline,
        pendingOperation: !isOnline ? 'update' : undefined,
      };
      
      // Update local state immediately
      refresh(updatedProducts);
      
      toast({
        title: isOnline ? "Stock Added" : "Stock Added (Offline)",
        description: `Added ${quantity} units to ${updatedProducts[productIndex].name}. ${!isOnline ? 'Will sync when online.' : ''}`,
      });
    }
    
    setShowInventoryModal(false);
  };

  const unsyncedCount = getUnsyncedItems().length;

  if (serverLoading || loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">Products</h2>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-600" />
              ) : (
                <WifiOff className="w-4 h-4 text-orange-600" />
              )}
              <span className="text-sm text-muted-foreground">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            {unsyncedCount > 0 && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                <Clock className="w-3 h-3 mr-1" />
                {unsyncedCount} unsynced
              </Badge>
            )}
            {!isOnline && (
              <Badge variant="destructive" className="bg-red-100 text-red-800">
                <AlertCircle className="w-3 h-3 mr-1" />
                CRUD Disabled
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            {/* Add Stock Button - Always Available */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={() => setShowInventoryModal(true)} 
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Package className="w-4 h-4" />
                  Add Stock
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isOnline ? 'Add stock to existing products' : 'Add stock offline - will sync when online'}</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Add Product Button - Disabled Offline */}
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button 
                    onClick={handleAddProduct} 
                    className={`flex items-center gap-2 ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!isOnline}
                  >
                    <Plus className="w-4 h-4" />
                    Add Product
                  </Button>
                </span>
              </TooltipTrigger>
              {!isOnline && (
                <TooltipContent>
                  <p>You are offline: Product creation is disabled. Only Add Stock is allowed.</p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </div>

        {/* Offline Notice */}
        {!isOnline && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-orange-800">
                <WifiOff className="w-4 h-4" />
                <span className="font-medium">Offline Mode Active</span>
              </div>
              <p className="text-sm text-orange-700 mt-1">
                You can view existing products and add stock, but cannot create, edit, or delete products while offline.
              </p>
              <div className="flex items-center gap-2 mt-2 text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Add Stock function remains available</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form */}
        {showForm && isOnline && (
          <Card>
            <CardHeader>
              <CardTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter product name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="Enter category"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="costPrice">Cost Price</Label>
                    <Input
                      id="costPrice"
                      type="number"
                      step="0.01"
                      value={formData.costPrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, costPrice: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sellingPrice">Selling Price</Label>
                    <Input
                      id="sellingPrice"
                      type="number"
                      step="0.01"
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, sellingPrice: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currentStock">Current Stock</Label>
                    <Input
                      id="currentStock"
                      type="number"
                      value={formData.currentStock}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentStock: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                    <Input
                      id="lowStockThreshold"
                      type="number"
                      value={formData.lowStockThreshold}
                      onChange={(e) => setFormData(prev => ({ ...prev, lowStockThreshold: parseInt(e.target.value) || 10 }))}
                      placeholder="10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={creating || updating}>
                    <Save className="w-4 h-4 mr-2" />
                    {editingProduct ? 'Update' : 'Create'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Products List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card key={product.id} className={`relative ${!isOnline ? 'opacity-75' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold truncate">{product.name}</h3>
                  <div className="flex items-center gap-1">
                    {product.offline && (
                      <Badge variant="secondary" className="text-xs">
                        {product.pendingOperation === 'create' && <Plus className="w-3 h-3 mr-1" />}
                        {product.pendingOperation === 'update' && <Edit className="w-3 h-3 mr-1" />}
                        {product.pendingOperation === 'delete' && <Trash2 className="w-3 h-3 mr-1" />}
                        {product.pendingOperation || 'Offline'}
                      </Badge>
                    )}
                    {!product.synced && (
                      <Clock className="w-4 h-4 text-orange-500" />
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{product.category}</p>
                <div className="space-y-1 text-sm mb-4">
                  <div className="flex justify-between">
                    <span>Cost:</span>
                    <span>{formatCurrency(product.costPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price:</span>
                    <span className="font-medium">{formatCurrency(product.sellingPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stock:</span>
                    <span className={product.currentStock <= product.lowStockThreshold ? 'text-red-600' : ''}>
                      {product.currentStock}
                      {product.currentStock <= product.lowStockThreshold && (
                        <AlertCircle className="w-3 h-3 inline ml-1" />
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(product)}
                          disabled={!isOnline || updating || product.pendingOperation === 'delete'}
                          className={`w-full ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!isOnline && (
                      <TooltipContent>
                        <p>You are offline: Editing is disabled. Only Add Stock is allowed.</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex-1">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(product)}
                          disabled={!isOnline || deleting || product.pendingOperation === 'delete'}
                          className={`w-full ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!isOnline && (
                      <TooltipContent>
                        <p>You are offline: Deleting is disabled. Only Add Stock is allowed.</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {products.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No products found. Add your first product to get started.</p>
            </CardContent>
          </Card>
        )}

        {/* Inventory Modal - Always Available */}
        <InventoryModal
          isOpen={showInventoryModal}
          onClose={() => setShowInventoryModal(false)}
          products={products}
          onAddStock={handleAddStock}
        />
      </div>
    </TooltipProvider>
  );
};

export default ProductCRUDManager;
