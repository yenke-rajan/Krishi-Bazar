import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { User, Phone, MapPin, Mail, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function UserProfile() {
  const { t, i18n } = useTranslation();
  const { user, token, refreshUser } = useAuth();
  const lang = i18n.language as 'en' | 'np';

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState(user?.primary_address || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ full_name: fullName, email: email || null, primary_address: address || null }),
      });
      if (!res.ok) throw new Error('Failed');
      await refreshUser();
      toast.success(lang === 'np' ? 'प्रोफाइल सफलतापूर्वक अपडेट गरियो' : 'Profile updated successfully');
    } catch {
      toast.error(t('errors.serverError'));
    } finally {
      setSaving(false);
    }
  };

  const roleColor = user?.role === 'FARMER' ? 'bg-kb-forest/10 text-kb-forest' : 'bg-orange-100 text-kb-marigold';
  const locationLabel = user?.role === 'FARMER' ? t('auth.pickupLocation') : t('auth.dropoffLocation');

  return (
    <div className="max-w-sm mx-auto">
      <div className="flex flex-col items-center py-6 gap-3 mb-6">
        <div className="w-16 h-16 bg-kb-cream border-2 border-kb-border rounded-full flex items-center justify-center">
          <User className="w-8 h-8 text-kb-muted" />
        </div>
        <div className="text-center">
          <p className="font-bold text-[18px] text-kb-text">{user?.full_name}</p>
          <span className={`inline-block mt-1 text-[11px] font-semibold px-3 py-1 rounded-full ${roleColor}`}>
            {user?.role ? t(`roles.${user.role}`) : ''}
          </span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="flex items-center gap-1.5 text-[12px] font-semibold text-kb-muted mb-1.5">
            <User className="w-3.5 h-3.5" /> {lang === 'np' ? 'पूरा नाम' : 'Full Name'}
          </label>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border border-kb-border rounded-xl px-4 py-3 text-[14px] text-kb-text outline-none focus:border-kb-forest bg-white"
          />
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-[12px] font-semibold text-kb-muted mb-1.5">
            <Phone className="w-3.5 h-3.5" /> {t('common.phone')}
          </label>
          <div className="w-full border border-kb-border/50 rounded-xl px-4 py-3 text-[14px] text-kb-muted bg-kb-cream/50 flex items-center gap-2">
            <span>🇳🇵</span>
            <span>{user?.phone}</span>
            <span className="ml-auto text-[11px] text-kb-muted">{lang === 'np' ? 'फोन नम्बर परिवर्तन गर्न सकिँदैन' : 'Cannot be changed'}</span>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-[12px] font-semibold text-kb-muted mb-1.5">
            <Mail className="w-3.5 h-3.5" /> {t('auth.emailOptional')}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            className="w-full border border-kb-border rounded-xl px-4 py-3 text-[14px] text-kb-text outline-none focus:border-kb-forest bg-white"
          />
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-[12px] font-semibold text-kb-muted mb-1.5">
            <MapPin className="w-3.5 h-3.5" /> {locationLabel}
          </label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={locationLabel}
            className="w-full border border-kb-border rounded-xl px-4 py-3 text-[14px] text-kb-text outline-none focus:border-kb-forest bg-white"
          />
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-[12px] font-semibold text-kb-muted mb-1.5">
            <Shield className="w-3.5 h-3.5" /> {t('common.role')}
          </label>
          <div className={`w-full border border-kb-border/50 rounded-xl px-4 py-3 text-[14px] bg-kb-cream/50 ${roleColor}`}>
            {user?.role ? t(`roles.${user.role}`) : ''}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className={`w-full py-3.5 rounded-xl font-semibold text-[15px] text-white disabled:opacity-50 ${user?.role === 'FARMER' ? 'bg-kb-forest' : 'bg-kb-marigold'}`}
        >
          {saving ? t('common.loading') : (lang === 'np' ? 'परिवर्तन सुरक्षित गर्नुहोस्' : 'Save Changes')}
        </button>
      </form>
    </div>
  );
}
