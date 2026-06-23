import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { AdminLayout } from './AdminLayout';
import { Users, PackageOpen, Leaf, ShoppingCart } from 'lucide-react';

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: any; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-kb-border p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-[24px] font-bold text-kb-text leading-none">{value}</p>
        <p className="text-[12px] text-kb-muted mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    ORDER_RECEIVED: 'bg-amber-50 text-amber-700',
    DISPATCHED_TO_COLLECT: 'bg-blue-50 text-blue-700',
    DISPATCHED: 'bg-blue-50 text-blue-700',
    COLLECTED: 'bg-green-50 text-green-700',
    DELIVERED: 'bg-green-50 text-green-700',
  };
  const short: Record<string, string> = {
    ORDER_RECEIVED: 'Received',
    DISPATCHED_TO_COLLECT: 'Pick Up',
    DISPATCHED: 'Dispatched',
    COLLECTED: 'Collected',
    DELIVERED: 'Delivered',
  };
  return <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${cls[status] ?? 'bg-gray-50 text-gray-600'}`}>{short[status] ?? status}</span>;
}

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const { token } = useAuth();
  const lang = i18n.language as 'en' | 'np';

  const [stats, setStats] = useState({ active: 0, farmers: 0, wholesalers: 0, catalog: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [stockSummary, setStockSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch('/api/orders/all', { headers: h }).then((r) => r.json()),
      fetch('/api/users', { headers: h }).then((r) => r.json()),
      fetch('/api/catalog', { headers: h }).then((r) => r.json()),
      fetch('/api/inventory/summary', { headers: h }).then((r) => r.json()),
    ]).then(([orders, users, catalog, inventory]) => {
      const activeOrders = (orders || []).filter((o: any) => o.status !== 'COLLECTED' && o.status !== 'DELIVERED');
      setStats({
        active: activeOrders.length,
        farmers: (users || []).filter((u: any) => u.role === 'FARMER').length,
        wholesalers: (users || []).filter((u: any) => u.role === 'WHOLESALER').length,
        catalog: (catalog || []).length,
      });
      setRecentOrders((orders || []).slice(0, 5));
      setStockSummary(inventory || []);
    }).finally(() => setLoading(false));
  }, [token]);

  return (
    <AdminLayout>
      <h1 className="text-[20px] font-bold text-kb-text mb-5">{t('admin.dashboard')}</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label={t('admin.activeOrders')} value={stats.active} icon={ShoppingCart} color="bg-kb-forest" />
        <StatCard label={t('admin.totalFarmers')} value={stats.farmers} icon={Users} color="bg-emerald-500" />
        <StatCard label={t('admin.totalWholesalers')} value={stats.wholesalers} icon={PackageOpen} color="bg-kb-marigold" />
        <StatCard label={t('admin.totalCatalog')} value={stats.catalog} icon={Leaf} color="bg-violet-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-kb-border p-4">
          <h2 className="text-[15px] font-bold text-kb-text mb-3">{t('admin.recentOrders')}</h2>
          {loading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-kb-cream rounded animate-pulse" />)}</div>
          ) : recentOrders.length === 0 ? (
            <p className="text-kb-muted text-sm py-4 text-center">{t('orders.noOrders')}</p>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((o, i) => (
                <div key={o.id} className={`flex items-center justify-between py-2 px-3 rounded-lg text-[13px] ${i % 2 === 0 ? 'bg-white' : 'bg-kb-cream/50'}`}>
                  <div className="flex flex-col">
                    <span className="font-mono font-bold text-kb-forest text-[12px]">{o.order_id}</span>
                    <span className="text-kb-muted text-[11px]">{o.client_name}</span>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock Summary */}
        <div className="bg-white rounded-xl border border-kb-border p-4">
          <h2 className="text-[15px] font-bold text-kb-text mb-3">{t('admin.stockSummary')}</h2>
          {loading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-kb-cream rounded animate-pulse" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-kb-muted text-[11px] uppercase tracking-wide">
                    <th className="text-left pb-2">{t('inventory.cropName')}</th>
                    <th className="text-right pb-2">{t('admin.received')}</th>
                    <th className="text-right pb-2">{t('admin.delivered')}</th>
                    <th className="text-right pb-2">{t('admin.available')}</th>
                  </tr>
                </thead>
                <tbody>
                  {stockSummary.map((s, i) => (
                    <tr key={s.crop_id} className={i % 2 === 0 ? 'bg-white' : 'bg-kb-cream/50'}>
                      <td className="py-1.5 font-medium text-kb-text">{lang === 'np' ? s.crop_name_np : s.crop_name}</td>
                      <td className="py-1.5 text-right text-kb-muted">{s.received_total}</td>
                      <td className="py-1.5 text-right text-kb-muted">{s.delivered_total}</td>
                      <td className={`py-1.5 text-right font-semibold ${s.available_stock < 10 ? 'text-red-600' : s.available_stock < 50 ? 'text-amber-600' : 'text-green-600'}`}>
                        {s.available_stock < 10 && <span className="mr-1">⚠️</span>}
                        {s.available_stock}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
