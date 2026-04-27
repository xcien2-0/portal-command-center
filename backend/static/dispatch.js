const MOCK_TECHS = [
    { name: "Brian Quintero Choreño", plaza: "CDMX", status: "available", skills: [5, 5, 4, 5, 5] },
    { name: "Jose Guadalupe Balderas", plaza: "Nuevo León", status: "insite", skills: [5, 4, 5, 4, 5] },
    { name: "Erik Alberto Silva Olivares", plaza: "Nuevo León", status: "available", skills: [4, 5, 4, 4, 5] },
    { name: "Miguel Angel Flores Herrera", plaza: "Nuevo León", status: "insite", skills: [5, 3, 5, 5, 4] },
    { name: "Andres Guadalupe Guardado", plaza: "Nuevo León", status: "offline", skills: [4, 4, 4, 3, 4] },
    { name: "Roberto Jimenez", plaza: "Jalisco", status: "available", skills: [3, 4, 5, 3, 4] },
    { name: "Carlos Sanchez", plaza: "Querétaro", status: "insite", skills: [5, 5, 3, 4, 3] }
];

document.addEventListener('DOMContentLoaded', () => {
    renderRoster();
});

function renderRoster() {
    const tbody = document.getElementById('dispatch-roster-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    MOCK_TECHS.forEach(tech => {
        const tr = document.createElement('tr');
        
        const statusClass = tech.status === 'available' ? 'status-available' : 
                          tech.status === 'insite' ? 'status-insite' : 'status-offline';
        const statusText = tech.status === 'available' ? 'Disponible' : 
                         tech.status === 'insite' ? 'En Sitio' : 'Desconectado';

        tr.innerHTML = `
            <td style="padding: 15px 10px; border-bottom: 1px solid var(--glass-border);">
                <div style="font-weight: 600;">${tech.name}</div>
                <div style="font-size: 0.7rem; color: #777;">Técnico Especialista</div>
            </td>
            <td style="padding: 15px 10px; border-bottom: 1px solid var(--glass-border);">${tech.plaza}</td>
            <td style="padding: 15px 10px; border-bottom: 1px solid var(--glass-border);">
                <span class="status-pill ${statusClass}">${statusText}</span>
            </td>
            <td style="padding: 15px 10px; border-bottom: 1px solid var(--glass-border);">
                <div style="display: flex; gap: 4px;">
                    ${tech.skills.map(s => `
                        <div class="skill-dot ${s >= 4 ? 'active' : ''}"></div>
                    `).join('')}
                </div>
            </td>
            <td style="padding: 15px 10px; border-bottom: 1px solid var(--glass-border);">
                <button class="primary-btn" style="padding: 5px 12px; font-size: 0.75rem; background: #7c3aed;" onclick="alert('Asignando tarea a ${tech.name}...')">
                    Despachar
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}
