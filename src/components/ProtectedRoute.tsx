import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { PortalType } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  requiredPortal: PortalType;
}

export function ProtectedRoute({ requiredPortal }: ProtectedRouteProps) {
  const { user, portalType, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#0a1628' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: '#00B4D8', borderTopColor: 'transparent' }}
          />
          <p className="text-sm" style={{ color: '#94a3b8' }}>
            Cargando...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (portalType !== requiredPortal) {
    return <Navigate to="/acceso-denegado" replace />;
  }

  return <Outlet />;
}
