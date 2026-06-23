import { ReactNode } from 'react';
import { LanguageToggle } from '../ui/LanguageToggle';
import { useTranslation } from 'react-i18next';
import { Leaf } from 'lucide-react';

export function AuthLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();

  return (
    <div className="min-h-[100dvh] w-full overflow-hidden bg-kb-cream flex flex-col relative">
      {/* Top Hero */}
      <div className="h-[42vh] min-h-[260px] relative shrink-0" style={{ background: 'linear-gradient(145deg, var(--color-kb-deep) 0%, var(--color-kb-forest) 60%, var(--color-kb-leaf) 100%)' }}>
        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
          <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <circle cx="200" cy="200" r="80" stroke="white" strokeWidth="2"/>
            <circle cx="200" cy="200" r="120" stroke="white" strokeWidth="2"/>
            <circle cx="200" cy="200" r="160" stroke="white" strokeWidth="2"/>
            <circle cx="200" cy="200" r="200" stroke="white" strokeWidth="2"/>
          </svg>
        </div>

        <LanguageToggle className="absolute top-4 right-4 z-20" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <div className="w-[52px] h-[52px] bg-white rounded-xl shadow-lg flex items-center justify-center relative mb-4">
             <Leaf className="w-8 h-8 text-kb-forest absolute" />
             <span className="text-kb-deep font-bold text-xl relative z-10">K</span>
             <div className="w-3 h-3 bg-kb-marigold rounded-full absolute -top-1 -right-1 shadow-sm"></div>
          </div>
          <h1 className="text-white font-bold text-[28px] tracking-tight">{t('app.name')}</h1>
          <p className="text-white/75 text-[13px] mt-1 font-medium">{t('app.tagline')}</p>
        </div>
      </div>

      {/* Bottom Sheet */}
      <div className="flex-1 bg-white rounded-t-[24px] -mt-[32px] z-20 relative px-6 pt-8 pb-6 overflow-y-auto shadow-card flex flex-col">
        <div className="w-10 h-1 bg-kb-border rounded-full mx-auto mb-6 shrink-0" />
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}