import CiudadOSSection from './CiudadOSSection';
import { PDN_CONFIG, XCIEN_CORPORATE_THEME } from './ciudadConfigs';
import { ThemeConfig } from '../types';

export default function BlackstoneOSSection({ theme: _theme }: { theme: ThemeConfig }) {
  return <CiudadOSSection config={PDN_CONFIG} theme={XCIEN_CORPORATE_THEME} />;
}
