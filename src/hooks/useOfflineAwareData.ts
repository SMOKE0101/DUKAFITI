
import { useState, useEffect } from 'react';
import { useSupabaseProducts } from './useSupabaseProducts';
import { useSupabaseCustomers } from './useSupabaseCustomers';
import { useSupabaseSales } from './useSupabaseSales';

export const useOfflineAwareData = () => {
  const { products, loading: productsLoading, error: productsError } = useSupabaseProducts();
  const { customers, loading: customersLoading, error: customersError } = useSupabaseCustomers();
  const { sales, loading: salesLoading, error: salesError } = useSupabaseSales();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const allLoading = productsLoading || customersLoading || salesLoading;
    setIsLoading(allLoading);
    
    const firstError = productsError || customersError || salesError;
    setError(firstError);
  }, [productsLoading, customersLoading, salesLoading, productsError, customersError, salesError]);

  return {
    products,
    customers,
    sales,
    loading: isLoading,
    error,
    refetch: () => {
      // Individual hooks handle their own refetching
      console.log('Refetching all data...');
    },
    isOnline: navigator.onLine
  };
};
