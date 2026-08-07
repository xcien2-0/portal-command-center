import CiudadOSSection from './CiudadOSSection';
import { MTY_CONFIG } from './ciudadConfigs';
import { ThemeConfig } from '../types';

export default function MonterreyOSSection({ theme }: { theme: ThemeConfig }) {
  return <CiudadOSSection config={MTY_CONFIG} theme={theme} />;
}
