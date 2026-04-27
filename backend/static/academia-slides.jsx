// Academia XCIEN — Presentación Interactiva (Browser-compatible)
const { useState, useEffect, useCallback } = React;

const SLIDES = ["intro","problema","comparacion","solucion","niveles","badges","leaderboard","roadmap","cta"];
const SLIDE_LABELS = ["Intro","Problema","Comparación","Solución","Niveles","Badges","Ranking","Roadmap","Cierre"];

const LEVELS = [
  { name:"Aprendiz",    min:0,  max:30,  icon:"🌱", color:"#888",    accent:"rgba(255,255,255,0.03)", count:2  },
  { name:"Técnico",     min:30, max:50,  icon:"🔧", color:"#4FC3F7", accent:"rgba(79,195,247,0.08)",  count:8  },
  { name:"Especialista",min:50, max:65,  icon:"⚙️", color:"#00C896", accent:"rgba(0,200,150,0.08)",   count:15 },
  { name:"Avanzado",    min:65, max:80,  icon:"🏆", color:"#7c3aed", accent:"rgba(124,58,237,0.08)",  count:14 },
  { name:"Experto",     min:80, max:95,  icon:"🎖️", color:"#FFB703", accent:"rgba(255,183,3,0.08)",   count:7  },
  { name:"Leyenda",     min:95, max:100, icon:"⭐", color:"#FF4757", accent:"rgba(255,71,87,0.08)",   count:1  },
];

const BADGES_DATA = [
  { icon:"🔧", name:"Maestro Instalador", desc:"100% en Instalación",       holders:3, tc:"#4FC3F7" },
  { icon:"📡", name:"RF Pro",             desc:"Dominio total Redes RF",    holders:2, tc:"#7c3aed" },
  { icon:"⭐", name:"Leyenda XCIEN",      desc:"Avance ≥ 95%",             holders:1, tc:"#FFB703" },
  { icon:"🔥", name:"Firewall Hero",      desc:"Habilidad crítica",        holders:4, tc:"#FF4757" },
  { icon:"🏅", name:"Top de Plaza",       desc:"Mejor técnico en tu ciudad",holders:6, tc:"#00C896" },
  { icon:"💥", name:"Racha x5",           desc:"5 capacitaciones seguidas", holders:8, tc:"#FFB703" },
];

const TOP5 = [
  { name:"Brian Quintero Choreño",      plaza:"CDMX",       role:"COR", pct:100,   badges:12, level:"Leyenda" },
  { name:"Jose Guadalupe Balderas",     plaza:"Nuevo León", role:"COR", pct:95.83, badges:10, level:"Leyenda" },
  { name:"Erik Alberto Silva Olivares", plaza:"Nuevo León", role:"CAE", pct:91.67, badges:9,  level:"Experto" },
  { name:"Miguel Angel Flores Herrera", plaza:"Nuevo León", role:"COR", pct:91.67, badges:9,  level:"Experto" },
  { name:"Andres Guadalupe Guardado",   plaza:"Nuevo León", role:"COR", pct:89.58, badges:8,  level:"Experto" },
];

const BEFORE_AFTER = [
  { b:"Hoja de cálculo estática",   a:"Dashboard interactivo en tiempo real" },
  { b:"Sin visibilidad por técnico", a:"Perfil individual con 48 habilidades" },
  { b:"Capacitación sin incentivos", a:"Niveles, badges y bonos automáticos" },
  { b:"Brechas detectadas tarde",    a:"Gaps visibles al instante por plaza" },
  { b:"Sin historial de progreso",   a:"Evolución trimestral registrada" },
  { b:"Evaluación subjetiva",        a:"Exámenes objetivos ligados a Odoo" },
];

const ROADMAP = [
  { q:"Q2 2025", done:true,  color:"#00C896", items:["Matriz de habilidades v1","Sistema de 6 niveles","15 badges definidos","Datos de 47 técnicos"] },
  { q:"Q3 2025", done:false, color:"#FFB703", items:["Portal web Academia XCIEN","Exámenes en línea","Integración con Odoo","Login individual"] },
  { q:"Q4 2025", done:false, color:"#888",    items:["App móvil técnicos","Smart contracts bonos","Certificaciones oficiales","Expansión 100+"] },
];

const S = {
  card: { background:"#151515", border:"0.5px solid rgba(255,255,255,0.06)", borderRadius:12, padding:20 },
  dim: "#888", green:"#00C896", red:"#FF4757", warn:"#FFB703", info:"#4FC3F7",
};

function Ring({ pct, size=40, stroke=3, color="#FFB703" }) {
  const [p, setP] = useState(0);
  useEffect(() => { const t = setTimeout(() => setP(pct), 100); return () => clearTimeout(t); }, [pct]);
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)", flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${(p/100)*circ} ${circ}`} strokeLinecap="round"
        style={{ transition:"stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)" }}/>
    </svg>
  );
}

function Chip({ children }) {
  return <span style={{ display:"inline-flex", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:500, background:"rgba(255,255,255,0.04)", border:"0.5px solid rgba(255,255,255,0.06)", color:S.dim }}>{children}</span>;
}

function AcademiaSlides() {
  const [slide, setSlide] = useState(0);
  const [hov, setHov] = useState(null);
  const total = SLIDES.length;
  const go = (i) => { if(i>=0 && i<total && i!==slide) { setSlide(i); setHov(null); } };

  useEffect(() => {
    const h = (e) => { if(e.key==="ArrowRight") go(slide+1); if(e.key==="ArrowLeft") go(slide-1); };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [slide]);

  const id = SLIDES[slide];

  const renderSlide = () => {
    if(id==="intro") return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", textAlign:"center" }}>
        <div style={{ display:"flex", gap:8, marginBottom:32, flexWrap:"wrap", justifyContent:"center" }}>
          <Chip>Field Services</Chip><Chip>47 técnicos</Chip><Chip>6 plazas · México</Chip>
        </div>
        <div style={{ fontSize:"clamp(36px,4vw,56px)", fontWeight:500, lineHeight:1, letterSpacing:-2, marginBottom:16 }}>
          Academia<br/><span style={{ fontWeight:400, color:S.dim }}>XCIEN</span>
        </div>
        <div style={{ fontSize:15, color:S.dim, lineHeight:1.7, marginBottom:40 }}>
          El sistema que convierte capacitación en carrera,<br/>esfuerzo en reconocimiento, técnicos en leyendas.
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, width:"100%", maxWidth:500 }}>
          {[["47","","Técnicos"],["62.32","%","Avance global"],["48","","Habilidades"],["15","","Badges"]].map(([v,s,l],i) => (
            <div key={i} style={{ ...S.card, textAlign:"center", padding:"14px 10px" }}>
              <div style={{ fontSize:26, fontWeight:500, letterSpacing:-1 }}>{v}{s}</div>
              <div style={{ fontSize:11, color:S.dim, marginTop:6 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    );

    if(id==="problema") return (
      <div style={{ maxWidth:800 }}>
        <div style={{ fontSize:11, fontWeight:500, letterSpacing:".1em", textTransform:"uppercase", color:S.dim, marginBottom:8 }}>El problema</div>
        <div style={{ fontSize:28, fontWeight:500, lineHeight:1.15, marginBottom:20 }}>Sin sistema,<br/><span style={{ color:S.dim, fontWeight:400 }}>sin dirección</span></div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
          {[
            { icon:"📊", t:"Cero visibilidad", d:"Las habilidades vivían en una hoja estática.", stat:"0%", sl:"datos en vivo" },
            { icon:"😶", t:"Sin motivación", d:"Los técnicos no veían su progreso.", stat:"62%", sl:"avance sin incentivos" },
            { icon:"🎯", t:"Brechas ocultas", d:"Habilidades críticas no se detectaban.", stat:"8.5%", sl:"cobertura Firewall" },
          ].map((c,i) => (
            <div key={i} onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}
              style={{ ...S.card, cursor:"pointer", transition:"all .2s", transform:hov===i?"translateY(-3px)":"none", borderColor:hov===i?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize:24, marginBottom:14 }}>{c.icon}</div>
              <div style={{ fontSize:14, fontWeight:500, marginBottom:8 }}>{c.t}</div>
              <div style={{ fontSize:13, color:S.dim, lineHeight:1.6, marginBottom:16 }}>{c.d}</div>
              <div style={{ borderTop:"0.5px solid rgba(255,255,255,0.06)", paddingTop:14 }}>
                <div style={{ fontSize:24, fontWeight:500, color:S.red }}>{c.stat}</div>
                <div style={{ fontSize:11, color:S.dim, marginTop:2 }}>{c.sl}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    if(id==="comparacion") return (
      <div style={{ maxWidth:700 }}>
        <div style={{ fontSize:11, fontWeight:500, letterSpacing:".1em", textTransform:"uppercase", color:S.dim, marginBottom:8 }}>Antes · Después</div>
        <div style={{ fontSize:28, fontWeight:500, lineHeight:1.15, marginBottom:20 }}>La transformación<br/><span style={{ color:S.dim, fontWeight:400 }}>es visible</span></div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div style={{ padding:"10px 16px", borderRadius:8, background:"rgba(255,71,87,0.08)", border:"0.5px solid rgba(255,71,87,0.2)", display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:S.red }}/><span style={{ fontSize:12, fontWeight:500, color:S.red }}>Sin Academia</span>
          </div>
          <div style={{ padding:"10px 16px", borderRadius:8, background:"rgba(0,200,150,0.08)", border:"0.5px solid rgba(0,200,150,0.2)", display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:S.green }}/><span style={{ fontSize:12, fontWeight:500, color:S.green }}>Con Academia</span>
          </div>
          {BEFORE_AFTER.map((item,i) => (
            <React.Fragment key={i}>
              <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", borderRadius:8, background:"rgba(255,255,255,0.02)", border:"0.5px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize:13, color:S.red }}>✕</span><span style={{ fontSize:13, color:S.dim }}>{item.b}</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", borderRadius:8, background:"rgba(255,255,255,0.02)", border:"0.5px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize:13, color:S.green }}>✓</span><span style={{ fontSize:13, fontWeight:500 }}>{item.a}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    );

    if(id==="solucion") return (
      <div style={{ maxWidth:700 }}>
        <div style={{ fontSize:11, fontWeight:500, letterSpacing:".1em", textTransform:"uppercase", color:S.dim, marginBottom:8 }}>La solución</div>
        <div style={{ fontSize:28, fontWeight:500, lineHeight:1.15, marginBottom:20 }}>Gamificación<br/><span style={{ color:S.dim, fontWeight:400 }}>que sí funciona</span></div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12 }}>
          {[
            { icon:"📈", t:"Niveles progresivos", d:"6 niveles desde Aprendiz hasta Leyenda." },
            { icon:"🏅", t:"Badges por dominio", d:"15 logros desbloqueables por categoría." },
            { icon:"🏆", t:"Leaderboard en vivo", d:"Rankings por plaza, rol y región." },
            { icon:"💰", t:"Bonos automáticos", d:"Smart contracts en n8n + Odoo." },
          ].map((c,i) => (
            <div key={i} onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}
              style={{ ...S.card, transition:"all .2s", transform:hov===i?"translateY(-3px)":"none", borderColor:hov===i?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.06)", cursor:"pointer" }}>
              <div style={{ fontSize:22, marginBottom:12 }}>{c.icon}</div>
              <div style={{ fontSize:14, fontWeight:500, marginBottom:6 }}>{c.t}</div>
              <div style={{ fontSize:13, color:S.dim, lineHeight:1.6 }}>{c.d}</div>
            </div>
          ))}
        </div>
      </div>
    );

    if(id==="niveles") return (
      <div style={{ maxWidth:800 }}>
        <div style={{ fontSize:11, fontWeight:500, letterSpacing:".1em", textTransform:"uppercase", color:S.dim, marginBottom:8 }}>Sistema de niveles</div>
        <div style={{ fontSize:28, fontWeight:500, lineHeight:1.15, marginBottom:20 }}>Tu carrera,<br/><span style={{ color:S.dim, fontWeight:400 }}>paso a paso</span></div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
          {LEVELS.map((lv,i) => (
            <div key={i} onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}
              style={{ ...S.card, cursor:"pointer", transition:"all .2s",
                borderTop: hov===i ? `2px solid ${lv.color}` : "0.5px solid rgba(255,255,255,0.06)",
                background: hov===i ? lv.accent : "#151515",
                transform: hov===i ? "translateY(-3px)" : "none" }}>
              <div style={{ fontSize:22, marginBottom:12 }}>{lv.icon}</div>
              <div style={{ fontSize:14, fontWeight:500, marginBottom:4 }}>{lv.name}</div>
              <div style={{ fontSize:12, color:S.dim, marginBottom:10 }}>{lv.min}–{lv.max}%</div>
              <span style={{ fontSize:11, color:lv.color, fontWeight:500, background:"rgba(255,255,255,0.04)", padding:"2px 8px", borderRadius:20 }}>{lv.count} técnicos</span>
            </div>
          ))}
        </div>
      </div>
    );

    if(id==="badges") return (
      <div style={{ maxWidth:800 }}>
        <div style={{ fontSize:11, fontWeight:500, letterSpacing:".1em", textTransform:"uppercase", color:S.dim, marginBottom:8 }}>Sistema de badges</div>
        <div style={{ fontSize:28, fontWeight:500, lineHeight:1.15, marginBottom:20 }}>Gana reconocimiento,<br/><span style={{ color:S.dim, fontWeight:400 }}>demuestra tu dominio</span></div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
          {BADGES_DATA.map((b,i) => (
            <div key={i} onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}
              style={{ ...S.card, padding:16, transition:"all .2s", transform:hov===i?"translateY(-3px)":"none", borderColor:hov===i?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.06)", cursor:"pointer" }}>
              <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                <div style={{ width:40, height:40, borderRadius:8, flexShrink:0, background:hov===i?`${b.tc}22`:"rgba(255,255,255,0.04)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, transition:"background .2s" }}>{b.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:500, marginBottom:3 }}>{b.name}</div>
                  <div style={{ fontSize:12, color:S.dim, marginBottom:8, lineHeight:1.5 }}>{b.desc}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ flex:1, height:3, borderRadius:2, background:"rgba(255,255,255,0.06)" }}>
                      <div style={{ height:"100%", borderRadius:2, background:b.tc, width:`${(b.holders/47)*100}%`, transition:"width .9s ease" }}/>
                    </div>
                    <span style={{ fontSize:11, color:b.tc, fontWeight:500, flexShrink:0 }}>{b.holders}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    if(id==="leaderboard") return (
      <div style={{ maxWidth:700 }}>
        <div style={{ fontSize:11, fontWeight:500, letterSpacing:".1em", textTransform:"uppercase", color:S.dim, marginBottom:8 }}>Leaderboard 2025</div>
        <div style={{ fontSize:28, fontWeight:500, lineHeight:1.15, marginBottom:20 }}>Top técnicos —<br/><span style={{ color:S.dim, fontWeight:400 }}>¿dónde estás tú?</span></div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {TOP5.map((t,i) => {
            const rc = [S.warn,"#aaa",S.red,"#aaa","#aaa"][i];
            return (
              <div key={i} onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}
                style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 18px", borderRadius:12, background:"#151515", border:"0.5px solid rgba(255,255,255,0.06)", transition:"all .2s", transform:hov===i?"translateX(4px)":"none", cursor:"pointer" }}>
                <div style={{ width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, background:"rgba(255,255,255,0.04)" }}>
                  {i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}`}
                </div>
                <Ring pct={t.pct} size={40} stroke={3} color={rc}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{t.name}</div>
                  <div style={{ display:"flex", gap:6, marginTop:4 }}><Chip>{t.role}</Chip><Chip>📍{t.plaza}</Chip><Chip>{t.level}</Chip></div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontSize:18, fontWeight:500 }}>{t.pct.toFixed(t.pct===100?0:1)}%</div>
                  <div style={{ fontSize:11, color:S.dim, marginTop:2 }}>{t.badges} badges</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );

    if(id==="roadmap") return (
      <div style={{ maxWidth:800 }}>
        <div style={{ fontSize:11, fontWeight:500, letterSpacing:".1em", textTransform:"uppercase", color:S.dim, marginBottom:8 }}>Roadmap</div>
        <div style={{ fontSize:28, fontWeight:500, lineHeight:1.15, marginBottom:20 }}>El plan para<br/><span style={{ color:S.dim, fontWeight:400 }}>la academia</span></div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
          {ROADMAP.map((ph,i) => (
            <div key={i} style={{ ...S.card, borderTop:`2px solid ${ph.color}`, borderRadius:"0 0 12px 12px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <span style={{ fontSize:14, fontWeight:500 }}>{ph.q}</span>
                <span style={{ fontSize:10, fontWeight:500, color:ph.color, background:`${ph.color}18`, padding:"2px 8px", borderRadius:20 }}>
                  {ph.done?"Completado":i===1?"En progreso":"Próximo"}
                </span>
              </div>
              {ph.items.map((item,j) => (
                <div key={j} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:8 }}>
                  <div style={{ width:5, height:5, borderRadius:"50%", background:ph.color, marginTop:5, flexShrink:0 }}/>
                  <span style={{ fontSize:13, color:S.dim, lineHeight:1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );

    if(id==="cta") return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", textAlign:"center" }}>
        <div style={{ display:"flex", gap:8, marginBottom:28 }}><Chip>Academia XCIEN</Chip><Chip>Q3 2025</Chip></div>
        <div style={{ fontSize:"clamp(32px,4vw,50px)", fontWeight:500, lineHeight:1.05, letterSpacing:-2, marginBottom:16 }}>
          ¿Listo para ser<br/><span style={{ fontWeight:400, color:S.dim }}>una Leyenda?</span>
        </div>
        <div style={{ fontSize:15, color:S.dim, lineHeight:1.7, marginBottom:36 }}>
          Tu progreso, tus badges, tu carrera — todo en un solo lugar.
        </div>
        <button style={{ padding:"12px 32px", borderRadius:40, background:"white", color:"#0A0A0A", fontSize:14, fontWeight:500, border:"none", cursor:"pointer" }}>
          Únete a la Academia
        </button>
      </div>
    );

    return null;
  };

  return (
    <div style={{ background:"#0d1117", minHeight:"calc(100vh - 130px)", position:"relative", overflow:"hidden", borderRadius:16, border:"1px solid rgba(255,255,255,0.06)" }}>
      <style>{`@keyframes up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 20px", borderBottom:"0.5px solid rgba(255,255,255,0.06)", background:"#151515" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background:S.green }}/>
          <span style={{ fontSize:13, fontWeight:500 }}>XCIEN</span>
          <span style={{ fontSize:13, color:S.dim }}>/ Academia</span>
        </div>
        <div style={{ display:"flex", gap:4, background:"rgba(255,255,255,0.03)", border:"0.5px solid rgba(255,255,255,0.06)", borderRadius:40, padding:"4px 6px" }}>
          {SLIDES.map((_,i) => (
            <button key={i} onClick={()=>go(i)} style={{
              height:26, minWidth:i===slide?72:26, borderRadius:40, padding:"0 8px",
              border:"none", cursor:"pointer", fontSize:10, fontWeight:500,
              background: i===slide ? "#151515" : "transparent",
              color: i===slide ? "white" : S.dim,
              transition:"all .25s", whiteSpace:"nowrap",
            }}>
              {i===slide ? SLIDE_LABELS[i] : "·"}
            </button>
          ))}
        </div>
        <div style={{ fontSize:12, color:S.dim }}>{slide+1} / {total}</div>
      </div>

      {/* Content */}
      <div key={slide} style={{ padding:"40px 48px", minHeight:500, display:"flex", alignItems:"center", justifyContent:"center", animation:"up .4s ease" }}>
        {renderSlide()}
      </div>

      {/* Nav arrows */}
      <div style={{ position:"absolute", bottom:16, left:0, right:0, display:"flex", justifyContent:"center", gap:8 }}>
        {[["←",slide===0,()=>go(slide-1)],["→",slide===total-1,()=>go(slide+1)]].map(([label,disabled,fn],i) => (
          <button key={i} onClick={fn} disabled={disabled} style={{
            width:34, height:34, borderRadius:"50%", fontSize:14,
            background:"#151515", border:"0.5px solid rgba(255,255,255,0.1)",
            color: disabled ? "#555" : "white", cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? .4 : 1, transition:"all .2s",
          }}>{label}</button>
        ))}
      </div>
    </div>
  );
}

// Mount
const dashRoot = document.getElementById("root-dashboard");
if (dashRoot) { ReactDOM.createRoot(dashRoot).render(React.createElement(AcademiaSlides)); }
