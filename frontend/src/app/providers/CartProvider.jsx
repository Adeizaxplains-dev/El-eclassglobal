import React, { useCallback, useEffect, useState } from 'react';
import { CartContext } from '../../context/CartContext.js';
import * as cartService from '../../services/cartService.js';
import { getAttribution } from '../../utils/attribution.js';

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(true);

  const refreshCart = useCallback(async () => {
    try {
      const data = await cartService.getCart();
      setCart(data);
    } catch {
      setCart({ items: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addItem = useCallback(async ({ productId, variantId, quantity = 1 }) => {
    const attribution = getAttribution();
    const data = await cartService.addCartItem({ productId, variantId, quantity }, attribution);
    setCart(data);
    return data;
  }, []);

  const updateItem = useCallback(async (itemId, quantity) => {
    const data = await cartService.updateCartItem(itemId, quantity);
    setCart(data);
    return data;
  }, []);

  const removeItem = useCallback(async (itemId) => {
    const data = await cartService.removeCartItem(itemId);
    setCart(data);
    return data;
  }, []);

  const itemCount = (cart.items || []).reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = (cart.items || []).reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  const value = { cart, items: cart.items || [], itemCount, subtotal, loading, addItem, updateItem, removeItem, refreshCart };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
