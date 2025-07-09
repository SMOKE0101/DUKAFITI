
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

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-display text-primary">Inventory</h1>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="px-6 py-2 bg-accent text-white rounded-xl shadow-lg hover:bg-accent/90 transition-all duration-200 flex items-center gap-2"
        >
          <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
            <Plus className="w-3 h-3" />
          </div>
          Add Product
        </Button>
      </div>

      {/* Premium Stats Cards */}
      <PremiumStatsCards 
        products={products}
        onCardClick={() => {}}
      />

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 py-4"
          />
        </div>
        
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Name A-Z</SelectItem>
            <SelectItem value="name-desc">Name Z-A</SelectItem>
            <SelectItem value="stock-asc">Stock Low-High</SelectItem>
            <SelectItem value="stock-desc">Stock High-Low</SelectItem>
            <SelectItem value="price-asc">Price Low-High</SelectItem>
            <SelectItem value="price-desc">Price High-Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredAndSortedProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
                onRestock={handleRestockProduct}
              />
            ))}
          </div>
        ) : (
          <Card className="rounded-2xl">
            <CardContent className="p-8 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No products found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || filterCategory !== 'all' ? 'Try adjusting your search or filters.' : 'Start by adding your first product.'}
              </p>
              {!searchQuery && filterCategory === 'all' && (
                <Button onClick={() => setShowAddModal(true)} className="bg-accent hover:bg-accent/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              )}
            </CardContent>
          </Card>
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
