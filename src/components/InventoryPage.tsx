
import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Plus, 
  Search, 
  X, 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  Calendar,
  Edit,
  Trash2,
  RotateCcw,
  Image as ImageIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '../utils/currency';
import { useSupabaseProducts } from '../hooks/useSupabaseProducts';
import { Product } from '../types';

interface InventoryStats {
  totalSKUs: number;
  inStockPercentage: number;
  lowStockCount: number;
  lastRestockDate: string;
}

const InventoryPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { toast } = useToast();
  const { products, loading, createProduct, updateProduct, deleteProduct } = useSupabaseProducts();

  const [addInventoryForm, setAddInventoryForm] = useState({
    productId: '',
    quantity: '',
    buyingPrice: '',
    supplier: ''
  });

  // Calculate statistics
  const stats: InventoryStats = useMemo(() => {
    const totalSKUs = products.length;
    const inStock = products.filter(p => p.currentStock > p.lowStockThreshold).length;
    const lowStock = products.filter(p => p.currentStock <= p.lowStockThreshold && p.currentStock > 0).length;
    
    return {
      totalSKUs,
      inStockPercentage: totalSKUs > 0 ? Math.round((inStock / totalSKUs) * 100) : 0,
      lowStockCount: lowStock,
      lastRestockDate: 'Today' // This would come from actual data
    };
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (filterStatus === 'low-stock') {
      filtered = filtered.filter(p => p.currentStock <= p.lowStockThreshold && p.currentStock > 0);
    } else if (filterStatus === 'out-of-stock') {
      filtered = filtered.filter(p => p.currentStock === 0);
    }

    return filtered;
  }, [products, searchQuery, filterStatus]);

  const getStockStatus = (product: Product) => {
    if (product.currentStock === 0) return 'out';
    if (product.currentStock <= product.lowStockThreshold) return 'low';
    return 'good';
  };

  const getStockBadgeColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-100 text-green-800';
      case 'low': return 'bg-amber-100 text-amber-800';
      case 'out': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddInventory = async () => {
    try {
      const product = products.find(p => p.id === addInventoryForm.productId);
      if (!product) return;

      await updateProduct(product.id, {
        currentStock: product.currentStock + parseInt(addInventoryForm.quantity),
        costPrice: parseFloat(addInventoryForm.buyingPrice)
      });

      toast({
        title: "Inventory Added",
        description: `Restocked ${addInventoryForm.quantity}× ${product.name}`,
      });

      setShowAddModal(false);
      setAddInventoryForm({ productId: '', quantity: '', buyingPrice: '', supplier: '' });
    } catch (error) {
      console.error('Failed to add inventory:', error);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (window.confirm(`Delete ${product.name}? This action cannot be undone.`)) {
      try {
        await deleteProduct(product.id);
        toast({
          title: "Product Deleted",
          description: `${product.name} has been removed from inventory`,
        });
      } catch (error) {
        console.error('Failed to delete product:', error);
      }
    }
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
                className="px-6 py-2 bg-brand-green-dark text-white rounded-xl shadow-lg hover:bg-brand-green transition-all duration-200 flex items-center gap-2"
              >
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                  <Plus className="w-3 h-3" />
                </div>
                Add Inventory
              </Button>
            </TooltipTrigger>
            <TooltipContent>Record new stock arrival</TooltipContent>
          </Tooltip>
        </div>

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

        {/* Statistics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.totalSKUs}</div>
                <div className="text-sm text-muted-foreground">Total SKUs</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold text-foreground">{stats.inStockPercentage}%</div>
                <div className="text-sm text-muted-foreground">In Stock</div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${stats.inStockPercentage}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.lowStockCount}</div>
                <div className="text-sm text-muted-foreground">Low Stock</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.lastRestockDate}</div>
                <div className="text-sm text-muted-foreground">Last Restock</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-square bg-muted animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-muted animate-pulse rounded" />
                    <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
                    <div className="flex justify-between items-center">
                      <div className="h-6 bg-muted animate-pulse rounded w-16" />
                      <div className="flex gap-2">
                        <div className="h-8 bg-muted animate-pulse rounded w-8" />
                        <div className="h-8 bg-muted animate-pulse rounded w-8" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product);
              return (
                <Card 
                  key={product.id} 
                  className="rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-brand-purple/10 transition-all duration-200 group"
                >
                  <CardContent className="p-0">
                    {/* Product Image */}
                    <div className="aspect-square bg-muted flex items-center justify-center rounded-lg">
                      <ImageIcon className="w-12 h-12 text-muted-foreground" />
                    </div>
                    
                    <div className="p-4 space-y-3">
                      {/* Product Info */}
                      <div>
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                        <Badge className="text-sm bg-accent/10 text-accent mt-1">
                          {formatCurrency(product.sellingPrice)}
                        </Badge>
                      </div>

                      {/* Stock and Actions */}
                      <div className="flex items-center justify-between">
                        <Badge className={`text-xs ${getStockBadgeColor(stockStatus)}`}>
                          {product.currentStock} units
                        </Badge>
                        
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-primary/10"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit product</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteProduct(product)}
                                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete product</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedProduct(product);
                          setAddInventoryForm(prev => ({ ...prev, productId: product.id }));
                          setShowAddModal(true);
                        }}
                        className="w-full border-accent text-accent hover:bg-accent/10"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Restock
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Add Inventory Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="sm:max-w-md rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Add Inventory</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="product">Product</Label>
                <Select 
                  value={addInventoryForm.productId} 
                  onValueChange={(value) => setAddInventoryForm(prev => ({ ...prev, productId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity Received</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={addInventoryForm.quantity}
                  onChange={(e) => setAddInventoryForm(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="buyingPrice">Buying Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    KES
                  </span>
                  <Input
                    id="buyingPrice"
                    type="number"
                    step="0.01"
                    value={addInventoryForm.buyingPrice}
                    onChange={(e) => setAddInventoryForm(prev => ({ ...prev, buyingPrice: e.target.value }))}
                    className="pl-12"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="supplier">Supplier (Optional)</Label>
                <Input
                  id="supplier"
                  value={addInventoryForm.supplier}
                  onChange={(e) => setAddInventoryForm(prev => ({ ...prev, supplier: e.target.value }))}
                  placeholder="Supplier name"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddInventory}
                  disabled={!addInventoryForm.productId || !addInventoryForm.quantity || !addInventoryForm.buyingPrice}
                  className="flex-1 bg-brand-green hover:bg-brand-green-dark"
                >
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default InventoryPage;
