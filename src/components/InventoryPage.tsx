
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Plus, 
  Search, 
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { Product } from '../types';
import AddProductModal from './inventory/AddProductModal';
import EditProductModal from './inventory/EditProductModal';
import DeleteProductModal from './inventory/DeleteProductModal';
import RestockModal from './inventory/RestockModal';
import ProductCard from './inventory/ProductCard';
import ProductCardSkeleton from './inventory/ProductCardSkeleton';
import PremiumStatsCards from './inventory/PremiumStatsCards';

const InventoryPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { toast } = useToast();
  const { products, loading, createProduct, updateProduct, deleteProduct } = useSupabaseProducts();

  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (filterStatus === 'low-stock') {
      filtered = filtered.filter(p => p.currentStock <= p.lowStockThreshold && p.currentStock > 0);
    } else if (filterStatus === 'out-of-stock') {
      filtered = filtered.filter(p => p.currentStock === 0);
    } else if (filterStatus === 'in-stock') {
      filtered = filtered.filter(p => p.currentStock > p.lowStockThreshold);
    }

    return filtered;
  }, [products, searchQuery, filterStatus]);

  const handleAddProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createProduct(productData);
      toast({
        title: "Product Added",
        description: `${productData.name} has been added to inventory`,
      });
    } catch (error) {
      console.error('Failed to add product:', error);
      throw error; // Re-throw to let modal handle the error
    }
  };

  const handleEditProduct = async (productData: Partial<Product>) => {
    if (!selectedProduct) return;
    
    try {
      await updateProduct(selectedProduct.id, productData);
      setSelectedProduct(null);
      toast({
        title: "Product Updated",
        description: `${selectedProduct.name} has been updated`,
      });
    } catch (error) {
      console.error('Failed to update product:', error);
      throw error; // Re-throw to let modal handle the error
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    
    try {
      await deleteProduct(selectedProduct.id);
      setShowDeleteModal(false);
      setSelectedProduct(null);
      toast({
        title: "Product Deleted",
        description: `${selectedProduct.name} has been removed from inventory`,
      });
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const handleRestock = async (quantity: number, buyingPrice: number) => {
    if (!selectedProduct) return;
    
    try {
      await updateProduct(selectedProduct.id, {
        currentStock: selectedProduct.currentStock + quantity,
        costPrice: buyingPrice
      });
      setShowRestockModal(false);
      setSelectedProduct(null);
      toast({
        title: "Inventory Restocked",
        description: `Added ${quantity} units to ${selectedProduct.name}`,
      });
    } catch (error) {
      console.error('Failed to restock product:', error);
    }
  };

  const handleStatsCardClick = (filter: string) => {
    setFilterStatus(filter === 'all' ? 'all' : filter === 'in-stock' ? 'all' : filter);
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const openDeleteModal = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const openRestockModal = (product: Product) => {
    setSelectedProduct(product);
    setShowRestockModal(true);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6 p-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-display text-primary">Inventory</h1>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={() => setShowAddModal(true)}
                className="px-5 py-2 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-500 transition-all duration-200 flex items-center gap-2"
              >
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                  <Plus className="w-3 h-3" />
                </div>
                Add Inventory
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add new product to inventory</TooltipContent>
          </Tooltip>
        </div>

        {/* Premium Statistics Cards */}
        <PremiumStatsCards 
          products={products} 
          onCardClick={handleStatsCardClick}
        />

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search products…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 py-4"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="low-stock">Low Stock</SelectItem>
              <SelectItem value="out-of-stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))
          ) : (
            filteredProducts.map((product) => (
              <ProductCard 
                key={product.id}
                product={product}
                onEdit={openEditModal}
                onDelete={openDeleteModal}
                onRestock={openRestockModal}
              />
            ))
          )}
        </div>

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
          onSave={handleEditProduct}
          product={selectedProduct}
        />

        <DeleteProductModal 
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedProduct(null);
          }}
          onConfirm={handleDeleteProduct}
          productName={selectedProduct?.name || ''}
        />

        <RestockModal 
          isOpen={showRestockModal}
          onClose={() => {
            setShowRestockModal(false);
            setSelectedProduct(null);
          }}
          onSave={handleRestock}
          product={selectedProduct}
        />
      </div>
    </TooltipProvider>
  );
};

export default InventoryPage;
