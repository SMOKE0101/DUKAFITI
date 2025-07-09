
import { useState, useEffect } from 'react';
import { Product } from '../types';

const FAVORITES_STORAGE_KEY = 'sales_favorite_products';
const MAX_FAVORITES = 6;

export const useFavoriteProducts = () => {
  const [favorites, setFavorites] = useState<Product[]>([]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const parsedFavorites = JSON.parse(stored);
        setFavorites(parsedFavorites);
      }
    } catch (error) {
      console.error('Failed to load favorite products:', error);
    }
  }, []);

  // Save favorites to localStorage whenever they change
  const saveFavorites = (newFavorites: Product[]) => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (error) {
      console.error('Failed to save favorite products:', error);
    }
  };

  // Add a product to favorites
  const addToFavorites = (product: Product) => {
    setFavorites(prevFavorites => {
      // Check if product is already in favorites
      if (prevFavorites.some(fav => fav.id === product.id)) {
        return prevFavorites;
      }

      let newFavorites = [...prevFavorites, product];
      
      // If we exceed max favorites, remove the oldest one (first item)
      if (newFavorites.length > MAX_FAVORITES) {
        newFavorites = newFavorites.slice(1);
      }

      saveFavorites(newFavorites);
      return newFavorites;
    });
  };

  // Remove a product from favorites
  const removeFromFavorites = (productId: string) => {
    const newFavorites = favorites.filter(fav => fav.id !== productId);
    saveFavorites(newFavorites);
  };

  return {
    favorites,
    addToFavorites,
    removeFromFavorites,
    maxFavorites: MAX_FAVORITES,
  };
};
