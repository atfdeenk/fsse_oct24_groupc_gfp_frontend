"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { roleBasedCartService as cartService } from '@/services/roleBasedServices';
import { CartItemWithDetails } from '@/types/cart';
import { isAuthenticated, getCurrentUser } from '@/lib/auth';
import { fetchCartWithDetails } from '@/services/cartLogic';
import { REFRESH_EVENTS, onRefresh, RefreshEventDetail } from '@/lib/dataRefresh';
import { showSuccess, showError } from '@/utils/toast';

// Flag to prevent duplicate toasts
let isRefreshingFromApi = false;

export function useCart() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItemWithDetails[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string | number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isCustomer, setIsCustomer] = useState(true); // Default to true for non-logged in users


  // Keep track of initial load to know when to auto-select all items
  const isInitialLoadRef = useRef(true);
  
  const fetchCart = useCallback(async (options = { preserveSelections: true }) => {
    setLoading(true);
    try {
      if (!isAuthenticated()) {
        // Don't redirect, just set empty cart
        setCartItems([]);
        setSelectedItems(new Set());
        return;
      }
      
      // Get current selections before any state updates
      const currentSelections = new Set(Array.from(selectedItems));
      
      const cartResponse = await cartService.getCart();
      const itemsWithDetails = await fetchCartWithDetails();
      
      // Update cart items and store in localStorage for voucher calculations
      setCartItems(itemsWithDetails);
      localStorage.setItem('cartItems', JSON.stringify(itemsWithDetails));
      
      // Selection logic based on options and initial load state
      if (!options.preserveSelections || isInitialLoadRef.current) {
        // Auto-select all items on initial load or when not preserving selections
        isInitialLoadRef.current = false;
        setSelectedItems(new Set(itemsWithDetails.map(item => item.id)));
      } else {
        // Keep only the selections that still exist in the cart
        const validSelections = new Set(
          Array.from(currentSelections).filter(id => 
            itemsWithDetails.some(item => 
              item.id === id || 
              String(item.id) === String(id) || 
              Number(item.id) === Number(id)
            )
          )
        );
        
        // If we have no valid selections but have items, select them all
        if (validSelections.size === 0 && itemsWithDetails.length > 0) {
          setSelectedItems(new Set(itemsWithDetails.map(item => item.id)));
        } else {
          setSelectedItems(validSelections);
        }
      }
    } catch (err) {
      setError('Failed to fetch cart');
      setCartItems([]);
      setSelectedItems(new Set());
    } finally {
      setLoading(false);
    }
  }, [router]); // Removed selectedItems dependency to prevent infinite loops
  
  // Function to handle refresh events from the API
  const handleApiRefresh = useCallback((detail: RefreshEventDetail = {}) => {
    console.log('Cart refresh event detected in useCart hook, refreshing cart data', detail);
    
    // Set the refreshing flag based on the showToast flag in the event detail
    // If showToast is false or not specified, we're refreshing from API and should suppress toasts
    isRefreshingFromApi = detail.showToast === true ? false : true;
    
    // Check if we should preserve selections
    const preserveSelections = detail.preserveSelections !== false;
    
    // If we're not preserving selections, clear them before fetching
    // This is handled separately from fetchCart to avoid dependency cycles
    if (!preserveSelections) {
      setSelectedItems(new Set());
      // Force a new initial load to select all items again if needed
      isInitialLoadRef.current = true;
    }
    
    fetchCart().finally(() => {
      // Reset the flag after a short delay to ensure toasts don't overlap
      setTimeout(() => {
        isRefreshingFromApi = false;
      }, 300);
    });
  }, [fetchCart]); // Removed selectedItems dependency to prevent infinite loops

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedSelections = localStorage.getItem('cartSelectedItems');
        if (savedSelections) {
          const parsedSelections = JSON.parse(savedSelections);
          if (Array.isArray(parsedSelections) && parsedSelections.length > 0) {
            setSelectedItems(new Set(parsedSelections));
          }
        }
      } catch (error) {
        console.error('Error loading cart selections from localStorage:', error);
      }
    }
  }, []);

  // Check user role on mount
  useEffect(() => {
    const checkUserRole = async () => {
      if (isAuthenticated()) {
        try {
          const user = await getCurrentUser();
          setUserRole(user?.role || null);
          // Only customers should fetch cart data
          setIsCustomer(user?.role === 'customer');
        } catch (error) {
          console.error('Error fetching user role:', error);
          setIsCustomer(true); // Default to showing cart functionality if role check fails
        }
      } else {
        setUserRole(null);
        setIsCustomer(true); // Non-logged in users should see cart functionality
      }
    };
    
    checkUserRole();
  }, []);

  useEffect(() => {
    // Only fetch cart data if user is a customer
    if (isCustomer) {
      fetchCart();
      
      // Set up event listener for cart refresh events using the utility
      const cleanup = onRefresh(REFRESH_EVENTS.CART, handleApiRefresh);
      return cleanup;
    }
    return () => {}; // Empty cleanup function if not a customer
  }, [fetchCart, handleApiRefresh, isCustomer]);

  // Add to cart with count check
  // Helper: deep compare cart items (product_id and quantity)
  function areCartItemsIdentical(before: any[], after: any[]): boolean {
    if (before.length !== after.length) return false;
    const sortById = (arr: any[]) => [...arr].sort((a, b) => a.product_id - b.product_id);
    const sortedBefore = sortById(before);
    const sortedAfter = sortById(after);
    return sortedBefore.every((item, idx) =>
      item.product_id === sortedAfter[idx].product_id &&
      item.quantity === sortedAfter[idx].quantity
    );
  }

  // Using centralized toast system from @/utils/toast

  const addToCartWithCountCheck = useCallback(async (itemData: { product_id: number | string; quantity: number }) => {
    setLoading(true);
    try {
      // Check if user is authenticated before proceeding
      if (!isAuthenticated()) {
        // Don't redirect, just return with an error
        setError('User not authenticated');
        return { success: false, error: 'User not authenticated' };
      }
      // Get before-cart info
      const beforeCart = await cartService.getCart();
      const beforeItems = Array.isArray(beforeCart.data?.items) ? beforeCart.data.items : [];

      // Add to cart
      const response = await cartService.addToCart(itemData);

      // Get product name for toast
      let productName = '';
      let productDetails = null;
      try {
        productDetails = await (await import('@/services/api/products')).default.getProduct(itemData.product_id);
        productName = productDetails?.name || '';
      } catch (e) {
        productName = '';
      }
      // Get after-cart info
      const afterCart = await cartService.getCart();
      const afterItems = Array.isArray(afterCart.data?.items) ? afterCart.data.items : [];

      if (!areCartItemsIdentical(beforeItems, afterItems)) {
        // Toast notifications are now handled by the cart service
        
        // Update cart items locally instead of fetching again
        // Find the newly added item or the updated item
        const newItem = afterItems.find((item: any) => 
          !beforeItems.some((beforeItem: any) => beforeItem.id === item.id)
        );
        
        if (newItem && productDetails) {
          // If it's a new item and we have product details, add it to the local state
          setCartItems(prevItems => [
            ...prevItems,
            {
              ...newItem,
              name: productDetails.name,
              price: productDetails.price,
              image_url: productDetails.image_url,
              currency: productDetails.currency,
              vendor_id: productDetails.vendor_id,
              product: productDetails
            }
          ]);
          
          // Add to selected items
          setSelectedItems(prev => {
            const newSet = new Set(prev);
            newSet.add(newItem.id);
            return newSet;
          });
        } else {
          // If we couldn't find the new item or don't have product details, fall back to fetching
          fetchCart();
        }
      } else {
        // Error toast is now handled by the cart service
        setError(response.error || `Failed to add${productName ? ` ${productName}` : ''} to cart (cart unchanged)`);
      }
    } catch (err: any) {
      // Error toast is now handled by the cart service
      setError(err?.message || 'Failed to add to cart');
    } finally {
      setLoading(false);
    }
  }, [fetchCart]);

  const updateQuantity = useCallback(async (id: number | string, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      // Optimistic UI update - update the UI immediately before API call completes
      let updatedItem = cartItems.find(item => item.id === id);
      let productName = updatedItem?.name || '';
      
      // Update the cart items state immediately
      setCartItems(prevItems => {
        return prevItems.map(item =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        );
      });
      
      // Make the API call in the background
      const response = await cartService.updateCartItem(id, { quantity: newQuantity });
      
      // Toast notifications are now handled by the cart service
      // No need to show toasts here
      
      // If the API call failed, revert to the original state
      if (!response.success) {
        setError(`Error updating quantity for item ${id}`);
        // Error toast is now handled by the cart service
        fetchCart(); // Revert to server state
      }
    } catch (err) {
      setError(`Error updating quantity for item ${id}`);
      // Error toast is now handled by the cart service
      fetchCart(); // Revert to server state
    } finally {
      setLoading(false);
    }
  }, [cartItems, fetchCart]);

  const removeItem = useCallback(async (id: number | string) => {
    try {
      // Get item details before removing
      let itemToRemove = cartItems.find(item => item.id === id);
      let productName = itemToRemove?.name || '';
      let quantity = itemToRemove?.quantity || '';
      
      // Store the original items in case we need to revert
      const originalItems = [...cartItems];
      const originalSelected = new Set(selectedItems);
      
      // Optimistic UI update - update the UI immediately before API call completes
      setCartItems(prevItems => prevItems.filter(item => item.id !== id));
      setSelectedItems(prevSelected => {
        const newSelected = new Set(prevSelected);
        newSelected.delete(id);
        return newSelected;
      });
      
      // Make the API call in the background
      const response = await cartService.removeFromCart(id);
      
      // Toast notifications are now handled by the cart service
      // No need to show toasts here
      
      // If the API call failed, revert to the original state
      if (!response.success) {
        setError(`Error removing item ${id} from cart`);
        // Error toast is now handled by the cart service
        setCartItems(originalItems);
        setSelectedItems(originalSelected);
      }
    } catch (err) {
      setError(`Error removing item ${id} from cart`);
      // Error toast is now handled by the cart service
      fetchCart(); // Revert to server state
    } finally {
      setLoading(false);
    }
  }, [cartItems, selectedItems]);

  // Selection logic
  const toggleSelectItem = useCallback((id: string | number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      
      // Check if the item is already selected (accounting for string/number conversion)
      const isSelected = Array.from(prev).some(itemId => 
        itemId === id || String(itemId) === String(id) || Number(itemId) === Number(id)
      );
      
      if (isSelected) {
        // Remove all variations of the ID (string and number)
        newSet.delete(id);
        newSet.delete(String(id));
        newSet.delete(Number(id));
      } else {
        // Always store as the original type to maintain consistency
        newSet.add(id);
      }
      
      // Store the updated selection in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('cartSelectedItems', JSON.stringify(Array.from(newSet)));
      }
      
      return newSet;
    });
  }, []);

  const selectAllItems = useCallback(() => {
    const allIds = cartItems.map(item => item.id);
    setSelectedItems(new Set(allIds));
    
    // Store the updated selection in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('cartSelectedItems', JSON.stringify(allIds));
    }
  }, [cartItems]);

  const clearAllSelections = useCallback(() => {
    setSelectedItems(new Set());
    
    // Clear the selection in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('cartSelectedItems', JSON.stringify([]));
    }
  }, []);

  // Clear the entire cart
  const clearCart = useCallback(async () => {
    setLoading(true);
    try {
      const response = await cartService.clearCart();
      if (response.success) {
        setCartItems([]);
        setSelectedItems(new Set());
        // Also clear cartSelectedItems in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('cartSelectedItems', JSON.stringify([]));
        }
        // Toast is handled by the cart service
      } else {
        setError('Failed to clear cart');
      }
    } catch (err) {
      setError('Failed to clear cart');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    cartItems,
    setCartItems,
    selectedItems,
    setSelectedItems,
    loading,
    error,
    fetchCart,
    addToCartWithCountCheck,
    updateQuantity,
    removeItem,
    toggleSelectItem,
    selectAllItems,
    clearAllSelections,
    clearCart,
  };
}
