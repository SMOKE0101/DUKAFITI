import React, { useState } from 'react';
import ProductCard from './ProductCard';
import RestockModal from './RestockModal';
import { Product } from '../../types';
import { useSupabaseProducts } from '../../hooks/useSupabaseProducts';
import { useToast } from '../../hooks/use-toast';
import { formatCurrency } from '../../utils/currency';

interface InventoryProductGridProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

const InventoryProductGrid: React.FC<InventoryProductGridProps> = ({ products, onEdit, onDelete }) => {
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isRestocking, setIsRestocking] = useState(false);
  
  const { updateProduct } = useSupabaseProducts();
  const { toast } = useToast();

  const handleRestock = (product: Product) => {
    setSelectedProduct(product);
    setShowRestockModal(true);
  };

  const handleRestockSave = async (quantity: number, buyingPrice: number) => {
    if (!selectedProduct) return;

    setIsRestocking(true);
    
    try {
      const newStock = selectedProduct.currentStock + quantity;
      
      await updateProduct(selectedProduct.id, {
        ...selectedProduct,
        currentStock: newStock,
        costPrice: buyingPrice, // Update cost price with latest buying price
        updatedAt: new Date().toISOString()
      });

      toast({
        title: "Stock Added Successfully",
        description: `Restocked ${quantity} × ${selectedProduct.name} (${formatCurrency(buyingPrice)} each)`,
        duration: 4000,
      });

      setShowRestockModal(false);
      setSelectedProduct(null);
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

  const handleCloseRestockModal = () => {
    setShowRestockModal(false);
    setSelectedProduct(null);
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m13-8v2a1 1 0 01-1 1H7a1 1 0 01-1-1V5a1 1 0 011-1h10a1 1 0 011 1z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No products found</h3>
        <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onEdit={onEdit}
            onDelete={onDelete}
            onRestock={handleRestock}
          />
        ))}
      </div>

      <RestockModal
        isOpen={showRestockModal}
        onClose={handleCloseRestockModal}
        onSave={handleRestockSave}
        product={selectedProduct}
        isLoading={isRestocking}
      />
    </>
  );
};

export default InventoryProductGrid;
