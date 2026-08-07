import { useEffect } from 'react';
import CiudadOSSection from './xcien2/sections/CiudadOSSection';
import { PDN_CONFIG, XCIEN_CORPORATE_THEME } from './xcien2/sections/ciudadConfigs';

export default function CiudadOSPage() {
  useEffect(() => {
    document.title = 'Piedras Negras OS · XCIEN';
  }, []);

  return (
    <div style={{ height: '100dvh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <CiudadOSSection config={PDN_CONFIG} theme={XCIEN_CORPORATE_THEME} />
    </div>
  );
}
