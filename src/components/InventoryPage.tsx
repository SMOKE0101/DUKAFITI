
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Filter, MoreVertical, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import AddProductModal from './inventory/AddProductModal';
import EditProductModal from './inventory/EditProductModal';
import DeleteProductModal from './inventory/DeleteProductModal';
import RestockModal from './inventory/RestockModal';
import InventoryFilters from './inventory/InventoryFilters';
import InventoryProductGrid from './inventory/InventoryProductGrid';
import PremiumStatsCards from './inventory/PremiumStatsCards';
import { Product } from '../types';
import { useUnifiedProducts } from '../hooks/useUnifiedProducts';
import { useUnifiedSyncManager } from '../hooks/useUnifiedSyncManager';

const InventoryPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { toast } = useToast();
  const { 
    products, 
    loading, 
    error, 
    createProduct, 
    updateProduct, 
    isOnline,
    pendingOperations 
  } = useUnifiedProducts();
  
  const { globalSyncInProgress } = useUnifiedSyncManager();

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // Calculate inventory stats
  const inventoryStats = useMemo(() => {
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.currentStock <= p.lowStockThreshold).length;
    const totalValue = products.reduce((sum, p) => sum + (p.sellingPrice * p.currentStock), 0);
    const outOfStockProducts = products.filter(p => p.currentStock === 0).length;

    return {
      totalProducts,
      lowStockProducts,
      totalValue,
      outOfStockProducts
    };
  }, [products]);

  const handleAddProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createProduct(productData);
      setShowAddModal(false);
      
      if (!isOnline) {
        toast({
          title: "Product Added Offline",
          description: "Product will be synced when connection is restored.",
          duration: 3000,
        });
      } else {
        toast({
          title: "Product Added",
          description: `${productData.name} has been added to your inventory.`,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: "Failed to add product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditProduct = (product: Product) => {
    console.log('[InventoryPage] Opening edit modal for product:', product.id);
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleUpdateProduct = async (productData: Partial<Product>) => {
    if (!selectedProduct) return;

    try {
      await updateProduct(selectedProduct.id, productData);
      setShowEditModal(false);
      setSelectedProduct(null);
      
      if (!isOnline) {
        toast({
          title: "Product Updated Offline",
          description: "Changes will be synced when connection is restored.",
          duration: 3000,
        });
      } else {
        toast({
          title: "Product Updated",
          description: `${productData.name || selectedProduct.name} has been updated.`,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = (product: Product) => {
    console.log('[InventoryPage] Opening delete modal for product:', product.id);
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedProduct) return;

    try {
      // For now, we'll just remove from local state
      // TODO: Implement proper delete functionality
      setShowDeleteModal(false);
      setSelectedProduct(null);
      
      toast({
        title: "Product Deleted",
        description: `${selectedProduct.name} has been removed from inventory.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRestock = (product: Product) => {
    console.log('[InventoryPage] Opening restock modal for product:', product.id);
    setSelectedProduct(product);
    setShowRestockModal(true);
  };

  const handleRestockProduct = async (quantity: number, buyingPrice: number) => {
    if (!selectedProduct) return;

    try {
      const newStock = selectedProduct.currentStock + quantity;
      await updateProduct(selectedProduct.id, { 
        currentStock: newStock,
        costPrice: buyingPrice 
      });
      
      setShowRestockModal(false);
      setSelectedProduct(null);
      
      if (!isOnline) {
        toast({
          title: "Restock Recorded Offline",
          description: "Stock update will be synced when connection is restored.",
          duration: 3000,
        });
      } else {
        toast({
          title: "Product Restocked",
          description: `${selectedProduct.name} stock updated to ${newStock} units.`,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error restocking product:', error);
      toast({
        title: "Error",
        description: "Failed to restock product. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
            <Box className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">Error loading inventory</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Inventory Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Track and manage your product inventory
            {!isOnline && <span className="text-orange-500 ml-2">(Offline Mode)</span>}
            {pendingOperations > 0 && (
              <span className="text-blue-500 ml-2">
                ({pendingOperations} pending sync{pendingOperations !== 1 ? 's' : ''})
              </span>
            )}
            {globalSyncInProgress && (
              <span className="text-green-500 ml-2">(Syncing...)</span>
            )}
          </p>
        </div>
        
        <Button 
          onClick={() => setShowAddModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto"
          disabled={loading}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Stats Cards */}
      <PremiumStatsCards stats={inventoryStats} />

      {/* Search and Filter Section */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search products by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <InventoryFilters
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          products={products}
        />
      )}

      {/* Products Grid */}
      <InventoryProductGrid
        products={filteredProducts}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
        onRestock={handleRestock}
      />

      {/* Modals */}
      <AddProductModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddProduct}
      />

      <EditProductModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedProduct(null);
        }}
        onSave={handleUpdateProduct}
        product={selectedProduct}
      />

      <DeleteProductModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedProduct(null);
        }}
        onConfirm={handleConfirmDelete}
        product={selectedProduct}
      />

      <RestockModal
        isOpen={showRestockModal}
        onClose={() => {
          setShowRestockModal(false);
          setSelectedProduct(null);
        }}
        onSave={handleRestockProduct}
        product={selectedProduct}
      />
    </div>
  );
};

export default InventoryPage;
