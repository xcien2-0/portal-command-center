import { Home, Radio, FileText, Presentation, Satellite, UserPlus, Shield, Phone, BarChart3, LayoutDashboard, ScanLine } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const items = [
  { title: 'Inicio', url: '/', icon: Home },
  { title: 'Red en Vivo', url: '/red-en-vivo', icon: Radio },
  { title: 'Coco Box', url: '/coco-monitor', icon: Satellite },
  { title: 'Onboarding', url: '/coco-onboarding', icon: UserPlus },
  { title: 'Call Center', url: '/call-center', icon: Phone },
  { title: 'NOC VIP', url: '/noc-vip', icon: Shield },
  { title: 'Reportes GOB', url: '/reportes-gobierno', icon: FileText, gob: true },
  { title: 'Impacto', url: '/reporte-impacto', icon: BarChart3 },
  { title: 'Gerencia', url: '/gerencia', icon: LayoutDashboard },
  { title: 'Pitch Deck', url: '/pitch', icon: Presentation },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest">
            {!collapsed && 'ISP Portal'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className="hover:bg-accent/50" activeClassName="bg-accent text-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                      {!collapsed && (item as any).gob && (
                        <Badge className="ml-auto bg-gob-navy text-white text-[9px] px-1 py-0 h-4">GOB</Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
