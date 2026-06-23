import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from 'wouter';
import { Spinner } from '@/components/ui/spinner';
import { UserRole } from '@workspace/api-client-react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        setLocation('/');
      } else if (allowedRoles && !allowedRoles.includes(user.role)) {
        setLocation('/dashboard');
      }
    }
  }, [user, loading, allowedRoles, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-kb-cream">
        <Spinner className="w-8 h-8 text-kb-forest" />
      </div>
    );
  }

  if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}