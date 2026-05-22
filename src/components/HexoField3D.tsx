/**
 * HexoField3D — Red neuronal viva con flujo eléctrico entre nodos
 * Pulsos viajan por los axones, nodos se "encienden" al recibir señal
 */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export interface NetworkNode {
  id: string;
  label: string;
  status: 'online' | 'offline' | 'warning';
  group?: string;
  value?: number;
}

interface HexoField3DProps {
  mode?: 'ambient' | 'network' | 'blockchain';
  nodes?: NetworkNode[];
  width?: number | string;
  height?: number | string;
  opacity?: number;
  accentColor?: string;
  interactive?: boolean;
  onNodeClick?: (node: NetworkNode) => void;
  className?: string;
  style?: React.CSSProperties;
}

// Paleta neuronal
const C = {
  online:     0x00e5ff,  // cyan eléctrico
  warning:    0xffd166,  // ámbar
  offline:    0xff6b2b,  // naranja fuego
  pulse:      0xffffff,  // pulso blanco
  axon:       0x00e5ff,  // color de axón activo
  axonDim:    0x0a3040,  // axón en reposo
  ambient:    0x1d9e75,
  blockchain: 0x00aff0,
  bg:         0x050810,
};

export default function HexoField3D({
  mode = 'ambient',
  nodes = [],
  width = '100%',
  height = '100%',
  opacity = 1,
  accentColor,
  interactive = true,
  onNodeClick,
  className,
  style,
}: HexoField3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const W = el.clientWidth  || 800;
    const H = el.clientHeight || 500;

    // ── Scene ──────────────────────────────────────────────────────
    const scene   = new THREE.Scene();
    scene.fog     = new THREE.FogExp2(C.bg, 0.009);
    const camera  = new THREE.PerspectiveCamera(65, W / H, 0.1, 1000);
    camera.position.set(0, 0, mode === 'ambient' ? 52 : 68);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    // ── Luz ambiental + punto central ─────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));
    const centerGlow = new THREE.PointLight(C.online, 2.5, 120);
    centerGlow.position.set(0, 0, 0);
    scene.add(centerGlow);
    const sideLight = new THREE.PointLight(0x7700ff, 1.2, 100);
    sideLight.position.set(-60, -30, 20);
    scene.add(sideLight);

    // ── Tipo interno ───────────────────────────────────────────────
    type NeuronObj = {
      mesh:        THREE.Mesh;
      halo:        THREE.Mesh;
      pos:         THREE.Vector3;
      phase:       number;
      phaseY:      number;
      activation:  number;   // 0-1, decae con el tiempo
      node?:       NetworkNode;
    };

    type AxonObj = {
      line:      THREE.Line;
      tube?:     THREE.Mesh;
      n1:        NeuronObj;
      n2:        NeuronObj;
      activity:  number;     // 0-1 brillo del axón
    };

    type PulseObj = {
      mesh:   THREE.Mesh;
      axon:   AxonObj;
      t:      number;      // 0 → 1 posición en el axón
      speed:  number;
      dir:    1 | -1;
    };

    const neurons: NeuronObj[] = [];
    const axons:   AxonObj[]   = [];
    const pulses:  PulseObj[]  = [];

    // ── Crear neuronas ────────────────────────────────────────────
    const buildNeuron = (
      x: number, y: number, z: number,
      size: number,
      color: number,
      node?: NetworkNode
    ): NeuronObj => {
      // Soma (cuerpo neuronal)
      const geo  = new THREE.SphereGeometry(size, 16, 16);
      const mat  = new THREE.MeshPhongMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.35,
        shininess: 180,
        specular: 0xffffff,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.userData = { node };
      scene.add(mesh);

      // Halo (esfera exterior semi-transparente)
      const haloGeo = new THREE.SphereGeometry(size * 1.7, 12, 12);
      const haloMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.06,
        side: THREE.BackSide,
        depthWrite: false,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.copy(mesh.position);
      scene.add(halo);

      return {
        mesh, halo,
        pos: new THREE.Vector3(x, y, z),
        phase:  Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        activation: 0,
        node,
      };
    };

    if (mode === 'ambient' || nodes.length === 0) {
      // Estructura hexomórfica concéntrica
      const layers = 6;
      const hexR   = 16;
      for (let layer = 0; layer < layers; layer++) {
        const count = layer === 0 ? 1 : layer * 6;
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          const r  = layer * hexR / layers;
          const x  = Math.cos(angle) * r;
          const z  = Math.sin(angle) * r;
          const y  = (Math.random() - 0.5) * 12;
          const color = mode === 'blockchain' ? C.blockchain : C.ambient;
          neurons.push(buildNeuron(x, y, z, 0.55, color));
        }
      }
    } else {
      // Distribución Fibonacci en esfera — nodos reales
      const total  = nodes.length;
      const maxVal = Math.max(...nodes.map(n => n.value ?? 1), 1);
      const golden = Math.PI * (3 - Math.sqrt(5));

      nodes.forEach((node, idx) => {
        const t = idx / Math.max(total - 1, 1);
        const inc = Math.acos(1 - 2 * t);
        const az  = golden * idx;
        const r   = 28;
        const x   = r * Math.sin(inc) * Math.cos(az);
        const y   = r * Math.sin(inc) * Math.sin(az);
        const z   = r * Math.cos(inc);

        const norm  = (node.value ?? 1) / maxVal;
        const size  = 0.7 + norm * 2.8;
        const color = node.status === 'online'  ? C.online
                    : node.status === 'offline' ? C.offline
                    : C.warning;

        neurons.push(buildNeuron(x, y, z, size, color, node));
      });
    }

    // ── Crear axones (líneas neuronales) ──────────────────────────
    const maxAxonDist = mode === 'network' ? 22 : 15;

    for (let i = 0; i < neurons.length; i++) {
      for (let j = i + 1; j < neurons.length; j++) {
        const d = neurons[i].pos.distanceTo(neurons[j].pos);
        if (d > maxAxonDist) continue;
        if (mode === 'network' && Math.random() > 0.55) continue;
        if (mode === 'ambient' && Math.random() > 0.40) continue;

        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          neurons[i].pos.clone(),
          neurons[j].pos.clone(),
        ]);
        const lineMat = new THREE.LineBasicMaterial({
          color: C.axonDim,
          transparent: true,
          opacity: 0.2,
        });
        const line = new THREE.Line(lineGeo, lineMat);
        scene.add(line);
        axons.push({ line, n1: neurons[i], n2: neurons[j], activity: 0 });
      }
    }

    // ── Mesh de pulso (bola eléctrica viajera) ────────────────────
    const pulseGeo = new THREE.SphereGeometry(0.22, 8, 8);
    const spawnPulse = (axon: AxonObj) => {
      if (pulses.length > 180) return;
      const mat = new THREE.MeshBasicMaterial({
        color: C.pulse,
        transparent: true,
        opacity: 0.9,
      });
      const mesh = new THREE.Mesh(pulseGeo, mat);
      mesh.position.copy(axon.n1.pos);
      scene.add(mesh);
      pulses.push({
        mesh, axon,
        t: 0,
        speed: 0.008 + Math.random() * 0.012,
        dir: 1,
      });
    };

    // Spawn inicial
    const initAxons = [...axons].sort(() => Math.random() - 0.5).slice(0, Math.min(axons.length, 25));
    initAxons.forEach(a => spawnPulse(a));

    // ── Interacción mouse ─────────────────────────────────────────
    let mouseX = 0, mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      mouseY = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
    };
    if (interactive) el.addEventListener('mousemove', onMouseMove);

    const raycaster = new THREE.Raycaster();
    const onMouseClick = (e: MouseEvent) => {
      if (!onNodeClick) return;
      const rect = el.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      const my = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(mx, my), camera);
      const hits = raycaster.intersectObjects(neurons.map(n => n.mesh));
      if (hits.length > 0) {
        const node = hits[0].object.userData?.node as NetworkNode;
        if (node) onNodeClick(node);
      }
    };
    if (onNodeClick) el.addEventListener('click', onMouseClick);

    // ── Loop de animación ─────────────────────────────────────────
    let time = 0;
    let spawnTimer = 0;
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      time += 0.016;
      spawnTimer += 0.016;

      // Spawn nuevos pulsos periódicamente
      if (spawnTimer > 0.18 && axons.length > 0) {
        spawnTimer = 0;
        const candidates = axons.filter(a => a.activity < 0.3);
        if (candidates.length > 0) {
          spawnPulse(candidates[Math.floor(Math.random() * candidates.length)]);
        }
      }

      // Mover pulsos
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.t += p.speed;

        // Iluminar axón mientras pasa el pulso
        p.axon.activity = Math.max(p.axon.activity, 1 - Math.abs(p.t - 0.5) * 2.5);

        // Interpolar posición sobre el axón
        const from = p.dir === 1 ? p.axon.n1.pos : p.axon.n2.pos;
        const to   = p.dir === 1 ? p.axon.n2.pos : p.axon.n1.pos;
        p.mesh.position.lerpVectors(from, to, p.t);

        // Fade in/out del pulso
        (p.mesh.material as THREE.MeshBasicMaterial).opacity =
          Math.sin(p.t * Math.PI) * 0.95;

        if (p.t >= 1) {
          // Pulso llegó al destino → activar neurona destino
          const dest = p.dir === 1 ? p.axon.n2 : p.axon.n1;
          dest.activation = 1.0;

          // Propagar a axones vecinos con cierta probabilidad
          const neighbors = axons.filter(
            a => (a.n1 === dest || a.n2 === dest) && a !== p.axon && Math.random() > 0.35
          );
          neighbors.slice(0, 2).forEach(a => spawnPulse(a));

          scene.remove(p.mesh);
          (p.mesh.material as THREE.MeshBasicMaterial).dispose();
          pulses.splice(i, 1);
        }
      }

      // Actualizar neuronas
      neurons.forEach(n => {
        // Oscilación suave
        const amp = mode === 'ambient' ? 2.2 : 0.9;
        n.mesh.position.x = n.pos.x + Math.sin(time * 0.5 + n.phase)  * amp;
        n.mesh.position.y = n.pos.y + Math.cos(time * 0.4 + n.phaseY) * amp;
        n.mesh.position.z = n.pos.z + Math.sin(time * 0.3 + n.phase)  * amp * 0.6;
        n.halo.position.copy(n.mesh.position);

        // Flash de activación
        n.activation *= 0.92;
        const baseEmissive  = 0.3;
        const flashEmissive = baseEmissive + n.activation * 1.4;
        (n.mesh.material as THREE.MeshPhongMaterial).emissiveIntensity = flashEmissive;
        (n.halo.material as THREE.MeshBasicMaterial).opacity = 0.05 + n.activation * 0.22;

        // Escala del halo en activación
        const s = 1 + n.activation * 0.35;
        n.halo.scale.set(s, s, s);
      });

      // Actualizar axones (color dinámico)
      axons.forEach(a => {
        a.activity *= 0.94;
        const lerpColor = new THREE.Color(C.axonDim).lerp(
          new THREE.Color(C.axon), a.activity
        );
        (a.line.material as THREE.LineBasicMaterial).color.copy(lerpColor);
        (a.line.material as THREE.LineBasicMaterial).opacity = 0.15 + a.activity * 0.65;

        // Actualizar posición de los extremos con la oscilación de las neuronas
        const positions = a.line.geometry.attributes.position.array as Float32Array;
        positions[0] = a.n1.mesh.position.x;
        positions[1] = a.n1.mesh.position.y;
        positions[2] = a.n1.mesh.position.z;
        positions[3] = a.n2.mesh.position.x;
        positions[4] = a.n2.mesh.position.y;
        positions[5] = a.n2.mesh.position.z;
        a.line.geometry.attributes.position.needsUpdate = true;
      });

      // Cámara órbita lenta + sigue mouse
      if (interactive) {
        camera.position.x += (mouseX * 8 - camera.position.x) * 0.025;
        camera.position.y += (mouseY * 5 - camera.position.y) * 0.025;
      }
      camera.position.x += Math.sin(time * 0.06) * 0.04;
      camera.position.y += Math.cos(time * 0.05) * 0.03;
      camera.lookAt(0, 0, 0);

      // Pulso en la luz central
      centerGlow.intensity = 1.8 + Math.sin(time * 1.2) * 0.7;

      renderer.render(scene, camera);
    };

    animate();

    // ── Resize ────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      if (!el) return;
      const w = el.clientWidth, h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(el);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('click', onMouseClick);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, nodes.length]);

  return (
    <div
      ref={mountRef}
      className={className}
      style={{ width, height, opacity, display: 'block', overflow: 'hidden', ...style }}
    />
  );
}
