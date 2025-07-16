
import { useState, useCallback } from 'react';
import { useOfflineManager } from './useOfflineManager';
import { useToast } from './use-toast';
import { Sale, Product, Customer } from '../types';

interface CRUDState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
}

interface OfflineItem {
  id: string;
  synced: boolean;
  offline?: boolean;
  pendingOperation?: 'create' | 'update' | 'delete';
  lastPurchaseDate?: string;
  updatedAt?: string;
}

export const useOfflineCRUD = <T extends OfflineItem>(
  entityType: 'product' | 'customer' | 'sale',
  initialData: T[] = []
) => {
  const { addOfflineOperation, isOnline } = useOfflineManager();
  const { toast } = useToast();

  const [state, setState] = useState<CRUDState<T>>({
    data: initialData,
    loading: false,
    error: null,
    creating: false,
    updating: false,
    deleting: false,
  });

  // Create operation
  const create = useCallback(async (itemData: Omit<T, 'id'>) => {
    setState(prev => ({ ...prev, creating: true, error: null }));

    try {
      const newItem: T = {
        ...itemData,
        id: `offline_${entityType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        synced: false,
        offline: !isOnline,
        pendingOperation: !isOnline ? 'create' : undefined,
      } as T;

      // Add to local state immediately
      setState(prev => ({
        ...prev,
        data: [newItem, ...prev.data],
        creating: false,
      }));

      if (!isOnline) {
        // Queue for offline sync
        await addOfflineOperation(entityType, 'create', newItem, 'high');
        
        toast({
          title: "Created Offline",
          description: `${entityType} will sync when connection is restored.`,
          duration: 3000,
        });
      }

      return newItem;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        creating: false, 
        error: `Failed to create ${entityType}: ${error.message}` 
      }));
      
      toast({
        title: "Error",
        description: `Failed to create ${entityType}. Please try again.`,
        variant: "destructive",
      });
      
      throw error;
    }
  }, [entityType, isOnline, addOfflineOperation, toast]);

  // Update operation
  const update = useCallback(async (id: string, updates: Partial<T>) => {
    setState(prev => ({ ...prev, updating: true, error: null }));

    try {
      // Update local state immediately
      setState(prev => ({
        ...prev,
        data: prev.data.map(item => 
          item.id === id 
            ? { 
                ...item, 
                ...updates, 
                synced: false,
                offline: !isOnline,
                pendingOperation: !isOnline ? 'update' : undefined,
              }
            : item
        ),
        updating: false,
      }));

      if (!isOnline) {
        // Queue for offline sync
        await addOfflineOperation(entityType, 'update', { id, updates }, 'medium');
        
        toast({
          title: "Updated Offline",
          description: `Changes will sync when connection is restored.`,
          duration: 3000,
        });
      }

      return true;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        updating: false, 
        error: `Failed to update ${entityType}: ${error.message}` 
      }));
      
      toast({
        title: "Error",
        description: `Failed to update ${entityType}. Please try again.`,
        variant: "destructive",
      });
      
      throw error;
    }
  }, [entityType, isOnline, addOfflineOperation, toast]);

  // Delete operation
  const remove = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, deleting: true, error: null }));

    try {
      const itemToDelete = state.data.find(item => item.id === id);
      
      if (!itemToDelete) {
        throw new Error(`${entityType} not found`);
      }

      if (!isOnline) {
        // Mark as deleted locally but keep in state with pending operation
        setState(prev => ({
          ...prev,
          data: prev.data.map(item => 
            item.id === id 
              ? { 
                  ...item, 
                  synced: false,
                  offline: true,
                  pendingOperation: 'delete',
                }
              : item
          ),
          deleting: false,
        }));

        // Queue for offline sync
        await addOfflineOperation(entityType, 'delete', { id }, 'high');
        
        toast({
          title: "Deleted Offline",
          description: `Deletion will sync when connection is restored.`,
          duration: 3000,
        });
      } else {
        // Remove from local state immediately if online
        setState(prev => ({
          ...prev,
          data: prev.data.filter(item => item.id !== id),
          deleting: false,
        }));
      }

      return true;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        deleting: false, 
        error: `Failed to delete ${entityType}: ${error.message}` 
      }));
      
      toast({
        title: "Error",
        description: `Failed to delete ${entityType}. Please try again.`,
        variant: "destructive",
      });
      
      throw error;
    }
  }, [entityType, isOnline, addOfflineOperation, toast, state.data]);

  // Refresh data (typically from server)
  const refresh = useCallback((newData: T[]) => {
    setState(prev => ({
      ...prev,
      data: newData,
      loading: false,
      error: null,
    }));
  }, []);

  // Set loading state
  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Get unsynced items
  const getUnsyncedItems = useCallback(() => {
    return state.data.filter(item => !item.synced || item.offline);
  }, [state.data]);

  // Mark items as synced
  const markAsSynced = useCallback((ids: string[]) => {
    setState(prev => ({
      ...prev,
      data: prev.data.map(item => 
        ids.includes(item.id)
          ? { ...item, synced: true, offline: false, pendingOperation: undefined }
          : item
      ),
    }));
  }, []);

  return {
    ...state,
    create,
    update,
    remove,
    refresh,
    setLoading,
    clearError,
    getUnsyncedItems,
    markAsSynced,
    isOnline,
  };
};
