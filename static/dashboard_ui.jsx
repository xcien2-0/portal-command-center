const { useState, useEffect } = React;

const SLIDES = ["intro","problema","comparacion","solucion","niveles","badges","leaderboard","roadmap","cta"];

const LEVELS = [
  { name:"Aprendiz",   min:0,  max:30,  icon:"🌱", color:"var(--color-text-secondary)", accent:"var(--color-background-secondary)", count:2  },
  { name:"Técnico",    min:30, max:50,  icon:"🔧", color:"var(--color-text-info)",      accent:"var(--color-background-info)",      count:8  },
  { name:"Especialista",min:50,max:65, icon:"⚙️", color:"var(--color-text-success)",   accent:"var(--color-background-success)",   count:15 },
  { name:"Avanzado",   min:65, max:80,  icon:"🏆", color:"#7c3aed",                     accent:"#f5f3ff",                           count:14 },
  { name:"Experto",    min:80, max:95,  icon:"🎖️", color:"var(--color-text-warning)",   accent:"var(--color-background-warning)",   count:7  },
  { name:"Leyenda",    min:95, max:100, icon:"⭐", color:"var(--color-text-danger)",    accent:"var(--color-background-danger)",    count:1  },
];

const BADGES_DATA = [
  { icon:"🔧", name:"Maestro Instalador", desc:"100% en categoría Instalación", holders:3,  color:"var(--color-background-info)",    tc:"var(--color-text-info)"    },
  { icon:"📡", name:"RF Pro",             desc:"Dominio total de Redes RF",      holders:2,  color:"#f5f3ff",                         tc:"#7c3aed"                   },
  { icon:"⭐", name:"Leyenda XCIEN",      desc:"Avance ≥ 95%",                  holders:1,  color:"var(--color-background-warning)", tc:"var(--color-text-warning)" },
  { icon:"🔥", name:"Firewall Hero",      desc:"Habilidad crítica desbloqueada", holders:4,  color:"var(--color-background-danger)",  tc:"var(--color-text-danger)"  },
  { icon:"🏅", name:"Top de Plaza",       desc:"Mejor técnico en tu ciudad",     holders:6,  color:"var(--color-background-success)", tc:"var(--color-text-success)" },
  { icon:"💥", name:"Racha x5",           desc:"5 capacitaciones seguidas",      holders:8,  color:"var(--color-background-warning)", tc:"var(--color-text-warning)" },
  { icon:"🌐", name:"Network Wizard",     desc:"100% en Redes IP",               holders:2,  color:"var(--color-background-info)",    tc:"var(--color-text-info)"    },
  { icon:"⚡", name:"Electricista Pro",   desc:"100% categoría Eléctrico",       holders:1,  color:"var(--color-background-warning)", tc:"var(--color-text-warning)" },
  { icon:"🛡️", name:"Guardián",           desc:"100% en Seguridad",              holders:3,  color:"var(--color-background-danger)",  tc:"var(--color-text-danger)"  },
];

const TOP5 = [
  { name:"Brian Quintero Choreño",        plaza:"CDMX",       role:"COR", pct:100,   badges:12, level:"Leyenda"   },
  { name:"Jose Guadalupe Balderas",       plaza:"Nuevo León", role:"COR", pct:95.83, badges:10, level:"Leyenda"   },
  { name:"Erik Alberto Silva Olivares",   plaza:"Nuevo León", role:"CAE", pct:91.67, badges:9,  level:"Experto"   },
  { name:"Miguel Angel Flores Herrera",   plaza:"Nuevo León", role:"COR", pct:91.67, badges:9,  level:"Experto"   },
  { name:"Andres Guadalupe Guardado",     plaza:"Nuevo León", role:"COR", pct:89.58, badges:8,  level:"Experto"   },
];

const BEFORE_AFTER = [
  { b:"Hoja de cálculo estática",          a:"Dashboard interactivo en tiempo real"   },
  { b:"Sin visibilidad por técnico",        a:"Perfil individual con 48 habilidades"   },
  { b:"Capacitación sin incentivos",        a:"Niveles, badges y bonos automáticos"    },
  { b:"Brechas detectadas tarde",           a:"Gaps visibles al instante por plaza"    },
  { b:"Sin historial de progreso",          a:"Evolución trimestral registrada"         },
  { b:"Evaluación subjetiva",               a:"Exámenes objetivos ligados a Odoo"       },
];

const ROADMAP = [
  { q:"Q2 2025", done:true,  color:"var(--color-text-success)",  border:"var(--color-border-success)", bg:"var(--color-background-success)",
    items:["Matriz de habilidades v1","Sistema de 6 niveles","15 badges definidos","Datos de 47 técnicos"] },
  { q:"Q3 2025", done:false, color:"var(--color-text-warning)", border:"var(--color-border-warning)", bg:"var(--color-background-warning)",
    items:["Portal web Academia XCIEN","Exámenes en línea","Integración con Odoo","Login individual por técnico"] },
  { q:"Q4 2025", done:false, color:"var(--color-text-secondary)", border:"var(--color-border-tertiary)", bg:"var(--color-background-secondary)",
    items:["App móvil técnicos","Smart contracts de bonos","Certificaciones oficiales","Expansión 100+ técnicos"] },
];

function Ring({ pct, size=48, stroke=3, color="var(--color-text-warning)" }) {
  const [p, setP] = useState(0);
  useEffect(() => { const t = setTimeout(() => setP(pct), 100); return () => clearTimeout(t); }, [pct]);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)", flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--color-border-tertiary)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${(p/100)*circ} ${circ}`} strokeLinecap="round"
        style={{ transition:"stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)" }}/>
    </svg>
  );
}

function useCount(target, delay=0) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      let s = null;
      const fn = (ts) => {
        if (!s) s = ts;
        const p = Math.min((ts - s) / 1200, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setV(+(ease * target).toFixed(target % 1 ? 2 : 0));
        if (p < 1) requestAnimationFrame(fn);
      };
      requestAnimationFrame(fn);
    }, delay);
    return () => clearTimeout(t);
  }, [target]);
  return v;
}

function Tag({ children }) {
  return (
    <div style={{ fontSize:11, fontWeight:500, letterSpacing:".1em", textTransform:"uppercase",
      color:"var(--color-text-secondary)", marginBottom:8, animation:"up .5s ease both" }}>
      {children}
    </div>
  );
}

function H({ children }) {
  return (
    <div style={{ fontSize:clamp(28,36), fontWeight:500, lineHeight:1.15,
      color:"var(--color-text-primary)", marginBottom:20, animation:"up .55s ease .05s both" }}>
      {children}
    </div>
  );
}

function Chip({ children, style={} }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", padding:"3px 10px",
      borderRadius:20, fontSize:11, fontWeight:500,
      background:"var(--color-background-secondary)",
      border:"0.5px solid var(--color-border-tertiary)",
      color:"var(--color-text-secondary)", ...style }}>
      {children}
    </span>
  );
}

const clamp = (min, max) => `clamp(${min}px, 3.5vw, ${max}px)`;

const card = {
  background:"var(--color-background-primary)",
  border:"0.5px solid var(--color-border-tertiary)",
  borderRadius:"var(--border-radius-lg)",
  padding:"20px",
};

const hoverCard = (hovered) => ({
  ...card,
  cursor:"pointer",
  transition:"border-color .2s, transform .2s, box-shadow .2s",
  transform: hovered ? "translateY(-3px)" : "none",
  boxShadow: hovered ? "0 8px 24px rgba(0,0,0,0.08)" : "none",
  borderColor: hovered ? "var(--color-border-primary)" : "var(--color-border-tertiary)",
});

const SLIDE_LABELS = ["Intro","Problema","Comparación","Solución","Niveles","Badges","Ranking","Roadmap","Cierre"];

const layout = {
    center: {
      position:"relative", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", padding:"72px 48px",
    },
    page: {
      position:"relative", display:"flex", flexDirection:"column",
      padding:"72px 48px 72px", overflowY:"auto", justifyContent:"center",
    },
  };

function AcademiaXCIEN() {
  const [slide, setSlide] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [hov, setHov] = useState(null);
  const [selectedTech, setSelectedTech] = useState(null);
  const total = SLIDES.length;

  const go = (i) => {
    if (i === slide) return;
    setSlide(i); setAnimKey(k=>k+1); setHov(null); setSelectedTech(null);
  };

  useEffect(() => {
    const h = (e) => {
      if (e.key==="ArrowRight"||e.key==="ArrowDown") go(Math.min(slide+1,total-1));
      if (e.key==="ArrowLeft"||e.key==="ArrowUp") go(Math.max(slide-1,0));
    };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [slide]);

  const c47 = useCount(47, 0);
  const c62 = useCount(62.32, 150);
  const c48 = useCount(48, 300);
  const c15 = useCount(15, 450);

  const renderSlide = () => {
    const id = SLIDES[slide];

    // ── INTRO ────────────────────────────────────────────────
    if (id==="intro") return (
      <div style={layout.center}>
        <div style={{ maxWidth:560, width:"100%", textAlign:"center" }}>
          <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:32, flexWrap:"wrap", animation:"up .5s ease both" }}>
            <Chip>Field Services</Chip>
            <Chip>47 técnicos</Chip>
            <Chip>6 plazas · México</Chip>
          </div>
          <div style={{ fontSize:clamp(42,64), fontWeight:500, lineHeight:1, letterSpacing:"-2px",
            color:"var(--color-text-primary)", marginBottom:16, animation:"up .6s ease .05s both" }}>
            Academia<br/>
            <span style={{ fontWeight:400, color:"var(--color-text-secondary)" }}>XCIEN</span>
          </div>
          <div style={{ fontSize:16, color:"var(--color-text-secondary)", lineHeight:1.7,
            marginBottom:40, fontWeight:400, animation:"up .6s ease .1s both" }}>
            El sistema que convierte capacitación en carrera,<br/>
            esfuerzo en reconocimiento, técnicos en leyendas.
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, animation:"up .6s ease .15s both" }}>
            {[
              { v:c47,   s:"",    l:"Técnicos" },
              { v:c62,   s:"%",   l:"Avance global" },
              { v:c48,   s:"",    l:"Habilidades" },
              { v:c15,   s:"",    l:"Badges" },
            ].map((item,i) => (
              <div key={i} style={{ ...card, textAlign:"center", padding:"16px 12px" }}>
                <div style={{ fontSize:28, fontWeight:500, color:"var(--color-text-primary)", letterSpacing:"-1px", lineHeight:1 }}>
                  {typeof item.v==="number"?(Number.isInteger(item.v)?item.v:item.v.toFixed(2)):item.v}{item.s}
                </div>
                <div style={{ fontSize:11, color:"var(--color-text-secondary)", marginTop:6 }}>{item.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

    // ── PROBLEMA ─────────────────────────────────────────────
    if (id==="problema") return (
      <div style={layout.page}>
        <Tag>El problema</Tag>
        <H>Sin sistema,<br/><span style={{ color:"var(--color-text-secondary)", fontWeight:400 }}>sin dirección</span></H>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
          {[
            { icon:"📊", t:"Cero visibilidad", d:"Las habilidades vivían en una hoja estática que nadie actualizaba en tiempo real.", stat:"0%", sl:"datos en vivo" },
            { icon:"😶", t:"Sin motivación", d:"Los técnicos no veían su progreso ni tenían metas claras de desarrollo profesional.", stat:"62%", sl:"avance sin incentivos" },
            { icon:"🎯", t:"Brechas ocultas", d:"Habilidades críticas como Firewall (8.5%) o SDWAN (21%) no se detectaban a tiempo.", stat:"8.5%", sl:"cobertura Firewall" },
          ].map((c,i) => (
            <div key={i}
              onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}
              style={{ ...hoverCard(hov===i), animation:`up .45s ease ${i*.12}s both` }}>
              <div style={{ fontSize:24, marginBottom:14 }}>{c.icon}</div>
              <div style={{ fontSize:14, fontWeight:500, color:"var(--color-text-primary)", marginBottom:8 }}>{c.t}</div>
              <div style={{ fontSize:13, color:"var(--color-text-secondary)", lineHeight:1.6, marginBottom:16 }}>{c.d}</div>
              <div style={{ borderTop:"0.5px solid var(--color-border-tertiary)", paddingTop:14 }}>
                <div style={{ fontSize:24, fontWeight:500, color:"var(--color-text-danger)" }}>{c.stat}</div>
                <div style={{ fontSize:11, color:"var(--color-text-secondary)", marginTop:2 }}>{c.sl}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:12, padding:"14px 18px", borderRadius:"var(--border-radius-md)",
          background:"var(--color-background-danger)", border:"0.5px solid var(--color-border-danger)",
          fontSize:13, color:"var(--color-text-danger)", animation:"up .5s ease .4s both" }}>
          El resultado: técnicos sin rumbo, capacitación sin impacto, inversión sin retorno medible.
        </div>
      </div>
    );

    // ── COMPARACIÓN ──────────────────────────────────────────
    if (id==="comparacion") return (
      <div style={layout.page}>
        <Tag>Antes · Después</Tag>
        <H>La transformación<br/><span style={{ fontWeight:400, color:"var(--color-text-secondary)" }}>es visible</span></H>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div style={{ padding:"10px 16px", borderRadius:"var(--border-radius-md)",
            background:"var(--color-background-danger)", border:"0.5px solid var(--color-border-danger)",
            display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--color-text-danger)", flexShrink:0 }}/>
            <span style={{ fontSize:12, fontWeight:500, color:"var(--color-text-danger)" }}>Sin Academia XCIEN</span>
          </div>
          <div style={{ padding:"10px 16px", borderRadius:"var(--border-radius-md)",
            background:"var(--color-background-success)", border:"0.5px solid var(--color-border-success)",
            display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--color-text-success)", flexShrink:0 }}/>
            <span style={{ fontSize:12, fontWeight:500, color:"var(--color-text-success)" }}>Con Academia XCIEN</span>
          </div>
          {BEFORE_AFTER.map((item,i) => (
            <React.Fragment key={i}>
              <div
                onMouseEnter={()=>setHov(`b${i}`)} onMouseLeave={()=>setHov(null)}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px",
                  borderRadius:"var(--border-radius-md)",
                  background: hov===`b${i}` ? "var(--color-background-danger)" : "var(--color-background-secondary)",
                  border:`0.5px solid ${hov===`b${i}` ? "var(--color-border-danger)" : "var(--color-border-tertiary)"}`,
                  transition:"all .2s", animation:`up .4s ease ${i*.07}s both`, cursor:"default" }}>
                <span style={{ fontSize:13, color:"var(--color-text-danger)", flexShrink:0 }}>✕</span>
                <span style={{ fontSize:13, color:"var(--color-text-secondary)" }}>{item.b}</span>
              </div>
              <div
                onMouseEnter={()=>setHov(`a${i}`)} onMouseLeave={()=>setHov(null)}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px",
                  borderRadius:"var(--border-radius-md)",
                  background: hov===`a${i}` ? "var(--color-background-success)" : "var(--color-background-secondary)",
                  border:`0.5px solid ${hov===`a${i}` ? "var(--color-border-success)" : "var(--color-border-tertiary)"}`,
                  transition:"all .2s", animation:`up .4s ease ${i*.07}s both`, cursor:"default" }}>
                <span style={{ fontSize:13, color:"var(--color-text-success)", flexShrink:0 }}>✓</span>
                <span style={{ fontSize:13, color:"var(--color-text-primary)", fontWeight:500 }}>{item.a}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    );

    // ── SOLUCIÓN ─────────────────────────────────────────────
    if (id==="solucion") return (
      <div style={layout.page}>
        <Tag>La solución</Tag>
        <H>Gamificación<br/><span style={{ fontWeight:400, color:"var(--color-text-secondary)" }}>que sí funciona</span></H>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12, marginBottom:12 }}>
          {[
            { icon:"📈", t:"Niveles progresivos", d:"6 niveles desde Aprendiz hasta Leyenda. Cada nivel desbloquea beneficios reales y verificables." },
            { icon:"🏅", t:"Badges por dominio", d:"15 logros desbloqueables por categoría, racha de capacitaciones y habilidades críticas." },
            { icon:"🏆", t:"Leaderboard en vivo", d:"Rankings por plaza, rol y región. Los técnicos ven exactamente dónde están y cuánto les falta." },
            { icon:"💰", t:"Bonos automáticos", d:"Smart contracts en n8n + Odoo: cumple los KPIs, el bono se ejecuta sin intervención manual." },
          ].map((c,i) => (
            <div key={i}
              onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}
              style={{ ...hoverCard(hov===i), animation:`up .45s ease ${i*.1}s both` }}>
              <div style={{ fontSize:22, marginBottom:12 }}>{c.icon}</div>
              <div style={{ fontSize:14, fontWeight:500, color:"var(--color-text-primary)", marginBottom:6 }}>{c.t}</div>
              <div style={{ fontSize:13, color:"var(--color-text-secondary)", lineHeight:1.6 }}>{c.d}</div>
            </div>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
          {[["47","técnicos activos"],["48","habilidades"],["15","badges"],["6","plazas"]].map(([v,l],i) => (
            <div key={i} style={{ ...card, textAlign:"center", padding:"14px 10px", animation:`up .45s ease ${.5+i*.08}s both` }}>
              <div style={{ fontSize:24, fontWeight:500, color:"var(--color-text-primary)" }}>{v}</div>
              <div style={{ fontSize:11, color:"var(--color-text-secondary)", marginTop:4 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    );

    // ── NIVELES ──────────────────────────────────────────────
    if (id==="niveles") return (
      <div style={layout.page}>
        <Tag>Sistema de niveles</Tag>
        <H>Tu carrera,<br/><span style={{ fontWeight:400, color:"var(--color-text-secondary)" }}>paso a paso</span></H>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:12 }}>
          {LEVELS.map((lv,i) => (
            <div key={i}
              onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}
              style={{
                ...card, cursor:"pointer",
                borderTop: hov===i ? `2px solid ${lv.color}` : "0.5px solid var(--color-border-tertiary)",
                borderRadius: hov===i ? "0 0 var(--border-radius-lg) var(--border-radius-lg)" : "var(--border-radius-lg)",
                background: hov===i ? lv.accent : "var(--color-background-primary)",
                transform: hov===i ? "translateY(-3px)" : "none",
                boxShadow: hov===i ? "0 8px 24px rgba(0,0,0,0.07)" : "none",
                transition:"all .2s", animation:`up .4s ease ${i*.08}s both`,
              }}>
              <div style={{ fontSize:22, marginBottom:12 }}>{lv.icon}</div>
              <div style={{ fontSize:14, fontWeight:500, color:"var(--color-text-primary)", marginBottom:4 }}>{lv.name}</div>
              <div style={{ fontSize:12, color:"var(--color-text-secondary)", marginBottom:10 }}>{lv.min}–{lv.max}%</div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:11, color:lv.color, fontWeight:500,
                  background: hov===i ? "rgba(255,255,255,0.5)" : "var(--color-background-secondary)",
                  padding:"2px 8px", borderRadius:20 }}>{lv.count} técnicos</span>
                {hov===i && <span style={{ fontSize:11, color:lv.color }}>→ beneficios</span>}
              </div>
              {hov===i && (
                <div style={{ marginTop:12, paddingTop:12, borderTop:"0.5px solid var(--color-border-tertiary)",
                  fontSize:12, color:"var(--color-text-secondary)", lineHeight:1.6 }}>
                  {["Acceso a cursos básicos","Certificado digital nivel 1","Badge de especialidad","Elegible para bonos","Bono desempeño máximo","Reconocimiento anual + bono especial"][i]}
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ padding:"13px 16px", borderRadius:"var(--border-radius-md)",
          background:"var(--color-background-secondary)", border:"0.5px solid var(--color-border-tertiary)",
          fontSize:13, color:"var(--color-text-secondary)", animation:"up .5s ease .55s both" }}>
          Pasa el cursor sobre cada nivel para ver sus beneficios. El avance combina habilidades completadas + exámenes aprobados.
        </div>
      </div>
    );

    // ── BADGES ───────────────────────────────────────────────
    if (id==="badges") return (
      <div style={layout.page}>
        <Tag>Sistema de badges</Tag>
        <H>Gana reconocimiento,<br/><span style={{ fontWeight:400, color:"var(--color-text-secondary)" }}>demuestra tu dominio</span></H>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
          {BADGES_DATA.map((b,i) => (
            <div key={i}
              onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}
              style={{ ...hoverCard(hov===i), padding:"16px", animation:`up .4s ease ${i*.07}s both` }}>
              <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                <div style={{
                  width:40, height:40, borderRadius:"var(--border-radius-md)", flexShrink:0,
                  background: hov===i ? b.color : "var(--color-background-secondary)",
                  border:"0.5px solid var(--color-border-tertiary)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:18, transition:"background .2s",
                }}>{b.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:500, color:"var(--color-text-primary)", marginBottom:3 }}>{b.name}</div>
                  <div style={{ fontSize:12, color:"var(--color-text-secondary)", marginBottom:8, lineHeight:1.5 }}>{b.desc}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ flex:1, height:3, borderRadius:2, background:"var(--color-background-tertiary)" }}>
                      <div style={{ height:"100%", borderRadius:2, background:b.tc,
                        width:`${(b.holders/47)*100}%`, transition:"width .9s ease" }}/>
                    </div>
                    <span style={{ fontSize:11, color:b.tc, fontWeight:500, flexShrink:0 }}>{b.holders} técnicos</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    // ── LEADERBOARD ──────────────────────────────────────────
    if (id==="leaderboard") return (
      <div style={layout.page}>
        <Tag>Leaderboard 2025</Tag>
        <H>Top técnicos —<br/><span style={{ fontWeight:400, color:"var(--color-text-secondary)" }}>¿dónde estás tú?</span></H>
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:12 }}>
          {TOP5.map((t,i) => {
            const rankColors = ["var(--color-text-warning)","var(--color-text-secondary)","var(--color-text-danger)","var(--color-text-secondary)","var(--color-text-secondary)"];
            const ringColor = rankColors[i];
            const on = selectedTech===i;
            return (
              <div key={i}
                onClick={()=>setSelectedTech(on?null:i)}
                onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}
                style={{
                  display:"flex", alignItems:"center", gap:14, padding:"14px 18px",
                  borderRadius:"var(--border-radius-lg)", cursor:"pointer",
                  background: on ? "var(--color-background-secondary)" : "var(--color-background-primary)",
                  border:`${on?"2px":"0.5px"} solid ${on?"var(--color-border-primary)":"var(--color-border-tertiary)"}`,
                  transition:"all .2s", animation:`up .4s ease ${i*.1}s both`,
                  transform: hov===i && !on ? "translateX(4px)" : "none",
                }}>
                <div style={{ width:28, height:28, borderRadius:"50%", flexShrink:0, display:"flex",
                  alignItems:"center", justifyContent:"center", fontSize:13,
                  background:"var(--color-background-secondary)", border:"0.5px solid var(--color-border-tertiary)" }}>
                  {i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}`}
                </div>
                <Ring pct={t.pct} size={40} stroke={3} color={ringColor}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:500, color:"var(--color-text-primary)",
                    whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{t.name}</div>
                  <div style={{ display:"flex", gap:6, marginTop:4, flexWrap:"wrap" }}>
                    <Chip>{t.role}</Chip>
                    <Chip>📍{t.plaza}</Chip>
                    <Chip>{t.level}</Chip>
                  </div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontSize:18, fontWeight:500, color:"var(--color-text-primary)" }}>{t.pct.toFixed(t.pct===100?0:1)}%</div>
                  <div style={{ fontSize:11, color:"var(--color-text-secondary)", marginTop:2 }}>{t.badges} badges</div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ padding:"12px 16px", borderRadius:"var(--border-radius-md)",
          background:"var(--color-background-secondary)", border:"0.5px solid var(--color-border-tertiary)",
          fontSize:13, color:"var(--color-text-secondary)", animation:"up .5s ease .55s both" }}>
          Haz clic en cualquier técnico para destacarlo. El ranking se actualiza con cada habilidad completada.
        </div>
      </div>
    );

    // ── ROADMAP ──────────────────────────────────────────────
    if (id==="roadmap") return (
      <div style={layout.page}>
        <Tag>Roadmap</Tag>
        <H>El plan para<br/><span style={{ fontWeight:400, color:"var(--color-text-secondary)" }}>la academia</span></H>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:14 }}>
          {ROADMAP.map((ph,i) => (
            <div key={i}
              onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}
              style={{ ...card, borderTop:`2px solid ${ph.color}`,
                borderRadius:"0 0 var(--border-radius-lg) var(--border-radius-lg)",
                background: hov===i ? ph.bg : "var(--color-background-primary)",
                transform: hov===i ? "translateY(-3px)" : "none",
                boxShadow: hov===i ? "0 8px 24px rgba(0,0,0,0.07)" : "none",
                transition:"all .2s", animation:`up .45s ease ${i*.15}s both`, cursor:"default" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <span style={{ fontSize:14, fontWeight:500, color:"var(--color-text-primary)" }}>{ph.q}</span>
                <span style={{ fontSize:10, fontWeight:500, color:ph.color,
                  background:ph.bg, border:`0.5px solid ${ph.border}`,
                  padding:"2px 8px", borderRadius:20 }}>
                  {ph.done?"Completado":i===1?"En progreso":"Próximo"}
                </span>
              </div>
              {ph.items.map((item,j) => (
                <div key={j} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:8 }}>
                  <div style={{ width:5, height:5, borderRadius:"50%", background:ph.color,
                    marginTop:5, flexShrink:0 }}/>
                  <span style={{ fontSize:13, color:"var(--color-text-secondary)", lineHeight:1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
          {[["Odoo","Integración nativa CRM"],["n8n","Bonos automáticos"],["Lovable","Portal sin código"]].map(([t,d],i) => (
            <div key={i} style={{ ...card, display:"flex", alignItems:"center", gap:10,
              padding:"12px 14px", animation:`up .45s ease ${.55+i*.1}s both` }}>
              <div style={{ width:7, height:7, borderRadius:"50%",
                background:"var(--color-text-success)", flexShrink:0 }}/>
              <div>
                <div style={{ fontSize:12, fontWeight:500, color:"var(--color-text-primary)" }}>{t}</div>
                <div style={{ fontSize:11, color:"var(--color-text-secondary)", marginTop:1 }}>{d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    // ── CTA ──────────────────────────────────────────────────
    if (id==="cta") return (
      <div style={layout.center}>
        <div style={{ maxWidth:540, width:"100%", textAlign:"center" }}>
          <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:28, animation:"up .5s ease both" }}>
            <Chip>Academia XCIEN</Chip>
            <Chip>Q3 2025</Chip>
          </div>
          <div style={{ fontSize:clamp(38,58), fontWeight:500, lineHeight:1.05, letterSpacing:"-2px",
            color:"var(--color-text-primary)", marginBottom:16, animation:"up .6s ease .05s both" }}>
            ¿Listo para ser<br/>
            <span style={{ fontWeight:400, color:"var(--color-text-secondary)" }}>una Leyenda?</span>
          </div>
          <div style={{ fontSize:15, color:"var(--color-text-secondary)", lineHeight:1.7,
            marginBottom:36, animation:"up .6s ease .1s both" }}>
            Tu progreso, tus badges, tu carrera — todo en un solo lugar.<br/>
            La academia que XCIEN construye para ti.
          </div>
          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap", marginBottom:40, animation:"up .6s ease .15s both" }}>
            <button
              onMouseEnter={e=>e.currentTarget.style.background="var(--color-text-primary)"}
              onMouseLeave={e=>e.currentTarget.style.background="var(--color-text-primary)"}
              style={{ padding:"12px 32px", borderRadius:40,
                background:"var(--color-text-primary)", color:"var(--color-background-primary)",
                fontSize:14, fontWeight:500, border:"none", cursor:"pointer",
                transition:"opacity .2s",
              }}
              onFocus={e=>e.currentTarget.style.opacity=".85"}
              onBlur={e=>e.currentTarget.style.opacity="1"}>
              Únete a la Academia
            </button>
            <button
              onMouseEnter={e=>{e.currentTarget.style.background="var(--color-background-secondary)"}}
              onMouseLeave={e=>{e.currentTarget.style.background="transparent"}}
              style={{ padding:"12px 28px", borderRadius:40,
                background:"transparent", color:"var(--color-text-primary)",
                fontSize:14, fontWeight:500,
                border:"0.5px solid var(--color-border-secondary)", cursor:"pointer",
                transition:"background .2s",
              }}>
              Ver mi perfil →
            </button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, animation:"up .6s ease .2s both" }}>
            {[["47","técnicos activos"],["15","badges disponibles"],["6","plazas en México"]].map(([v,l],i) => (
              <div key={i} style={{ ...card, textAlign:"center", padding:"16px 10px" }}>
                <div style={{ fontSize:26, fontWeight:500, color:"var(--color-text-primary)" }}>{v}</div>
                <div style={{ fontSize:11, color:"var(--color-text-secondary)", marginTop:4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

    return null;
  };

  return (
    <div style={{ background:"var(--color-background-tertiary)", minHeight:"calc(100vh - 80px)",
      position:"relative", overflow:"hidden", borderRadius: "20px", border: "1px solid var(--glass-border)" }}>
      <style>{`
        @keyframes up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box;margin:0;padding:0;font-family:var(--font-sans)}
        ::-webkit-scrollbar{display:none}
      `}</style>

      {/* Header local del componente */}
      <div style={{ position:"sticky", top:0, left:0, right:0, zIndex:20,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"14px 24px",
        background:"var(--color-background-primary)",
        borderBottom:"0.5px solid var(--color-border-tertiary)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:7, height:7, borderRadius:"50%",
            background:"var(--color-text-success)" }}/>
          <span style={{ fontSize:13, fontWeight:500, color:"var(--color-text-primary)" }}>DASHBOARD INTERACTIVO</span>
        </div>

        {/* Pill nav */}
        <div style={{ display:"flex", gap:4, alignItems:"center",
          background:"var(--color-background-secondary)",
          border:"0.5px solid var(--color-border-tertiary)",
          borderRadius:40, padding:"4px 6px" }}>
          {SLIDES.map((_,i) => (
            <button key={i} onClick={()=>go(i)} title={SLIDE_LABELS[i]} style={{
              height:28, minWidth:i===slide?80:28, borderRadius:40, padding:"0 10px",
              border:"none", cursor:"pointer", fontSize:11, fontWeight:500,
              background: i===slide ? "var(--color-background-primary)" : "transparent",
              color: i===slide ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              boxShadow: i===slide ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              transition:"all .25s", whiteSpace:"nowrap",
            }}>
              {i===slide ? SLIDE_LABELS[i] : "·"}
            </button>
          ))}
        </div>

        <div style={{ fontSize:12, color:"var(--color-text-secondary)" }}>{slide+1} / {total}</div>
      </div>

      {/* Slide area */}
      <div key={animKey} style={{ position:"relative", minHeight: "500px" }}>
        {renderSlide()}
      </div>

      {/* Nav */}
      <div style={{ position:"absolute", bottom:20, left:0, right:0,
        display:"flex", justifyContent:"center", gap:8, zIndex:20 }}>
        {[["←", slide===0, ()=>go(Math.max(slide-1,0))],
          ["→", slide===total-1, ()=>go(Math.min(slide+1,total-1))]].map(([label,disabled,fn],i) => (
          <button key={i} onClick={fn} disabled={disabled} style={{
            width:36, height:36, borderRadius:"50%", fontSize:15,
            background:"var(--color-background-primary)",
            border:"0.5px solid var(--color-border-secondary)",
            color: disabled ? "var(--color-text-secondary)" : "var(--color-text-primary)",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? .4 : 1, transition:"all .2s",
          }}>{label}</button>
        ))}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root-dashboard'));
root.render(<AcademiaXCIEN />);
