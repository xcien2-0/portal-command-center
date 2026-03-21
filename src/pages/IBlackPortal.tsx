import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Home, Package, Headphones, FileText, Settings, MessageCircle } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import IBlackMiConexion from '@/components/iblack/MiConexion';
import IBlackSoporteVip from '@/components/iblack/SoporteVip';

const navItems = [
  { title: 'Mi Conexión', path: '/iblack', icon: Home },
  { title: 'Mi Plan', path: '/iblack/plan', icon: Package },
  { title: 'Soporte VIP', path: '/iblack/soporte', icon: Headphones },
  { title: 'Facturas', path: '/iblack/facturas', icon: FileText },
];

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-[#86868B] text-lg">{title} — Próximamente</p>
    </div>
  );
}

export default function IBlackPortal() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex">
      {/* Sidebar */}
      <aside className="w-60 border-r border-[#E5E5E7] bg-white flex flex-col fixed h-screen">
        {/* Wordmark */}
        <div className="px-6 pt-6 pb-4 flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-[#1D1D1F]">iBlack</span>
          <Badge className="bg-[#C9A84C] text-white text-[10px] px-1.5 py-0 h-4 rounded hover:bg-[#C9A84C]">VIP</Badge>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/iblack'}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] text-[#6E6E73] transition-colors hover:bg-[#F5F5F7]"
              activeClassName="bg-[#1D1D1F] !text-white hover:bg-[#1D1D1F]"
            >
              <item.icon className="h-[18px] w-[18px]" />
              <span>{item.title}</span>
            </NavLink>
          ))}

          <div className="my-4 border-t border-[#E5E5E7]" />

          <NavLink
            to="/iblack/ajustes"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] text-[#6E6E73] transition-colors hover:bg-[#F5F5F7]"
            activeClassName="bg-[#1D1D1F] !text-white hover:bg-[#1D1D1F]"
          >
            <Settings className="h-[18px] w-[18px]" />
            <span>Ajustes</span>
          </NavLink>
        </nav>

        {/* Technician card */}
        <div className="mx-3 mb-4 p-3 rounded-xl bg-[#F5F5F7] border border-[#E5E5E7]">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-[#1D1D1F] text-white text-xs font-medium">CM</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#1D1D1F]">Carlos M.</p>
              <p className="text-[11px] text-[#86868B]">Tu técnico</p>
            </div>
          </div>
          <Button
            size="sm"
            className="w-full mt-2.5 h-8 bg-[#C9A84C] hover:bg-[#B8963D] text-white text-[12px] font-medium rounded-lg"
          >
            <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
            WhatsApp
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-60 min-h-screen">
        <Routes>
          <Route index element={<IBlackMiConexion />} />
          <Route path="plan" element={<PlaceholderPage title="Mi Plan" />} />
          <Route path="soporte" element={<IBlackSoporteVip />} />
          <Route path="facturas" element={<PlaceholderPage title="Facturas" />} />
          <Route path="ajustes" element={<PlaceholderPage title="Ajustes" />} />
          <Route path="*" element={<Navigate to="/iblack" replace />} />
        </Routes>
      </main>
    </div>
  );
}
