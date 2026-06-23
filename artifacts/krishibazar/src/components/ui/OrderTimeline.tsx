interface OrderTimelineProps {
  status: string;
  layerType: 'SUPPLY' | 'DEMAND';
  lang: 'en' | 'np';
}

const SUPPLY_STEPS = [
  { key: 'ORDER_RECEIVED', en: 'Order Received', np: 'अर्डर प्राप्त' },
  { key: 'DISPATCHED_TO_COLLECT', en: 'Coming to Pick Up', np: 'सङ्कलन गर्न आउँदैछ' },
  { key: 'COLLECTED', en: 'Picked Up', np: 'सङ्कलन गरियो' },
];

const DEMAND_STEPS = [
  { key: 'ORDER_RECEIVED', en: 'Order Received', np: 'अर्डर प्राप्त' },
  { key: 'DISPATCHED', en: 'Dispatched', np: 'पठाइयो' },
  { key: 'DELIVERED', en: 'Delivered', np: 'डेलिभर गरियो' },
];

export function OrderTimeline({ status, layerType, lang }: OrderTimelineProps) {
  const steps = layerType === 'SUPPLY' ? SUPPLY_STEPS : DEMAND_STEPS;
  const activeIdx = steps.findIndex((s) => s.key === status);
  const label = (s: typeof steps[0]) => lang === 'np' ? s.np : s.en;

  return (
    <div className="flex flex-col gap-0 py-1">
      {steps.map((step, i) => {
        const isCompleted = i < activeIdx;
        const isActive = i === activeIdx;
        const isUpcoming = i > activeIdx;
        const isLast = i === steps.length - 1;

        return (
          <div key={step.key} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className={[
                'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 relative',
                isCompleted ? 'bg-kb-forest text-white' : '',
                isActive ? 'bg-kb-forest text-white' : '',
                isUpcoming ? 'bg-white border-2 border-kb-border text-kb-muted' : '',
              ].join(' ')}>
                {isCompleted ? '✓' : i + 1}
                {isActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-kb-marigold rounded-full animate-pulse" />
                )}
              </div>
              {!isLast && (
                <div className={['w-0.5 h-6', isCompleted ? 'bg-kb-forest' : 'bg-kb-border'].join(' ')} />
              )}
            </div>
            <span className={[
              'text-[13px] pt-0.5',
              isActive ? 'font-semibold text-kb-text' : '',
              isCompleted ? 'text-kb-success line-through opacity-70' : '',
              isUpcoming ? 'text-kb-muted' : '',
            ].join(' ')}>
              {label(step)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
