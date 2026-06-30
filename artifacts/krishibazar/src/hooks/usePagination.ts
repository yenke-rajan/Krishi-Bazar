import { useState } from 'react';

export function usePagination<T>(items: T[], initialCount = 5) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? items : items.slice(0, initialCount);
  const hasMore = items.length > initialCount;
  const remaining = items.length - initialCount;
  return { visible, hasMore, showAll, setShowAll, remaining };
}
