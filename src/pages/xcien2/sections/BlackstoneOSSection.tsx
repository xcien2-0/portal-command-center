import CiudadOSSection from './CiudadOSSection';
import { PDN_CONFIG } from './ciudadConfigs';
import { ThemeConfig } from '../types';

export default function BlackstoneOSSection({ theme }: { theme: ThemeConfig }) {
  return <CiudadOSSection config={PDN_CONFIG} theme={theme} />;
}
