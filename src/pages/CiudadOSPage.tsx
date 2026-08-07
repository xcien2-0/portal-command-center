import { useEffect } from 'react';
import CiudadOSSection from './xcien2/sections/CiudadOSSection';
import { PDN_CONFIG, XCIEN_CORPORATE_THEME } from './xcien2/sections/ciudadConfigs';

export default function CiudadOSPage({ plaza }: { plaza: string }) {
  useEffect(() => {
    document.title = 'Piedras Negras OS · XCIEN';
  }, []);

  if (plaza !== 'pdn') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f8fdf9', color: '#5a5a5a', fontFamily: 'monospace',
        flexDirection: 'column', gap: 8,
      }}>
        <div style={{ fontSize: 32 }}>404</div>
        <div>Plaza no disponible: {plaza}</div>
      </div>
    );
  }

  return (
    <div style={{ height: '100dvh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <CiudadOSSection config={PDN_CONFIG} theme={XCIEN_CORPORATE_THEME} />
    </div>
  );
}
