// ═══════════════════════════════════════════════════════
//  XCIEN 2.0 — Master App Controller
// ═══════════════════════════════════════════════════════
const API = `${window.location.origin}/api`;

// ─── SECCIÓN: Clock ─────────────────────────────────────
function updateClock() {
    const now = new Date();
    const t = now.toLocaleTimeString('es-MX', { hour12: false });
    const el = document.getElementById('live-clock');
    if (el) el.textContent = t;
}
setInterval(updateClock, 1000);
updateClock();

// ─── SECCIÓN: Navegación ─────────────────────────────────
const SECTION_TITLES = {
    inicio: '💎 Agente Director General',
    noc: '📡 Red en Vivo — NOC',
    operaciones: '🛠️ Operaciones de Campo',
    'academia-dash': '📈 Dashboard Academia XCIEN',
    biblioteca: '📖 Biblioteca & Exámenes',
    wfm: '🚚 WFM Control — Dispatch'
};

function switchSection(id) {
    // Ocultar todas
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    // Activar
    const target = document.getElementById(`section-${id}`);
    if (target) target.classList.add('active');

    // Nav activo
    document.querySelectorAll('.nav-item').forEach(b => {
        b.classList.toggle('active', b.dataset.section === id);
    });

    // Título
    const titleEl = document.getElementById('section-title');
    if (titleEl) titleEl.textContent = SECTION_TITLES[id] || id;

    // Cargar datos según sección
    if (id === 'noc') loadNOC();
    if (id === 'wfm') loadWFM();
    if (id === 'biblioteca') loadLibrary();
}

// ─── INICIO: mostrar NOC por defecto ─────────────────────
window.addEventListener('DOMContentLoaded', () => {
    switchSection('noc');
    loadNOC();
});

// ═══════════════════════════════════════════════════════
//  MÓDULO 1: NOC — RED EN VIVO
// ═══════════════════════════════════════════════════════
const NOC_NODES = [
    { name:'CDMX-Core-01', icon:'🏢', lat: 19.4, lon: -99.1, pop: 'CDMX', type: 'core' },
    { name:'MTY-Hub-01',   icon:'🏙️', lat: 25.6, lon:-100.3, pop: 'Monterrey', type: 'hub' },
    { name:'GDL-Edge-01',  icon:'🏘️', lat: 20.6, lon:-103.3, pop: 'Guadalajara', type: 'edge' },
    { name:'QRO-Node-01',  icon:'🔲', lat: 20.5, lon: -100.4, pop: 'Querétaro', type: 'edge' },
    { name:'PUE-Node-01',  icon:'🔲', lat: 19.0, lon: -98.2, pop: 'Puebla', type: 'edge' },
    { name:'WIFI-AP-MTY',  icon:'📶', lat: 25.7, lon:-100.2, pop: 'Monterrey', type: 'ap' },
];

const ALERTS_MOCK = [
    { node:'MTY-Hub-01',  type:'Latencia Alta',   sev:'WARNING',  tech:'Carlos Rodríguez', status:'Investigando' },
    { node:'GDL-Edge-01', type:'Pérdida de Paquetes', sev:'CRITICAL', tech:'Sin asignar', status:'Abierto' },
    { node:'WIFI-AP-MTY', type:'AP Desconectado', sev:'INFO',    tech:'Juan López',    status:'Resuelto' },
];

function loadNOC() {
    // Nodos
    const grid = document.getElementById('nodes-grid');
    if (!grid) return;

    const stats = [
        { pct: 100, label: 'OK' },
        { pct: 78,  label: 'Degradado' },
        { pct: 100, label: 'OK' },
        { pct: 95,  label: 'OK' },
        { pct: 100, label: 'OK' },
        { pct: 0,   label: 'OFFLINE' },
    ];

    grid.innerHTML = NOC_NODES.map((n, i) => {
        const s = stats[i];
        const cls = s.pct === 0 ? 'danger' : s.pct < 90 ? 'warning' : '';
        const color = s.pct === 0 ? '#e74c3c' : s.pct < 90 ? '#f1c40f' : '#00A859';
        return `
        <div class="node-card ${cls}">
            <span class="node-icon">${n.icon}</span>
            <span class="node-name">${n.name}</span>
            <span class="node-stat" style="color:${color}">${s.label} ${s.pct > 0 ? '· ' + s.pct + '%' : ''}</span>
            <span class="node-stat">${n.pop}</span>
        </div>`;
    }).join('');

    // Alertas
    const body = document.getElementById('alerts-body');
    const count = document.getElementById('alert-count');
    if (!body) return;

    const active = ALERTS_MOCK.filter(a => a.status !== 'Resuelto');
    if (count) count.textContent = active.length;

    body.innerHTML = ALERTS_MOCK.map(a => {
        const sevColor = a.sev === 'CRITICAL' ? '#e74c3c' : a.sev === 'WARNING' ? '#f1c40f' : '#3498db';
        return `<tr>
            <td>${a.node}</td>
            <td>${a.type}</td>
            <td><span style="color:${sevColor}; font-weight:700; font-size:0.75rem;">${a.sev}</span></td>
            <td>${a.tech}</td>
            <td>${a.status}</td>
            <td><button class="primary-btn" style="padding:5px 14px; font-size:0.75rem;">Ver</button></td>
        </tr>`;
    }).join('');
}

// ═══════════════════════════════════════════════════════
//  MÓDULO 2: WFM — WORKFORCE MANAGEMENT
// ═══════════════════════════════════════════════════════
async function loadWFM() {
    const container = document.getElementById('wfm-content');
    if (!container) return;
    container.innerHTML = `<p style="color:var(--dim); padding:20px;">Cargando datos de campo...</p>`;

    try {
        const [techRes, ticketRes] = await Promise.all([
            fetch(`${API}/wfm/tecnicos`),
            fetch(`${API}/wfm/tickets`)
        ]);
        const techs  = await techRes.json();
        const tickets = await ticketRes.json();

        container.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 24px;">
            <!-- Técnicos -->
            <div style="background:var(--card); border:1px solid var(--border); border-radius:16px; overflow:hidden;">
                <div style="padding:20px; border-bottom:1px solid var(--border);">
                    <h3 style="font-size:0.95rem;">👷 TÉCNICOS DE CAMPO</h3>
                </div>
                <table class="data-table" style="width:100%">
                    <thead><tr><th>Nombre</th><th>Zona</th><th>Status</th></tr></thead>
                    <tbody>
                        ${techs.map(t => {
                            const c = t.status === 'Disponible' ? '#00A859' : '#f1c40f';
                            return `<tr>
                                <td>
                                    <div style="font-weight:600;">${t.nombre}</div>
                                    <div style="font-size:0.7rem; color:var(--dim);">${t.especialidad || ''}</div>
                                </td>
                                <td>${t.zona}</td>
                                <td><span style="color:${c}; font-size:0.8rem; font-weight:700;">${t.status}</span></td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Tickets -->
            <div style="background:var(--card); border:1px solid var(--border); border-radius:16px; overflow:hidden;">
                <div style="padding:20px; border-bottom:1px solid var(--border);">
                    <h3 style="font-size:0.95rem;">🎫 TICKETS ACTIVOS</h3>
                </div>
                <table class="data-table" style="width:100%">
                    <thead><tr><th>Ticket</th><th>Zona</th><th>Status</th><th></th></tr></thead>
                    <tbody>
                        ${tickets.map(t => {
                            const c = t.status === 'Agendado' ? '#00A859' : t.status === 'Pendiente' ? '#f1c40f' : '#3498db';
                            return `<tr>
                                <td>
                                    <div style="font-weight:600;">${t.id}</div>
                                    <div style="font-size:0.7rem; color:var(--dim);">${t.tipo}</div>
                                </td>
                                <td>${t.zona}</td>
                                <td><span style="color:${c}; font-size:0.8rem; font-weight:700;">${t.status}</span></td>
                                <td>
                                    ${t.status === 'Pendiente' ? `<button class="primary-btn" style="padding:5px 12px; font-size:0.75rem;" onclick="asignarTicket('${t.id}')">⚡ Asignar</button>` : ''}
                                </td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
    } catch (e) {
        container.innerHTML = `<p style="color:#e74c3c; padding:20px;">Error al cargar WFM: ${e.message}</p>`;
    }
}

async function asignarTicket(ticketId) {
    try {
        const r = await fetch(`${API}/wfm/asignar/${ticketId}`, { method: 'POST' });
        const d = await r.json();
        if (d.status === 'success') {
            alert(`✅ Ticket ${ticketId} asignado a ${d.tecnico_asignado}`);
            loadWFM();
        }
    } catch (e) {
        alert('Error al asignar el ticket');
    }
}

// ═══════════════════════════════════════════════════════
//  MÓDULO 3: BIBLIOTECA & EXÁMENES
// ═══════════════════════════════════════════════════════
let allDocs = [];

async function loadLibrary() {
    const grid = document.getElementById('lib-grid');
    if (!grid) return;
    grid.innerHTML = `<p style="color:var(--dim);">Cargando biblioteca...</p>`;

    try {
        const r = await fetch(`${API}/docs`);
        allDocs = await r.json();
        renderLibrary(allDocs);
    } catch (e) {
        grid.innerHTML = `<p style="color:#e74c3c;">Error al cargar la biblioteca.</p>`;
    }
}

function renderLibrary(files) {
    const grid = document.getElementById('lib-grid');
    if (!grid) return;

    if (!files.length) {
        grid.innerHTML = `<p style="color:var(--dim);">Sin documentos encontrados.</p>`;
        return;
    }

    grid.innerHTML = files.map(f => {
        const title = f.replace('.md', '').replace(/_/g, ' ');
        return `
        <div class="doc-card">
            <div class="tag-label">Estándar Xcien</div>
            <h3 style="font-size:0.95rem; line-height:1.4; margin-bottom:8px;">${title}</h3>
            <div style="display:flex; gap:10px; margin-top:1rem;">
                <button class="card-btn" onclick="openDoc('${f}')">📖 Leer</button>
                <button class="card-btn" style="background:var(--green-glow); border-color:var(--green); color:var(--green);" onclick="startExam('${f}')">🎓 Examinar</button>
            </div>
        </div>`;
    }).join('');
}

function filterLibrary() {
    const term = document.getElementById('lib-search')?.value.toLowerCase() || '';
    renderLibrary(allDocs.filter(f => f.toLowerCase().includes(term)));
}

async function openDoc(filename) {
    const modal = document.getElementById('doc-modal');
    const body  = document.getElementById('modal-body');
    body.innerHTML = `<p style="color:var(--dim);">Cargando...</p>`;
    modal.style.display = 'flex';

    try {
        const r = await fetch(`${API}/docs/${filename}`);
        const d = await r.json();
        body.innerHTML = `<h2 style="color:var(--green); margin-bottom:1.5rem;">${filename.replace('.md','').replace(/_/g,' ')}</h2>` + marked.parse(d.content);
    } catch (e) {
        body.innerHTML = `<p style="color:#e74c3c;">Error al cargar el documento.</p>`;
    }
}

function closeModal() {
    document.getElementById('doc-modal').style.display = 'none';
}

// ─── EXÁMENES ────────────────────────────────────────────
let quizData = null;
let currentQ = 0;
let answers  = [];
let pendingFile = '';

async function startExam(filename) {
    pendingFile = filename;
    const overlay = document.getElementById('exam-overlay');
    const content = document.getElementById('exam-content');
    overlay.classList.remove('hidden');

    content.innerHTML = `
        <div style="max-width:600px; margin:0 auto;">
            <h2 style="color:var(--green); margin-bottom:8px;">🎓 Iniciar Examen</h2>
            <p style="color:var(--dim); margin-bottom:24px;">${filename.replace('.md','').replace(/_/g,' ')}</p>
            <input type="text" id="exam-name-input" placeholder="Tu nombre completo" style="width:100%; padding:14px 18px; background:#1a1a1a; border:1px solid var(--border); border-radius:10px; color:white; font-size:1rem; font-family:Inter,sans-serif; outline:none; margin-bottom:16px;">
            <button class="primary-btn" style="width:100%; padding:14px;" onclick="beginExam()">🚀 Comenzar</button>
        </div>`;
}

async function beginExam() {
    const nameInput = document.getElementById('exam-name-input');
    const nombre = nameInput?.value.trim();
    if (!nombre) { nameInput.style.borderColor = '#e74c3c'; return; }
    localStorage.setItem('xcien_nombre', nombre);

    const content = document.getElementById('exam-content');
    content.innerHTML = `<div style="text-align:center; padding:60px 0;">
        <div style="font-size:3rem; margin-bottom:20px;">🤖</div>
        <h3>Generando examen con IA...</h3>
        <p style="color:var(--dim); margin-top:10px;">El agente de Academia está leyendo el manual. Esto puede tardar hasta 30 segundos.</p>
    </div>`;

    try {
        const r = await fetch(`${API}/generate_quiz`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: pendingFile })
        });
        if (!r.ok) throw new Error((await r.json()).detail);
        quizData = await r.json();
        currentQ = 0;
        answers  = [];
        showQuestion();
    } catch (e) {
        content.innerHTML = `<div style="text-align:center; padding:40px;">
            <div style="font-size:2rem; margin-bottom:16px;">⚠️</div>
            <h3>Error generando el examen</h3>
            <p style="color:var(--dim); margin:10px 0;">${e.message}</p>
            <button class="primary-btn" onclick="closeExam()">← Volver</button>
        </div>`;
    }
}

async function startDiagnostic() {
    const overlay = document.getElementById('exam-overlay');
    const content = document.getElementById('exam-content');
    overlay.classList.remove('hidden');

    content.innerHTML = `
        <div style="max-width:600px; margin:0 auto; text-align:center;">
            <div style="font-size:3rem; margin-bottom:16px;">🚀</div>
            <h2 style="color:var(--green); margin-bottom:8px;">Examen de Diagnóstico 2026</h2>
            <p style="color:var(--dim); margin-bottom:24px;">Evaluación global de habilidades técnicas</p>
            <input type="text" id="diagnostic-name-input" placeholder="Tu nombre completo" style="width:100%; padding:14px 18px; background:#1a1a1a; border:1px solid var(--border); border-radius:10px; color:white; font-size:1rem; font-family:Inter,sans-serif; outline:none; margin-bottom:16px;">
            <button class="primary-btn" style="width:100%; padding:14px;" onclick="beginDiagnostic()">Comenzar Evaluación</button>
        </div>`;
}

async function beginDiagnostic() {
    const nameInput = document.getElementById('diagnostic-name-input');
    const nombre = nameInput?.value.trim();
    if (!nombre) { nameInput.style.borderColor = '#e74c3c'; return; }
    localStorage.setItem('xcien_nombre', nombre);

    const content = document.getElementById('exam-content');
    content.innerHTML = `<div style="text-align:center; padding:60px 0;">
        <div style="font-size:3rem; margin-bottom:20px;">⏳</div>
        <h3>Cargando Banco Maestro...</h3>
    </div>`;

    try {
        const r = await fetch(`${API}/diagnostic_exam`);
        if (!r.ok) throw new Error((await r.json()).detail);
        quizData = await r.json();
        currentQ = 0;
        answers  = [];
        showQuestion();
    } catch (e) {
        content.innerHTML = `<div style="text-align:center; padding:40px;">
            <div style="font-size:2rem; margin-bottom:16px;">⚠️</div>
            <h3>Error cargando el examen</h3>
            <p style="color:var(--dim); margin:10px 0;">${e.message}</p>
            <button class="primary-btn" onclick="closeExam()">← Volver</button>
        </div>`;
    }
}

function showQuestion() {
    const q = quizData.preguntas[currentQ];
    const total = quizData.preguntas.length;
    const pct = Math.round(((currentQ) / total) * 100);
    const content = document.getElementById('exam-content');

    content.innerHTML = `
        <div style="max-width:700px; margin:0 auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <h3 style="color:var(--green);">${quizData.titulo}</h3>
                <span style="color:var(--dim); font-size:0.85rem;">${currentQ+1} / ${total}</span>
            </div>
            <div style="background:var(--border); height:4px; border-radius:2px; margin-bottom:28px; overflow:hidden;">
                <div style="height:100%; width:${pct}%; background:var(--green); transition:0.4s;"></div>
            </div>
            <div style="background:var(--card); border:1px solid var(--border); border-radius:14px; padding:24px;">
                <h4 style="line-height:1.5; margin-bottom:20px;">${q.pregunta}</h4>
                <div style="display:flex; flex-direction:column; gap:10px;">
                    ${q.opciones.map((opt, idx) => `
                        <button class="option-btn" id="opt-${idx}"
                            onclick="selectOption(${idx})"
                            style="text-align:left; padding:14px 18px; background:#1a1a1a; border:1px solid var(--border); border-radius:10px; color:white; cursor:pointer; font-family:Inter,sans-serif; transition:0.2s;">
                            <span style="color:var(--green); margin-right:10px; font-weight:700;">${String.fromCharCode(65+idx)})</span>${opt}
                        </button>`).join('')}
                </div>
            </div>
            <button id="next-btn" onclick="nextQuestion()" disabled
                style="margin-top:20px; width:100%; padding:14px; border-radius:10px; border:none; background:#222; color:var(--dim); font-weight:700; cursor:not-allowed;">
                ${currentQ < total-1 ? 'Siguiente →' : 'Finalizar Examen'}
            </button>
        </div>`;
}

function selectOption(idx) {
    answers[currentQ] = idx;
    document.querySelectorAll('.option-btn').forEach((btn, i) => {
        btn.style.borderColor = i === idx ? 'var(--green)' : 'var(--border)';
        btn.style.background  = i === idx ? 'rgba(0,168,89,0.1)' : '#1a1a1a';
    });
    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) {
        nextBtn.disabled = false;
        nextBtn.style.background = 'var(--green)';
        nextBtn.style.color = 'white';
        nextBtn.style.cursor = 'pointer';
    }
}

function nextQuestion() {
    if (answers[currentQ] === undefined) return;
    currentQ++;
    if (currentQ < quizData.preguntas.length) {
        showQuestion();
    } else {
        showResults();
    }
}

async function showResults() {
    const total = quizData.preguntas.length;
    let correctas = 0;
    const pilarScore = {};
    const pilarTotal = {};

    quizData.preguntas.forEach((q, i) => {
        const pilar = q.pilar || 'General';
        pilarTotal[pilar] = (pilarTotal[pilar] || 0) + 1;
        if (answers[i] === q.respuesta_correcta) {
            correctas++;
            pilarScore[pilar] = (pilarScore[pilar] || 0) + 1;
        }
    });

    const pct     = Math.round((correctas / total) * 100);
    const aprobado = correctas >= Math.ceil(total * 0.7);
    const nombre   = localStorage.getItem('xcien_nombre') || 'Técnico';
    const color    = aprobado ? '#00A859' : '#e74c3c';

    document.getElementById('exam-content').innerHTML = `
        <div style="max-width:600px; margin:0 auto; text-align:center;">
            <div style="font-size:4rem; margin-bottom:16px;">${aprobado ? '🏆' : '📖'}</div>
            <h2 style="font-size:1.5rem; margin-bottom:8px;">${aprobado ? '¡Certificación Aprobada!' : 'Sigue Practicando'}</h2>
            <p style="color:var(--dim); margin-bottom:32px;">${nombre}</p>
            <div style="background:var(--card); border:2px solid ${color}; border-radius:20px; padding:32px; margin-bottom:24px;">
                <div style="font-size:3rem; font-weight:800; color:${color};">${correctas}/${total}</div>
                <div style="font-size:1.5rem; color:${color}; margin-top:4px;">${pct}%</div>
                <div style="color:var(--dim); margin-top:8px; font-size:0.85rem;">Necesitas 70% para certificarte</div>
            </div>
            <div style="text-align:left; background:var(--card); border:1px solid var(--border); border-radius:14px; padding:20px; margin-bottom:24px;">
                ${quizData.preguntas.map((q, i) => {
                    const ok = answers[i] === q.respuesta_correcta;
                    return `<div style="padding:12px 0; border-bottom:1px solid var(--border); display:flex; gap:12px; align-items:flex-start;">
                        <span style="font-size:1.2rem; flex-shrink:0;">${ok ? '✅' : '❌'}</span>
                        <div>
                            <div style="font-size:0.85rem; margin-bottom:4px;">${q.pregunta}</div>
                            ${!ok ? `<div style="font-size:0.75rem; color:var(--green);">✔ ${q.opciones[q.respuesta_correcta]}</div>` : ''}
                        </div>
                    </div>`;
                }).join('')}
            </div>
            <button class="primary-btn" style="padding:14px 32px;" onclick="closeExam()">← Volver a la Biblioteca</button>
        </div>`;

    // Guardar resultado
    try {
        await fetch(`${API}/save_skill_result`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre_tecnico: nombre, resultados: pilarScore })
        });
    } catch (e) { /* silencioso */ }
}

function closeExam() {
    document.getElementById('exam-overlay').classList.add('hidden');
    quizData = null; currentQ = 0; answers = [];
}

// ═══════════════════════════════════════════════════════
//  MÓDULO 4: DIRECTOR GENERAL — Chat AI
// ═══════════════════════════════════════════════════════
async function sendChat() {
    const input  = document.getElementById('chat-input');
    const msgs   = document.getElementById('chat-messages');
    const msg    = input?.value.trim();
    if (!msg) return;

    msgs.innerHTML += `<div class="msg user">${msg}</div>`;
    input.value = '';
    msgs.scrollTop = msgs.scrollHeight;

    const loadId = 'load-' + Date.now();
    msgs.innerHTML += `<div class="msg bot" id="${loadId}" style="color:var(--dim);">💎 Analizando y delegando...</div>`;
    msgs.scrollTop = msgs.scrollHeight;

    try {
        const r = await fetch(`${API}/director/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg })
        });
        const d = await r.json();
        const loadEl = document.getElementById(loadId);
        if (loadEl) loadEl.remove();

        const text = d.response || d.detail || 'Sin respuesta';
        msgs.innerHTML += `<div class="msg bot">${marked.parse(text)}</div>`;
    } catch (e) {
        const loadEl = document.getElementById(loadId);
        if (loadEl) loadEl.textContent = '❌ Error en el centro de mando. Verifica que el servidor esté activo.';
    }
    msgs.scrollTop = msgs.scrollHeight;
}
