import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useGetOrderSummary, getGetOrderSummaryQueryKey } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { Sprout, Package, BookOpen, LogOut, Leaf } from 'lucide-react';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user, logout, token } = useAuth();
  
  const { data: summary, isLoading } = useGetOrderSummary({
    query: {
      enabled: !!token,
      queryKey: getGetOrderSummaryQueryKey()
    }
  });

  if (!user) return null;

  const firstLetter = user.full_name?.charAt(0).toUpperCase() || 'U';

  const welcomeSubtext = user.role === 'FARMER' 
    ? t('dashboard.farmerWelcome')
    : user.role === 'WHOLESALER'
      ? t('dashboard.wholesalerWelcome')
      : t('dashboard.adminWelcome');

  return (
    <div className="min-h-screen bg-kb-cream w-full font-sans">
      <div className="max-w-sm mx-auto px-4 pt-8 pb-12 flex flex-col min-h-screen">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 text-kb-deep font-bold text-xl tracking-tight">
            <div className="w-8 h-8 bg-kb-forest rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            KrishiBazar
          </div>
          <LanguageToggle className="bg-kb-border/50 text-kb-deep" />
        </header>

        {/* Hero Card */}
        <div className="rounded-[16px] p-6 text-white mb-6 relative overflow-hidden shadow-card" style={{ background: 'linear-gradient(145deg, var(--color-kb-deep) 0%, var(--color-kb-forest) 100%)' }}>
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Leaf className="w-24 h-24" />
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-full bg-white/20 border border-white/30 flex items-center justify-center font-bold text-xl text-kb-marigold shrink-0">
              {firstLetter}
            </div>
            <div>
              <p className="text-white/80 text-sm font-medium mb-0.5">{t('dashboard.welcome')},</p>
              <h2 className="font-bold text-xl truncate">{user.full_name}</h2>
            </div>
          </div>
          
          <div className="mt-6 relative z-10 flex items-center justify-between">
            <div>
              <div className="inline-block px-2.5 py-1 rounded-md bg-white/20 backdrop-blur-sm text-xs font-bold tracking-wider mb-2">
                {t(`roles.${user.role}`)}
              </div>
              <p className="text-sm text-white/90 font-medium">{welcomeSubtext}</p>
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white rounded-[12px] p-3 shadow-sm border border-kb-border/50 text-center">
            <div className="text-xl font-bold text-kb-deep">
              {isLoading ? <Skeleton className="h-7 w-12 mx-auto" /> : summary?.total_orders || 0}
            </div>
            <div className="text-[10px] font-bold text-kb-muted uppercase tracking-wider mt-1">Total</div>
          </div>
          <div className="bg-white rounded-[12px] p-3 shadow-sm border border-kb-border/50 text-center">
            <div className="text-xl font-bold text-kb-deep">
              {isLoading ? <Skeleton className="h-7 w-12 mx-auto" /> : summary?.supply_orders || 0}
            </div>
            <div className="text-[10px] font-bold text-kb-muted uppercase tracking-wider mt-1">Supply</div>
          </div>
          <div className="bg-white rounded-[12px] p-3 shadow-sm border border-kb-border/50 text-center">
            <div className="text-xl font-bold text-kb-deep">
              {isLoading ? <Skeleton className="h-7 w-12 mx-auto" /> : summary?.demand_orders || 0}
            </div>
            <div className="text-[10px] font-bold text-kb-muted uppercase tracking-wider mt-1">Demand</div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid gap-3 mb-auto">
          {user.role === 'FARMER' && (
            <Link href="/catalog" className="flex items-center p-4 bg-white rounded-[16px] shadow-sm border border-kb-border hover:border-kb-forest hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-full bg-kb-leaf/10 flex items-center justify-center text-kb-forest mr-4 group-hover:scale-110 transition-transform">
                <Sprout size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-kb-text text-base">List Produce</h3>
                <p className="text-xs text-kb-muted mt-0.5">Offer your harvest to market</p>
              </div>
            </Link>
          )}

          <Link href="/orders" className="flex items-center p-4 bg-white rounded-[16px] shadow-sm border border-kb-border hover:border-kb-forest hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-full bg-kb-marigold/10 flex items-center justify-center text-kb-marigold mr-4 group-hover:scale-110 transition-transform">
              <Package size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-kb-text text-base">{t('nav.orders')}</h3>
              <p className="text-xs text-kb-muted mt-0.5">Track your current shipments</p>
            </div>
          </Link>

          <Link href="/catalog" className="flex items-center p-4 bg-white rounded-[16px] shadow-sm border border-kb-border hover:border-kb-forest hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-full bg-kb-forest/10 flex items-center justify-center text-kb-forest mr-4 group-hover:scale-110 transition-transform">
              <BookOpen size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-kb-text text-base">{t('nav.catalog')}</h3>
              <p className="text-xs text-kb-muted mt-0.5">Browse market availability</p>
            </div>
          </Link>
          
          {user.role === 'ADMIN' && (
             <Link href="/admin" className="flex items-center p-4 bg-kb-deep text-white rounded-[16px] shadow-sm border border-kb-deep hover:bg-kb-forest transition-all group">
               <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
               </div>
               <div className="flex-1">
                 <h3 className="font-bold text-base">Command Center</h3>
                 <p className="text-xs text-white/70 mt-0.5">Manage orders & inventory</p>
               </div>
             </Link>
          )}
        </div>

        {/* Logout */}
        <div className="mt-8 pt-6 border-t border-kb-border/50">
          <Button 
            variant="ghost" 
            className="w-full text-kb-error hover:bg-kb-error/10 hover:text-kb-error h-12 rounded-[10px]"
            onClick={logout}
          >
            <LogOut size={18} className="mr-2" />
            {t('nav.logout')}
          </Button>
        </div>
      </div>
    </div>
  );
}