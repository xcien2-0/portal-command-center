import { useState } from 'react';
import {
  Home, Radio, FileText, Presentation, Satellite, UserPlus, Shield, Phone,
  BarChart3, LayoutDashboard, ScanLine, Monitor, Send, GraduationCap,
  ChevronDown, Activity, Settings, FileBarChart, Users, BookOpen, ExternalLink,
  Database, TrendingUp,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';

type Item = { title: string; url: string; icon: any; gob?: boolean; external?: boolean };

const topItems: Item[] = [
  { title: 'Inicio', url: '/', icon: Home },
  { title: 'Red en Vivo', url: '/red-en-vivo', icon: Radio },
];

const nocGroup: { label: string; icon: any; main: Item; children: Item[] } = {
  label: 'NOC',
  icon: Shield,
  main: { title: 'Vista Global NOC', url: '/noc', icon: Monitor },
  children: [],
};

const opsGroup: { label: string; icon: any; children: Item[] } = {
  label: 'Operaciones',
  icon: Settings,
  children: [
    { title: 'Dispatch', url: '/dispatch', icon: Send },
    { title: 'Call Center', url: '/call-center', icon: Phone },
    { title: 'Scanner', url: '/scan', icon: ScanLine },
  ],
};

const reportsGroup: { label: string; icon: any; children: Item[] } = {
  label: 'Reportes',
  icon: FileBarChart,
  children: [
    { title: 'Gerencia', url: '/gerencia', icon: LayoutDashboard },
    { title: 'Gobierno', url: '/reportes-gobierno', icon: FileText, gob: true },
    { title: 'Impacto', url: '/reporte-impacto', icon: BarChart3 },
  ],
};

const estrategiaGroup: { label: string; icon: any; children: Item[] } = {
  label: 'Estrategia & Datos',
  icon: TrendingUp,
  children: [
    { title: 'Métricas & KPIs', url: '/metricas', icon: BarChart3 },
    { title: 'Migración Odoo', url: '/migracion', icon: Database },
  ],
};

const academiaGroup: { label: string; icon: any; main: Item; children: Item[] } = {
  label: 'Academia XCIEN',
  icon: GraduationCap,
  main: { title: 'Dashboard', url: '/academia', icon: Home },
  children: [
    { title: 'Biblioteca & Exámenes', url: 'http://localhost:8000', icon: BookOpen, external: true },
    { title: 'WFM Control Operativo', url: 'http://localhost:8000/wfm.html', icon: Users, external: true },
  ],
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const path = location.pathname;

  const nocActive = path === nocGroup.main.url || nocGroup.children.some(c => path.startsWith(c.url));
  const opsActive = opsGroup.children.some(c => path.startsWith(c.url));
  const reportsActive = reportsGroup.children.some(c => path.startsWith(c.url));

  const academiaActive = path.startsWith('/academia');
  const estrategiaActive = estrategiaGroup.children.some(c => path.startsWith(c.url));
  const [nocOpen, setNocOpen] = useState(nocActive);
  const [opsOpen, setOpsOpen] = useState(opsActive);
  const [reportsOpen, setReportsOpen] = useState(reportsActive);
  const [estrategiaOpen, setEstrategiaOpen] = useState(estrategiaActive);
  const [academiaOpen, setAcademiaOpen] = useState(academiaActive);

  const renderItem = (item: Item) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild tooltip={collapsed ? item.title : undefined}>
        {item.external ? (
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center hover:bg-accent/50 rounded-md px-2 py-1.5 w-full text-sm">
            <item.icon className="mr-2 h-4 w-4" />
            {!collapsed && <span>{item.title}</span>}
            {!collapsed && <ExternalLink className="ml-auto h-3 w-3 opacity-40" />}
          </a>
        ) : (
          <NavLink to={item.url} end className="hover:bg-accent/50" activeClassName="bg-accent text-primary font-medium">
            <item.icon className="mr-2 h-4 w-4" />
            {!collapsed && <span>{item.title}</span>}
            {!collapsed && item.gob && (
              <Badge className="ml-auto bg-gob-navy text-white text-[9px] px-1 py-0 h-4">GOB</Badge>
            )}
          </NavLink>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  const renderGroup = (
    group: { label: string; icon: any; main?: Item; children: Item[] },
    open: boolean,
    setOpen: (v: boolean) => void,
    isActive: boolean,
  ) => {
    // When collapsed: render flat icons (main + children) so they remain reachable
    if (collapsed) {
      return (
        <>
          {group.main && renderItem(group.main)}
          {group.children.map(renderItem)}
        </>
      );
    }

    return (
      <Collapsible open={open} onOpenChange={setOpen} className="group/collapsible">
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton className={isActive ? 'text-primary font-medium' : ''}>
              <group.icon className="mr-2 h-4 w-4" />
              <span>{group.label}</span>
              <ChevronDown className={`ml-auto h-3.5 w-3.5 transition-transform ${open ? 'rotate-0' : '-rotate-90'}`} />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {group.main && (
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton asChild>
                    <NavLink to={group.main.url} end className="hover:bg-accent/50" activeClassName="bg-accent text-primary font-medium">
                      <group.main.icon className="mr-2 h-3.5 w-3.5" />
                      <span>{group.main.title}</span>
                    </NavLink>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              )}
              {group.children.map(child => (
                <SidebarMenuSubItem key={child.title}>
                  <SidebarMenuSubButton asChild>
                    {child.external ? (
                      <a href={child.url} target="_blank" rel="noopener noreferrer" className="flex items-center hover:bg-accent/50 rounded-md w-full text-sm">
                        <child.icon className="mr-2 h-3.5 w-3.5" />
                        <span>{child.title}</span>
                        <ExternalLink className="ml-auto h-3 w-3 opacity-40" />
                      </a>
                    ) : (
                      <NavLink to={child.url} className="hover:bg-accent/50" activeClassName="bg-accent text-primary font-medium">
                        <child.icon className="mr-2 h-3.5 w-3.5" />
                        <span>{child.title}</span>
                        {child.gob && (
                          <Badge className="ml-auto bg-gob-navy text-white text-[9px] px-1 py-0 h-4">GOB</Badge>
                        )}
                      </NavLink>
                    )}
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest">
            {collapsed ? (
              <img src="/xcien.png" alt="XCIEN" className="h-6 w-6 object-contain mx-auto" />
            ) : (
              <div className="flex items-center gap-2 py-1">
                <img src="/xcien.png" alt="XCIEN" className="h-7 w-auto object-contain" />
                <span className="text-[11px] font-semibold tracking-widest text-sidebar-foreground">2.0</span>
              </div>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {topItems.map(renderItem)}
              {renderGroup(nocGroup, nocOpen, setNocOpen, nocActive)}
              {renderGroup(opsGroup, opsOpen, setOpsOpen, opsActive)}
              {renderGroup(reportsGroup, reportsOpen, setReportsOpen, reportsActive)}
              {renderGroup(estrategiaGroup, estrategiaOpen, setEstrategiaOpen, estrategiaActive)}
              {renderGroup(academiaGroup, academiaOpen, setAcademiaOpen, academiaActive)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
