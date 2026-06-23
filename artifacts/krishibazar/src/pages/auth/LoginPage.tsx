import { useState, useEffect } from 'react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { Link, useLocation } from 'wouter';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login, user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && !authLoading) {
      if (user.role === 'ADMIN') {
        setLocation('/admin');
      } else if (user.role === 'FARMER') {
        setLocation('/farmer');
      } else {
        setLocation('/wholesaler');
      }
    }
  }, [user, authLoading, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!phone || !password) {
      setError(t('errors.required'));
      return;
    }
    
    if (phone.length !== 10 || !/^(97|98)\d{8}$/.test(phone)) {
      setError(t('errors.invalidPhone'));
      return;
    }

    setLoading(true);
    try {
      await login({ phone, password });
      // Redirect is handled by effect
    } catch (err: any) {
      setError(t('errors.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-kb-text">{t('auth.loginTitle')}</h2>
        <p className="text-sm text-kb-muted mt-1">{t('auth.loginSubtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-1">
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
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <span className="text-[11px] text-kb-muted">(Coming soon)</span>
          </div>
          <div className="relative">
            <Input 
              id="password"
              type={showPassword ? "text" : "password"}
              className="pr-10 rounded-[10px]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

        {error && <p className="text-sm text-kb-error">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full mt-2 rounded-[10px] bg-kb-forest hover:bg-kb-deep text-white h-12">
          {loading ? (
            <span className="flex items-center gap-2"><span className="animate-spin inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full" /> {t('common.loading')}</span>
          ) : (
            <span className="flex items-center gap-2"><LogIn size={18} /> {t('auth.signIn')}</span>
          )}
        </Button>

        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="h-[1px] bg-kb-border flex-1" />
          <span className="text-xs text-kb-muted uppercase tracking-wider font-medium">or</span>
          <div className="h-[1px] bg-kb-border flex-1" />
        </div>

        <div className="mt-6 text-center text-sm">
          <span className="text-kb-muted">{t('auth.noAccount')}</span>{' '}
          <Link href="/register" className="text-kb-forest font-semibold hover:underline">
            {t('auth.signUp')}
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}