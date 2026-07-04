import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { AdminLayout } from './AdminLayout';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

function RoleBadge({ role }: { role: string }) {
  const cls: Record<string, string> = {
    FARMER: 'bg-green-50 text-green-700',
    WHOLESALER: 'bg-orange-50 text-orange-700',
    ADMIN: 'bg-indigo-50 text-indigo-700',
  };
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cls[role] ?? 'bg-gray-50 text-gray-600'}`}>{role}</span>;
}

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString('en-NP', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AdminUsers() {
  const { t } = useTranslation();
  const { user: me, token } = useAuth();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [form, setForm] = useState({ phone: '', password: '', full_name: '', email: '', role: 'FARMER', primary_address: '' });
  const [submitting, setSubmitting] = useState(false);

  const h = { Authorization: `Bearer ${token}` };

  const parseResponseError = async (res: Response) => {
    const contentType = res.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      return data.error ?? JSON.stringify(data);
    }
    return await res.text();
  };

  const loadUsers = async () => {
    setLoading(true);
    const res = await fetch('/api/users', { headers: h });
    const data = await res.json();
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { ...h, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const message = await parseResponseError(res);
        throw new Error(message);
      }
      toast.success('User added');
      setForm({ phone: '', password: '', full_name: '', email: '', role: 'FARMER', primary_address: '' });
      setShowAddForm(false);
      await loadUsers();
    } catch (err: any) {
      toast.error(err.message || t('errors.serverError'));
    } finally {
      setSubmitting(false);
    }
  };

  const safeJson = async (res: Response): Promise<any> => {
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { error: `Server error (${res.status})` }; }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE', headers: h });
      if (!res.ok) {
        const d = await safeJson(res);
        throw new Error(d.error || `Failed to delete user (${res.status})`);
      }
      toast.success('User deleted successfully');
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setConfirmDelete(null);
    } catch (err: any) {
      toast.error(err.message || t('errors.serverError'));
    } finally {
      setDeleting(null);
    }
  };

  const handleRoleChange = async (id: string, role: string) => {
    try {
      const res = await fetch(`/api/users/${id}/role`, {
        method: 'PATCH',
        headers: { ...h, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const message = await parseResponseError(res);
        throw new Error(message);
      }
      toast.success(t('admin.statusUpdated'));
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role } : u));
    } catch (err: any) {
      toast.error(err.message || t('errors.serverError'));
    }
  };

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.full_name || '').toLowerCase().includes(q) || (u.phone || '').includes(q);
  });

  const Field = ({ label, ...props }: any) => (
    <div>
      <label className="block text-[12px] font-semibold text-kb-muted mb-1">{label}</label>
      <input {...props} className="w-full border border-kb-border rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-kb-forest" />
    </div>
  );

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[20px] font-bold text-kb-text">{t('admin.users')}</h1>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('common.search')}
            className="px-3 py-2 text-[13px] bg-white border border-kb-border rounded-xl outline-none focus:border-kb-forest w-44"
          />
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 bg-kb-forest text-white px-4 py-2 rounded-xl text-[13px] font-semibold"
          >
            {showAddForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {t('admin.addUser')}
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="bg-white rounded-xl border border-kb-border p-5 mb-5">
          <h2 className="text-[15px] font-bold text-kb-text mb-4">{t('admin.addUser')}</h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label={t('auth.fullName')} required value={form.full_name} onChange={(e: any) => setForm({ ...form, full_name: e.target.value })} placeholder="Full Name" />
            <Field label={t('auth.phone')} required value={form.phone} onChange={(e: any) => setForm({ ...form, phone: e.target.value })} placeholder="98XXXXXXXX" />
            <Field label={t('auth.password')} type="password" required value={form.password} onChange={(e: any) => setForm({ ...form, password: e.target.value })} placeholder="Min 6 chars" />
            <div>
              <label className="block text-[12px] font-semibold text-kb-muted mb-1">{t('common.role')}</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full border border-kb-border rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-kb-forest bg-white"
              >
                <option value="FARMER">FARMER</option>
                <option value="WHOLESALER">WHOLESALER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <Field label={t('auth.emailOptional')} type="email" value={form.email} onChange={(e: any) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
            <Field label={t('common.location')} value={form.primary_address} onChange={(e: any) => setForm({ ...form, primary_address: e.target.value })} placeholder="Kathmandu" />
            <div className="md:col-span-2 lg:col-span-3">
              <button type="submit" disabled={submitting} className="bg-kb-forest text-white rounded-xl px-6 py-2.5 font-semibold text-[13px] disabled:opacity-50">
                {submitting ? t('common.loading') : t('common.submit')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users count */}
      <p className="text-[12px] text-kb-muted mb-3">{t('admin.showingUsers', { count: filtered.length })}</p>

      {/* Table */}
      <div className="bg-white rounded-xl border border-kb-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-kb-cream/60 border-b border-kb-border">
                {[t('common.name'), t('common.phone'), t('common.role'), t('common.location'), t('common.joined'), t('common.actions')].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-kb-muted text-[11px] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-4 bg-kb-cream rounded animate-pulse" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-kb-muted">No users found</td></tr>
              ) : (
                filtered.map((u, i) => (
                  <tr key={u.id} className={i % 2 === 0 ? 'bg-white' : 'bg-kb-cream/30'}>
                    <td className="px-4 py-3 font-medium text-kb-text">{u.full_name}</td>
                    <td className="px-4 py-3 text-kb-muted">{u.phone}</td>
                    <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-4 py-3 text-kb-muted max-w-[120px] truncate">{u.primary_address || '—'}</td>
                    <td className="px-4 py-3 text-kb-muted whitespace-nowrap">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {u.id !== me?.id ? (
                          <>
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className="text-[11px] border border-kb-border rounded-lg px-1.5 py-1 bg-white outline-none focus:border-kb-forest"
                            >
                              {['FARMER', 'WHOLESALER', 'ADMIN'].map((r) => <option key={r} value={r}>{r}</option>)}
                            </select>
                            {confirmDelete === u.id ? (
                              <div className="flex items-center gap-1">
                                <button onClick={() => handleDelete(u.id)} disabled={deleting === u.id} className="text-[11px] bg-red-600 text-white px-2 py-1 rounded-lg">
                                  {deleting === u.id ? '...' : 'Yes'}
                                </button>
                                <button onClick={() => setConfirmDelete(null)} className="text-[11px] bg-kb-cream text-kb-muted px-2 py-1 rounded-lg">No</button>
                              </div>
                            ) : (
                              <button onClick={() => setConfirmDelete(u.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-[11px] text-kb-muted italic">You</span>
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
