import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from 'wouter';
import { OrderTimeline } from '@/components/ui/OrderTimeline';
import { formatBSDate } from '@/lib/bs-calendar';

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
    <div className="space-y-3">
      {orders.map((order) => (
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
        </div>
      ))}
    </div>
  );
}
