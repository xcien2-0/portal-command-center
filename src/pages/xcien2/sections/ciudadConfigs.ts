import type { PlazaConfig } from './CiudadOSSection';

export const PDN_CONFIG: PlazaConfig = {
  id: 'pdn',
  nombre: 'Piedras Negras',
  estado_mx: 'Coahuila',
  emoji: '🏙️',
  fibra_plaza_id: 'pn',
  tecnico_filter: '',
  ticket_terms: ['piedras', 'acuña', 'acuna', 'allende', 'nava', 'progreso', 'cd acuña'],
  noc_terms: ['piedras', 'acuña', 'acuna', 'pdn', 'acu'],
  blocker: 'F3 CWDM bloqueado — Lancemex 21 cajas, 10% avance · Escalado a Francisco Alday',
  equipo: [
    { nombre: 'Francisco Alday',        rol: 'Responsable de plaza',  emoji: '👔' },
    { nombre: 'Guillermo Hernandez F.', rol: 'Técnico campo',         emoji: '🔧', activo: true },
    { nombre: 'José Miguel Macías',     rol: 'Supervisor / Auditor',  emoji: '🛡️' },
  ],
};

export const MTY_CONFIG: PlazaConfig = {
  id: 'mty',
  nombre: 'Monterrey',
  estado_mx: 'Nuevo León',
  emoji: '🏔️',
  fibra_plaza_id: 'mty',
  tecnico_filter: '',
  ticket_terms: ['monterrey', 'mty', 'alpha', 'alfa', 'guadalupe', 'apodaca', 'escobedo',
                 'linares', 'montemorelos', 'nuevo leon', 'nuevo león', 'nl'],
  noc_terms: ['monterrey', 'mty', 'purisima', 'purísima', 'alpha', 'alfa', 'guadalupe', 'neutral'],
  equipo: [
    { nombre: 'Rodrigo Flores',     rol: 'Operaciones / Comercial', emoji: '📋' },
    { nombre: 'Alejandro Guzmán',  rol: 'Ingeniería de red',        emoji: '🌐' },
    { nombre: 'Gustavo Cavazos',   rol: 'Red Neutral — troncales',  emoji: '🔗' },
    { nombre: 'José Miguel Macías', rol: 'Supervisor',              emoji: '🛡️' },
  ],
};

export const SLT_CONFIG: PlazaConfig = {
  id: 'slt',
  nombre: 'Saltillo',
  estado_mx: 'Coahuila',
  emoji: '🏭',
  fibra_plaza_id: 'slt',
  tecnico_filter: 'raul',
  ticket_terms: ['saltillo', 'slt', 'zapaliname', 'arteaga', 'ramos arizpe', 'torreon', 'torreón'],
  noc_terms: ['saltillo', 'slt', 'zapaliname', 'luminet', 'registral', 'finsa', 'ramos'],
  blocker: 'Todo por definir — piloto en evaluación · 0 clientes activos · Sitios en instalación',
  equipo: [
    { nombre: 'Raúl Zapata',        rol: 'Técnico campo', emoji: '🔧', activo: true },
    { nombre: 'José Miguel Macías', rol: 'Supervisor',    emoji: '🛡️' },
  ],
};
