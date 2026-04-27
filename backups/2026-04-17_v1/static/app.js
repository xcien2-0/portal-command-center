const API_URL = `${window.location.origin}/api`;

let currentDoc = '';
let quizData = null;
let currentQuestionIndex = 0;
let userAnswers = [];
let allFiles = []; // Almacén para búsqueda rápida
let timerInterval = null;
let isDiagnostic = false;
let startTime = 0;

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
    loadLibrary();
    
    // Delegación de eventos para las opciones (más robusto que onclick en línea)
    document.getElementById('quiz-body').addEventListener('click', (e) => {
        if (e.target.classList.contains('option-btn')) {
            const index = parseInt(e.target.getAttribute('data-idx'));
            selectOption(index);
        }
    });
});

// NAVEGACIÓN
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`section-${sectionId}`).classList.remove('hidden');
    
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`btn-${sectionId}`).classList.add('active');

    // Ocultar buscador en dashboard ya que es una vista de presentación
    if (sectionId === 'dashboard') {
        document.querySelector('.search-container').classList.add('hidden');
    } else {
        document.querySelector('.search-container').classList.remove('hidden');
    }

    if (sectionId === 'academia') {
        loadQuizList();
    }
}

async function startDiagnostic() {
    showSection('academia');
    document.getElementById('quiz-selection').classList.add('hidden');
    document.getElementById('quiz-container').classList.remove('hidden');
    document.getElementById('quiz-timer').classList.remove('hidden');
    
    isDiagnostic = true;
    
    // El técnico debe ingresar su nombre para el diagnóstico
    let nombre = prompt("Por favor, ingresa tu nombre completo para el Examen de Diagnóstico 2026:");
    if (!nombre) {
        resetAcademia();
        return;
    }
    localStorage.setItem('xcien_user_name', nombre);

    try {
        const response = await fetch(`${API_URL}/diagnostic_exam`);
        quizData = await response.json();
        
        currentQuestionIndex = 0;
        userAnswers = [];
        startTimer(quizData.tiempo_limite * 60);
        showQuestion();
    } catch (err) {
        alert("Error cargando el examen de diagnóstico");
        resetAcademia();
    }
}

function startTimer(seconds) {
    let timeLeft = seconds;
    updateTimerDisplay(timeLeft);
    
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay(timeLeft);
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("¡Tiempo agotado! El examen se enviará automáticamente.");
            showResults();
        }
    }, 1000);
}

function updateTimerDisplay(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    document.getElementById('timer-count').innerText = `${mins}:${secs.toString().padStart(2, '0')}`;
    
    if (seconds < 300) { // Menos de 5 min en rojo
        document.getElementById('quiz-timer').style.color = '#ff4d4d';
    } else {
        document.getElementById('quiz-timer').style.color = 'var(--primary)';
    }
}

// BIBLIOTECA
async function loadLibrary() {
    const docsGrid = document.getElementById('docs-list');
    try {
        const response = await fetch(`${API_URL}/docs`);
        allFiles = await response.json();
        renderDocs(allFiles, 'docs-list');
    } catch (err) {
        docsGrid.innerHTML = '<div class="error">Error al cargar la biblioteca.</div>';
    }
}

function renderDocs(files, targetId) {
    const grid = document.getElementById(targetId);
    grid.innerHTML = '';
    
    if (files.length === 0) {
        grid.innerHTML = '<p style="color: grey; padding: 20px;">No se encontraron documentos.</p>';
        return;
    }

    files.forEach(file => {
        const card = document.createElement('div');
        card.className = 'doc-card';
        card.style.animation = 'fadeIn 0.5s ease-out';
        
        const isQuiz = targetId === 'quiz-docs-list';
        const title = file.replace('.md', '').replace(/_/g, ' ');
        
        card.innerHTML = `
            <div>
                <span style="color: var(--primary); font-size: 0.7rem; font-weight: 800; text-transform: uppercase;">Estándar Xcien</span>
                <h3>${title}</h3>
            </div>
            <button class="primary-btn" onclick="${isQuiz ? `startQuiz` : `openDoc`}('${file}')" style="margin-top: 20px;">
                ${isQuiz ? 'Iniciar Certificación' : 'Leer Proceso'}
            </button>
        `;
        grid.appendChild(card);
    });
}

function filterDocs() {
    const term = document.getElementById('global-search').value.toLowerCase();
    const filtered = allFiles.filter(f => f.toLowerCase().includes(term));
    
    const activeSection = document.getElementById('section-biblioteca').classList.contains('hidden') ? 'academia' : 'biblioteca';
    
    if (activeSection === 'biblioteca') {
        renderDocs(filtered, 'docs-list');
    } else {
        renderDocs(filtered, 'quiz-docs-list');
    }
}

async function openDoc(filename) {
    const modal = document.getElementById('doc-viewer');
    const contentDiv = document.getElementById('doc-content-rendered');
    
    try {
        const response = await fetch(`${API_URL}/docs/${filename}`);
        const data = await response.json();
        
        contentDiv.innerHTML = marked.parse(data.content);
        modal.style.display = 'flex';
    } catch (err) {
        alert('Error al abrir el documento');
    }
}

function closeModal() {
    document.getElementById('doc-viewer').style.display = 'none';
}

// ACADEMIA
async function loadQuizList() {
    renderDocs(allFiles, 'quiz-docs-list');
}

async function startQuiz(filename) {
    document.getElementById('quiz-selection').classList.add('hidden');
    document.getElementById('quiz-container').classList.remove('hidden');
    
    // Mostrar loader con mensaje claro de espera
    document.getElementById('quiz-body').innerHTML = `
        <div class="loader-box" style="text-align: center; padding: 40px;">
            <div class="loader" style="margin-bottom: 20px;"></div>
            <h3>El Agente de Academia está leyendo el manual...</h3>
            <p style="color: grey; margin-top: 10px;">Generando examen personalizado de 10 preguntas.</p>
            <p style="font-size: 0.8rem; color: #777; margin-top: 5px;">Esto puede tardar hasta 30 segundos.</p>
        </div>
    `;
    
    try {
        const response = await fetch(`${API_URL}/generate_quiz`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ filename })
        });
        
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Error en el servidor');
        }

        quizData = await response.json();
        
        currentQuestionIndex = 0;
        userAnswers = [];
        showQuestion();
    } catch (err) {
        document.getElementById('quiz-body').innerHTML = `
            <div class="error-box" style="text-align: center; color: #ff4d4d; padding: 40px;">
                <h3>⚠️ Error al generar el examen</h3>
                <p>${err.message}</p>
                <button class="primary-btn" onclick="resetAcademia()" style="margin-top: 20px;">Intentar de Nuevo</button>
            </div>
        `;
    }
}

function showQuestion() {
    const q = quizData.preguntas[currentQuestionIndex];
    document.getElementById('quiz-title').innerText = quizData.titulo;
    document.getElementById('progress').style.width = `${((currentQuestionIndex + 1) / quizData.preguntas.length) * 100}%`;

    const body = document.getElementById('quiz-body');
    body.innerHTML = `
        <div class="question-box">
            <h3>Pregunta ${currentQuestionIndex + 1}: ${q.pregunta}</h3>
            <div class="options-list">
                ${q.opciones.map((opt, idx) => `
                    <button class="option-btn" data-idx="${idx}" id="opt-${idx}">${opt}</button>
                `).join('')}
            </div>
        </div>
    `;
    
    document.getElementById('next-btn').innerText = 
        currentQuestionIndex === quizData.preguntas.length - 1 ? 'Finalizar Examen' : 'Siguiente';
}

function selectOption(index) {
    userAnswers[currentQuestionIndex] = index;
    document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById(`opt-${index}`).classList.add('selected');
}

function nextQuestion() {
    if (userAnswers[currentQuestionIndex] === undefined) {
        alert('Por favor selecciona una respuesta');
        return;
    }

    if (currentQuestionIndex < quizData.preguntas.length - 1) {
        currentQuestionIndex++;
        showQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    document.getElementById('quiz-container').classList.add('hidden');
    document.getElementById('quiz-result').classList.remove('hidden');

    let correctCount = 0;
    quizData.preguntas.forEach((q, idx) => {
        if (userAnswers[idx] === q.respuesta_correcta) {
            correctCount++;
        }
    });

    const finalScore = correctCount;
    document.getElementById('score-text').innerText = `${finalScore}/${quizData.preguntas.length}`;
    
    if (isDiagnostic) {
        clearInterval(timerInterval);
        document.getElementById('quiz-timer').classList.add('hidden');
        processDiagnosticResults();
    } else {
        const msg = finalScore >= 8 
            ? '¡Felicidades! Has aprobado la certificación de Xcien.' 
            : 'Sigue estudiando el manual. Necesitas al menos 8 aciertos para certificarte.';
        document.getElementById('result-message').innerText = msg;
    }
}

async function processDiagnosticResults() {
    const pilarScores = {};
    quizData.pilares.forEach(p => pilarScores[p] = 0);
    const pilarTotals = {};
    quizData.pilares.forEach(p => pilarTotals[p] = 0);

    quizData.preguntas.forEach((q, idx) => {
        pilarTotals[q.pilar]++;
        if (userAnswers[idx] === q.respuesta_correcta) {
            pilarScores[q.pilar]++;
        }
    });

    const finalMapping = {};
    for (let pilar in pilarScores) {
        // Calcular porcentaje por pilar
        finalMapping[pilar] = Math.round((pilarScores[pilar] / pilarTotals[pilar]) * 100);
    }

    const nombre = localStorage.getItem('xcien_user_name');
    
    try {
        await fetch(`${API_URL}/save_skill_result`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                nombre_tecnico: nombre,
                resultados: finalMapping
            })
        });
        
        let reportHtml = '<h3>Ranking por Competencia:</h3><ul style="text-align: left; list-style: none; padding: 0;">';
        for (let p in finalMapping) {
            const color = finalMapping[p] >= 80 ? '#00A859' : (finalMapping[p] >= 60 ? '#f1c40f' : '#e74c3c');
            reportHtml += `<li style="margin-bottom: 8px;">
                <div style="display:flex; justify-content:space-between;">
                    <span>${p}</span>
                    <span style="color: ${color}; font-weight: bold;">${finalMapping[p]}%</span>
                </div>
                <div style="width: 100%; height: 4px; background: #333; border-radius: 2px;">
                    <div style="width: ${finalMapping[p]}%; height: 100%; background: ${color}; border-radius: 2px;"></div>
                </div>
            </li>`;
        }
        reportHtml += '</ul>';
        
        document.getElementById('result-message').innerHTML = `
            <p>Hola <b>${nombre}</b>, hemos generado tu radar de habilidades 2026.</p>
            ${reportHtml}
            <p style="margin-top: 20px; font-size: 0.9rem; color: #999;">Resultados guardados en la Matriz de RRHH.</p>
        `;

    } catch (err) {
        console.error("Error guardando resultados:", err);
    }
}

function resetAcademia() {
    isDiagnostic = false;
    clearInterval(timerInterval);
    document.getElementById('quiz-timer').classList.add('hidden');
    document.getElementById('quiz-result').classList.add('hidden');
    document.getElementById('quiz-container').classList.add('hidden');
    document.getElementById('quiz-selection').classList.remove('hidden');
    loadQuizList();
}


