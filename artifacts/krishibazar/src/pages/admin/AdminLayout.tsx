import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useViewportGuard } from '@/hooks/useViewportGuard';
import { LayoutDashboard, PackageOpen, BarChart3, Users, Leaf, LogOut, Menu, Monitor } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isDesktop = useViewportGuard(768);

  const navItems = [
    { path: '/admin', label: t('admin.dashboard'), icon: LayoutDashboard },
    { path: '/admin/orders', label: t('admin.orders'), icon: PackageOpen },
    { path: '/admin/inventory', label: t('admin.inventory'), icon: BarChart3 },
    { path: '/admin/users', label: t('admin.users'), icon: Users },
    { path: '/admin/catalog', label: t('admin.catalog'), icon: Leaf },
  ];

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Fresh Tarkari" className="w-8 h-8 rounded-lg object-contain shrink-0" />
          <div>
            <p className="text-white font-bold text-[14px] leading-none">{t('app.name')}</p>
            <p className="text-white/50 text-[11px] leading-none mt-0.5">{t('admin.adminPanel')}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = path === '/admin' ? location === '/admin' : location.startsWith(path);
          return (
            <Link
              key={path}
              href={path}
              onClick={() => setSidebarOpen(false)}
              className={[
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all',
                isActive ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white',
              ].join(' ')}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10 space-y-3">
        <LanguageToggle className="w-full justify-center" />
        <div className="px-3 py-2">
          <p className="text-white/80 text-[12px] font-semibold truncate">{user?.full_name}</p>
          <p className="text-white/40 text-[11px] truncate">{user?.phone}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          {t('nav.logout')}
        </button>
      </div>
    </div>
  );

  if (!isDesktop) {
    return (
      <div className="min-h-screen bg-kb-cream flex flex-col items-center justify-center px-6 text-center gap-5">
        <Monitor className="w-16 h-16 text-kb-muted" />
        <div>
          <h1 className="text-[18px] font-bold text-kb-text mb-2">{t('admin.desktopRequired')}</h1>
          <p className="text-[13px] text-kb-muted max-w-xs">{t('admin.desktopRequiredDesc')}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 bg-white border border-kb-border text-kb-muted px-5 py-2.5 rounded-xl text-[13px] font-medium"
        >
          <LogOut className="w-4 h-4" />
          {t('nav.logout')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-kb-cream overflow-hidden">
      <aside className="hidden md:flex w-60 shrink-0 bg-kb-deep flex-col">
        <Sidebar />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-kb-deep flex flex-col">
            <Sidebar />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-kb-border">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-kb-cream">
            <Menu className="w-5 h-5 text-kb-text" />
          </button>
          <span className="font-bold text-kb-text text-[14px]">{t('app.name')}</span>
          <div className="w-9" />
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 page-enter">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
