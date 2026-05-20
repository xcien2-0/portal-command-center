import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  requiredPortal: 'empleado' | 'cliente';
}

export default function ProtectedRoute({ requiredPortal }: ProtectedRouteProps) {
  const { user, portalType, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{ backgroundColor: '#0a1628' }}
        className="min-h-screen flex items-center justify-center"
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
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
