import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // { produk, jumlah_kg }

  const addItem = (produk, jumlah_kg = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.produk.id === produk.id);
      if (existing) {
        return prev.map((i) =>
          i.produk.id === produk.id ? { ...i, jumlah_kg: i.jumlah_kg + jumlah_kg } : i
        );
      }
      return [...prev, { produk, jumlah_kg }];
    });
  };

  const updateQty = (produkId, jumlah_kg) => {
    setItems((prev) => prev.map((i) => (i.produk.id === produkId ? { ...i, jumlah_kg } : i)));
  };

  const removeItem = (produkId) => {
    setItems((prev) => prev.filter((i) => i.produk.id !== produkId));
  };

  const clear = () => setItems([]);

  const total = items.reduce((sum, i) => sum + i.jumlah_kg * i.produk.harga_per_kg, 0);

  return (
    <CartContext.Provider value={{ items, addItem, updateQty, removeItem, clear, total }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
