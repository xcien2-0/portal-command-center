// red-en-vivo.jsx — XCIEN NOC Component
// Compatible con Babel Standalone (sin import/export ES modules)

const { useState, useEffect, useCallback } = React;

const MOCK_NODES = [
  { id:"MTY-CORE", label:"MTY-CORE", location:"Monterrey, NL",        client:"Xcien",   latency:10,  uptime:99.9, status:"ok" },
  { id:"APO-DIST", label:"APO-DIST", location:"Apodaca, NL",          client:"Xcien",   latency:38,  uptime:97.2, status:"warning" },
  { id:"ESC-DIST", label:"ESC-DIST", location:"Escobedo, NL",         client:"Luminet", latency:7,   uptime:99.8, status:"ok" },
  { id:"SAL-CORE", label:"SAL-CORE", location:"Saltillo, COAH",       client:"Wispi",   latency:211, uptime:89.1, status:"critical" },
  { id:"RAM-DIST", label:"RAM-DIST", location:"Ramos Arizpe, COAH",   client:"Wispi",   latency:1,   uptime:99.7, status:"ok" },
  { id:"SLP-CORE", label:"SLP-CORE", location:"San Luis Potosí, SLP", client:"Luminet", latency:11,  uptime:99.5, status:"ok" },
  { id:"SOL-DIST", label:"SOL-DIST", location:"Soledad G.S., SLP",    client:"Sandur",  latency:74,  uptime:95.3, status:"warning" },
  { id:"GAR-DIST", label:"GAR-DIST", location:"García, NL",           client:"Huus",    latency:1,   uptime:99.9, status:"ok" },
  { id:"TOR-CORE", label:"TOR-CORE", location:"Torreón, COAH",        client:"Xcien",   latency:12,  uptime:99.6, status:"ok" },
  { id:"STC-DIST", label:"STC-DIST", location:"Santa Catarina, NL",   client:"Huus",    latency:1,   uptime:99.8, status:"ok" },
];

const MOCK_ALERTS = [
  { id:1, node:"COAH-SALTILLO-CORE", type:"Alta latencia",    severity:"critical", technician:"Carlos Mendoza",      status:"Nueva",       ts:"12:34" },
  { id:2, node:"COAH-SALTILLO-CORE", type:"Packet loss >5%",  severity:"critical", technician:"Carlos Mendoza",      status:"Nueva",       ts:"12:34" },
  { id:3, node:"NL-APODACA-DIST",    type:"Latencia elevada", severity:"high",     technician:"Ana Rodríguez",       status:"En atención", ts:"12:21" },
  { id:4, node:"SLP-SOLEDAD-DIST",   type:"Latencia elevada", severity:"high",     technician:"Miguel Ángel Torres", status:"En atención", ts:"12:18" },
  { id:5, node:"NL-STC-DIST",        type:"Flap de interfaz", severity:"high",     technician:"Sin asignar",         status:"Nueva",       ts:"12:05" },
];

const G = "#00ff88";
const Y = "#ffcc00";
const R = "#ff3366";

function sc(s)   { return s==="critical"?R : s==="warning"?Y : G; }
function lsc(ms) { return ms>100?"critical": ms>30?"warning":"ok"; }
function usc(u)  { return u<95?"critical": u<99?"warning":"ok"; }
function health(nodes){ return Math.round(nodes.filter(n=>n.status!=="critical").length/nodes.length*100); }

const CC = { Xcien:"#00aaff", Luminet:"#aa66ff", Wispi:"#0EA5E9", Sandur:"#FF6B35", Huus:"#9B59D7" };
function cc(c){ return CC[c]||"#888"; }

function HoloBackground() {
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
      <div style={{
        position:"absolute", inset:0,
        backgroundImage:`linear-gradient(rgba(0,255,136,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.035) 1px, transparent 1px)`,
        backgroundSize:"44px 44px",
      }}/>
      <div style={{ position:"absolute", top:"25%", left:"50%", transform:"translate(-50%,-50%)", width:900, height:900, borderRadius:"50%", background:"radial-gradient(circle, rgba(0,255,136,0.05) 0%, transparent 65%)" }}/>
      <div style={{ position:"absolute", bottom:"10%", right:"10%", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle, rgba(0,170,255,0.04) 0%, transparent 70%)" }}/>
      <div style={{ position:"absolute", left:0, right:0, height:"1px", background:`linear-gradient(90deg,transparent,rgba(0,255,136,0.25),transparent)`, animation:"scanline 7s linear infinite" }}/>
    </div>
  );
}

function NocClock() {
  const [t, setT] = useState(new Date());
  useEffect(()=>{ const i=setInterval(()=>setT(new Date()),1000); return ()=>clearInterval(i); },[]);
  return <span style={{ fontFamily:"monospace", fontSize:13, color:G, letterSpacing:2, textShadow:`0 0 10px ${G}` }}>{t.toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}</span>;
}

function SectionLabel({ children }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
      <div style={{ width:3, height:14, background:G, boxShadow:`0 0 8px ${G}`, borderRadius:2 }}/>
      <span style={{ fontFamily:"monospace", fontSize:9, fontWeight:700, letterSpacing:3, color:`${G}80`, textTransform:"uppercase" }}>{children}</span>
      <div style={{ flex:1, height:"1px", background:`linear-gradient(90deg,${G}25,transparent)` }}/>
    </div>
  );
}

function NodeCard({ node }) {
  const c = sc(node.status);
  const isCrit = node.status==="critical";
  return (
    <div style={{ position:"relative", borderRadius:8, overflow:"hidden", cursor:"default", background:"rgba(0,8,4,0.88)", border:`1px solid ${c}35`, backdropFilter:"blur(10px)", transition:"all 0.2s", boxShadow: isCrit?`0 0 18px ${R}18`:undefined }}
      onMouseEnter={e=>{ e.currentTarget.style.borderColor=c+"70"; e.currentTarget.style.boxShadow=`0 0 24px ${c}30`; }}
      onMouseLeave={e=>{ e.currentTarget.style.borderColor=c+"35"; e.currentTarget.style.boxShadow=isCrit?`0 0 18px ${R}18`:"none"; }}
    >
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"2px", background:`linear-gradient(90deg,transparent,${c},transparent)`, boxShadow:`0 0 8px ${c}` }}/>
      <div style={{ padding:"14px 15px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
          <span style={{ fontFamily:"monospace", fontWeight:700, fontSize:12, color:"#d8f8e8", letterSpacing:1 }}>{node.label}</span>
          <span style={{ background:`${cc(node.client)}12`, color:cc(node.client), border:`1px solid ${cc(node.client)}35`, borderRadius:3, padding:"1px 6px", fontSize:9, fontWeight:700 }}>{node.client}</span>
        </div>
        <div style={{ fontSize:9, color:"#2a5040", marginBottom:13, fontFamily:"monospace" }}>{node.location}</div>
        <div style={{ display:"flex", gap:16, alignItems:"center" }}>
          <div>
            <span style={{ color:sc(lsc(node.latency)), fontFamily:"monospace", fontWeight:700, fontSize:17, textShadow:`0 0 10px ${sc(lsc(node.latency))}` }}>{node.latency}</span>
            <span style={{ color:"#1e4030", fontSize:9 }}>ms</span>
          </div>
          <div style={{ width:1, height:18, background:"#0a2018" }}/>
          <div>
            <span style={{ color:sc(usc(node.uptime)), fontFamily:"monospace", fontWeight:700, fontSize:17, textShadow:`0 0 10px ${sc(usc(node.uptime))}` }}>{node.uptime}</span>
            <span style={{ color:"#1e4030", fontSize:9 }}>%up</span>
          </div>
        </div>
      </div>
      <div style={{ position:"absolute", bottom:11, right:11, width:7, height:7, borderRadius:"50%", background:c, boxShadow:`0 0 8px ${c}, 0 0 16px ${c}50`, animation:isCrit?"critpulse 1s ease-in-out infinite":undefined }}/>
    </div>
  );
}

function AlertRow({ alert, onAttend }) {
  const isCrit = alert.severity==="critical";
  const c = isCrit ? R : Y;
  return (
    <tr style={{ borderBottom:`1px solid rgba(0,255,136,0.05)`, transition:"background 0.15s" }}
      onMouseEnter={e=>e.currentTarget.style.background="rgba(0,255,136,0.025)"}
      onMouseLeave={e=>e.currentTarget.style.background="transparent"}
    >
      <td style={{ padding:"11px 16px", fontFamily:"monospace", fontSize:11, color:"#90d8b0" }}>{alert.node}</td>
      <td style={{ padding:"11px 16px", fontSize:11, color:"#3a6050" }}>{alert.type}</td>
      <td style={{ padding:"11px 16px", textAlign:"center" }}>
        <div style={{ width:8, height:8, borderRadius:"50%", background:c, margin:"0 auto", boxShadow:`0 0 8px ${c}`, animation:isCrit?"critpulse 1s ease-in-out infinite":undefined }}/>
      </td>
      <td style={{ padding:"11px 16px", fontSize:11, color:"#3a6050" }}>{alert.technician}</td>
      <td style={{ padding:"11px 16px" }}>
        <span style={{ background:alert.status==="Nueva"?`${R}10`:`${G}08`, color:alert.status==="Nueva"?R:G, border:`1px solid ${alert.status==="Nueva"?R+"35":G+"25"}`, borderRadius:3, padding:"2px 8px", fontSize:9, fontFamily:"monospace" }}>
          {alert.status}
        </span>
      </td>
      <td style={{ padding:"11px 16px" }}>
        <button onClick={()=>onAttend(alert)} style={{ background:"transparent", border:`1px solid ${G}45`, color:G, borderRadius:4, padding:"4px 11px", fontSize:9, cursor:"pointer", fontFamily:"monospace", letterSpacing:1.5 }}
          onMouseEnter={e=>{ e.target.style.background=`${G}12`; }}
          onMouseLeave={e=>{ e.target.style.background="transparent"; }}
        >ATENDER</button>
      </td>
    </tr>
  );
}

function HoloBar({ value, color }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <div style={{ flex:1, height:"3px", background:"rgba(0,255,136,0.06)", borderRadius:2, overflow:"hidden" }}>
        <div style={{ width:`${value}%`, height:"100%", background:`linear-gradient(90deg,${color}60,${color})`, boxShadow:`0 0 6px ${color}`, transition:"width 1s ease" }}/>
      </div>
      <span style={{ color, fontFamily:"monospace", fontWeight:700, fontSize:12, textShadow:`0 0 8px ${color}`, minWidth:44, textAlign:"right" }}>{value}%</span>
    </div>
  );
}

function RedEnVivo() {
  const [nodes, setNodes]   = useState(MOCK_NODES);
  const [alerts, setAlerts] = useState(MOCK_ALERTS);
  const [filter, setFilter] = useState("Todos");
  const [view, setView]     = useState("Operador");
  const [lastR, setLastR]   = useState(new Date());
  const [boot, setBoot]     = useState(0);

  const BOOT = ["XCIEN NOC v2.0 — INICIANDO...","Cargando nodos de red...","Conectando telemetría...","Sistema operacional."];
  useEffect(()=>{ if(boot<BOOT.length){ const t=setTimeout(()=>setBoot(b=>b+1),600); return ()=>clearTimeout(t); } },[boot]);

  const refresh = useCallback(()=>{ setLastR(new Date()); },[]);
  useEffect(()=>{ const i=setInterval(refresh,30000); return ()=>clearInterval(i); },[refresh]);

  const h    = health(nodes);
  const hc   = h>=95?G:h>=85?Y:R;
  const crit = alerts.filter(a=>a.severity==="critical").length;
  const high = alerts.filter(a=>a.severity==="high").length;
  const shown = filter==="Todos"?alerts:filter==="Crítico"?alerts.filter(a=>a.severity==="critical"):alerts.filter(a=>a.severity==="high");

  return (
    <div style={{ background:"#000905", minHeight:"calc(100vh - 64px)", color:"#d8f8e8", fontFamily:"sans-serif", position:"relative", overflowX:"hidden" }}>
      <HoloBackground/>
      <div style={{ position:"relative", zIndex:1 }}>

        {/* TOP BAR NOC */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 28px", background:"rgba(0,8,4,0.92)", borderBottom:`1px solid ${G}18`, backdropFilter:"blur(20px)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <div style={{ width:9, height:9, borderRadius:"50%", background:G, boxShadow:`0 0 12px ${G}`, animation:"nocpulse 2s ease-in-out infinite" }}/>
              <span style={{ fontFamily:"monospace", fontWeight:700, fontSize:13, letterSpacing:2.5, color:"#d8f8e8", textTransform:"uppercase" }}>Red en Vivo</span>
            </div>
            <NocClock/>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:18 }}>
            <div style={{ fontFamily:"monospace" }}>
              <span style={{ fontSize:9, color:`${G}45`, letterSpacing:1.5, marginRight:8 }}>RED OPERANDO</span>
              <span style={{ fontSize:16, fontWeight:700, color:hc, textShadow:`0 0 14px ${hc}` }}>{h}%</span>
            </div>
            {crit>0 && (
              <div style={{ display:"flex", alignItems:"center", gap:6, background:`${R}10`, border:`1px solid ${R}45`, borderRadius:6, padding:"4px 12px" }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:R, boxShadow:`0 0 8px ${R}`, animation:"critpulse 1s ease-in-out infinite" }}/>
                <span style={{ color:R, fontWeight:700, fontSize:11, fontFamily:"monospace", letterSpacing:1 }}>{crit} CRÍTICO{crit>1?"S":""}</span>
              </div>
            )}
            <div style={{ display:"flex", background:`${G}06`, border:`1px solid ${G}20`, borderRadius:6, overflow:"hidden" }}>
              {["Operador","Gerencial"].map(v=>(
                <button key={v} onClick={()=>setView(v)} style={{ padding:"5px 14px", fontSize:9, fontWeight:700, border:"none", cursor:"pointer", fontFamily:"monospace", letterSpacing:1.5, textTransform:"uppercase", background:view===v?`${G}18`:"transparent", color:view===v?G:`${G}35`, transition:"all 0.2s" }}>{v}</button>
              ))}
            </div>
          </div>
        </div>

        {/* BOOT SEQUENCE */}
        {boot<BOOT.length && (
          <div style={{ padding:"7px 28px", background:`${G}07`, borderBottom:`1px solid ${G}12` }}>
            {BOOT.slice(0,boot).map((line,i)=>(
              <div key={i} style={{ fontFamily:"monospace", fontSize:9, color:`${G}55`, letterSpacing:1.5 }}>&gt; {line}</div>
            ))}
          </div>
        )}

        <div style={{ padding:"24px 28px", maxWidth:1400, margin:"0 auto" }}>

          {/* VISTA GERENCIAL */}
          {view==="Gerencial" && (
            <div style={{ marginBottom:28, background:"rgba(0,8,4,0.75)", border:`1px solid ${G}18`, borderRadius:10, padding:"20px 24px", backdropFilter:"blur(12px)" }}>
              <SectionLabel>Salud por cliente</SectionLabel>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(190px, 1fr))", gap:20 }}>
                {["Xcien","Luminet","Wispi","Sandur","Huus"].map(client=>{
                  const cn=nodes.filter(n=>n.client===client);
                  const avg=Math.round(cn.reduce((s,n)=>s+n.uptime,0)/cn.length*10)/10;
                  return (
                    <div key={client}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                        <span style={{ fontSize:10, color:cc(client), fontWeight:700, fontFamily:"monospace", letterSpacing:1 }}>{client}</span>
                        <span style={{ fontSize:9, color:`${G}25`, fontFamily:"monospace" }}>{cn.length}n</span>
                      </div>
                      <HoloBar value={avg} color={cc(client)}/>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* NODOS */}
          <SectionLabel>Nodos de red</SectionLabel>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(205px, 1fr))", gap:10, marginBottom:28 }}>
            {nodes.map(node=><NodeCard key={node.id} node={node}/>)}
          </div>

          {/* ALERTAS */}
          <div style={{ background:"rgba(0,8,4,0.82)", border:`1px solid ${G}18`, borderRadius:10, overflow:"hidden", backdropFilter:"blur(12px)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 20px", borderBottom:`1px solid ${G}10` }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <SectionLabel>Alertas activas</SectionLabel>
                <div style={{ width:20, height:20, borderRadius:"50%", background:`${R}18`, border:`1px solid ${R}55`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ fontFamily:"monospace", fontSize:10, fontWeight:700, color:R }}>{alerts.length}</span>
                </div>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                {[{l:"Todos",n:null},{l:"Crítico",n:crit},{l:"Alto",n:high}].map(({l,n})=>(
                  <button key={l} onClick={()=>setFilter(l)} style={{ padding:"4px 11px", fontSize:9, fontWeight:700, letterSpacing:1.5, borderRadius:20, border:"1px solid", fontFamily:"monospace", textTransform:"uppercase", cursor:"pointer", transition:"all 0.15s", borderColor:filter===l?G:`${G}20`, background:filter===l?`${G}12`:"transparent", color:filter===l?G:`${G}35` }}>
                    {l}{n?` (${n})`:""}
                  </button>
                ))}
              </div>
            </div>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ borderBottom:`1px solid ${G}08` }}>
                  {["Nodo","Tipo","Sev.","Técnico","Estado","Acción"].map(h=>(
                    <th key={h} style={{ padding:"9px 16px", fontSize:8, fontWeight:700, color:`${G}35`, letterSpacing:2, textAlign:"left", textTransform:"uppercase", fontFamily:"monospace" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map(a=><AlertRow key={a.id} alert={a} onAttend={al=>setAlerts(prev=>prev.map(x=>x.id===al.id?{...x,status:"En atención"}:x))}/>)}
                {shown.length===0&&<tr><td colSpan={6} style={{ padding:"28px", textAlign:"center", color:`${G}20`, fontSize:10, fontFamily:"monospace", letterSpacing:2 }}>— SIN ALERTAS —</td></tr>}
              </tbody>
            </table>
          </div>

          {/* FOOTER */}
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:14, padding:"0 2px" }}>
            <span style={{ fontSize:8, color:`${G}20`, fontFamily:"monospace", letterSpacing:1.5 }}>XCIEN NOC v2.0 · REFRESH {lastR.toLocaleTimeString("es-MX")} · AUTO 30s</span>
            <div style={{ display:"flex", gap:14, fontSize:8, fontFamily:"monospace", letterSpacing:1 }}>
              <span style={{ color:G }}>● OK</span><span style={{ color:Y }}>● WARNING</span><span style={{ color:R }}>● CRÍTICO</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes nocpulse { 0%,100%{opacity:1;box-shadow:0 0 12px #00ff88}50%{opacity:.4;box-shadow:0 0 4px #00ff88} }
        @keyframes critpulse { 0%,100%{opacity:1}50%{opacity:.25} }
        @keyframes scanline { 0%{top:-2px}100%{top:100vh} }
        button:focus{outline:none}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:#00ff8825;border-radius:2px}
      `}</style>
    </div>
  );
}

// Montar cuando el contenedor NOC esté disponible
const nocContainer = document.getElementById('noc-root');
if (nocContainer) {
  const nocRoot = ReactDOM.createRoot(nocContainer);
  nocRoot.render(<RedEnVivo/>);
}
