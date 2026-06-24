import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { AdminLayout } from './AdminLayout';
import { Switch } from '@/components/ui/switch';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type CategoryFilter = 'ALL' | 'VEGETABLE' | 'PICKLE';

function ItemImage({ imageUrl, name }: { imageUrl?: string | null; name: string }) {
  const [imgError, setImgError] = useState(false);
  if (imageUrl && !imgError) {
    return (
      <img
        src={imageUrl}
        alt={name}
        onError={() => setImgError(true)}
        className="w-full h-full object-cover rounded-lg"
      />
    );
  }
  return (
    <div className="w-full h-full bg-kb-forest/10 rounded-lg flex items-center justify-center font-bold text-kb-forest text-xl">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function AdminCatalog() {
  const { t, i18n } = useTranslation();
  const { token } = useAuth();
  const lang = i18n.language as 'en' | 'np';

  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');
  const [form, setForm] = useState({ crop_name: '', crop_name_np: '', category: 'VEGETABLE', image_url: '', is_available: true });
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteErrors, setDeleteErrors] = useState<Record<string, string>>({});

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
      toast.success(lang === 'np' ? 'बाली थपियो' : 'Item added to catalog');
      setForm({ crop_name: '', crop_name_np: '', category: 'VEGETABLE', image_url: '', is_available: true });
      await loadCatalog();
    } catch {
      toast.error(t('errors.serverError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    setDeleteErrors((prev) => { const n = { ...prev }; delete n[id]; return n; });
    try {
      const res = await fetch(`/api/catalog/${id}`, { method: 'DELETE', headers: h });
      if (!res.ok) {
        const d = await res.json();
        setDeleteErrors((prev) => ({ ...prev, [id]: d.error || t('errors.serverError') }));
        return;
      }
      toast.success(lang === 'np' ? 'वस्तु मेटियो' : 'Item deleted');
      setCatalog((prev) => prev.filter((c) => c.id !== id));
      setConfirmDelete(null);
    } catch {
      toast.error(t('errors.serverError'));
    } finally {
      setDeleting(null);
    }
  };

  const filteredCatalog = catalog.filter((c) => categoryFilter === 'ALL' || c.category === categoryFilter);

  const imagePreviewUrl = form.image_url.trim();

  return (
    <AdminLayout>
      <h1 className="text-[20px] font-bold text-kb-text mb-5">{t('admin.catalog')}</h1>

      {/* Add form */}
      <div className="bg-white rounded-xl border border-kb-border p-5 mb-6">
        <h2 className="text-[15px] font-bold text-kb-text mb-4">
          {lang === 'np' ? 'नयाँ वस्तु थप्नुहोस्' : 'Add New Item'}
        </h2>
        <form onSubmit={handleAdd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-[12px] font-semibold text-kb-muted mb-1">Item Name (English) *</label>
              <input
                required
                value={form.crop_name}
                onChange={(e) => setForm({ ...form, crop_name: e.target.value })}
                placeholder="Tomato"
                className="w-full border border-kb-border rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-kb-forest"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-kb-muted mb-1">नेपाली नाम *</label>
              <input
                required
                value={form.crop_name_np}
                onChange={(e) => setForm({ ...form, crop_name_np: e.target.value })}
                placeholder="टमाटर"
                style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
                className="w-full border border-kb-border rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-kb-forest"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-kb-muted mb-1">Category</label>
              <div className="flex gap-2">
                {(['VEGETABLE', 'PICKLE'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm({ ...form, category: cat })}
                    className={[
                      'flex-1 py-2.5 rounded-xl text-[13px] font-semibold border-2 transition-all',
                      form.category === cat
                        ? cat === 'VEGETABLE' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-amber-50 border-amber-500 text-amber-700'
                        : 'border-kb-border text-kb-muted',
                    ].join(' ')}
                  >
                    {cat === 'VEGETABLE' ? '🥦 Vegetable' : '🫙 Pickle'}
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[12px] font-semibold text-kb-muted mb-1">{t('admin.imageUrl')}</label>
              <div className="flex gap-3 items-start">
                <input
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://..."
                  className="flex-1 border border-kb-border rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-kb-forest"
                />
                <div className="w-[60px] h-[60px] shrink-0 border border-kb-border rounded-lg overflow-hidden">
                  <ItemImage imageUrl={imagePreviewUrl || null} name={form.crop_name || '?'} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-4">
              <Switch
                checked={form.is_available}
                onCheckedChange={(val) => setForm({ ...form, is_available: val })}
              />
              <label className="text-[13px] text-kb-text font-medium">
                {lang === 'np' ? t('admin.availableToUsers') : 'Available to users'}
              </label>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-kb-forest text-white rounded-xl py-3 font-semibold text-[14px] disabled:opacity-50"
          >
            {submitting ? t('common.loading') : (lang === 'np' ? 'सूचीमा थप्नुहोस्' : 'Add to Catalog')}
          </button>
        </form>
      </div>

      {/* Catalog grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[13px] text-kb-muted">{t('admin.itemsInCatalog', { count: catalog.length })}</p>
          <div className="flex gap-2">
            {(['ALL', 'VEGETABLE', 'PICKLE'] as CategoryFilter[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={[
                  'px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all',
                  categoryFilter === cat ? 'bg-kb-forest text-white border-kb-forest' : 'bg-white text-kb-muted border-kb-border hover:border-kb-forest',
                ].join(' ')}
              >
                {cat === 'ALL' ? t('orders.allCategories') : cat === 'VEGETABLE' ? '🥦 ' + t('orders.vegetables') : '🫙 ' + t('orders.pickles')}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-36 bg-white rounded-xl animate-pulse border border-kb-border" />)}
          </div>
        ) : filteredCatalog.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3 text-kb-muted">
            <span className="text-4xl">🌿</span>
            <p className="text-[13px]">{categoryFilter === 'ALL' ? t('admin.noItems') : 'No items in this category.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCatalog.map((c) => (
              <div key={c.id} className="bg-white rounded-xl border border-kb-border p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-[60px] h-[60px] shrink-0 rounded-lg overflow-hidden border border-kb-border">
                    <ItemImage imageUrl={c.image_url} name={c.crop_name} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[14px] text-kb-text truncate">{c.crop_name}</p>
                    <p className="text-[12px] text-kb-muted truncate" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{c.crop_name_np}</p>
                    <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.category === 'VEGETABLE' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                      {c.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Switch checked={c.is_available} onCheckedChange={() => handleToggle(c.id, c.is_available)} />
                    <span className={`text-[12px] font-medium ${c.is_available ? 'text-green-600' : 'text-kb-muted'}`}>
                      {c.is_available ? 'Available' : 'Hidden'}
                    </span>
                  </div>
                  {confirmDelete === c.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deleting === c.id}
                        className="text-[11px] bg-red-600 text-white px-2 py-1 rounded-lg disabled:opacity-50"
                      >
                        {deleting === c.id ? '...' : (lang === 'np' ? 'हो' : 'Yes')}
                      </button>
                      <button
                        onClick={() => { setConfirmDelete(null); setDeleteErrors((p) => { const n = { ...p }; delete n[c.id]; return n; }); }}
                        className="text-[11px] bg-kb-cream text-kb-muted px-2 py-1 rounded-lg"
                      >
                        {lang === 'np' ? 'होइन' : 'No'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(c.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {confirmDelete === c.id && (
                  <p className="text-[11px] text-kb-muted mt-1">{lang === 'np' ? t('admin.deleteConfirm') : 'Are you sure? This cannot be undone.'}</p>
                )}
                {deleteErrors[c.id] && (
                  <p className="text-[11px] text-red-600 mt-1">{deleteErrors[c.id]}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
