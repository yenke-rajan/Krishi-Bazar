import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useInventory } from '@/context/InventoryContext';
import { AdminLayout } from './AdminLayout';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

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
    if (next && history.length === 0) loadHistory();
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

  const stockColor = (n: number) =>
    n > 50 ? 'text-green-600' : n >= 10 ? 'text-amber-600' : 'text-red-600';

  return (
    <AdminLayout>
      <h1 className="text-[20px] font-bold text-kb-text mb-5">{t('admin.inventory')}</h1>

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
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder="0"
                  className="w-full border border-kb-border rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-kb-forest"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-kb-muted mb-2">{t('inventory.type')}</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setTrackingType('RECEIVED')}
                    className={[
                      'flex-1 py-2.5 rounded-xl text-[13px] font-semibold border-2 transition-all',
                      trackingType === 'RECEIVED' ? 'bg-green-50 border-green-500 text-green-700' : 'border-kb-border text-kb-muted',
                    ].join(' ')}
                  >
                    ✅ {t('admin.received')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrackingType('DELIVERED')}
                    className={[
                      'flex-1 py-2.5 rounded-xl text-[13px] font-semibold border-2 transition-all',
                      trackingType === 'DELIVERED' ? 'bg-red-50 border-red-500 text-red-700' : 'border-kb-border text-kb-muted',
                    ].join(' ')}
                  >
                    🚚 {t('admin.delivered')}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-kb-muted mb-1">{t('common.notes')}</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder={t('common.notes')}
                  className="w-full border border-kb-border rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-kb-forest resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-kb-forest text-white rounded-xl py-3 font-semibold text-[14px] disabled:opacity-50"
              >
                {submitting ? t('common.loading') : t('inventory.logEntry')}
              </button>
            </form>
          </div>
        </div>

        {/* Summary table */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-kb-border overflow-hidden">
            <div className="px-4 py-3 border-b border-kb-border">
              <h2 className="text-[15px] font-bold text-kb-text">{t('admin.stockSummary')}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-kb-cream/60 border-b border-kb-border">
                    <th className="text-left px-4 py-3 font-semibold text-kb-muted text-[11px] uppercase">{t('inventory.cropName')}</th>
                    <th className="text-right px-4 py-3 font-semibold text-kb-muted text-[11px] uppercase">{t('admin.received')}</th>
                    <th className="text-right px-4 py-3 font-semibold text-kb-muted text-[11px] uppercase">{t('admin.delivered')}</th>
                    <th className="text-right px-4 py-3 font-semibold text-kb-muted text-[11px] uppercase">{t('admin.available')}</th>
                    <th className="text-right px-4 py-3 font-semibold text-kb-muted text-[11px] uppercase">{t('inventory.lastUpdated')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td colSpan={5} className="px-4 py-3"><div className="h-4 bg-kb-cream rounded animate-pulse" /></td>
                      </tr>
                    ))
                  ) : summary.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-kb-muted">No inventory data</td></tr>
                  ) : (
                    summary.map((s, i) => (
                      <tr key={s.crop_id} className={i % 2 === 0 ? 'bg-white' : 'bg-kb-cream/30'}>
                        <td className="px-4 py-3 font-medium text-kb-text">{lang === 'np' ? s.crop_name_np : s.crop_name}</td>
                        <td className="px-4 py-3 text-right text-kb-muted">{s.received_total} KG</td>
                        <td className="px-4 py-3 text-right text-kb-muted">{s.delivered_total} KG</td>
                        <td className={`px-4 py-3 text-right font-bold ${stockColor(s.available_stock)}`}>
                          {s.available_stock < 10 && <span className="mr-1">⚠️</span>}
                          {s.available_stock} KG
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
              <p className="px-5 py-8 text-center text-kb-muted text-[13px]">No transactions yet</p>
            ) : (
              <div className="divide-y divide-kb-border/50">
                {history.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-4 px-5 py-3 text-[13px]">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${entry.tracking_type === 'RECEIVED' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {entry.tracking_type}
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
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
