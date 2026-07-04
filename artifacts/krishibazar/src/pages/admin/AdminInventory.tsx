import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useInventory } from '@/context/InventoryContext';
import { AdminLayout } from './AdminLayout';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { toast } from 'sonner';
import { usePagination } from '@/hooks/usePagination';

function relativeTime(ts: number, lang: 'en' | 'np'): string {
  const diff = Math.floor(Date.now() / 1000 - ts);
  if (diff < 60) return lang === 'np' ? 'अहिले' : 'Just now';
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return lang === 'np' ? `${m} मिनेट अघि` : `${m} min ago`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return lang === 'np' ? `${h} घण्टा अघि` : `${h} hr ago`;
  }
  const d = Math.floor(diff / 86400);
  return lang === 'np' ? `${d} दिन अघि` : `${d} days ago`;
}

function AvailableCell({ inWarehouse, toDeliver, lang }: { inWarehouse: number; toDeliver: number; lang: 'en' | 'np' }) {
  const surplus = inWarehouse - toDeliver;
  if (surplus === 0) {
    return <span className="text-kb-muted text-[12px]">{lang === 'np' ? 'सन्तुलित' : 'Balanced'}</span>;
  }
  if (surplus > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 text-[12px] font-semibold px-2 py-0.5 rounded-full">
        +{surplus} KG
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 text-[12px] font-semibold px-2 py-0.5 rounded-full">
      ⚠️ {surplus} KG
    </span>
  );
}

export default function AdminInventory() {
  const { t, i18n } = useTranslation();
  const { token } = useAuth();
  const { inventoryVersion } = useInventory();
  const lang = i18n.language as 'en' | 'np';

  const [catalog, setCatalog] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stockSearch, setStockSearch] = useState('');

  const [cropId, setCropId] = useState('');
  const [qty, setQty] = useState('');
  const [trackingType, setTrackingType] = useState<'RECEIVED' | 'DELIVERED'>('RECEIVED');
  const [notes, setNotes] = useState('');

  const h = { Authorization: `Bearer ${token}` };

  const loadData = async () => {
    setLoading(true);
    const [catRes, sumRes] = await Promise.all([
      fetch('/api/catalog', { headers: h }).then((r) => r.json()),
      fetch('/api/inventory/summary', { headers: h }).then((r) => r.json()),
    ]);
    setCatalog(catRes || []);
    setSummary(sumRes || []);
    setLoading(false);
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    const res = await fetch('/api/inventory/history?limit=20', { headers: h });
    setHistory(await res.json() || []);
    setHistoryLoading(false);
  };

  useEffect(() => { loadData(); }, [inventoryVersion]);

  const handleHistoryToggle = () => {
    const next = !historyOpen;
    setHistoryOpen(next);
    if (next) loadHistory();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cropId || !qty) { toast.error(t('errors.required')); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { ...h, 'Content-Type': 'application/json' },
        body: JSON.stringify({ crop_id: cropId, delta_quantity: Number(qty), tracking_type: trackingType, notes }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(t('inventory.logSuccess'));
      setCropId(''); setQty(''); setNotes('');
      await loadData();
      if (historyOpen) await loadHistory();
    } catch {
      toast.error(t('errors.serverError'));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSummary = summary.filter((s) => {
    if (!stockSearch) return true;
    const q = stockSearch.toLowerCase();
    return s.crop_name.toLowerCase().includes(q) || s.crop_name_np.includes(q);
  });

  const { visible: historyVisible, hasMore: historyHasMore, showAll: historyShowAll, setShowAll: setHistoryShowAll, remaining: historyRemaining } = usePagination(history, 5);

  const warehouseColor = (n: number) =>
    n > 50 ? 'text-green-600' : n >= 10 ? 'text-amber-600' : 'text-red-600';

  const chipStyle = (n: number) =>
    n > 50
      ? 'bg-green-50 border-green-200 text-green-700'
      : n >= 10
      ? 'bg-amber-50 border-amber-200 text-amber-700'
      : 'bg-red-50 border-red-200 text-red-700';

  return (
    <AdminLayout>
      <h1 className="text-[20px] font-bold text-kb-text mb-5">{t('admin.inventory')}</h1>

      {/* Stock overview panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {/* Available Stock */}
        <div className="bg-white rounded-xl border border-kb-border p-4">
          <h2 className="text-[13px] font-bold text-kb-text mb-3 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            {lang === 'np' ? 'उपलब्ध स्टक' : 'Available Stock'}
          </h2>
          {loading ? (
            <div className="flex flex-wrap gap-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-14 w-24 bg-kb-cream rounded-xl animate-pulse" />)}
            </div>
          ) : summary.filter((s) => s.in_warehouse > 0).length === 0 ? (
            <p className="text-kb-muted text-[12px]">{lang === 'np' ? 'कुनै स्टक छैन' : 'No stock available'}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {summary.filter((s) => s.in_warehouse > 0).map((s) => (
                <div key={s.crop_id} className={`px-3 py-2 rounded-xl border text-center min-w-[80px] ${chipStyle(s.in_warehouse)}`}>
                  <p className="text-[12px] font-bold leading-tight">{lang === 'np' ? s.crop_name_np : s.crop_name}</p>
                  <p className="text-[14px] font-extrabold mt-0.5">{s.in_warehouse} <span className="text-[10px] font-semibold">KG</span></p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* To Receive */}
        <div className="bg-white rounded-xl border border-kb-border p-4">
          <h2 className="text-[13px] font-bold text-kb-text mb-3 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
            {lang === 'np' ? 'प्राप्त हुने' : 'To Receive'}
          </h2>
          {loading ? (
            <div className="flex flex-wrap gap-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-14 w-24 bg-kb-cream rounded-xl animate-pulse" />)}
            </div>
          ) : summary.filter((s) => s.to_receive > 0).length === 0 ? (
            <p className="text-kb-muted text-[12px]">{lang === 'np' ? 'प्राप्त हुने केही छैन' : 'Nothing pending to receive'}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {summary.filter((s) => s.to_receive > 0).map((s) => (
                <div key={s.crop_id} className="px-3 py-2 rounded-xl border text-center min-w-[80px] bg-blue-50 border-blue-200 text-blue-700">
                  <p className="text-[12px] font-bold leading-tight">{lang === 'np' ? s.crop_name_np : s.crop_name}</p>
                  <p className="text-[14px] font-extrabold mt-0.5">{s.to_receive} <span className="text-[10px] font-semibold">KG</span></p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* To Deliver */}
        <div className="bg-white rounded-xl border border-kb-border p-4">
          <h2 className="text-[13px] font-bold text-kb-text mb-3 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
            {lang === 'np' ? 'डेलिभर हुने' : 'To Deliver'}
          </h2>
          {loading ? (
            <div className="flex flex-wrap gap-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-14 w-24 bg-kb-cream rounded-xl animate-pulse" />)}
            </div>
          ) : summary.filter((s) => s.to_deliver > 0).length === 0 ? (
            <p className="text-kb-muted text-[12px]">{lang === 'np' ? 'डेलिभर हुने केही छैन' : 'Nothing pending to deliver'}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {summary.filter((s) => s.to_deliver > 0).map((s) => (
                <div key={s.crop_id} className="px-3 py-2 rounded-xl border text-center min-w-[80px] bg-orange-50 border-orange-200 text-orange-700">
                  <p className="text-[12px] font-bold leading-tight">{lang === 'np' ? s.crop_name_np : s.crop_name}</p>
                  <p className="text-[14px] font-extrabold mt-0.5">{s.to_deliver} <span className="text-[10px] font-semibold">KG</span></p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-5">
        {/* Manual Adjustment form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-kb-border p-5">
            <h2 className="text-[15px] font-bold text-kb-text mb-1">{t('admin.manualAdjustment')}</h2>
            <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-700 px-3 py-2 rounded text-xs mb-4">
              {lang === 'np' ? t('admin.autoInventoryNote') : "Note: Inventory updates automatically when order statuses change to 'Picked Up' or 'Delivered'."}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-kb-muted mb-1">{t('inventory.selectCrop')}</label>
                <select
                  value={cropId}
                  onChange={(e) => setCropId(e.target.value)}
                  className="w-full border border-kb-border rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-kb-forest bg-white"
                >
                  <option value="">{t('inventory.selectCrop')}</option>
                  {catalog.map((c) => (
                    <option key={c.id} value={c.id}>{lang === 'np' ? c.crop_name_np : c.crop_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-kb-muted mb-1">{t('inventory.quantityKg')}</label>
                <input
                  type="number" min={0.1} step={0.1} value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder="0"
                  className="w-full border border-kb-border rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-kb-forest"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-kb-muted mb-2">{t('inventory.type')}</label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setTrackingType('RECEIVED')}
                    className={['flex-1 py-2.5 rounded-xl text-[13px] font-semibold border-2 transition-all',
                      trackingType === 'RECEIVED' ? 'bg-green-50 border-green-500 text-green-700' : 'border-kb-border text-kb-muted'].join(' ')}>
                    ✅ {t('admin.received')}
                  </button>
                  <button type="button" onClick={() => setTrackingType('DELIVERED')}
                    className={['flex-1 py-2.5 rounded-xl text-[13px] font-semibold border-2 transition-all',
                      trackingType === 'DELIVERED' ? 'bg-red-50 border-red-500 text-red-700' : 'border-kb-border text-kb-muted'].join(' ')}>
                    🚚 {t('admin.delivered')}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-kb-muted mb-1">{t('common.notes')}</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                  placeholder={t('common.notes')}
                  className="w-full border border-kb-border rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-kb-forest resize-none"
                />
              </div>

              <button type="submit" disabled={submitting}
                className="w-full bg-kb-forest text-white rounded-xl py-3 font-semibold text-[14px] disabled:opacity-50">
                {submitting ? t('common.loading') : t('inventory.logEntry')}
              </button>
            </form>
          </div>
        </div>

        {/* Summary table */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-kb-border overflow-hidden">
            <div className="px-4 py-3 border-b border-kb-border">
              <h2 className="text-[15px] font-bold text-kb-text mb-3">{t('admin.stockSummary')}</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-kb-muted w-4 h-4" />
                <input
                  type="text"
                  placeholder={lang === 'np' ? 'उपज खोज्नुहोस्...' : 'Search crop...'}
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-kb-border rounded-xl text-sm focus:outline-none focus:border-kb-forest focus:ring-2 focus:ring-kb-forest/20"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-kb-cream/60 border-b border-kb-border">
                    <th className="text-left px-4 py-3 font-semibold text-kb-muted text-[11px] uppercase">{t('inventory.cropName')}</th>
                    <th className="text-right px-4 py-3 font-semibold text-kb-muted text-[11px] uppercase whitespace-nowrap">
                      {lang === 'np' ? 'प्राप्त हुने' : 'To Receive'}
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-kb-muted text-[11px] uppercase whitespace-nowrap">
                      {lang === 'np' ? 'डेलिभर हुने' : 'To Deliver'}
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-kb-muted text-[11px] uppercase whitespace-nowrap">
                      {lang === 'np' ? 'भण्डारमा' : 'In Warehouse'}
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-kb-muted text-[11px] uppercase whitespace-nowrap">
                      {lang === 'np' ? 'उपलब्ध' : 'Available'}
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-kb-muted text-[11px] uppercase">{t('inventory.lastUpdated')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td colSpan={6} className="px-4 py-3"><div className="h-4 bg-kb-cream rounded animate-pulse" /></td>
                      </tr>
                    ))
                  ) : filteredSummary.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-kb-muted">
                      {lang === 'np' ? 'भण्डार डाटा छैन' : 'No inventory data'}
                    </td></tr>
                  ) : (
                    filteredSummary.map((s, i) => (
                      <tr key={s.crop_id} className={i % 2 === 0 ? 'bg-white' : 'bg-kb-cream/30'}>
                        <td className="px-4 py-3 font-medium text-kb-text">{lang === 'np' ? s.crop_name_np : s.crop_name}</td>
                        <td className="px-4 py-3 text-right text-kb-muted">{s.to_receive} KG</td>
                        <td className="px-4 py-3 text-right text-kb-muted">{s.to_deliver} KG</td>
                        <td className={`px-4 py-3 text-right font-bold ${warehouseColor(s.in_warehouse)}`}>
                          {s.in_warehouse < 10 && <span className="mr-1">⚠️</span>}
                          {s.in_warehouse} KG
                        </td>
                        <td className="px-4 py-3 text-right">
                          <AvailableCell inWarehouse={s.in_warehouse} toDeliver={s.to_deliver} lang={lang} />
                        </td>
                        <td className="px-4 py-3 text-right text-[11px] text-kb-muted whitespace-nowrap">
                          {s.last_updated ? (
                            <span className={`inline-flex items-center gap-1 ${s.last_entry_type === 'RECEIVED' ? 'text-green-600' : s.last_entry_type === 'DELIVERED' ? 'text-red-600' : 'text-kb-muted'}`}>
                              {s.last_entry_type === 'RECEIVED' ? '↑' : s.last_entry_type === 'DELIVERED' ? '↓' : ''}
                              {relativeTime(s.last_updated, lang)}
                            </span>
                          ) : (
                            <span className="text-kb-muted">{t('inventory.neverUpdated')}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions collapsible */}
      <div className="bg-white rounded-xl border border-kb-border overflow-hidden">
        <button
          onClick={handleHistoryToggle}
          className="w-full flex items-center justify-between px-5 py-4 text-[14px] font-bold text-kb-text hover:bg-kb-cream/40 transition-colors"
        >
          <span>{t('admin.recentTransactions')}</span>
          {historyOpen ? <ChevronUp className="w-4 h-4 text-kb-muted" /> : <ChevronDown className="w-4 h-4 text-kb-muted" />}
        </button>

        {historyOpen && (
          <div className="border-t border-kb-border">
            {historyLoading ? (
              <div className="p-4 space-y-2">
                {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-kb-cream rounded animate-pulse" />)}
              </div>
            ) : history.length === 0 ? (
              <p className="px-5 py-8 text-center text-kb-muted text-[13px]">
                {lang === 'np' ? 'अहिलेसम्म कुनै लेनदेन छैन' : 'No transactions yet'}
              </p>
            ) : (
              <>
                <div className="divide-y divide-kb-border/50">
                  {historyVisible.map((entry) => (
                    <div key={entry.id} className="flex items-center gap-4 px-5 py-3 text-[13px]">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${entry.tracking_type === 'RECEIVED' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {entry.tracking_type === 'RECEIVED'
                          ? (lang === 'np' ? 'प्राप्त' : 'RECEIVED')
                          : (lang === 'np' ? 'डेलिभर' : 'DELIVERED')}
                      </span>
                      <span className="font-medium text-kb-text flex-1 min-w-0 truncate">
                        {lang === 'np' ? entry.crop_name_np : entry.crop_name}
                      </span>
                      <span className="font-semibold text-kb-text shrink-0">{entry.delta_quantity} KG</span>
                      <span className="text-kb-muted shrink-0 text-[12px]">{relativeTime(entry.recorded_at, lang)}</span>
                      {entry.notes && (
                        <span className="text-kb-muted text-[11px] max-w-[200px] truncate" title={entry.notes}>{entry.notes}</span>
                      )}
                    </div>
                  ))}
                </div>
                {historyHasMore && !historyShowAll && (
                  <div className="px-5 py-3 border-t border-kb-border/50">
                    <button onClick={() => setHistoryShowAll(true)}
                      className="w-full py-2 text-sm text-kb-muted hover:text-kb-forest flex items-center justify-center gap-2">
                      <ChevronDown className="w-4 h-4" />
                      {lang === 'np' ? `थप हेर्नुहोस् (${historyRemaining} थप)` : `See More (${historyRemaining} more)`}
                    </button>
                  </div>
                )}
                {historyShowAll && historyHasMore && (
                  <div className="px-5 py-3 border-t border-kb-border/50">
                    <button onClick={() => setHistoryShowAll(false)}
                      className="w-full py-2 text-sm text-kb-muted hover:text-kb-forest flex items-center justify-center gap-2">
                      <ChevronUp className="w-4 h-4" />
                      {lang === 'np' ? 'कम देखाउनुहोस्' : 'See Less'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
