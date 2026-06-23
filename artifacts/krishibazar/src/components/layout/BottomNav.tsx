import { useLocation, Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { Home, ShoppingBag, ClipboardList, User } from 'lucide-react';

interface BottomNavProps {
  role: 'FARMER' | 'WHOLESALER';
}

export function BottomNav({ role }: BottomNavProps) {
  const [location] = useLocation();
  const { t } = useTranslation();
  const base = role === 'FARMER' ? '/farmer' : '/wholesaler';

  const tabs = [
    { path: base, label: t('nav.home'), icon: Home },
    { path: `${base}/place-order`, label: t('orders.placeOrder'), icon: ShoppingBag },
    { path: `${base}/my-orders`, label: t('orders.myOrders'), icon: ClipboardList },
    { path: `${base}/profile`, label: t('nav.profile'), icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-kb-border safe-area-pb">
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location === tab.path || (tab.path !== base && location.startsWith(tab.path));
          return (
            <Link key={tab.path} href={tab.path} className="flex-1 flex flex-col items-center py-2 px-1 gap-0.5 relative">
              <Icon className={['w-5 h-5 transition-colors', isActive ? 'text-kb-forest' : 'text-kb-muted'].join(' ')} />
              <span className={['text-[10px] font-medium transition-colors', isActive ? 'text-kb-forest' : 'text-kb-muted'].join(' ')}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-kb-forest rounded-b-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
