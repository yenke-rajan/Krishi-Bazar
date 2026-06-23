import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateOrderId(layerType: 'SUPPLY' | 'DEMAND'): string {
  const prefix = layerType === 'SUPPLY' ? 'KBF' : 'KBW';
  const ts = Date.now().toString(36).toUpperCase().slice(-4);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `${prefix}-${ts}${rand}`;
}
