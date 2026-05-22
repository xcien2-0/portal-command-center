/**
 * HexoField3D — Visualización paramagnética hexomórfica reutilizable
 * Modos:
 *   'ambient'  → partículas flotantes puras (fondo decorativo)
 *   'network'  → nodos con datos reales (dispositivos NOC)
 *   'blockchain' → nodos de transacciones
 */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export interface NetworkNode {
  id: string;
  label: string;
  status: 'online' | 'offline' | 'warning';
  group?: string;
  value?: number; // tamaño relativo del nodo
}

interface HexoField3DProps {
  mode?: 'ambient' | 'network' | 'blockchain';
  nodes?: NetworkNode[];
  width?: number | string;
  height?: number | string;
  opacity?: number;        // para usarlo como overlay (0-1)
  accentColor?: string;    // hex string, ej '#1d9e75'
  interactive?: boolean;   // mouse orbit
  onNodeClick?: (node: NetworkNode) => void;
  className?: string;
  style?: React.CSSProperties;
}

const COLOR_ONLINE    = 0x00ff88;
const COLOR_OFFLINE   = 0xff3355;
const COLOR_WARNING   = 0xffb703;
const COLOR_AMBIENT   = 0x1d9e75;
const COLOR_BLOCKCHAIN = 0x00aff0;

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
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    animId: number;
  } | null>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = el.clientWidth  || 800;
    const H = el.clientHeight || 500;

    // ── Scene ──────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = null; // transparente para overlay
    scene.fog = new THREE.FogExp2(0x0a0e27, 0.012);

    const camera = new THREE.PerspectiveCamera(70, W / H, 0.1, 1000);
    camera.position.set(0, 0, mode === 'ambient' ? 50 : 60);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    // ── Lighting ───────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const mainLight = new THREE.PointLight(
      accentColor ? parseInt(accentColor.replace('#', ''), 16) : COLOR_AMBIENT,
      3, 150
    );
    mainLight.position.set(40, 40, 40);
    scene.add(mainLight);
    const sideLight = new THREE.PointLight(0xff006e, 1, 120);
    sideLight.position.set(-50, -30, 30);
    scene.add(sideLight);

    // ── Build particles ────────────────────────────────────────
    type ParticleObj = {
      mesh: THREE.Mesh;
      originalPos: THREE.Vector3;
      phase: number; phaseY: number; phaseZ: number;
      node?: NetworkNode;
    };

    const particles: ParticleObj[] = [];

    if (mode === 'ambient' || nodes.length === 0) {
      // Estructura hexomórfica concéntrica
      const hexRadius = 14;
      const layers = 6;
      for (let layer = 0; layer < layers; layer++) {
        const count = layer === 0 ? 1 : layer * 6;
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          const r = layer * hexRadius / layers;
          const x = Math.cos(angle) * r;
          const z = Math.sin(angle) * r;
          const y = (Math.random() - 0.5) * 10;

          const geo = new THREE.IcosahedronGeometry(0.4, 3);
          const mat = new THREE.MeshPhongMaterial({
            color: mode === 'blockchain' ? COLOR_BLOCKCHAIN : COLOR_AMBIENT,
            emissive: mode === 'blockchain' ? 0x005580 : 0x0a5a42,
            shininess: 120,
          });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(x, y, z);
          scene.add(mesh);
          particles.push({
            mesh,
            originalPos: new THREE.Vector3(x, y, z),
            phase: Math.random() * Math.PI * 2,
            phaseY: Math.random() * Math.PI * 2,
            phaseZ: Math.random() * Math.PI * 2,
          });
        }
      }
    } else {
      // Nodos reales — distribuidos en esfera
      const total = nodes.length;
      nodes.forEach((node, idx) => {
        // Distribución Fibonacci en esfera
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        const t = idx / total;
        const inclination = Math.acos(1 - 2 * t);
        const azimuth = goldenAngle * idx;
        const r = 22;
        const x = r * Math.sin(inclination) * Math.cos(azimuth);
        const y = r * Math.sin(inclination) * Math.sin(azimuth);
        const z = r * Math.cos(inclination);

        const size = node.value ? Math.max(0.3, Math.min(1.2, node.value / 100)) : 0.55;
        const geo = new THREE.IcosahedronGeometry(size, 2);
        const color = node.status === 'online'  ? COLOR_ONLINE
                    : node.status === 'offline' ? COLOR_OFFLINE
                    : COLOR_WARNING;
        const mat = new THREE.MeshPhongMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.3,
          shininess: 100,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        mesh.userData = { node };
        scene.add(mesh);
        particles.push({
          mesh,
          originalPos: new THREE.Vector3(x, y, z),
          phase:  Math.random() * Math.PI * 2,
          phaseY: Math.random() * Math.PI * 2,
          phaseZ: Math.random() * Math.PI * 2,
          node,
        });
      });
    }

    // ── Connection lines ───────────────────────────────────────
    type ConnObj = { line: THREE.Line; p1: ParticleObj; p2: ParticleObj };
    const connections: ConnObj[] = [];
    const maxDist = mode === 'network' ? 14 : 12;

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const d = particles[i].originalPos.distanceTo(particles[j].originalPos);
        if (d < maxDist && Math.random() > 0.45) {
          const lineGeo = new THREE.BufferGeometry().setFromPoints([
            particles[i].mesh.position.clone(),
            particles[j].mesh.position.clone(),
          ]);
          const lineMat = new THREE.LineBasicMaterial({
            color: mode === 'blockchain' ? COLOR_BLOCKCHAIN
                 : mode === 'network'    ? 0x00ff88
                 : COLOR_AMBIENT,
            transparent: true,
            opacity: 0.1,
          });
          const line = new THREE.Line(lineGeo, lineMat);
          scene.add(line);
          connections.push({ line, p1: particles[i], p2: particles[j] });
        }
      }
    }

    // ── Mouse interaction ──────────────────────────────────────
    let mouseX = 0, mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      mouseY = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
    };
    if (interactive) el.addEventListener('mousemove', onMouseMove);

    // Click detection
    const raycaster = new THREE.Raycaster();
    const onMouseClick = (e: MouseEvent) => {
      if (!onNodeClick) return;
      const rect = el.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      const my = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(mx, my), camera);
      const hits = raycaster.intersectObjects(particles.map(p => p.mesh));
      if (hits.length > 0) {
        const node = hits[0].object.userData?.node as NetworkNode;
        if (node) onNodeClick(node);
      }
    };
    if (onNodeClick) el.addEventListener('click', onMouseClick);

    // ── Animation ──────────────────────────────────────────────
    let time = 0;
    const animate = () => {
      time += 0.016;
      const animId = requestAnimationFrame(animate);
      sceneRef.current!.animId = animId;

      particles.forEach(p => {
        const amp = mode === 'ambient' ? 2.5 : 1.2;
        const ox = Math.sin(time * 0.6 + p.phase)  * amp;
        const oy = Math.cos(time * 0.8 + p.phaseY) * amp;
        const oz = Math.sin(time * 0.4 + p.phaseZ) * amp * 0.7;

        p.mesh.position.x = p.originalPos.x + ox;
        p.mesh.position.y = p.originalPos.y + oy;
        p.mesh.position.z = p.originalPos.z + oz;

        p.mesh.rotation.x += oz * 0.006;
        p.mesh.rotation.y += ox * 0.006;

        const glow = Math.abs(Math.sin(time * 0.5 + p.phase)) * 0.6 + 0.2;
        (p.mesh.material as THREE.MeshPhongMaterial).emissiveIntensity = glow * 0.5;
      });

      connections.forEach(c => {
        const pos = c.line.geometry.attributes.position.array as Float32Array;
        pos[0] = c.p1.mesh.position.x; pos[1] = c.p1.mesh.position.y; pos[2] = c.p1.mesh.position.z;
        pos[3] = c.p2.mesh.position.x; pos[4] = c.p2.mesh.position.y; pos[5] = c.p2.mesh.position.z;
        c.line.geometry.attributes.position.needsUpdate = true;
        (c.line.material as THREE.LineBasicMaterial).opacity =
          Math.abs(Math.sin(time * 0.3)) * 0.15 + 0.04;
      });

      // Cámara orbita + sigue mouse suavemente
      camera.position.x += (mouseX * 6 - camera.position.x) * 0.02;
      camera.position.y += (mouseY * 4 - camera.position.y) * 0.02;
      camera.position.x += Math.sin(time * 0.07) * 0.05;
      camera.position.y += Math.cos(time * 0.05) * 0.03;
      camera.lookAt(0, 0, 0);

      mainLight.position.x = Math.cos(time * 0.12) * 60;
      mainLight.position.z = Math.sin(time * 0.12) * 60;

      renderer.render(scene, camera);
    };

    sceneRef.current = { renderer, animId: 0 };
    animate();

    // ── Resize ─────────────────────────────────────────────────
    const onResize = () => {
      if (!el) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(el);

    return () => {
      cancelAnimationFrame(sceneRef.current?.animId ?? 0);
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
      style={{
        width,
        height,
        opacity,
        display: 'block',
        overflow: 'hidden',
        ...style,
      }}
    />
  );
}
