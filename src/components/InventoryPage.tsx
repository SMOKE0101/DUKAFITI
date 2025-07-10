
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

  const handleRestockSave = async (quantity: number, buyingPrice: number) => {
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
    <div className="p-6 space-y-6">
      <InventoryHeader 
        totalProducts={totalProducts}
        totalValue={totalValue}
        lowStockCount={lowStockCount}
        onAddProduct={handleCreateProduct}
      />

      <PremiumStatsCards 
        products={products}
        onCardClick={handleCardClick}
      />

      {/* Filter indicator */}
      {activeFilter !== 'all' && (
        <div className="flex items-center gap-2 pb-2">
          <span className="text-sm text-muted-foreground">Filtered by:</span>
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
            {activeFilter === 'low-stock' ? 'Low Stock Items' : 
             activeFilter === 'in-stock' ? 'In Stock Items' : 'All Items'}
          </span>
          <button
            onClick={() => setActiveFilter('all')}
            className="text-sm text-primary hover:text-primary/80 underline"
          >
            Clear filter
          </button>
        </div>
      )}

      <InventoryFilters
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <InventoryProductGrid
        products={filteredProducts}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onRestock={handleRestock}
      />

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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">Delete Product</h2>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete "{productToDelete.name}"? This action cannot be undone.
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProductToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
