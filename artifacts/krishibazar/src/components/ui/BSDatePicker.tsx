import { get7DayBSWindow } from '@/lib/bs-calendar';

interface BSDatePickerProps {
  selectedDate: string | null;
  onSelect: (dateStr: string) => void;
  lang: 'en' | 'np';
}

export function BSDatePicker({ selectedDate, onSelect, lang }: BSDatePickerProps) {
  const days = get7DayBSWindow();
  const label = lang === 'np' ? 'मिति छान्नुहोस्' : 'Select Date';

  return (
    <div>
      <p className="text-[14px] font-semibold text-kb-text mb-2">{label}</p>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {days.map((bs, i) => {
          const isSelected = selectedDate === bs.dateStringBS;
          const isToday = i === 0;
          return (
            <button
              key={bs.dateStringBS}
              type="button"
              onClick={() => onSelect(bs.dateStringBS)}
              className={[
                'min-w-[56px] flex flex-col items-center py-2 px-1 rounded-xl transition-all',
                isSelected
                  ? 'bg-kb-forest text-white border-2 border-kb-forest shadow-md scale-105'
                  : 'bg-white border border-kb-border text-kb-text hover:border-kb-forest/50',
              ].join(' ')}
            >
              <span className={['text-[11px]', isSelected ? 'text-white/80' : 'text-kb-muted'].join(' ')}>
                {lang === 'np' ? bs.dayNameNp : bs.dayNameEn}
              </span>
              <div className="relative flex flex-col items-center">
                <span className="text-[18px] font-bold leading-tight">{bs.day}</span>
                {isToday && (
                  <span className={['w-1.5 h-1.5 rounded-full mt-0.5', isSelected ? 'bg-amber-300' : 'bg-kb-marigold'].join(' ')} />
                )}
              </div>
              <span className={['text-[11px]', isSelected ? 'text-white/80' : 'text-kb-muted'].join(' ')}>
                {(lang === 'np' ? bs.monthNameNp : bs.monthNameEn).slice(0, 3)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
