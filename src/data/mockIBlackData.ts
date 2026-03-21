export interface IBlackMeshNode {
  id: string;
  room: string;
  signalDbm: number;
  quality: 'excellent' | 'good' | 'weak';
  devices: number;
}

export interface IBlackDevice {
  id: string;
  name: string;
  icon: 'phone' | 'laptop' | 'tv' | 'tablet' | 'speaker' | 'other';
  band: '2.4GHz' | '5GHz' | '6GHz';
  usage: number; // Mbps
}

export interface IBlackChatMessage {
  id: string;
  sender: 'agent' | 'client';
  text: string;
  time: string;
}

export const IBLACK_MESH_NODES: IBlackMeshNode[] = [
  { id: 'n1', room: 'Sala', signalDbm: -58, quality: 'excellent', devices: 6 },
  { id: 'n2', room: 'Recámara principal', signalDbm: -61, quality: 'excellent', devices: 4 },
  { id: 'n3', room: 'Cocina', signalDbm: -54, quality: 'excellent', devices: 3 },
];

export const IBLACK_DEVICES: IBlackDevice[] = [
  { id: 'd1', name: 'iPhone de Roberto', icon: 'phone', band: '5GHz', usage: 12.4 },
  { id: 'd2', name: 'MacBook Pro', icon: 'laptop', band: '5GHz', usage: 45.2 },
  { id: 'd3', name: 'Smart TV Samsung', icon: 'tv', band: '5GHz', usage: 8.1 },
  { id: 'd4', name: 'iPad mini', icon: 'tablet', band: '2.4GHz', usage: 3.2 },
  { id: 'd5', name: 'HomePod mini', icon: 'speaker', band: '5GHz', usage: 1.1 },
  { id: 'd6', name: 'Ring Doorbell', icon: 'other', band: '2.4GHz', usage: 0.8 },
  { id: 'd7', name: 'PlayStation 5', icon: 'other', band: '5GHz', usage: 22.3 },
  { id: 'd8', name: 'MacBook Air', icon: 'laptop', band: '5GHz', usage: 5.7 },
  { id: 'd9', name: 'iPhone de Mariana', icon: 'phone', band: '5GHz', usage: 8.9 },
  { id: 'd10', name: 'Alexa Echo', icon: 'speaker', band: '2.4GHz', usage: 0.4 },
  { id: 'd11', name: 'iPad Pro', icon: 'tablet', band: '5GHz', usage: 6.1 },
  { id: 'd12', name: 'Chromecast', icon: 'other', band: '5GHz', usage: 4.3 },
  { id: 'd13', name: 'Laptop HP', icon: 'laptop', band: '5GHz', usage: 2.1 },
  { id: 'd14', name: 'Nintendo Switch', icon: 'other', band: '5GHz', usage: 3.8 },
];

export const IBLACK_CHAT_HISTORY: IBlackChatMessage[] = [
  { id: 'm1', sender: 'agent', text: 'Bienvenido al soporte VIP de iBlack. Soy Nico, tu asistente. ¿En qué puedo ayudarte hoy?', time: '14:30' },
  { id: 'm2', sender: 'client', text: 'Hola, quiero saber cuándo es mi próxima visita preventiva', time: '14:31' },
  { id: 'm3', sender: 'agent', text: 'Tu próxima visita preventiva está programada para el 28 de marzo. Carlos M., tu técnico asignado, llegará entre 10:00 y 11:00 AM. ¿Te funciona ese horario?', time: '14:31' },
];
