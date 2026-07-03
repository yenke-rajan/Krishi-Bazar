import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { BottomNav } from '@/components/layout/BottomNav';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { LogOut } from 'lucide-react';

export function FarmerLayout({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const lang = i18n.language as 'en' | 'np';

  return (
    <div className="min-h-screen bg-kb-cream pb-20">
      <div className="sticky top-0 z-40 bg-white border-b border-kb-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Fresh Tarkari" className="w-7 h-7 rounded-lg object-contain" />
          <div>
            <p className="text-[13px] font-bold text-kb-text leading-none">{t('app.name')}</p>
            <p className="text-[10px] text-kb-muted leading-none">{t('roles.FARMER')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <button onClick={logout} className="p-1.5 rounded-lg hover:bg-kb-cream">
            <LogOut className="w-4 h-4 text-kb-muted" />
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-kb-forest to-kb-leaf px-4 py-3">
        <p className="text-white/80 text-[12px]">{t('dashboard.welcome')},</p>
        <p className="text-white font-bold text-[16px]">{user?.full_name}</p>
        <p className="text-white/70 text-[11px] mt-0.5">
          {user?.primary_address || t('auth.pickupLocation')}
        </p>
      </div>

      <div className="px-4 py-4 page-enter">
        <ErrorBoundary>{children}</ErrorBoundary>
      </div>

      <BottomNav role="FARMER" />
    </div>
  );
}
