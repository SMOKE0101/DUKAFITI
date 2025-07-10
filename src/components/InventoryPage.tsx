
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
        {/* Blocky Header with Smooth Cards */}
        <div className="relative overflow-hidden bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="relative z-10">
            <h1 className="font-mono text-4xl font-black uppercase tracking-widest text-gray-900 dark:text-white mb-2">
              INVENTORY
            </h1>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Manage your products and stock levels</p>
            
            {/* Quick Stats in smooth pills */}
            <div className="flex items-center gap-6 mt-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-200 dark:border-blue-800">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{totalProducts} Products</span>
              </div>
              {lowStockCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-full border border-red-200 dark:border-red-800">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-red-700 dark:text-red-300">{lowStockCount} Low Stock</span>
                </div>
              )}
            </div>
          </div>
          
          <Button 
            onClick={handleCreateProduct}
            className="absolute top-8 right-8 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1"
          >
            Add New Product
          </Button>
        </div>

        {/* Summary Stats with Smooth Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">TOTAL SKUS</h3>
                <p className="text-3xl font-semibold text-gray-900 dark:text-white mt-2">{totalProducts}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">INVENTORY VALUE</h3>
                <p className="text-3xl font-semibold text-gray-900 dark:text-white mt-2">KES {totalValue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">LOW STOCK</h3>
                <p className="text-3xl font-semibold text-red-600 dark:text-red-400 mt-2">{lowStockCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">CATEGORIES</h3>
                <p className="text-3xl font-semibold text-gray-900 dark:text-white mt-2">{categories.length - 1}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filter indicator with smooth styling */}
        {activeFilter !== 'all' && (
          <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
            <span className="font-mono text-sm font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">ACTIVE FILTER:</span>
            <span className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full text-sm font-semibold shadow-md">
              {activeFilter === 'low-stock' ? 'Low Stock Items' : 
               activeFilter === 'in-stock' ? 'In Stock Items' : 'All Items'}
            </span>
            <button
              onClick={() => setActiveFilter('all')}
              className="px-3 py-1 text-sm text-purple-600 hover:text-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-full transition-all duration-200 font-medium"
            >
              Clear filter
            </button>
          </div>
        )}

        {/* Filters with smooth styling */}
        <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
          <h3 className="font-mono text-lg font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-4">FILTERS</h3>
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

        {/* Product Grid with smooth cards */}
        <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
          <h3 className="font-mono text-lg font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-6">PRODUCTS</h3>
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

        {/* Enhanced Delete Confirmation Modal */}
        {showDeleteModal && productToDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl border border-gray-200 dark:border-gray-700">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h2 className="font-mono text-xl font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-2">DELETE PRODUCT</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">"{productToDelete.name}"</span>? This action cannot be undone.
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={handleDeleteConfirm}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
                >
                  Delete Product
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setProductToDelete(null);
                  }}
                  className="flex-1 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl border-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
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
