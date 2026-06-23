import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { AdminLayout } from './AdminLayout';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function AdminCatalog() {
  const { t, i18n } = useTranslation();
  const { token } = useAuth();
  const lang = i18n.language as 'en' | 'np';

  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ crop_name: '', crop_name_np: '', category: 'VEGETABLE', image_url: '' });
  const [submitting, setSubmitting] = useState(false);

  const h = { Authorization: `Bearer ${token}` };

  const loadCatalog = async () => {
    setLoading(true);
    const res = await fetch('/api/catalog', { headers: h });
    setCatalog(await res.json() || []);
    setLoading(false);
  };

  useEffect(() => { loadCatalog(); }, []);

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await fetch(`/api/catalog/${id}`, {
        method: 'PATCH',
        headers: { ...h, 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_available: !current }),
      });
      setCatalog((prev) => prev.map((c) => c.id === id ? { ...c, is_available: !current } : c));
    } catch {
      toast.error(t('errors.serverError'));
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.crop_name || !form.crop_name_np) { toast.error(t('errors.required')); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/catalog', {
        method: 'POST',
        headers: { ...h, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Crop added');
      setForm({ crop_name: '', crop_name_np: '', category: 'VEGETABLE', image_url: '' });
      await loadCatalog();
    } catch {
      toast.error(t('errors.serverError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-[20px] font-bold text-kb-text mb-5">{t('admin.catalog')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Add form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-kb-border p-5">
            <h2 className="text-[15px] font-bold text-kb-text mb-4">{t('admin.addCrop')}</h2>
            <form onSubmit={handleAdd} className="space-y-3">
              {[
                { label: 'English Name', key: 'crop_name', ph: 'Tomato' },
                { label: 'Nepali Name (नेपाली)', key: 'crop_name_np', ph: 'टमाटर' },
              ].map(({ label, key, ph }) => (
                <div key={key}>
                  <label className="block text-[12px] font-semibold text-kb-muted mb-1">{label}</label>
                  <input
                    required
                    value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={ph}
                    className="w-full border border-kb-border rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-kb-forest"
                  />
                </div>
              ))}
              <div>
                <label className="block text-[12px] font-semibold text-kb-muted mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-kb-border rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-kb-forest bg-white"
                >
                  <option value="VEGETABLE">VEGETABLE</option>
                  <option value="PICKLE">PICKLE</option>
                </select>
              </div>
              <button type="submit" disabled={submitting} className="w-full bg-kb-forest text-white rounded-xl py-3 font-semibold text-[13px] disabled:opacity-50">
                {submitting ? t('common.loading') : t('admin.addCrop')}
              </button>
            </form>
          </div>
        </div>

        {/* Catalog table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-kb-border overflow-hidden">
            <div className="px-4 py-3 border-b border-kb-border">
              <p className="text-[15px] font-bold text-kb-text">{catalog.length} items</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-kb-cream/60 border-b border-kb-border">
                    {['English', 'Nepali', 'Category', 'Available'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-kb-muted text-[11px] uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(6)].map((_, i) => (
                      <tr key={i}><td colSpan={4} className="px-4 py-3"><div className="h-4 bg-kb-cream rounded animate-pulse" /></td></tr>
                    ))
                  ) : (
                    catalog.map((c, i) => (
                      <tr key={c.id} className={i % 2 === 0 ? 'bg-white' : 'bg-kb-cream/30'}>
                        <td className="px-4 py-3 font-medium text-kb-text">{c.crop_name}</td>
                        <td className="px-4 py-3 text-kb-text">{c.crop_name_np}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${c.category === 'VEGETABLE' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                            {c.category}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Switch checked={c.is_available} onCheckedChange={() => handleToggle(c.id, c.is_available)} />
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
