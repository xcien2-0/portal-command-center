import CiudadOSSection from './CiudadOSSection';
import { SLT_CONFIG } from './ciudadConfigs';
import { ThemeConfig } from '../types';

export default function SaltilloOSSection({ theme }: { theme: ThemeConfig }) {
  return <CiudadOSSection config={SLT_CONFIG} theme={theme} />;
}
