import { useAuth } from '@/hooks/use-auth';
import { Navigate, useLocation } from 'react-router-dom';

interface PublicOnlyRouteProps {
  children: React.ReactNode;
}

export function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    const intendedDestination = location.state?.from || '/';
    return <Navigate to={intendedDestination} replace />;
  }

  return <>{children}</>;
}
