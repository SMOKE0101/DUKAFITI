
import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign,
  BarChart3,
  Filter
} from 'lucide-react';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { formatCurrency } from '../utils/currency';
import { Product } from '../types';
import AddProductModal from './inventory/AddProductModal';
import ProductCard from './inventory/ProductCard';
import EditProductModal from './inventory/EditProductModal';
import DeleteProductModal from './inventory/DeleteProductModal';
import RestockModal from './inventory/RestockModal';
import PremiumStatsCards from './inventory/PremiumStatsCards';
import ProductCardSkeleton from './inventory/ProductCardSkeleton';
import InventoryHeader from './inventory/InventoryHeader';
import InventoryFilters from './inventory/InventoryFilters';
import InventoryProductGrid from './inventory/InventoryProductGrid';

const InventoryPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { products, loading, createProduct, updateProduct, deleteProduct } = useSupabaseProducts();

  // Calculate statistics
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => sum + (p.currentStock * p.costPrice), 0);
    const lowStockCount = products.filter(p => p.currentStock <= (p.lowStockThreshold || 10)).length;
    const outOfStockCount = products.filter(p => p.currentStock === 0).length;
    
    return {
      totalProducts,
      totalValue,
      lowStockCount,
      outOfStockCount
    };
  }, [products]);

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(products.map(p => p.category)));
    return uniqueCategories.sort();
  }, [products]);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
      return matchesSearch && matchesCategory;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'stock-asc':
          return a.currentStock - b.currentStock;
        case 'stock-desc':
          return b.currentStock - a.currentStock;
        case 'price-asc':
          return a.sellingPrice - b.sellingPrice;
        case 'price-desc':
          return b.sellingPrice - a.sellingPrice;
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, searchQuery, sortBy, filterCategory]);

  const handleAddProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createProduct(productData);
      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to add product:', error);
    }
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleUpdateProduct = async (productData: Partial<Product>) => {
    if (!selectedProduct) return;
    
    try {
      await updateProduct(selectedProduct.id, productData);
      setShowEditModal(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Failed to update product:', error);
    }
  };

  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const confirmDeleteProduct = async () => {
    if (!selectedProduct) return;

    try {
      await deleteProduct(selectedProduct.id);
      setShowDeleteModal(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const handleRestockProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowRestockModal(true);
  };

  const handleRestock = async (quantity: number, costPrice?: number) => {
    if (!selectedProduct) return;
    
    try {
      const updatedProduct: Partial<Product> = {
        currentStock: selectedProduct.currentStock + quantity,
      };
      
      if (costPrice !== undefined) {
        updatedProduct.costPrice = costPrice;
      }
      
      await updateProduct(selectedProduct.id, updatedProduct);
      setShowRestockModal(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Failed to restock product:', error);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedProduct(null);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedProduct(null);
  };

  const handleCloseRestockModal = () => {
    setShowRestockModal(false);
    setSelectedProduct(null);
  };

  // Create a wrapper function that doesn't take parameters
  const handleSaveEditProduct = () => {
    // This will be handled by the modal internally
  };

  return (
    <div className="space-y-6 p-6">
      <InventoryHeader onAddProduct={() => setShowAddModal(true)} />
      
      <PremiumStatsCards 
        products={products}
        onCardClick={() => {}}
      />

      <InventoryFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterCategory={filterCategory}
        onCategoryChange={setFilterCategory}
        sortBy={sortBy}
        onSortChange={setSortBy}
        categories={categories}
      />

      <InventoryProductGrid
        products={filteredAndSortedProducts}
        loading={loading}
        searchQuery={searchQuery}
        filterCategory={filterCategory}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
        onRestock={handleRestockProduct}
        onAddProduct={() => setShowAddModal(true)}
      />

      {/* Modals */}
      <AddProductModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddProduct}
      />

      <EditProductModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        product={selectedProduct}
        onSave={handleUpdateProduct}
      />

      <DeleteProductModal
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        onConfirm={confirmDeleteProduct}
        productName={selectedProduct?.name || ''}
      />

      <RestockModal
        isOpen={showRestockModal}
        onClose={handleCloseRestockModal}
        onSave={handleRestock}
        product={selectedProduct}
      />
    </div>
  );
};

export default InventoryPage;
