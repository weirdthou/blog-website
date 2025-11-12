import { useAuth } from '@/hooks/use-auth';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: ('admin' | 'author' | 'reader')[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (
    roles &&
    user &&
    !roles.includes(user.role as 'admin' | 'author' | 'reader')
  ) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
