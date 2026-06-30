import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from 'wouter';
import { OrderTimeline } from '@/components/ui/OrderTimeline';
import { formatBSDate } from '@/lib/bs-calendar';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { usePagination } from '@/hooks/usePagination';
import { SearchToggle } from '@/components/ui/SearchToggle';

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    ORDER_RECEIVED: 'bg-amber-50 text-amber-700 border-amber-200',
    DISPATCHED: 'bg-blue-50 text-blue-700 border-blue-200',
    DELIVERED: 'bg-green-50 text-green-700 border-green-200',
  };
  const labels: Record<string, string> = {
    ORDER_RECEIVED: 'Order Received',
    DISPATCHED: 'Dispatched',
    DELIVERED: 'Delivered',
  };
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${cls[status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
      {labels[status] ?? status}
    </span>
  );
}

const statusBorderColor: Record<string, string> = {
  ORDER_RECEIVED: 'border-l-kb-marigold',
  DISPATCHED: 'border-l-blue-500',
  DELIVERED: 'border-l-green-500',
};

export default function WholesalerMyOrders() {
  const { t, i18n } = useTranslation();
  const { token } = useAuth();
  const [, setLocation] = useLocation();
  const lang = i18n.language as 'en' | 'np';

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/orders/my', { headers: { Authorization: `Bearer ${token}` } });
        setOrders(await res.json() || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const handleCancelOrder = async (orderId: string) => {
    setCancelling(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || t('common.cannotCancel'));
        return;
      }
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      setCancelConfirmId(null);
      toast.success(lang === 'np' ? 'अर्डर रद्द गरियो' : 'Order cancelled');
    } catch {
      toast.error(t('errors.serverError'));
    } finally {
      setCancelling(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.order_id?.toLowerCase().includes(q) ||
      o.crop_name?.toLowerCase().includes(q) ||
      o.crop_name_np?.includes(q)
    );
  });

  const { visible, hasMore, showAll, setShowAll, remaining } = usePagination(filteredOrders, 5);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white rounded-xl animate-pulse" />)}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 gap-3 text-center">
        <div className="text-5xl">🛒</div>
        <p className="font-bold text-kb-text">{t('orders.noOrders')}</p>
        <p className="text-kb-muted text-sm">{t('orders.noOrdersHint')}</p>
        <button
          onClick={() => setLocation('/wholesaler/place-order')}
          className="mt-2 bg-kb-marigold text-white rounded-xl px-6 py-3 font-semibold text-sm"
        >
          {t('orders.placeOrder')}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-bold text-kb-text">{t('orders.myOrders')}</h2>
        <SearchToggle
          onSearch={setSearchQuery}
          placeholder={lang === 'np' ? 'अर्डर खोज्नुहोस्...' : 'Search orders...'}
        />
      </div>

      <div className="space-y-3">
        {visible.map((order) => (
          <div key={order.id} className={`bg-white rounded-xl border border-kb-border border-l-4 ${statusBorderColor[order.status] ?? 'border-l-kb-border'} p-4`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[14px] font-bold text-kb-marigold">{order.order_id}</span>
              <StatusBadge status={order.status} />
            </div>
            <div className="flex items-center gap-3 text-[13px] text-kb-muted mb-3">
              <span className="font-semibold text-kb-text">{lang === 'np' ? order.crop_name_np : order.crop_name}</span>
              <span>·</span>
              <span>{order.weight_kg} {t('common.kg')}</span>
              <span>·</span>
              <span>{order.target_date_bs ? formatBSDate(order.target_date_bs, lang) : '—'}</span>
            </div>
            <OrderTimeline status={order.status} layerType="DEMAND" lang={lang} />

            {order.status === 'ORDER_RECEIVED' && (
              cancelConfirmId === order.id ? (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-xs text-red-700 mb-2 font-medium">
                    {lang === 'np' ? 'यो अर्डर रद्द गर्ने?' : 'Cancel this order?'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      disabled={cancelling === order.id}
                      className="text-xs bg-red-500 text-white px-3 py-1 rounded-lg disabled:opacity-50"
                    >
                      {cancelling === order.id ? '...' : (lang === 'np' ? 'हो, रद्द गर्नुहोस्' : 'Yes, Cancel')}
                    </button>
                    <button
                      onClick={() => setCancelConfirmId(null)}
                      className="text-xs border border-kb-border px-3 py-1 rounded-lg"
                    >
                      {lang === 'np' ? 'राख्नुहोस्' : 'Keep Order'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setCancelConfirmId(order.id)}
                  className="text-xs text-red-500 border border-red-200 rounded-xl px-3 py-1.5 hover:bg-red-50 flex items-center gap-1 mt-3"
                >
                  <X className="w-3 h-3" />
                  {lang === 'np' ? 'अर्डर रद्द गर्नुहोस्' : 'Cancel Order'}
                </button>
              )
            )}
          </div>
        ))}
      </div>

      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full mt-3 py-2.5 border border-kb-border rounded-xl text-sm text-kb-muted hover:text-kb-forest hover:border-kb-forest/50 hover:bg-kb-forest/5 transition-all flex items-center justify-center gap-2"
        >
          <ChevronDown className="w-4 h-4" />
          {lang === 'np' ? `थप हेर्नुहोस् (${remaining} थप)` : `See More (${remaining} more)`}
        </button>
      )}
      {showAll && hasMore && (
        <button
          onClick={() => setShowAll(false)}
          className="w-full mt-3 py-2.5 text-sm text-kb-muted hover:text-kb-forest transition-colors flex items-center justify-center gap-2"
        >
          <ChevronUp className="w-4 h-4" />
          {lang === 'np' ? 'कम देखाउनुहोस्' : 'See Less'}
        </button>
      )}
    </div>
  );
}
