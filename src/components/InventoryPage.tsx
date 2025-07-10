
import React, { useState, useMemo } from 'react';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { Product } from '../types';
import { useToast } from '../hooks/use-toast';
import InventoryHeader from './inventory/InventoryHeader';
import InventoryFilters from './inventory/InventoryFilters';
import PremiumStatsCards from './inventory/PremiumStatsCards';
import InventoryProductGrid from './inventory/InventoryProductGrid';
import ProductCardSkeleton from './inventory/ProductCardSkeleton';
import AddProductModal from './inventory/AddProductModal';
import EditProductModal from './inventory/EditProductModal';
import DeleteProductModal from './inventory/DeleteProductModal';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Package } from 'lucide-react';

const InventoryPage = () => {
  const { 
    products, 
    loading, 
    error,
    createProduct, 
    updateProduct, 
    deleteProduct, 
    addStock 
  } = useSupabaseProducts();
  
  const { toast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'price'>('name');

  console.log('InventoryPage: Render state:', { 
    productsCount: products.length, 
    loading, 
    error 
  });

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(products.map(p => p.category)));
    return ['all', ...uniqueCategories];
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'stock':
          if (a.currentStock === -1 && b.currentStock === -1) return 0;
          if (a.currentStock === -1) return 1;
          if (b.currentStock === -1) return -1;
          return b.currentStock - a.currentStock;
        case 'price':
          return b.sellingPrice - a.sellingPrice;
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, searchTerm, selectedCategory, sortBy]);

  const handleAddProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createProduct(productData);
      setShowAddModal(false);
      toast({
        title: "Success",
        description: "Product added successfully",
      });
    } catch (error) {
      console.error('Failed to add product:', error);
      toast({
        title: "Error",
        description: "Failed to add product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
  };

  const handleSaveEdit = () => {
    setEditingProduct(null);
  };

  const handleDeleteProduct = (product: Product) => {
    setDeletingProduct(product);
  };

  const handleConfirmDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      setDeletingProduct(null);
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRestock = async (product: Product, quantity: number, buyingPrice: number) => {
    try {
      await addStock(product.id, quantity, buyingPrice);
      toast({
        title: "Success",
        description: `${product.name} restocked successfully`,
      });
    } catch (error) {
      console.error('Failed to restock product:', error);
      toast({
        title: "Error",
        description: "Failed to restock product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStatsCardClick = (filter: string) => {
    switch (filter) {
      case 'low-stock':
        // Could implement filtering for low stock items
        break;
      case 'value':
        setSortBy('price');
        break;
      default:
        setSelectedCategory('all');
    }
  };

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center px-6">
          <h1 className="font-mono text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">
            INVENTORY
          </h1>
        </div>

        <div className="p-6 space-y-8 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Failed to Load Inventory
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-full font-mono text-sm font-bold uppercase tracking-wide hover:bg-blue-700 transition-colors"
            >
              RETRY
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center px-6">
          <h1 className="font-mono text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">
            INVENTORY
          </h1>
        </div>

        <div className="p-6 space-y-8 max-w-7xl mx-auto">
          <TooltipProvider>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-6 bg-transparent">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          </TooltipProvider>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        {/* Modern Top Bar */}
        <div className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center">
              <Package className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="font-mono text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">
              INVENTORY
            </h1>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2 bg-transparent border-2 border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full font-mono text-sm font-bold uppercase tracking-wide transition-all duration-200"
          >
            ADD PRODUCT
          </button>
        </div>

        <div className="p-6 space-y-8 max-w-7xl mx-auto">
          {/* Stats Cards */}
          <PremiumStatsCards 
            products={products} 
            onCardClick={handleStatsCardClick}
          />

          {/* Filters */}
          <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-6 bg-transparent">
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

          {/* Products Grid */}
          <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-6 bg-transparent">
            <h2 className="font-mono text-lg font-black uppercase tracking-wider text-gray-900 dark:text-white mb-6">
              PRODUCTS ({filteredProducts.length})
            </h2>
            {filteredProducts.length === 0 && !loading ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {products.length === 0 ? "No products found" : "No products match your search"}
                </p>
                {products.length === 0 && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-6 py-2 bg-green-600 text-white rounded-full font-mono text-sm font-bold uppercase tracking-wide hover:bg-green-700 transition-colors"
                  >
                    ADD YOUR FIRST PRODUCT
                  </button>
                )}
              </div>
            ) : (
              <InventoryProductGrid
                products={filteredProducts}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
                onRestock={handleRestock}
              />
            )}
          </div>
        </div>

        {/* Modals */}
        <AddProductModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddProduct}
        />

        <EditProductModal
          isOpen={!!editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={handleSaveEdit}
          product={editingProduct}
        />

        <DeleteProductModal
          isOpen={!!deletingProduct}
          onClose={() => setDeletingProduct(null)}
          product={deletingProduct!}
          onDelete={handleConfirmDelete}
        />
      </div>
    </TooltipProvider>
  );
};

export default InventoryPage;
