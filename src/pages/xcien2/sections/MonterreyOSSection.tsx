import CiudadOSSection from './CiudadOSSection';
import { MTY_CONFIG, XCIEN_CORPORATE_THEME } from './ciudadConfigs';
import { ThemeConfig } from '../types';

export default function MonterreyOSSection({ theme: _theme }: { theme: ThemeConfig }) {
  return <CiudadOSSection config={MTY_CONFIG} theme={XCIEN_CORPORATE_THEME} />;
}
