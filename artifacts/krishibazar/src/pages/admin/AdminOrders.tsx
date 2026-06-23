import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { AdminLayout } from './AdminLayout';
import { formatBSDate } from '@/lib/bs-calendar';
import { toast } from 'sonner';

type LayerFilter = 'SUPPLY' | 'DEMAND';

const SUPPLY_STATUSES = ['ORDER_RECEIVED', 'DISPATCHED_TO_COLLECT', 'COLLECTED'];
const DEMAND_STATUSES = ['ORDER_RECEIVED', 'DISPATCHED', 'DELIVERED'];

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    ORDER_RECEIVED: 'bg-amber-50 text-amber-700 border-amber-200',
    DISPATCHED_TO_COLLECT: 'bg-blue-50 text-blue-700 border-blue-200',
    DISPATCHED: 'bg-blue-50 text-blue-700 border-blue-200',
    COLLECTED: 'bg-green-50 text-green-700 border-green-200',
    DELIVERED: 'bg-green-50 text-green-700 border-green-200',
  };
  const labels: Record<string, string> = {
    ORDER_RECEIVED: 'Received',
    DISPATCHED_TO_COLLECT: 'Collecting',
    DISPATCHED: 'Dispatched',
    COLLECTED: 'Collected',
    DELIVERED: 'Delivered',
  };
  return <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${cls[status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>{labels[status] ?? status}</span>;
}

export default function AdminOrders() {
  const { t, i18n } = useTranslation();
  const { token } = useAuth();
  const lang = i18n.language as 'en' | 'np';

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<LayerFilter>('SUPPLY');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders/all', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setOrders(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  const handleStatusChange = async (orderId: string, status: string) => {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(t('admin.statusUpdated'));
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
    } catch {
      toast.error(t('errors.serverError'));
    } finally {
      setUpdating(null);
    }
  };

  const filtered = orders
    .filter((o) => o.layer_type === tab)
    .filter((o) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (o.order_id || '').toLowerCase().includes(q) ||
        (o.client_name || '').toLowerCase().includes(q) ||
        (o.client_phone || '').toLowerCase().includes(q)
      );
    });

  const statuses = tab === 'SUPPLY' ? SUPPLY_STATUSES : DEMAND_STATUSES;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[20px] font-bold text-kb-text">{t('admin.orders')}</h1>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('common.search')}
          className="px-3 py-2 text-[13px] bg-white border border-kb-border rounded-xl outline-none focus:border-kb-forest w-48"
        />
      </div>

      {/* Layer tabs */}
      <div className="flex bg-white border border-kb-border rounded-xl p-1 gap-1 mb-4 w-fit">
        {(['SUPPLY', 'DEMAND'] as LayerFilter[]).map((lt) => (
          <button
            key={lt}
            onClick={() => setTab(lt)}
            className={[
              'px-4 py-2 rounded-lg text-[13px] font-semibold transition-all',
              tab === lt ? 'bg-kb-forest text-white shadow-sm' : 'text-kb-muted hover:text-kb-text',
            ].join(' ')}
          >
            {lt === 'SUPPLY' ? t('admin.farmerOrders') : t('admin.wholesalerOrders')}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-kb-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-kb-cream/60 border-b border-kb-border">
                <th className="text-left px-4 py-3 font-semibold text-kb-muted text-[11px] uppercase tracking-wide whitespace-nowrap">Order ID</th>
                <th className="text-left px-4 py-3 font-semibold text-kb-muted text-[11px] uppercase tracking-wide whitespace-nowrap">{t('common.name')}</th>
                <th className="text-left px-4 py-3 font-semibold text-kb-muted text-[11px] uppercase tracking-wide whitespace-nowrap">{t('common.phone')}</th>
                <th className="text-left px-4 py-3 font-semibold text-kb-muted text-[11px] uppercase tracking-wide whitespace-nowrap">{t('common.location')}</th>
                <th className="text-left px-4 py-3 font-semibold text-kb-muted text-[11px] uppercase tracking-wide whitespace-nowrap">{t('orders.crop')}</th>
                <th className="text-right px-4 py-3 font-semibold text-kb-muted text-[11px] uppercase tracking-wide whitespace-nowrap">{t('common.kg')}</th>
                <th className="text-left px-4 py-3 font-semibold text-kb-muted text-[11px] uppercase tracking-wide whitespace-nowrap">{t('common.date')}</th>
                <th className="text-left px-4 py-3 font-semibold text-kb-muted text-[11px] uppercase tracking-wide whitespace-nowrap">{t('common.status')}</th>
                <th className="text-left px-4 py-3 font-semibold text-kb-muted text-[11px] uppercase tracking-wide whitespace-nowrap">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-kb-cream/30'}>
                    {[...Array(9)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-kb-cream rounded animate-pulse" /></td>)}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-kb-muted">{t('orders.noOrders')}</td></tr>
              ) : (
                filtered.map((o, i) => (
                  <tr key={o.id} className={i % 2 === 0 ? 'bg-white' : 'bg-kb-cream/30'}>
                    <td className="px-4 py-3 font-mono font-bold text-kb-forest text-[12px] whitespace-nowrap">{o.order_id}</td>
                    <td className="px-4 py-3 font-medium text-kb-text whitespace-nowrap">{o.client_name || '—'}</td>
                    <td className="px-4 py-3 text-kb-muted whitespace-nowrap">{o.client_phone || '—'}</td>
                    <td className="px-4 py-3 text-kb-muted whitespace-nowrap max-w-[120px] truncate">{o.client_address || '—'}</td>
                    <td className="px-4 py-3 text-kb-text whitespace-nowrap">{lang === 'np' ? o.crop_name_np : o.crop_name}</td>
                    <td className="px-4 py-3 text-right font-semibold text-kb-text">{o.weight_kg}</td>
                    <td className="px-4 py-3 text-kb-muted whitespace-nowrap">{o.target_date_bs ? formatBSDate(o.target_date_bs, lang) : '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        {updating === o.id ? (
                          <div className="w-5 h-5 border-2 border-kb-forest border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <select
                            value={o.status}
                            onChange={(e) => handleStatusChange(o.id, e.target.value)}
                            className="text-[12px] border border-kb-border rounded-lg px-2 py-1.5 bg-white outline-none focus:border-kb-forest cursor-pointer"
                          >
                            {statuses.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
