import { useState, useEffect } from 'react';

export function useViewportGuard(minWidth: number): boolean {
  const [meetsMin, setMeetsMin] = useState(() => window.innerWidth >= minWidth);

  useEffect(() => {
    const handler = () => setMeetsMin(window.innerWidth >= minWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [minWidth]);

  return meetsMin;
}
