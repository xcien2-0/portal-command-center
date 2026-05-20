/**
 * SalaJuntasSection.tsx — Calendarios cruzados
 * Fuentes: Odoo (calendar.event + hr.leave) + Google Calendar (OAuth)
 */

import { useState, useEffect, useCallback } from 'react';
import { ThemeConfig } from '../types';
import { API_BASE } from '../../../config';

// ── Tipos ──────────────────────────────────────────────────────────────────────
interface CalEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  desc?: string;
  owner?: string;
  source: 'odoo_meeting' | 'odoo_leave' | 'gcal';
  allDay?: boolean;
  calendar?: string;
  days?: number;
}

interface GCalendar { id: string; name: string; color: string; primary: boolean; }

interface Props { theme: ThemeConfig }

// ── Constantes ─────────────────────────────────────────────────────────────────
const SOURCE_COLOR: Record<string, string> = {
  odoo_meeting: '#00B4D8',
  odoo_leave:   '#F97316',
  gcal:         '#34A853',
};
const SOURCE_LABEL: Record<string, string> = {
  odoo_meeting: 'Reunión Odoo',
  odoo_leave:   'Ausencia',
  gcal:         'Google Calendar',
};
const SOURCE_ICON: Record<string, string> = {
  odoo_meeting: '📅',
  odoo_leave:   '🏖️',
  gcal:         '🗓️',
};

const DAYS_ES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// ── Helpers ────────────────────────────────────────────────────────────────────
function isoDate(d: Date) { return d.toISOString().slice(0,10); }
function parseDate(s: string) { return s ? new Date(s.includes('T') ? s : s+'T00:00:00') : null; }

function sameDay(d1: Date, d2: Date) {
  return d1.getFullYear()===d2.getFullYear() && d1.getMonth()===d2.getMonth() && d1.getDate()===d2.getDate();
}

function eventOnDay(ev: CalEvent, day: Date) {
  const start = parseDate(ev.start);
  const end   = parseDate(ev.end);
  if (!start) return false;
  const dayStart = new Date(day); dayStart.setHours(0,0,0,0);
  const dayEnd   = new Date(day); dayEnd.setHours(23,59,59,999);
  const evEnd = end || start;
  return start <= dayEnd && evEnd >= dayStart;
}

function formatTime(iso: string) {
  const d = parseDate(iso);
  if (!d) return '';
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

// ── Componente ─────────────────────────────────────────────────────────────────
export default function SalaJuntasSection({ theme }: Props) {
  const { card, border, text, dim, accent, bg, radius } = theme;

  const today = new Date();
  const [curYear,  setCurYear]  = useState(today.getFullYear());
  const [curMonth, setCurMonth] = useState(today.getMonth());
  const [events,   setEvents]   = useState<CalEvent[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [selDay,   setSelDay]   = useState<Date | null>(null);
  const [selEv,    setSelEv]    = useState<CalEvent | null>(null);

  // Google Calendar
  const [gcalConn,  setGcalConn]  = useState(false);
  const [gcalCals,  setGcalCals]  = useState<GCalendar[]>([]);
  const [gcalSel,   setGcalSel]   = useState<string[]>([]);
  const [gcalLoading, setGcalLoading] = useState(false);

  // Source visibility
  const [showSrc, setShowSrc] = useState<Record<string,boolean>>({
    odoo_meeting: true, odoo_leave: true, gcal: true,
  });

  // ── Check Google Calendar connection ────────────────────────────────────────
  const checkGcal = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/api/calendario/auth/status`);
      const d = await r.json();
      setGcalConn(d.connected);
      if (d.connected) {
        const r2 = await fetch(`${API_BASE}/api/calendario/gcal-calendarios`);
        if (r2.ok) {
          const cals: GCalendar[] = await r2.json();
          setGcalCals(cals);
          setGcalSel(cals.map(c => c.id)); // all selected by default
        }
      }
    } catch {}
  }, []);

  useEffect(() => { checkGcal(); }, [checkGcal]);

  // Check for ?gcal=ok redirect from OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('gcal') === 'ok') {
      window.history.replaceState({}, '', window.location.pathname);
      checkGcal();
    }
  }, [checkGcal]);

  // ── Load events for current month ───────────────────────────────────────────
  const loadEvents = useCallback(async () => {
    setLoading(true);
    const start = isoDate(new Date(curYear, curMonth, 1));
    const end   = isoDate(new Date(curYear, curMonth + 1, 0));
    const all: CalEvent[] = [];

    try {
      const r = await fetch(`${API_BASE}/api/calendario/eventos?start=${start}&end=${end}`);
      if (r.ok) all.push(...await r.json());
    } catch {}

    if (gcalConn && gcalSel.length > 0) {
      try {
        const r2 = await fetch(
          `${API_BASE}/api/calendario/gcal-eventos?start=${start}&end=${end}&calendars=${gcalSel.join(',')}`
        );
        if (r2.ok) all.push(...await r2.json());
      } catch {}
    }

    setEvents(all);
    setLoading(false);
  }, [curYear, curMonth, gcalConn, gcalSel]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  // ── Calendar grid ────────────────────────────────────────────────────────────
  const firstDay = new Date(curYear, curMonth, 1).getDay();
  const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
  const prevMonthDays = new Date(curYear, curMonth, 0).getDate();

  // Build 6×7 grid
  const cells: { date: Date; current: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({ date: new Date(curYear, curMonth - 1, prevMonthDays - i), current: false });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ date: new Date(curYear, curMonth, d), current: true });
  while (cells.length < 42)
    cells.push({ date: new Date(curYear, curMonth + 1, cells.length - daysInMonth - firstDay + 1), current: false });

  const visibleEvents = events.filter(e => showSrc[e.source]);

  const eventsOnDay = (day: Date) =>
    visibleEvents.filter(ev => eventOnDay(ev, day));

  const selDayEvents = selDay ? eventsOnDay(selDay) : [];

  // ── Prev / Next ──────────────────────────────────────────────────────────────
  const prevMonth = () => {
    if (curMonth === 0) { setCurYear(y => y-1); setCurMonth(11); }
    else setCurMonth(m => m-1);
  };
  const nextMonth = () => {
    if (curMonth === 11) { setCurYear(y => y+1); setCurMonth(0); }
    else setCurMonth(m => m+1);
  };

  // ── Connect Google Calendar ──────────────────────────────────────────────────
  const connectGcal = async () => {
    setGcalLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/calendario/auth`);
      if (!r.ok) { alert('Configura GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en .env'); return; }
      const { url } = await r.json();
      window.location.href = url;
    } finally { setGcalLoading(false); }
  };

  const disconnectGcal = async () => {
    await fetch(`${API_BASE}/api/calendario/auth/disconnect`);
    setGcalConn(false); setGcalCals([]); setGcalSel([]);
    setEvents(ev => ev.filter(e => e.source !== 'gcal'));
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden', gap:0 }}>

      {/* ── Header ── */}
      <div style={{ padding:'14px 24px 0', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div>
            <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:text }}>Sala de Juntas</h2>
            <p style={{ margin:'3px 0 0', fontSize:12, color:dim }}>Calendarios cruzados · Odoo + Google Calendar</p>
          </div>

          {/* Source toggles */}
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            {(['odoo_meeting','odoo_leave','gcal'] as const).map(src => {
              const on = showSrc[src];
              const c  = SOURCE_COLOR[src];
              return (
                <button key={src} onClick={() => setShowSrc(p => ({...p, [src]: !on}))} style={{
                  padding:'4px 12px', borderRadius:20, fontSize:11, cursor:'pointer',
                  background: on ? `${c}20` : 'transparent',
                  border: `1px solid ${on ? c : c+'44'}`,
                  color: on ? c : c+'66',
                  display:'flex', alignItems:'center', gap:5,
                }}>
                  <span>{SOURCE_ICON[src]}</span>
                  <span>{SOURCE_LABEL[src]}</span>
                  <span style={{ background:`${c}25`, borderRadius:8, padding:'0 5px', fontSize:10 }}>
                    {events.filter(e=>e.source===src).length}
                  </span>
                </button>
              );
            })}

            <div style={{ width:1, height:18, background:border, margin:'0 4px' }} />

            {/* Google Calendar connect/disconnect */}
            {!gcalConn ? (
              <button onClick={connectGcal} disabled={gcalLoading} style={{
                padding:'5px 14px', borderRadius:8, fontSize:12, cursor:'pointer',
                background:'rgba(52,168,83,0.12)', border:'1px solid rgba(52,168,83,0.4)',
                color:'#34A853', display:'flex', alignItems:'center', gap:6,
              }}>
                {gcalLoading ? '⏳' : '🔗'} Conectar Google Calendar
              </button>
            ) : (
              <button onClick={disconnectGcal} style={{
                padding:'5px 14px', borderRadius:8, fontSize:12, cursor:'pointer',
                background:'rgba(52,168,83,0.08)', border:'1px solid rgba(52,168,83,0.3)',
                color:'#34A853', display:'flex', alignItems:'center', gap:6,
              }}>
                ✓ Google Calendar
              </button>
            )}

            {/* Refresh */}
            <button onClick={loadEvents} style={{
              padding:'5px 10px', borderRadius:8, fontSize:12, cursor:'pointer',
              background:'transparent', border:`1px solid ${border}`, color:dim,
            }}>
              {loading ? '⏳' : '↺'}
            </button>
          </div>
        </div>

        {/* Google calendars sub-selector */}
        {gcalConn && gcalCals.length > 0 && (
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
            <span style={{ fontSize:11, color:dim, alignSelf:'center' }}>Calendarios:</span>
            {gcalCals.map(cal => {
              const on = gcalSel.includes(cal.id);
              return (
                <button key={cal.id} onClick={() => setGcalSel(p => on ? p.filter(x=>x!==cal.id) : [...p,cal.id])} style={{
                  padding:'2px 10px', borderRadius:20, fontSize:10, cursor:'pointer',
                  background: on ? `${cal.color}22` : 'transparent',
                  border:`1px solid ${on ? cal.color : cal.color+'44'}`,
                  color: on ? cal.color : cal.color+'77',
                }}>
                  {cal.name || cal.id}{cal.primary ? ' ★' : ''}
                </button>
              );
            })}
          </div>
        )}

        {/* Month navigator */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
          <button onClick={prevMonth} style={{ background:'transparent', border:`1px solid ${border}`, color:text, borderRadius:6, padding:'4px 10px', cursor:'pointer', fontSize:14 }}>‹</button>
          <span style={{ fontWeight:700, fontSize:16, color:text, minWidth:180, textAlign:'center' }}>
            {MONTHS_ES[curMonth]} {curYear}
          </span>
          <button onClick={nextMonth} style={{ background:'transparent', border:`1px solid ${border}`, color:text, borderRadius:6, padding:'4px 10px', cursor:'pointer', fontSize:14 }}>›</button>
          <button onClick={() => { setCurYear(today.getFullYear()); setCurMonth(today.getMonth()); }} style={{
            background:'transparent', border:`1px solid ${accent}40`, color:accent,
            borderRadius:6, padding:'3px 10px', cursor:'pointer', fontSize:11,
          }}>Hoy</button>
          <span style={{ marginLeft:'auto', fontSize:11, color:dim }}>{visibleEvents.length} eventos visibles</span>
        </div>
      </div>

      {/* ── Main: Calendar + Day panel ── */}
      <div style={{ flex:1, display:'flex', gap:0, minHeight:0, overflow:'hidden' }}>

        {/* Calendar grid */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', minHeight:0, padding:'0 24px 16px' }}>

          {/* Weekday headers */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:1, marginBottom:2 }}>
            {DAYS_ES.map(d => (
              <div key={d} style={{ textAlign:'center', fontSize:10, fontWeight:700, color:dim, padding:'4px 0', textTransform:'uppercase', letterSpacing:'0.5px' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div style={{ flex:1, display:'grid', gridTemplateColumns:'repeat(7,1fr)', gridTemplateRows:'repeat(6,1fr)', gap:2, minHeight:0 }}>
            {cells.map((cell, i) => {
              const dayEvs = eventsOnDay(cell.date);
              const isToday = sameDay(cell.date, today);
              const isSel   = selDay ? sameDay(cell.date, selDay) : false;
              const isWeekend = cell.date.getDay() === 0 || cell.date.getDay() === 6;

              return (
                <div
                  key={i}
                  onClick={() => setSelDay(isSel ? null : cell.date)}
                  style={{
                    background: isSel ? `${accent}15` : isWeekend && cell.current ? 'rgba(255,255,255,0.02)' : 'transparent',
                    border: `1px solid ${isSel ? accent+'60' : isToday ? accent+'40' : border+'80'}`,
                    borderRadius: radius,
                    padding: '3px 4px',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    minHeight: 0,
                    transition: 'background 0.1s',
                    opacity: cell.current ? 1 : 0.35,
                  }}
                  onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = `${accent}08`; }}
                  onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                >
                  {/* Day number */}
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: isToday ? accent : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: isToday ? 800 : 500,
                    color: isToday ? '#000' : cell.current ? text : dim,
                    marginBottom: 2,
                  }}>{cell.date.getDate()}</div>

                  {/* Event pills */}
                  {dayEvs.slice(0, 3).map(ev => (
                    <div
                      key={ev.id}
                      onClick={e => { e.stopPropagation(); setSelEv(ev); }}
                      style={{
                        fontSize: 9, padding: '1px 4px', borderRadius: 3, marginBottom: 1,
                        background: SOURCE_COLOR[ev.source] + '30',
                        color: SOURCE_COLOR[ev.source],
                        border: `1px solid ${SOURCE_COLOR[ev.source]}40`,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        cursor: 'pointer',
                      }}
                    >
                      {ev.allDay ? '● ' : `${formatTime(ev.start)} `}{ev.title}
                    </div>
                  ))}
                  {dayEvs.length > 3 && (
                    <div style={{ fontSize: 9, color: dim }}>+{dayEvs.length - 3} más</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Day detail panel */}
        {selDay && (
          <div style={{
            width: 300, flexShrink: 0, borderLeft: `1px solid ${border}`,
            display: 'flex', flexDirection: 'column', background: card, overflowY: 'auto',
          }}>
            <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontWeight:800, fontSize:15, color:text }}>
                  {selDay.getDate()} de {MONTHS_ES[selDay.getMonth()]}
                </div>
                <div style={{ fontSize:11, color:dim, marginTop:2 }}>
                  {DAYS_ES[selDay.getDay()]} · {selDayEvents.length} evento{selDayEvents.length !== 1 ? 's' : ''}
                </div>
              </div>
              <button onClick={() => setSelDay(null)} style={{ background:'transparent', border:'none', color:dim, fontSize:18, cursor:'pointer' }}>✕</button>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
              {selDayEvents.length === 0 ? (
                <div style={{ padding:24, textAlign:'center', color:dim, fontSize:12 }}>Sin eventos este día</div>
              ) : (
                selDayEvents
                  .sort((a,b) => (a.start || '').localeCompare(b.start || ''))
                  .map(ev => {
                    const c = SOURCE_COLOR[ev.source];
                    return (
                      <div
                        key={ev.id}
                        onClick={() => setSelEv(ev)}
                        style={{
                          margin:'4px 10px', padding:'10px 12px', borderRadius:8, cursor:'pointer',
                          background:`${c}10`, border:`1px solid ${c}30`,
                          transition:'background 0.1s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = `${c}20`)}
                        onMouseLeave={e => (e.currentTarget.style.background = `${c}10`)}
                      >
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                          <span style={{ fontSize:11 }}>{SOURCE_ICON[ev.source]}</span>
                          <span style={{ fontSize:10, color:c, fontWeight:700 }}>{SOURCE_LABEL[ev.source]}</span>
                        </div>
                        <div style={{ fontWeight:700, fontSize:12, color:text, marginBottom:2 }}>{ev.title}</div>
                        {!ev.allDay && (
                          <div style={{ fontSize:11, color:dim }}>
                            {formatTime(ev.start)}{ev.end ? ` → ${formatTime(ev.end)}` : ''}
                          </div>
                        )}
                        {ev.allDay && <div style={{ fontSize:11, color:dim }}>Todo el día</div>}
                        {ev.location && <div style={{ fontSize:10, color:dim, marginTop:3 }}>📍 {ev.location}</div>}
                        {ev.owner && <div style={{ fontSize:10, color:dim }}>👤 {ev.owner}</div>}
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Event detail modal ── */}
      {selEv && (
        <div
          onClick={() => setSelEv(null)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background:bg, border:`1px solid ${SOURCE_COLOR[selEv.source]}40`,
              borderRadius:16, width:420, maxWidth:'90vw', padding:0,
              boxShadow:`0 20px 60px rgba(0,0,0,0.5)`,
            }}
          >
            {/* Header */}
            <div style={{
              background:`${SOURCE_COLOR[selEv.source]}12`,
              borderBottom:`1px solid ${SOURCE_COLOR[selEv.source]}30`,
              padding:'16px 20px', borderRadius:'16px 16px 0 0',
              display:'flex', justifyContent:'space-between', alignItems:'flex-start',
            }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <span style={{ fontSize:16 }}>{SOURCE_ICON[selEv.source]}</span>
                  <span style={{ fontSize:11, color:SOURCE_COLOR[selEv.source], fontWeight:700 }}>
                    {SOURCE_LABEL[selEv.source]}
                  </span>
                </div>
                <div style={{ fontWeight:800, fontSize:16, color:text, lineHeight:1.3 }}>{selEv.title}</div>
              </div>
              <button onClick={() => setSelEv(null)} style={{ background:'transparent', border:'none', color:dim, fontSize:20, cursor:'pointer' }}>✕</button>
            </div>

            {/* Body */}
            <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:8 }}>
              {/* Date/time */}
              <div style={{ display:'flex', gap:8, alignItems:'flex-start', padding:'6px 0', borderBottom:`1px solid ${border}` }}>
                <span style={{ fontSize:14, width:20 }}>📆</span>
                <div>
                  <div style={{ fontSize:12, color:text }}>
                    {parseDate(selEv.start)?.toLocaleDateString('es-MX', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
                  </div>
                  {!selEv.allDay && selEv.start && (
                    <div style={{ fontSize:12, color:dim, marginTop:2 }}>
                      {formatTime(selEv.start)}{selEv.end ? ` — ${formatTime(selEv.end)}` : ''}
                    </div>
                  )}
                  {selEv.allDay && <div style={{ fontSize:11, color:dim }}>Todo el día</div>}
                </div>
              </div>

              {selEv.location && (
                <div style={{ display:'flex', gap:8, alignItems:'flex-start', padding:'6px 0', borderBottom:`1px solid ${border}` }}>
                  <span style={{ fontSize:14, width:20 }}>📍</span>
                  <span style={{ fontSize:12, color:text }}>{selEv.location}</span>
                </div>
              )}

              {selEv.owner && (
                <div style={{ display:'flex', gap:8, alignItems:'center', padding:'6px 0', borderBottom:`1px solid ${border}` }}>
                  <span style={{ fontSize:14, width:20 }}>👤</span>
                  <span style={{ fontSize:12, color:text }}>{selEv.owner}</span>
                </div>
              )}

              {selEv.desc && (
                <div style={{ display:'flex', gap:8, alignItems:'flex-start', padding:'6px 0' }}>
                  <span style={{ fontSize:14, width:20 }}>📝</span>
                  <span style={{ fontSize:12, color:dim, whiteSpace:'pre-wrap' }}>{selEv.desc}</span>
                </div>
              )}

              {selEv.days && (
                <div style={{ display:'flex', gap:8, alignItems:'center', padding:'6px 0', borderTop:`1px solid ${border}` }}>
                  <span style={{ fontSize:14, width:20 }}>⏱️</span>
                  <span style={{ fontSize:12, color:text }}>{selEv.days} día{selEv.days !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
