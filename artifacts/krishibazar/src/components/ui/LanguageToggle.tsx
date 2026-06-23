import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

export function LanguageToggle({ className }: { className?: string }) {
  const { language, toggleLanguage } = useLanguage();

  return (
    <div 
      className={cn("flex items-center rounded-full p-1 bg-black/20 backdrop-blur-sm cursor-pointer", className)}
      role="button"
      tabIndex={0}
      onClick={toggleLanguage}
    >
      <div className={cn("px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200", language === 'en' ? "bg-white text-kb-deep shadow-sm" : "text-white/70")}>
        EN
      </div>
      <div className={cn("px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200", language === 'np' ? "bg-white text-kb-deep shadow-sm" : "text-white/70")}>
        नेपाली
      </div>
    </div>
  );
}