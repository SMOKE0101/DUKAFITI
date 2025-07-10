
import React, { useState, useEffect } from 'react';
import { useToast } from '../hooks/use-toast';
import { Product } from '../types';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InventoryHeader from './inventory/InventoryHeader';
import InventoryFilters from './inventory/InventoryFilters';
import InventoryProductGrid from './inventory/InventoryProductGrid';
import PremiumStatsCards from './inventory/PremiumStatsCards';
import AddProductModal from './inventory/AddProductModal';
import RestockModal from './inventory/RestockModal';

const InventoryPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'price'>('name');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockingProduct, setRestockingProduct] = useState<Product | null>(null);
  const [isRestocking, setIsRestocking] = useState(false);

  const { products, loading, createProduct, updateProduct, deleteProduct, refetch } = useSupabaseProducts();
  const { toast } = useToast();

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(products.map(product => product.category)))];

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = activeFilter === 'all' || 
        (activeFilter === 'low-stock' && product.currentStock !== -1 && product.currentStock <= product.lowStockThreshold) ||
        (activeFilter === 'in-stock' && (product.currentStock === -1 || product.currentStock > product.lowStockThreshold));
      return matchesCategory && matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'stock':
          // Handle unspecified stock (-1) by treating it as 0 for sorting
          const aStock = a.currentStock === -1 ? 0 : a.currentStock;
          const bStock = b.currentStock === -1 ? 0 : b.currentStock;
          return bStock - aStock;
        case 'price':
          return b.sellingPrice - a.sellingPrice;
        default:
          return 0;
      }
    });

  // Calculate stats (exclude unspecified stock from calculations)
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, product) => {
    // Only count products with specified stock
    if (product.currentStock === -1) return sum;
    return sum + (product.sellingPrice * product.currentStock);
  }, 0);
  const lowStockCount = products.filter(product => 
    product.currentStock !== -1 && product.currentStock <= product.lowStockThreshold
  ).length;

  const handleEdit = (product: Product) => {
    console.log('Edit button clicked for product:', product);
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const handleRestock = (product: Product) => {
    setRestockingProduct(product);
    setShowRestockModal(true);
  };

  const handleRestockSave = async (quantity: number, buyingPrice: number): Promise<void> => {
    if (!restockingProduct) return;

    setIsRestocking(true);
    try {
      const newStock = restockingProduct.currentStock === -1 ? quantity : restockingProduct.currentStock + quantity;
      
      await updateProduct(restockingProduct.id, {
        ...restockingProduct,
        currentStock: newStock,
        costPrice: buyingPrice, // Update cost price with latest buying price
      });

      toast({
        title: "Product Restocked",
        description: `${restockingProduct.name} has been restocked with ${quantity} units.`,
      });

      setShowRestockModal(false);
      setRestockingProduct(null);
      await refetch();
    } catch (error) {
      console.error('Error restocking product:', error);
      toast({
        title: "Error",
        description: "Failed to restock product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRestocking(false);
    }
  };

  const handleProductRestock = async (product: Product, quantity: number, buyingPrice: number): Promise<void> => {
    const newStock = product.currentStock === -1 ? quantity : product.currentStock + quantity;
    
    await updateProduct(product.id, {
      ...product,
      currentStock: newStock,
      costPrice: buyingPrice,
    });

    toast({
      title: "Product Restocked",
      description: `${product.name} has been restocked with ${quantity} units.`,
    });

    await refetch();
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    
    try {
      await deleteProduct(productToDelete.id);
      toast({
        title: "Product Deleted",
        description: `${productToDelete.name} has been removed from your inventory.`,
      });
      setShowDeleteModal(false);
      setProductToDelete(null);
      // Refetch data to update UI immediately
      await refetch();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  const handleCardClick = (filter: string) => {
    setActiveFilter(filter);
    if (filter === 'low-stock') {
      setSelectedCategory('all');
      setSearchTerm('');
    }
  };

  const handleSaveProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        toast({
          title: "Product Updated",
          description: `${productData.name} has been updated successfully.`,
        });
      } else {
        await createProduct(productData);
        toast({
          title: "Product Created",
          description: `${productData.name} has been added to your inventory.`,
        });
      }
      
      setShowModal(false);
      setEditingProduct(null);
      // Refetch data to update UI immediately
      await refetch();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: "Failed to save product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleCloseRestockModal = () => {
    setShowRestockModal(false);
    setRestockingProduct(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        {/* Enhanced Header with Gradient Background */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <InventoryHeader 
              totalProducts={totalProducts}
              totalValue={totalValue}
              lowStockCount={lowStockCount}
              onAddProduct={handleCreateProduct}
            />
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
        </div>

        {/* Premium Stats Cards with Enhanced Styling */}
        <div className="relative">
          <PremiumStatsCards 
            products={products}
            onCardClick={handleCardClick}
          />
        </div>

        {/* Filter indicator with Glass Morphism */}
        {activeFilter !== 'all' && (
          <div className="flex items-center gap-3 p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-xl border border-white/20 shadow-lg">
            <span className="text-sm font-medium text-muted-foreground">Active Filter:</span>
            <span className="px-4 py-2 bg-gradient-to-r from-primary/20 to-primary/10 text-primary rounded-full text-sm font-semibold border border-primary/20">
              {activeFilter === 'low-stock' ? 'Low Stock Items' : 
               activeFilter === 'in-stock' ? 'In Stock Items' : 'All Items'}
            </span>
            <button
              onClick={() => setActiveFilter('all')}
              className="px-3 py-1 text-sm text-primary hover:text-primary/80 hover:bg-primary/10 rounded-full transition-all duration-200 font-medium"
            >
              Clear filter
            </button>
          </div>
        )}

        {/* Enhanced Filters with Glass Effect */}
        <div className="p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl">
          <InventoryFilters
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        </div>

        {/* Product Grid with Enhanced Container */}
        <div className="p-6 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/10 shadow-lg">
          <InventoryProductGrid
            products={filteredProducts}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onRestock={handleProductRestock}
          />
        </div>

        {/* Enhanced Add/Edit Product Modal */}
        <AddProductModal
          isOpen={showModal}
          onClose={handleCloseModal}
          onSave={handleSaveProduct}
          editingProduct={editingProduct}
        />

        {/* Restock Modal */}
        <RestockModal
          isOpen={showRestockModal}
          onClose={handleCloseRestockModal}
          onSave={handleRestockSave}
          product={restockingProduct}
          isLoading={isRestocking}
        />

        {/* Enhanced Delete Confirmation Modal with Glass Effect */}
        {showDeleteModal && productToDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl border border-white/20">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">Delete Product</h2>
                <p className="text-muted-foreground">
                  Are you sure you want to delete <span className="font-semibold text-foreground">"{productToDelete.name}"</span>? This action cannot be undone.
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={handleDeleteConfirm}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Delete Product
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setProductToDelete(null);
                  }}
                  className="flex-1 bg-white/50 hover:bg-white/70 backdrop-blur-sm border-2 hover:shadow-lg transition-all duration-200"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryPage;
