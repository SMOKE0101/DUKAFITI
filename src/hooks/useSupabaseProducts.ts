
import { useProductQueries } from './products/useProductQueries';
import { useProductMutations } from './products/useProductMutations';

export const useSupabaseProducts = () => {
  const { products, loading, refetch } = useProductQueries();
  const { 
    createProduct, 
    updateProduct, 
    deleteProduct, 
    isCreating, 
    isUpdating, 
    isDeleting 
  } = useProductMutations();

  return {
    products,
    loading: loading || isCreating || isUpdating || isDeleting,
    createProduct,
    updateProduct,
    deleteProduct,
    refetch,
  };
};
