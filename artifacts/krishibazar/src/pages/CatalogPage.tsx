import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useGetCatalog, getGetCatalogQueryKey, useUpdateCatalogItem } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueryClient } from '@tanstack/react-query';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

type FilterTab = 'ALL' | 'VEGETABLE' | 'PICKLE';

export default function CatalogPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterTab>('ALL');

  const { data: catalogItems, isLoading } = useGetCatalog({
    query: {
      queryKey: getGetCatalogQueryKey()
    }
  });

  const updateItem = useUpdateCatalogItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCatalogQueryKey() });
        toast.success("Catalog updated");
      },
      onError: () => {
        toast.error("Failed to update item");
      }
    }
  });

  const filteredItems = catalogItems?.filter(item => {
    if (filter === 'ALL') return true;
    return item.category === filter;
  });

  const isNp = i18n.language === 'np';

  return (
    <div className="min-h-screen bg-kb-cream w-full font-sans pb-20">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 shadow-sm border-b border-kb-border">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 -ml-2 text-kb-deep hover:bg-kb-cream rounded-full transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="font-bold text-xl text-kb-deep">{t('nav.catalog')}</h1>
          </div>
          {user?.role === 'ADMIN' && (
            <Link href="/admin" className="p-2 -mr-2 text-kb-forest hover:bg-kb-forest/10 rounded-full transition-colors">
              <Plus size={20} />
            </Link>
          )}
        </div>
        
        {/* Tabs */}
        <div className="max-w-md mx-auto px-4 flex gap-6 mt-1">
          {(['ALL', 'VEGETABLE', 'PICKLE'] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`pb-3 text-sm font-semibold transition-all border-b-2 ${
                filter === tab 
                  ? 'border-kb-forest text-kb-forest' 
                  : 'border-transparent text-kb-muted hover:text-kb-deep'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-[16px] p-4 flex gap-4">
                <Skeleton className="w-16 h-16 rounded-xl" />
                <div className="flex-1 space-y-2 py-1">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredItems?.length === 0 ? (
              <div className="text-center py-12 text-kb-muted">
                No items found
              </div>
            ) : (
              filteredItems?.map(item => (
                <div key={item.id} className="bg-white rounded-[16px] p-4 shadow-sm border border-kb-border flex gap-4 items-center">
                  <div className="w-16 h-16 bg-kb-cream rounded-xl flex items-center justify-center text-3xl shrink-0">
                    {item.category === 'VEGETABLE' ? '🥬' : '🌶️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-kb-text text-lg truncate">
                      {isNp ? item.crop_name_np : item.crop_name}
                    </h3>
                    <p className="text-sm text-kb-muted truncate">
                      {isNp ? item.crop_name : item.crop_name_np}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-kb-cream text-kb-deep uppercase">
                        {item.category}
                      </span>
                      {item.is_available ? (
                         <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-kb-success/10 text-kb-success uppercase">
                           Available
                         </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-kb-muted/10 text-kb-muted uppercase">
                          Out of stock
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {user?.role === 'ADMIN' && (
                    <div className="pl-2 border-l border-kb-border">
                      <Switch 
                        checked={item.is_available}
                        onCheckedChange={(checked) => {
                          updateItem.mutate({ id: item.id, data: { is_available: checked } });
                        }}
                        disabled={updateItem.isPending}
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}