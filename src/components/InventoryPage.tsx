
import React, { useState } from 'react';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Plus, 
  Filter,
  SortAsc,
  SortDesc,
  Package,
  TrendingUp,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  ShoppingCart
} from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import AddProductModal from './inventory/AddProductModal';
import EditProductModal from './inventory/EditProductModal';
import DeleteProductModal from './inventory/DeleteProductModal';
import InventoryModal from './InventoryModal';
import { Product } from '../types';

const InventoryPage = () => {
  const { products, loading, createProduct, updateProduct, deleteProduct, addStock } = useSupabaseProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterBy, setFilterBy] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Filter and sort products
  const filteredAndSortedProducts = React.useMemo(() => {
    let filtered = products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply filter
    if (filterBy === 'low-stock') {
      filtered = filtered.filter(product => product.currentStock <= (product.lowStockThreshold || 10));
    } else if (filterBy === 'out-of-stock') {
      filtered = filtered.filter(product => product.currentStock === 0);
    } else if (filterBy !== 'all') {
      filtered = filtered.filter(product => product.category === filterBy);
    }

    // Apply sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'stock':
          aValue = a.currentStock;
          bValue = b.currentStock;
          break;
        case 'price':
          aValue = a.sellingPrice;
          bValue = b.sellingPrice;
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [products, searchTerm, sortBy, sortOrder, filterBy]);

  // Calculate summary stats
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.currentStock <= (p.lowStockThreshold || 10)).length;
  const totalValue = products.reduce((sum, p) => sum + (p.sellingPrice * p.currentStock), 0);
  const outOfStockProducts = products.filter(p => p.currentStock === 0).length;

  // Get unique categories and sort them alphabetically
  const categories = Array.from(new Set(products.map(p => p.category))).sort();

  const handleAddStock = async (productId: string, quantity: number, buyingPrice: number, supplier?: string) => {
    try {
      await addStock(productId, quantity, buyingPrice, supplier);
      setIsInventoryModalOpen(false);
    } catch (error) {
      console.error('Failed to add stock:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page Title - Consistent with other pages */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-mono font-black uppercase tracking-widest text-gray-900 dark:text-white">
              INVENTORY
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 font-normal">
              Manage your products and track stock levels
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={() => setIsInventoryModalOpen(true)}
              className="bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 border-2 border-green-200 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 shadow-sm hover:shadow-md transition-all duration-200 font-semibold"
            >
              <Plus className="w-4 h-4 mr-2 stroke-2" />
              ADD INVENTORY
            </Button>
            
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              variant="outline"
              className="bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 border-2 border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 shadow-sm hover:shadow-md transition-all duration-200 font-semibold"
            >
              <Plus className="w-4 h-4 mr-2 stroke-2" />
              ADD PRODUCT
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-blue-200 dark:border-blue-700 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono font-bold uppercase tracking-tight text-blue-600 dark:text-blue-400">
                    TOTAL PRODUCTS
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {totalProducts}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl">
                  <Package className="w-8 h-8 text-blue-600 dark:text-blue-400 stroke-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-orange-200 dark:border-orange-700 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono font-bold uppercase tracking-tight text-orange-600 dark:text-orange-400">
                    LOW STOCK ITEMS
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {lowStockProducts}
                  </p>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-700 rounded-xl">
                  <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400 stroke-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-green-200 dark:border-green-700 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono font-bold uppercase tracking-tight text-green-600 dark:text-green-400">
                    TOTAL VALUE
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatCurrency(totalValue)}
                  </p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400 stroke-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-red-200 dark:border-red-700 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono font-bold uppercase tracking-tight text-red-600 dark:text-red-400">
                    OUT OF STOCK
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {outOfStockProducts}
                  </p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700 rounded-xl">
                  <Package className="w-8 h-8 text-red-600 dark:text-red-400 stroke-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 stroke-2" />
                <Input
                  placeholder="Search products by name or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600"
                />
              </div>

              {/* Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500 stroke-2" />
                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger className="w-40 bg-white/50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="low-stock">Low Stock</SelectItem>
                    <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40 bg-white/50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="stock">Stock Level</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="bg-white/50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600"
                >
                  {sortOrder === 'asc' ? <SortAsc className="w-4 h-4 stroke-2" /> : <SortDesc className="w-4 h-4 stroke-2" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-mono font-bold uppercase tracking-tight">
            SHOWING {filteredAndSortedProducts.length} OF {totalProducts} PRODUCTS
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedProducts.map((product) => (
            <Card key={product.id} className="bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">{product.name}</CardTitle>
                    <Badge className="mt-1 text-xs font-mono font-bold uppercase border bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-700">
                      {product.category}
                    </Badge>
                  </div>
                  <Badge className={`text-xs font-mono font-bold uppercase border ${
                    product.currentStock === 0 
                      ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700' 
                      : product.currentStock <= (product.lowStockThreshold || 10)
                      ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-700'
                      : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700'
                  }`}>
                    STOCK: {product.currentStock}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Selling Price:</span>
                    <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(product.sellingPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Cost Price:</span>
                    <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(product.costPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Value:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(product.sellingPrice * product.currentStock)}</span>
                  </div>
                </div>

                <div className="pt-2 grid grid-cols-3 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-white/50 dark:bg-gray-700/50 border-2 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-semibold"
                    onClick={() => {/* View functionality */}}
                  >
                    <Eye className="w-4 h-4 stroke-2" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-white/50 dark:bg-gray-700/50 border-2 border-yellow-200 dark:border-yellow-700 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 font-semibold"
                    onClick={() => setEditingProduct(product)}
                  >
                    <Edit className="w-4 h-4 stroke-2" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-white/50 dark:bg-gray-700/50 border-2 border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-semibold"
                    onClick={() => setDeletingProduct(product)}
                  >
                    <Trash2 className="w-4 h-4 stroke-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredAndSortedProducts.length === 0 && (
          <Card className="bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-400 stroke-2" />
              </div>
              <h3 className="text-lg font-mono font-bold uppercase tracking-tight text-gray-600 dark:text-gray-400 mb-2">
                {searchTerm || filterBy !== 'all' ? 'NO PRODUCTS FOUND' : 'NO PRODUCTS YET'}
              </h3>
              <p className="text-gray-500 dark:text-gray-500 mb-6 font-medium">
                {searchTerm || filterBy !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Add your first product to get started'
                }
              </p>
              {!searchTerm && filterBy === 'all' && (
                <Button 
                  onClick={() => setIsAddModalOpen(true)}
                  variant="outline"
                  className="bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 border-2 border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 font-semibold"
                >
                  <Plus className="w-4 h-4 mr-2 stroke-2" />
                  ADD PRODUCT
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Modals */}
        <AddProductModal 
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={createProduct}
        />
        
        <InventoryModal
          isOpen={isInventoryModalOpen}
          onClose={() => setIsInventoryModalOpen(false)}
          products={products}
          onAddStock={handleAddStock}
        />
        
        {editingProduct && (
          <EditProductModal
            isOpen={!!editingProduct}
            onClose={() => setEditingProduct(null)}
            product={editingProduct}
            onSave={(id, data) => updateProduct(id, data)}
          />
        )}
        
        {deletingProduct && (
          <DeleteProductModal
            isOpen={!!deletingProduct}
            onClose={() => setDeletingProduct(null)}
            productId={deletingProduct.id}
            onDelete={deleteProduct}
          />
        )}
      </div>
    </div>
  );
};

export default InventoryPage;
