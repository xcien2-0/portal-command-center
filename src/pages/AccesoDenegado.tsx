import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function AccesoDenegado() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#0a1628' }}
    >
      <div
        className="text-center max-w-md p-10 rounded-2xl"
        style={{
          backgroundColor: '#0f1f38',
          border: '1px solid rgba(239,68,68,0.3)',
        }}
      >
        <div className="text-6xl mb-4">🔒</div>
        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: '#f87171' }}
        >
          Acceso no autorizado
        </h1>
        <p className="mb-6 text-sm" style={{ color: '#94a3b8' }}>
          No tienes permisos para ver esta página. Por favor inicia sesión con
          las credenciales correctas.
        </p>
        <Button
          onClick={() => navigate('/login')}
          style={{ backgroundColor: '#00B4D8', color: '#001a26' }}
          className="font-semibold"
        >
          Ir al inicio de sesión
        </Button>
      </div>
    </div>
  );
}
