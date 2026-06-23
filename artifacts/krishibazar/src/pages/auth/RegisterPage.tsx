import { useState } from 'react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { Link, useLocation } from 'wouter';
import { Eye, EyeOff, UserPlus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserRegistrationRole } from '@workspace/api-client-react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const [, setLocation] = useLocation();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<UserRegistrationRole | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNext = () => {
    if (role) setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setError('');
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.fullName || !formData.phone || !formData.address || !formData.password || !formData.confirmPassword) {
      setError(t('errors.required'));
      return;
    }
    
    if (formData.phone.length !== 10 || !/^(97|98)\d{8}$/.test(formData.phone)) {
      setError(t('errors.invalidPhone'));
      return;
    }

    if (formData.password.length < 6) {
      setError(t('errors.passwordLength'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('errors.passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      await register({
        full_name: formData.fullName,
        phone: formData.phone,
        password: formData.password,
        email: formData.email || undefined,
        primary_address: formData.address,
        role: role!
      });
      toast.success("Account created successfully!");
      setLocation('/dashboard');
    } catch (err: any) {
      setError(t('errors.registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-6 text-center relative">
        {step === 2 && (
          <button 
            onClick={handleBack}
            className="absolute left-0 top-1/2 -translate-y-1/2 p-2 -ml-2 text-kb-muted hover:text-kb-deep transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="text-xs font-bold text-kb-marigold uppercase tracking-wider mb-2">
          Step {step} of 2
        </div>
        <h2 className="text-2xl font-bold text-kb-text">
          {step === 1 ? t('auth.selectRole') : t('auth.registerTitle')}
        </h2>
        <p className="text-sm text-kb-muted mt-1">
          {step === 1 ? t('auth.roleHint') : t('auth.registerSubtitle')}
        </p>
      </div>

      {step === 1 ? (
        <div className="flex flex-col gap-4 flex-1">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setRole(UserRegistrationRole.FARMER)}
              className={`p-4 rounded-[16px] text-left transition-all ${
                role === UserRegistrationRole.FARMER 
                  ? 'border-2 border-kb-forest bg-kb-forest/5 shadow-card relative' 
                  : 'border border-kb-border bg-white hover:border-kb-forest/50'
              }`}
            >
              {role === UserRegistrationRole.FARMER && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-kb-forest rounded-full flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
              <div className="text-[40px] mb-3">🌾</div>
              <h3 className="font-bold text-kb-text text-lg">{t('auth.farmer')}</h3>
              <p className="text-xs text-kb-muted mt-1 leading-relaxed">{t('auth.farmerDesc')}</p>
            </button>

            <button
              onClick={() => setRole(UserRegistrationRole.WHOLESALER)}
              className={`p-4 rounded-[16px] text-left transition-all ${
                role === UserRegistrationRole.WHOLESALER 
                  ? 'border-2 border-kb-forest bg-kb-forest/5 shadow-card relative' 
                  : 'border border-kb-border bg-white hover:border-kb-forest/50'
              }`}
            >
              {role === UserRegistrationRole.WHOLESALER && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-kb-forest rounded-full flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
              <div className="text-[40px] mb-3">🏪</div>
              <h3 className="font-bold text-kb-text text-lg">{t('auth.wholesaler')}</h3>
              <p className="text-xs text-kb-muted mt-1 leading-relaxed">{t('auth.wholesalerDesc')}</p>
            </button>
          </div>
          
          <div className="mt-auto pt-6">
            <Button 
              onClick={handleNext} 
              disabled={!role} 
              className="w-full rounded-[10px] bg-kb-forest hover:bg-kb-deep text-white h-12"
            >
              {t('auth.continue')}
            </Button>
            
            <div className="mt-6 text-center text-sm">
              <span className="text-kb-muted">{t('auth.haveAccount')}</span>{' '}
              <Link href="/" className="text-kb-forest font-semibold hover:underline">
                {t('auth.signIn')}
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">{t('auth.fullName')}</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-base">👤</div>
              <Input 
                id="fullName"
                className="pl-10 rounded-[10px]"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">{t('auth.phone')}</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-base">🇳🇵</div>
              <Input 
                id="phone"
                type="tel"
                maxLength={10}
                placeholder="98XXXXXXXX"
                className="pl-10 rounded-[10px]"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">{t('auth.emailOptional')}</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-base">✉️</div>
              <Input 
                id="email"
                type="email"
                className="pl-10 rounded-[10px]"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">
              {role === UserRegistrationRole.FARMER ? t('auth.pickupLocation') : t('auth.dropoffLocation')}
            </Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-base">📍</div>
              <Input 
                id="address"
                className="pl-10 rounded-[10px]"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <div className="relative">
              <Input 
                id="password"
                type={showPassword ? "text" : "password"}
                className="pr-10 rounded-[10px]"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
              />
              <button 
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-kb-muted"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
            <div className="relative">
              <Input 
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                className="pr-10 rounded-[10px]"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
              />
              <button 
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-kb-muted"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-kb-error">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full mt-2 rounded-[10px] bg-kb-forest hover:bg-kb-deep text-white h-12">
            {loading ? (
              <span className="flex items-center gap-2"><span className="animate-spin inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full" /> {t('common.loading')}</span>
            ) : (
              <span className="flex items-center gap-2"><UserPlus size={18} /> {t('auth.signUp')}</span>
            )}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}