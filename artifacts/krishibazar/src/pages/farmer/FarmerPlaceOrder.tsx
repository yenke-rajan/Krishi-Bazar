import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from 'wouter';
import { BSDatePicker } from '@/components/ui/BSDatePicker';
import { formatBSDate } from '@/lib/bs-calendar';
import { CheckCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';

type Step = 1 | 2 | 3 | 4;

export default function FarmerPlaceOrder() {
  const { t, i18n } = useTranslation();
  const { user, token } = useAuth();
  const [, setLocation] = useLocation();
  const lang = i18n.language as 'en' | 'np';

  const [step, setStep] = useState<Step>(1);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<any>(null);
  const [weightKg, setWeightKg] = useState('');
  const [pickupDate, setPickupDate] = useState<string | null>(null);
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

  useEffect(() => { loadCatalog(); }, []);

  const handlePlaceOrder = async () => {
    if (!selectedCrop || !weightKg || !pickupDate) return;
    setPlacing(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ crop_id: selectedCrop.id, weight_kg: Number(weightKg), target_date_bs: pickupDate }),
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

  const copyOrderId = (id: string) => { navigator.clipboard.writeText(id); toast.success('Copied!'); };

  if (successOrder) {
    return (
      <div className="flex flex-col items-center py-10 gap-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-kb-text">🎉 {t('orders.orderPlaced')}</h2>
        <p className="text-kb-muted text-sm">{t('orders.orderIdLabel')}</p>
        <div className="flex items-center gap-2 bg-kb-cream rounded-xl px-4 py-3">
          <span className="font-mono text-[20px] font-bold text-kb-forest">{successOrder.order_id}</span>
          <button onClick={() => copyOrderId(successOrder.order_id)} className="p-1 hover:bg-kb-border rounded">
            <Copy className="w-4 h-4 text-kb-muted" />
          </button>
        </div>
        <button
          onClick={() => setLocation('/farmer/my-orders')}
          className="mt-2 bg-kb-forest text-white rounded-xl px-6 py-3 font-semibold text-sm w-full"
        >
          {t('orders.viewMyOrders')}
        </button>
        <button onClick={() => setSuccessOrder(null)} className="text-kb-muted text-sm underline">
          Place another order
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] text-kb-muted">{t('orders.stepOf', { current: step, total: 4 })}</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={['w-2 h-2 rounded-full', s <= step ? 'bg-kb-forest' : 'bg-kb-border'].join(' ')} />
          ))}
        </div>
      </div>

      {step === 1 && (
        <div>
          <h2 className="text-[16px] font-bold text-kb-text mb-1">{t('orders.whatAreSelling')}</h2>
          <p className="text-[13px] text-kb-muted mb-4">{t('orders.selectProduce')}</p>
          {catalogLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {catalog.map((crop) => (
                <button
                  key={crop.id}
                  onClick={() => setSelectedCrop(crop)}
                  className={['relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                    selectedCrop?.id === crop.id ? 'border-kb-forest bg-kb-forest/5 shadow-md' : 'border-kb-border bg-white'].join(' ')}
                >
                  <div className="w-12 h-12 bg-kb-forest/10 rounded-full flex items-center justify-center text-[20px] font-bold text-kb-forest">
                    {(lang === 'np' ? crop.crop_name_np : crop.crop_name).charAt(0)}
                  </div>
                  <span className="text-[13px] font-semibold text-kb-text">
                    {lang === 'np' ? crop.crop_name_np : crop.crop_name}
                  </span>
                  {selectedCrop?.id === crop.id && (
                    <span className="absolute top-2 right-2 w-5 h-5 bg-kb-forest rounded-full flex items-center justify-center text-white text-[10px]">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setStep(2)}
            disabled={!selectedCrop}
            className="mt-6 w-full bg-kb-forest text-white rounded-xl py-3 font-semibold disabled:opacity-50"
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
              type="number" min={1} max={10000} value={weightKg}
              onChange={(e) => setWeightKg(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="0"
              className="w-full text-[32px] font-bold text-kb-text bg-white border-2 border-kb-border rounded-xl px-5 py-4 pr-16 focus:border-kb-forest outline-none"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[18px] font-bold text-kb-muted">{t('common.kg')}</span>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(1)} className="flex-1 border-2 border-kb-border text-kb-text rounded-xl py-3 font-semibold">{t('orders.back')}</button>
            <button onClick={() => setStep(3)} disabled={!weightKg || Number(weightKg) < 1} className="flex-1 bg-kb-forest text-white rounded-xl py-3 font-semibold disabled:opacity-50">{t('orders.next')}</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="text-[16px] font-bold text-kb-text mb-1">{t('orders.whenReady')}</h2>
          <p className="text-[13px] text-kb-muted mb-4">{t('orders.selectDate')}</p>
          <BSDatePicker selectedDate={pickupDate} onSelect={setPickupDate} lang={lang} />
          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(2)} className="flex-1 border-2 border-kb-border text-kb-text rounded-xl py-3 font-semibold">{t('orders.back')}</button>
            <button onClick={() => setStep(4)} disabled={!pickupDate} className="flex-1 bg-kb-forest text-white rounded-xl py-3 font-semibold disabled:opacity-50">{t('orders.next')}</button>
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
              <span className="text-kb-muted">{t('orders.pickupDate')}</span>
              <span className="font-semibold text-kb-text">{pickupDate ? formatBSDate(pickupDate, lang) : '—'}</span>
            </div>
            <div className="flex justify-between text-[14px]">
              <span className="text-kb-muted">{t('orders.yourLocation')}</span>
              <span className="font-semibold text-kb-text">{user?.primary_address || '—'}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(3)} className="flex-1 border-2 border-kb-border text-kb-text rounded-xl py-3 font-semibold">{t('orders.back')}</button>
            <button onClick={handlePlaceOrder} disabled={placing} className="flex-1 bg-kb-forest text-white rounded-xl py-3 font-semibold disabled:opacity-50">
              {placing ? t('common.loading') : t('orders.confirm')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
