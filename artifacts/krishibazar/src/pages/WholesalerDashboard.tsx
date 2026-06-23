import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { BottomNav } from '@/components/layout/BottomNav';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { OrderTimeline } from '@/components/ui/OrderTimeline';
import { BSDatePicker } from '@/components/ui/BSDatePicker';
import { formatBSDate } from '@/lib/bs-calendar';
import { ShoppingCart, LogOut, CheckCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';

type Step = 1 | 2 | 3 | 4;
type CategoryFilter = 'ALL' | 'VEGETABLE' | 'PICKLE';

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    ORDER_RECEIVED: 'bg-amber-50 text-amber-700 border-amber-200',
    DISPATCHED: 'bg-blue-50 text-blue-700 border-blue-200',
    DELIVERED: 'bg-green-50 text-green-700 border-green-200',
  };
  const labels: Record<string, string> = {
    ORDER_RECEIVED: 'Order Received',
    DISPATCHED: 'Dispatched',
    DELIVERED: 'Delivered',
  };
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${cls[status] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
      {labels[status] ?? status}
    </span>
  );
}

export default function WholesalerDashboard() {
  const { t, i18n } = useTranslation();
  const { user, token, logout } = useAuth();
  const { language } = useLanguage();
  const lang = i18n.language as 'en' | 'np';

  const [activeTab, setActiveTab] = useState<'place' | 'orders'>('place');
  const [step, setStep] = useState<Step>(1);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');
  const [selectedCrop, setSelectedCrop] = useState<any>(null);
  const [weightKg, setWeightKg] = useState('');
  const [deliveryDate, setDeliveryDate] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [successOrder, setSuccessOrder] = useState<any>(null);

  const loadCatalog = async () => {
    if (catalog.length) return;
    setCatalogLoading(true);
    try {
      const res = await fetch('/api/catalog', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setCatalog((data || []).filter((c: any) => c.is_available));
    } finally {
      setCatalogLoading(false);
    }
  };

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch('/api/orders/my', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setMyOrders(data || []);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleTabChange = (tab: 'place' | 'orders') => {
    setActiveTab(tab);
    if (tab === 'place') { loadCatalog(); setStep(1); setSuccessOrder(null); }
    if (tab === 'orders') loadOrders();
  };

  const filteredCatalog = catalog.filter((c) => categoryFilter === 'ALL' || c.category === categoryFilter);

  const handlePlaceOrder = async () => {
    if (!selectedCrop || !weightKg || !deliveryDate) return;
    setPlacing(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ crop_id: selectedCrop.id, weight_kg: Number(weightKg), target_date_bs: deliveryDate }),
      });
      if (!res.ok) throw new Error('Order failed');
      const order = await res.json();
      setSuccessOrder(order);
      toast.success(t('orders.orderPlaced'));
    } catch {
      toast.error(t('errors.serverError'));
    } finally {
      setPlacing(false);
    }
  };

  const copyOrderId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success('Copied!');
  };

  const statusBorderColor: Record<string, string> = {
    ORDER_RECEIVED: 'border-l-kb-marigold',
    DISPATCHED: 'border-l-blue-500',
    DELIVERED: 'border-l-green-500',
  };

  return (
    <div className="min-h-screen bg-kb-cream pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-kb-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-kb-marigold rounded-lg flex items-center justify-center">
            <ShoppingCart className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-kb-text leading-none">{t('app.name')}</p>
            <p className="text-[10px] text-kb-muted leading-none">{t('roles.WHOLESALER')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <button onClick={logout} className="p-1.5 rounded-lg hover:bg-kb-cream">
            <LogOut className="w-4 h-4 text-kb-muted" />
          </button>
        </div>
      </div>

      {/* Welcome strip */}
      <div className="px-4 py-3 bg-gradient-to-r from-kb-marigold to-orange-400">
        <p className="text-white/80 text-[12px]">{t('dashboard.welcome')},</p>
        <p className="text-white font-bold text-[16px]">{user?.full_name}</p>
        <p className="text-white/70 text-[11px] mt-0.5">{user?.primary_address || t('auth.dropoffLocation')}</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-kb-border">
        {(['place', 'orders'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={[
              'flex-1 py-3 text-[13px] font-semibold transition-colors border-b-2',
              activeTab === tab ? 'border-kb-marigold text-kb-marigold' : 'border-transparent text-kb-muted',
            ].join(' ')}
          >
            {tab === 'place' ? t('orders.placeOrder') : t('orders.myOrders')}
          </button>
        ))}
      </div>

      <div className="px-4 py-4">
        {activeTab === 'place' && (
          <>
            {successOrder ? (
              <div className="flex flex-col items-center py-10 gap-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-kb-text">🎉 {t('orders.orderPlaced')}</h2>
                <p className="text-kb-muted text-sm">{t('orders.orderIdLabel')}</p>
                <div className="flex items-center gap-2 bg-kb-cream rounded-xl px-4 py-3">
                  <span className="font-mono text-[20px] font-bold text-kb-marigold">{successOrder.order_id}</span>
                  <button onClick={() => copyOrderId(successOrder.order_id)} className="p-1 hover:bg-kb-border rounded">
                    <Copy className="w-4 h-4 text-kb-muted" />
                  </button>
                </div>
                <button
                  onClick={() => { setSuccessOrder(null); handleTabChange('orders'); }}
                  className="mt-2 bg-kb-marigold text-white rounded-xl px-6 py-3 font-semibold text-sm w-full"
                >
                  {t('orders.viewMyOrders')}
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[12px] text-kb-muted">{t('orders.stepOf', { current: step, total: 4 })}</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((s) => (
                      <div key={s} className={['w-2 h-2 rounded-full', s <= step ? 'bg-kb-marigold' : 'bg-kb-border'].join(' ')} />
                    ))}
                  </div>
                </div>

                {step === 1 && (
                  <div>
                    <h2 className="text-[16px] font-bold text-kb-text mb-1">{t('orders.whatDoYouNeed')}</h2>
                    <p className="text-[13px] text-kb-muted mb-3">{t('orders.selectProduce')}</p>
                    {/* Category filter */}
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                      {(['ALL', 'VEGETABLE', 'PICKLE'] as CategoryFilter[]).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setCategoryFilter(cat)}
                          className={[
                            'px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap border',
                            categoryFilter === cat ? 'bg-kb-marigold text-white border-kb-marigold' : 'bg-white text-kb-muted border-kb-border',
                          ].join(' ')}
                        >
                          {cat === 'ALL' ? t('orders.allCategories') : cat === 'VEGETABLE' ? t('orders.vegetables') : t('orders.pickles')}
                        </button>
                      ))}
                    </div>
                    {catalogLoading ? (
                      <div className="grid grid-cols-2 gap-3">
                        {[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />)}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {filteredCatalog.map((crop) => (
                          <button
                            key={crop.id}
                            onClick={() => setSelectedCrop(crop)}
                            className={[
                              'relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                              selectedCrop?.id === crop.id
                                ? 'border-kb-marigold bg-orange-50 shadow-md'
                                : 'border-kb-border bg-white',
                            ].join(' ')}
                          >
                            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-[20px] font-bold text-kb-marigold">
                              {(lang === 'np' ? crop.crop_name_np : crop.crop_name).charAt(0)}
                            </div>
                            <span className="text-[13px] font-semibold text-kb-text">
                              {lang === 'np' ? crop.crop_name_np : crop.crop_name}
                            </span>
                            {selectedCrop?.id === crop.id && (
                              <span className="absolute top-2 right-2 w-5 h-5 bg-kb-marigold rounded-full flex items-center justify-center text-white text-[10px]">✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => { loadCatalog(); setStep(2); }}
                      disabled={!selectedCrop}
                      className="mt-6 w-full bg-kb-marigold text-white rounded-xl py-3 font-semibold disabled:opacity-50"
                    >
                      {t('orders.next')}
                    </button>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <h2 className="text-[16px] font-bold text-kb-text mb-1">{t('orders.howManyKg')}</h2>
                    <p className="text-[13px] text-kb-muted mb-4">{t('orders.enterQuantity')}</p>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        max={10000}
                        value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="0"
                        className="w-full text-[32px] font-bold text-kb-text bg-white border-2 border-kb-border rounded-xl px-5 py-4 pr-16 focus:border-kb-marigold outline-none"
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[18px] font-bold text-kb-muted">{t('common.kg')}</span>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button onClick={() => setStep(1)} className="flex-1 border-2 border-kb-border text-kb-text rounded-xl py-3 font-semibold">{t('orders.back')}</button>
                      <button onClick={() => setStep(3)} disabled={!weightKg || Number(weightKg) < 1} className="flex-1 bg-kb-marigold text-white rounded-xl py-3 font-semibold disabled:opacity-50">{t('orders.next')}</button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <h2 className="text-[16px] font-bold text-kb-text mb-1">{t('orders.whenDelivery')}</h2>
                    <p className="text-[13px] text-kb-muted mb-4">{t('orders.selectDate')}</p>
                    <BSDatePicker selectedDate={deliveryDate} onSelect={setDeliveryDate} lang={lang} />
                    <div className="flex gap-3 mt-6">
                      <button onClick={() => setStep(2)} className="flex-1 border-2 border-kb-border text-kb-text rounded-xl py-3 font-semibold">{t('orders.back')}</button>
                      <button onClick={() => setStep(4)} disabled={!deliveryDate} className="flex-1 bg-kb-marigold text-white rounded-xl py-3 font-semibold disabled:opacity-50">{t('orders.next')}</button>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div>
                    <h2 className="text-[16px] font-bold text-kb-text mb-4">{t('orders.reviewOrder')}</h2>
                    <div className="bg-white rounded-xl border border-kb-border p-4 space-y-3 mb-6">
                      <div className="flex justify-between text-[14px]">
                        <span className="text-kb-muted">{t('orders.crop')}</span>
                        <span className="font-semibold text-kb-text">{lang === 'np' ? selectedCrop?.crop_name_np : selectedCrop?.crop_name}</span>
                      </div>
                      <div className="flex justify-between text-[14px]">
                        <span className="text-kb-muted">{t('orders.quantity')}</span>
                        <span className="font-semibold text-kb-text">{weightKg} {t('common.kg')}</span>
                      </div>
                      <div className="flex justify-between text-[14px]">
                        <span className="text-kb-muted">{t('orders.deliveryDate')}</span>
                        <span className="font-semibold text-kb-text">{deliveryDate ? formatBSDate(deliveryDate, lang) : '—'}</span>
                      </div>
                      <div className="flex justify-between text-[14px]">
                        <span className="text-kb-muted">{t('orders.location')}</span>
                        <span className="font-semibold text-kb-text">{user?.primary_address || '—'}</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setStep(3)} className="flex-1 border-2 border-kb-border text-kb-text rounded-xl py-3 font-semibold">{t('orders.back')}</button>
                      <button onClick={handlePlaceOrder} disabled={placing} className="flex-1 bg-kb-marigold text-white rounded-xl py-3 font-semibold disabled:opacity-50">
                        {placing ? t('common.loading') : t('orders.confirm')}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeTab === 'orders' && (
          <div>
            {ordersLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white rounded-xl animate-pulse" />)}
              </div>
            ) : myOrders.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-3 text-center">
                <div className="text-5xl">🛒</div>
                <p className="font-bold text-kb-text">{t('orders.noOrders')}</p>
                <p className="text-kb-muted text-sm">{t('orders.noOrdersHint')}</p>
                <button onClick={() => handleTabChange('place')} className="mt-2 bg-kb-marigold text-white rounded-xl px-6 py-3 font-semibold text-sm">
                  {t('orders.placeOrder')}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myOrders.map((order) => (
                  <div key={order.id} className={`bg-white rounded-xl border border-kb-border border-l-4 ${statusBorderColor[order.status] ?? 'border-l-kb-border'} p-4`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[14px] font-bold text-kb-marigold">{order.order_id}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="flex items-center gap-3 text-[13px] text-kb-muted mb-3">
                      <span className="font-semibold text-kb-text">{lang === 'np' ? order.crop_name_np : order.crop_name}</span>
                      <span>·</span>
                      <span>{order.weight_kg} {t('common.kg')}</span>
                      <span>·</span>
                      <span>{order.target_date_bs ? formatBSDate(order.target_date_bs, lang) : '—'}</span>
                    </div>
                    <OrderTimeline status={order.status} layerType="DEMAND" lang={lang} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav role="WHOLESALER" />
    </div>
  );
}
