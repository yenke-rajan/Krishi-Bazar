import { createContext, useContext, useState, ReactNode } from 'react';

interface InventoryContextType {
  inventoryVersion: number;
  bumpInventory: () => void;
}

const InventoryContext = createContext<InventoryContextType | null>(null);

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory must be used within InventoryProvider');
  return ctx;
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [inventoryVersion, setInventoryVersion] = useState(0);
  const bumpInventory = () => setInventoryVersion((v) => v + 1);
  return (
    <InventoryContext.Provider value={{ inventoryVersion, bumpInventory }}>
      {children}
    </InventoryContext.Provider>
  );
}
