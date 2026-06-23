import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useGetOrders, getGetOrdersQueryKey } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { ArrowLeft, Package, Clock, CheckCircle2, Truck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function OrdersPage() {
  const { t, i18n } = useTranslation();
  const { token } = useAuth();
  const isNp = i18n.language === 'np';

  const { data: orders, isLoading } = useGetOrders({
    query: {
      enabled: !!token,
      queryKey: getGetOrdersQueryKey()
    }
  });

  const getStatusSteps = (layer_type: 'SUPPLY' | 'DEMAND') => {
    if (layer_type === 'SUPPLY') {
      return [
        { id: 'ORDER_RECEIVED', label: 'Received', icon: Clock },
        { id: 'DISPATCHED_TO_COLLECT', label: 'Dispatched', icon: Truck },
        { id: 'COLLECTED', label: 'Collected', icon: CheckCircle2 }
      ];
    }
    return [
      { id: 'ORDER_RECEIVED', label: 'Received', icon: Clock },
      { id: 'DISPATCHED', label: 'Dispatched', icon: Truck },
      { id: 'DELIVERED', label: 'Delivered', icon: CheckCircle2 }
    ];
  };

  const getStepIndex = (status: string, steps: any[]) => {
    return steps.findIndex(s => s.id === status);
  };

  return (
    <div className="min-h-screen bg-kb-cream w-full font-sans pb-20">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 shadow-sm border-b border-kb-border">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/dashboard" className="p-2 -ml-2 text-kb-deep hover:bg-kb-cream rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-bold text-xl text-kb-deep">{t('nav.orders')}</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-[16px] p-5">
                <div className="flex justify-between items-center mb-4">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <div className="flex items-center gap-3 mb-6">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            {orders?.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-kb-muted mb-4 shadow-sm border border-kb-border">
                  <Package size={24} />
                </div>
                <p className="text-kb-deep font-bold text-lg">No orders yet</p>
                <p className="text-sm text-kb-muted mt-1">Your orders will appear here</p>
              </div>
            ) : (
              orders?.map(order => {
                const steps = getStatusSteps(order.layer_type);
                const currentIndex = getStepIndex(order.status, steps);

                return (
                  <div key={order.id} className="bg-white rounded-[16px] shadow-sm border border-kb-border overflow-hidden">
                    <div className="p-4 border-b border-kb-border/50 flex justify-between items-center bg-kb-cream/30">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-kb-deep text-white uppercase tracking-wider">
                          {order.layer_type}
                        </span>
                        <span className="text-xs font-semibold text-kb-muted">#{order.order_id}</span>
                      </div>
                      <span className="text-xs font-semibold text-kb-deep">{order.target_date_bs}</span>
                    </div>
                    
                    <div className="p-5">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 bg-kb-cream rounded-xl flex items-center justify-center text-2xl">
                          📦
                        </div>
                        <div>
                          <h3 className="font-bold text-kb-text text-lg">
                            {isNp ? order.crop_name_np : order.crop_name}
                          </h3>
                          <div className="text-sm text-kb-forest font-bold mt-0.5">
                            {order.weight_kg} <span className="text-xs font-semibold">{t('common.kg')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="relative mt-2 px-2">
                        <div className="absolute top-3 left-4 right-4 h-0.5 bg-kb-border/60 z-0"></div>
                        <div 
                          className="absolute top-3 left-4 h-0.5 bg-kb-leaf z-0 transition-all duration-500"
                          style={{ width: `calc(${(currentIndex / (steps.length - 1)) * 100}% - 16px)` }}
                        ></div>
                        
                        <div className="relative z-10 flex justify-between">
                          {steps.map((step, idx) => {
                            const isCompleted = idx <= currentIndex;
                            const isActive = idx === currentIndex;
                            const StepIcon = step.icon;
                            
                            return (
                              <div key={step.id} className="flex flex-col items-center gap-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                                  isCompleted 
                                    ? 'bg-kb-leaf border-kb-leaf text-white' 
                                    : 'bg-white border-kb-border text-kb-muted'
                                } ${isActive ? 'ring-4 ring-kb-leaf/20' : ''}`}>
                                  {isCompleted && <CheckCircle2 size={12} strokeWidth={3} />}
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                  isActive ? 'text-kb-deep' : isCompleted ? 'text-kb-leaf' : 'text-kb-muted'
                                }`}>
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}