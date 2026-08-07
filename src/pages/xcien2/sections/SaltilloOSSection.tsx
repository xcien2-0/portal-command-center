import CiudadOSSection from './CiudadOSSection';
import { SLT_CONFIG, XCIEN_CORPORATE_THEME } from './ciudadConfigs';
import { ThemeConfig } from '../types';

export default function SaltilloOSSection({ theme: _theme }: { theme: ThemeConfig }) {
  return <CiudadOSSection config={SLT_CONFIG} theme={XCIEN_CORPORATE_THEME} />;
}
