import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { AdminLayout } from './AdminLayout';
import { toast } from 'sonner';

export default function AdminInventory() {
  const { t, i18n } = useTranslation();
  const { token } = useAuth();
  const lang = i18n.language as 'en' | 'np';

  const [catalog, setCatalog] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => { loadData(); }, []);

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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Log form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-kb-border p-5">
            <h2 className="text-[15px] font-bold text-kb-text mb-4">{t('admin.logReceipt')}</h2>
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
                    <th className="text-right px-4 py-3 font-semibold text-kb-muted text-[11px] uppercase">{t('inventory.receivedKg')}</th>
                    <th className="text-right px-4 py-3 font-semibold text-kb-muted text-[11px] uppercase">{t('inventory.deliveredKg')}</th>
                    <th className="text-right px-4 py-3 font-semibold text-kb-muted text-[11px] uppercase">{t('inventory.availableKg')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}><td colSpan={4} className="px-4 py-3"><div className="h-4 bg-kb-cream rounded animate-pulse" /></td></tr>
                    ))
                  ) : summary.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-kb-muted">No inventory data</td></tr>
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
