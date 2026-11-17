import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import type { PandalId } from '../data/config';

export type Pandal3DProps = {
  type: PandalId;
  lengthFt: number;
  breadthFt: number;
  guests: number;
  night: boolean;
  autoRotate?: boolean;
  /** Phones / low-power devices: no shadows, fewer lights and stars, lower pixel ratio. */
  lite?: boolean;
  /** false = the canvas ignores touches so the page can scroll over it. */
  interactive?: boolean;
  /** true = stop rendering (scrolled off-screen) to save battery. */
  paused?: boolean;
  onContextLost?: () => void;
};

const H = 12; // pole height (ft)
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/* ---------------- procedural textures ---------------- */

function canvasTex(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, repeat?: [number, number]) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  draw(cv.getContext('2d')!);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...repeat);
  }
  return t;
}

const stripeTex = (cols: string[], n = 2) =>
  canvasTex(512, 16, (c) => {
    const sw = 512 / (cols.length * n);
    for (let i = 0; i < cols.length * n; i++) {
      c.fillStyle = cols[i % cols.length];
      c.fillRect(i * sw, 0, sw + 1, 16);
    }
  });

const thatchTex = () =>
  canvasTex(512, 512, (c) => {
    c.fillStyle = '#6f8a3a';
    c.fillRect(0, 0, 512, 512);
    const cols = ['#4f7a2c', '#86a24a', '#b9a35c', '#5f8a35', '#a08a48', '#3f6a26', '#c7b36a'];
    for (let i = 0; i < 4200; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      c.strokeStyle = cols[i % cols.length];
      c.lineWidth = 2 + Math.random() * 2;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + 6 + Math.random() * 6, y + 18 + Math.random() * 14);
      c.stroke();
    }
  }, [3, 3]);

const corrugatedTex = () =>
  canvasTex(256, 16, (c) => {
    const g = c.createLinearGradient(0, 0, 256, 0);
    for (let i = 0; i <= 16; i++) g.addColorStop(i / 16, i % 2 ? '#7f97ab' : '#dbe5ec');
    c.fillStyle = g;
    c.fillRect(0, 0, 256, 16);
  }, [6, 1]);

const valanceTex = (a: string, b: string) =>
  canvasTex(256, 64, (c) => {
    c.fillStyle = '#063b37';
    c.fillRect(0, 0, 256, 26);
    c.fillStyle = '#e8b93a';
    c.fillRect(0, 4, 256, 3);
    c.fillRect(0, 20, 256, 3);
    for (let i = 0; i < 8; i++) {
      c.fillStyle = i % 2 ? a : b;
      c.beginPath();
      c.arc(i * 32 + 16, 26, 16, 0, Math.PI);
      c.fill();
    }
  });

const kanatTex = () =>
  canvasTex(256, 256, (c) => {
    c.fillStyle = '#0b4a45';
    c.fillRect(0, 0, 256, 256);
    c.strokeStyle = '#f2c14e';
    c.lineWidth = 6;
    for (let i = 0; i < 2; i++) {
      const x = i * 128;
      c.beginPath();
      c.moveTo(x + 20, 240);
      c.lineTo(x + 20, 90);
      c.quadraticCurveTo(x + 64, 10, x + 108, 90);
      c.lineTo(x + 108, 240);
      c.stroke();
      c.fillStyle = '#f2c14e';
      c.beginPath();
      c.arc(x + 64, 110, 12, 0, Math.PI * 2);
      c.fill();
    }
  }, [1, 1]);

const kolamTex = () =>
  canvasTex(512, 512, (c) => {
    c.translate(256, 256);
    const cols = ['#f59e0b', '#14847a', '#facc15', '#2563eb', '#fffaf0'];
    for (let r = 5; r > 0; r--) {
      c.fillStyle = cols[r % cols.length];
      c.beginPath();
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        const rr = r * 44 * (k % 2 ? 0.78 : 1);
        c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      c.closePath();
      c.fill();
    }
    c.strokeStyle = '#fffaf0';
    c.lineWidth = 5;
    for (let k = 0; k < 8; k++) {
      c.rotate(Math.PI / 4);
      c.beginPath();
      c.ellipse(0, -150, 26, 60, 0, 0, Math.PI * 2);
      c.stroke();
    }
    c.fillStyle = '#fffaf0';
    for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) if (Math.abs(i) + Math.abs(j) <= 4) {
      c.beginPath();
      c.arc(i * 34, j * 34, 5, 0, Math.PI * 2);
      c.fill();
    }
  });

/* ---------------- helpers ---------------- */

function spread(a: number, b: number, step: number) {
  const n = Math.max(1, Math.round((b - a) / step));
  return Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);
}

type V3 = [number, number, number];
function stringPoints(p1: V3, p2: V3, sag: number, spacing: number) {
  const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]);
  const n = Math.max(2, Math.round(len / spacing));
  const out: V3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push([p1[0] + (p2[0] - p1[0]) * t, p1[1] + (p2[1] - p1[1]) * t - sag * 4 * t * (1 - t), p1[2] + (p2[2] - p1[2]) * t]);
  }
  return out;
}

const BULB_COLORS = ['#ffd23f', '#3bf08a', '#3bb8ff', '#ff9f40', '#fff1c1', '#b98cff'].map((c) => new THREE.Color(c));

/* ---------------- parts ---------------- */

function SerialLights({ points, night, lite }: { points: V3[]; night: boolean; lite: boolean }) {
  const bulbs = useRef<THREE.InstancedMesh>(null!);
  const halos = useRef<THREE.InstancedMesh>(null!);
  const tmp = useMemo(() => new THREE.Color(), []);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    points.forEach((p, i) => {
      m.makeTranslation(p[0], p[1], p[2]);
      bulbs.current.setMatrixAt(i, m);
      halos.current.setMatrixAt(i, m);
      bulbs.current.setColorAt(i, BULB_COLORS[i % BULB_COLORS.length]);
      halos.current.setColorAt(i, BULB_COLORS[i % BULB_COLORS.length]);
    });
    bulbs.current.instanceMatrix.needsUpdate = true;
    halos.current.instanceMatrix.needsUpdate = true;
  }, [points]);
  const tick = useRef(0);
  useFrame(({ clock }) => {
    if (lite && (tick.current++ & 1)) return; // phones: twinkle at half rate
    const t = clock.elapsedTime;
    for (let i = 0; i < points.length; i++) {
      const k = 0.55 + 0.45 * Math.sin(t * 3 + i * 1.9);
      tmp.copy(BULB_COLORS[i % BULB_COLORS.length]).multiplyScalar(night ? 0.6 + k : 0.9);
      bulbs.current.setColorAt(i, tmp);
      if (night && !lite) halos.current.setColorAt(i, tmp);
    }
    bulbs.current.instanceColor!.needsUpdate = true;
    if (halos.current.instanceColor) halos.current.instanceColor.needsUpdate = true;
  });
  return (
    <>
      <instancedMesh ref={bulbs} args={[undefined, undefined, points.length]} key={`b${points.length}`}>
        <sphereGeometry args={[0.16, 8, 8]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={halos} args={[undefined, undefined, points.length]} key={`h${points.length}`} visible={night && !lite}>
        <sphereGeometry args={[0.55, 8, 8]} />
        <meshBasicMaterial transparent opacity={0.22} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </instancedMesh>
    </>
  );
}

function Chairs({ W, D, count, stageDepth }: { W: number; D: number; count: number; stageDepth: number }) {
  const seat = useRef<THREE.InstancedMesh>(null!);
  const back = useRef<THREE.InstancedMesh>(null!);
  const legs = useRef<THREE.InstancedMesh>(null!);
  const slots = useMemo(() => {
    const out: [number, number][] = [];
    const zFront = D / 2 - 3;
    const zBack = -D / 2 + stageDepth + 4;
    for (let z = zFront; z >= zBack && out.length < count; z -= 3.2) {
      for (let x = -W / 2 + 2; x <= W / 2 - 2 && out.length < count; x += 2.3) {
        if (Math.abs(x) < 2.6) continue;
        out.push([x, z]);
      }
    }
    return out;
  }, [W, D, count, stageDepth]);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    slots.forEach(([x, z], i) => {
      m.makeTranslation(x, 1.6, z);
      seat.current.setMatrixAt(i, m);
      m.makeTranslation(x, 2.6, z + 0.75);
      back.current.setMatrixAt(i, m);
      m.makeTranslation(x, 0.8, z);
      legs.current.setMatrixAt(i, m);
    });
    [seat, back, legs].forEach((r) => (r.current.instanceMatrix.needsUpdate = true));
  }, [slots]);
  const n = Math.max(1, slots.length);
  return (
    <group key={n}>
      <instancedMesh ref={seat} args={[undefined, undefined, n]} castShadow>
        <boxGeometry args={[1.5, 0.2, 1.5]} />
        <meshStandardMaterial color="#f4f1ea" roughness={0.35} />
      </instancedMesh>
      <instancedMesh ref={back} args={[undefined, undefined, n]} castShadow>
        <boxGeometry args={[1.4, 1.8, 0.18]} />
        <meshStandardMaterial color="#ebe6da" roughness={0.35} />
      </instancedMesh>
      <instancedMesh ref={legs} args={[undefined, undefined, n]}>
        <boxGeometry args={[1.3, 1.6, 1.3]} />
        <meshStandardMaterial color="#cfc8b8" roughness={0.6} transparent opacity={0.35} />
      </instancedMesh>
    </group>
  );
}

const LEAF_SHAPE = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(1.1, 1.5, 1.2, 5, 0, 7.5);
  s.bezierCurveTo(-1.2, 5, -1.1, 1.5, 0, 0);
  return new THREE.ShapeGeometry(s, 8);
})();

function BananaTree({ position, flip = false }: { position: V3; flip?: boolean }) {
  const leaves = [0, 50, 105, 160, 215, 270, 320];
  return (
    <group position={position} rotation={[0, flip ? Math.PI : 0, 0]}>
      <mesh position={[0, 4.5, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.45, 9, 10]} />
        <meshStandardMaterial color="#7da653" roughness={0.8} />
      </mesh>
      {leaves.map((a, i) => (
        <group key={a} position={[0, 8.6, 0]} rotation={[0, (a * Math.PI) / 180, 0]}>
          <mesh rotation={[-(0.55 + (i % 3) * 0.25), 0, 0]} castShadow>
            <primitive object={LEAF_SHAPE} attach="geometry" />
            <meshStandardMaterial color={['#4f8a3c', '#5f9e46', '#3f7a33'][i % 3]} side={THREE.DoubleSide} roughness={0.7} />
          </mesh>
        </group>
      ))}
      <mesh position={[0.5, 6.6, 0.4]}>
        <cylinderGeometry args={[0.45, 0.3, 1.6, 8]} />
        <meshStandardMaterial color="#b5c43c" roughness={0.7} />
      </mesh>
      <mesh position={[0.55, 5.4, 0.45]}>
        <coneGeometry args={[0.28, 0.9, 8]} />
        <meshStandardMaterial color="#6d2140" />
      </mesh>
    </group>
  );
}

function Thoranam({ W, z, y }: { W: number; z: number; y: number }) {
  const leaves = useRef<THREE.InstancedMesh>(null!);
  const flowers = useRef<THREE.InstancedMesh>(null!);
  const pts = useMemo(() => stringPoints([-W / 2, y, z], [W / 2, y, z], 0.6, 0.55), [W, y, z]);
  const fl = useMemo(() => pts.filter((_, i) => i % 4 === 2), [pts]);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3(1, 1, 1);
    pts.forEach((p, i) => {
      q.setFromEuler(new THREE.Euler(Math.PI, 0, ((i % 3) - 1) * 0.12));
      m.compose(new THREE.Vector3(p[0], p[1] - 0.55, p[2]), q, s);
      leaves.current.setMatrixAt(i, m);
      leaves.current.setColorAt(i, new THREE.Color(['#2f6b35', '#3d7d3f', '#4c8f43'][i % 3]));
    });
    fl.forEach((p, i) => {
      m.makeTranslation(p[0] + 0.27, p[1] - 0.1, p[2] + 0.05);
      flowers.current.setMatrixAt(i, m);
    });
    leaves.current.instanceMatrix.needsUpdate = true;
    flowers.current.instanceMatrix.needsUpdate = true;
  }, [pts, fl]);
  return (
    <group key={pts.length}>
      <instancedMesh ref={leaves} args={[undefined, undefined, pts.length]}>
        <coneGeometry args={[0.18, 1.1, 4]} />
        <meshStandardMaterial roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={flowers} args={[undefined, undefined, Math.max(1, fl.length)]}>
        <sphereGeometry args={[0.22, 8, 8]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.6} />
      </instancedMesh>
    </group>
  );
}

function Roof({ type, W, D }: { type: PandalId; W: number; D: number }) {
  const tex = useMemo(() => {
    if (type === 'sheet') return corrugatedTex();
    if (type === 'theenolai') return thatchTex();
    return stripeTex(['#0b5c55', '#f2c14e', '#fffaf0', '#f2c14e', '#14847a', '#e8b93a'], 4);
  }, [type]);
  const val = useMemo(() => valanceTex('#f2c14e', '#fffaf0'), []);
  useEffect(() => () => tex.dispose(), [tex]);

  if (type === 'samiyana') {
    const nx = Math.max(1, Math.round(W / 22));
    const nz = Math.max(1, Math.round(D / 22));
    const mw = W / nx;
    const md = D / nz;
    const ph = 5.5;
    const cones: V3[] = [];
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) cones.push([-W / 2 + mw * (i + 0.5), H + ph / 2, -D / 2 + md * (j + 0.5)]);
    return (
      <group>
        {cones.map((c, i) => (
          <group key={i} position={c} scale={[mw * 1.02, 1, md * 1.02]}>
            <mesh rotation={[0, Math.PI / 4, 0]} castShadow>
              <coneGeometry args={[Math.SQRT1_2, ph, 4, 1, true]} />
              <meshStandardMaterial map={tex} side={THREE.DoubleSide} roughness={0.85} />
            </mesh>
          </group>
        ))}
        <Valance W={W} D={D} y={H - 0.4} tex={val} />
      </group>
    );
  }

  const ridge = type === 'sheet' ? 4.5 : 3;
  const halfD = D / 2 + 1.2;
  const slope = Math.hypot(halfD, ridge);
  const angle = Math.atan2(ridge, halfD);
  const thick = type === 'theenolai' ? 0.7 : 0.12;
  tex.repeat.set(type === 'sheet' ? Math.max(4, W / 3) : W / 12, type === 'sheet' ? 1 : slope / 12);
  const mat = type === 'sheet'
    ? <meshStandardMaterial map={tex} metalness={0.55} roughness={0.35} side={THREE.DoubleSide} />
    : <meshStandardMaterial map={tex} roughness={1} side={THREE.DoubleSide} />;
  return (
    <group>
      {[1, -1].map((s) => (
        <mesh key={s} position={[0, H + ridge / 2, (s * halfD) / 2]} rotation={[s * angle, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[W + 2.4, thick, slope]} />
          {mat}
        </mesh>
      ))}
      {type === 'theenolai' && <Fringe W={W + 2.4} z={halfD} y={H - 0.1} />}
      {type === 'theenolai' && <Fringe W={W + 2.4} z={-halfD} y={H - 0.1} />}
      {type === 'sheet' && <Valance W={W} D={D} y={H - 0.4} tex={val} />}
      <mesh position={[0, H + ridge, 0]}>
        <boxGeometry args={[W + 2.4, 0.3, 0.3]} />
        <meshStandardMaterial color={type === 'sheet' ? '#5d6a73' : '#6b4a2a'} />
      </mesh>
    </group>
  );
}

function Fringe({ W, z, y }: { W: number; z: number; y: number }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const n = Math.round(W / 0.45);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    for (let i = 0; i < n; i++) {
      m.makeTranslation(-W / 2 + i * 0.45, y - (i % 3) * 0.15, z);
      ref.current.setMatrixAt(i, m);
      ref.current.setColorAt(i, new THREE.Color(['#5f8a35', '#a08a48', '#86a24a'][i % 3]));
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [n, W, y, z]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, n]} key={n} rotation={[Math.PI, 0, 0]} position={[0, 2 * y, 2 * z]} scale={[1, 1, 1]}>
      <coneGeometry args={[0.2, 1.3, 4]} />
      <meshStandardMaterial roughness={1} />
    </instancedMesh>
  );
}

function Valance({ W, D, y, tex }: { W: number; D: number; y: number; tex: THREE.Texture }) {
  const tx = useMemo(() => { const t = tex.clone(); t.wrapS = THREE.RepeatWrapping; t.repeat.set(W / 4, 1); t.needsUpdate = true; return t; }, [tex, W]);
  const tz = useMemo(() => { const t = tex.clone(); t.wrapS = THREE.RepeatWrapping; t.repeat.set(D / 4, 1); t.needsUpdate = true; return t; }, [tex, D]);
  return (
    <group>
      {[1, -1].map((s) => (
        <mesh key={`x${s}`} position={[0, y, (s * D) / 2 + s * 0.05]}>
          <planeGeometry args={[W, 1.6]} />
          <meshStandardMaterial map={tx} transparent alphaTest={0.1} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {[1, -1].map((s) => (
        <mesh key={`z${s}`} position={[(s * W) / 2 + s * 0.05, y, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[D, 1.6]} />
          <meshStandardMaterial map={tz} transparent alphaTest={0.1} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

const CAM_TARGET = new THREE.Vector3(0, 5, 0);

/** Frames the whole pandal for the current screen shape (portrait phone or wide desktop) and keeps the user's viewing angle when sliders change. */
function CameraRig({ W, D }: { W: number; D: number }) {
  const { camera, size: vp, controls } = useThree();
  const first = useRef(true);
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = vp.width / Math.max(1, vp.height);
    // On phones the buttons / hint chips cover the top and bottom of the canvas, so fit the pandal into the visible middle part.
    const phone = vp.width < 768;
    const usable = phone ? Math.max(0.55, (vp.height - 120) / Math.max(1, vp.height)) : 1;
    const vFov = (2 * Math.atan(Math.tan(((cam.fov * Math.PI) / 180) / 2) * usable));
    const hFov = 2 * Math.atan(Math.tan(((cam.fov * Math.PI) / 180) / 2) * aspect);
    const radius = Math.hypot(W, D) / 2 + 9; // pandal + banana trees + height
    const dist = (radius * 1.12) / Math.sin(Math.min(vFov, hFov) / 2); // >1 = whole pandal fits with a margin
    const dir = first.current
      ? new THREE.Vector3(0.78, 0.48, 0.92).normalize()
      : cam.position.clone().sub(CAM_TARGET).normalize();
    first.current = false;
    cam.position.copy(CAM_TARGET).addScaledVector(dir, dist);
    cam.lookAt(CAM_TARGET);
    (controls as unknown as { update?: () => void } | null)?.update?.();
  }, [W, D, vp.width, vp.height, camera, controls]);
  return null;
}

function Scene({ type, lengthFt, breadthFt, guests, night, autoRotate = true, lite = false }: Pandal3DProps) {
  const W = clamp(lengthFt || 40, 12, 140);
  const D = clamp(breadthFt || 20, 12, 120);
  const stageW = Math.min(16, W * 0.5);
  const stageD = Math.min(8, D * 0.25);

  const poles = useMemo(() => {
    const out: V3[] = [];
    const xs = spread(-W / 2, W / 2, 12);
    const zs = spread(-D / 2, D / 2, 12);
    xs.forEach((x) => { out.push([x, H / 2, D / 2]); out.push([x, H / 2, -D / 2]); });
    zs.slice(1, -1).forEach((z) => { out.push([-W / 2, H / 2, z]); out.push([W / 2, H / 2, z]); });
    return out;
  }, [W, D]);

  const lights = useMemo(() => {
    const y = H - 1.4;
    const pts: V3[] = [
      ...stringPoints([-W / 2, y, D / 2 + 0.3], [W / 2, y, D / 2 + 0.3], 1.2, 0.9),
      ...stringPoints([-W / 2, y, -D / 2 - 0.3], [W / 2, y, -D / 2 - 0.3], 1.2, 0.9),
      ...stringPoints([-W / 2 - 0.3, y, -D / 2], [-W / 2 - 0.3, y, D / 2], 1, 0.9),
      ...stringPoints([W / 2 + 0.3, y, -D / 2], [W / 2 + 0.3, y, D / 2], 1, 0.9),
      ...stringPoints([-W / 2, H - 0.6, 0], [W / 2, H - 0.6, 0], 2.2, 1.1),
      ...stringPoints([0, H - 0.6, -D / 2], [0, H - 0.6, D / 2], 2, 1.1),
    ];
    [-W / 2, W / 2].forEach((x) => pts.push(...stringPoints([x, 0.6, D / 2 + 0.35], [x, H - 0.5, D / 2 + 0.35], 0, 0.8)));
    return pts;
  }, [W, D]);

  const poleTex = useMemo(() => {
    const t = stripeTex(type === 'samiyana' ? ['#0b5c55', '#f2c14e'] : ['#e8b93a', '#fff4dc'], 3);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.rotation = Math.PI / 5;
    t.repeat.set(1, 4);
    return t;
  }, [type]);
  const kanat = useMemo(() => { const t = kanatTex(); t.repeat.set(W / 10, 1); return t; }, [W]);
  const kolam = useMemo(() => kolamTex(), []);

  return (
    <>
      <CameraRig W={W} D={D} />
      <color attach="background" args={[night ? '#0b0718' : '#cfe8f3']} />
      <fog attach="fog" args={[night ? '#0b0718' : '#e9dcc4', Math.max(W, D) * 1.6 + 40, Math.max(W, D) * 4 + 140]} />
      {night && <Stars radius={260} depth={60} count={lite ? 700 : 2500} factor={lite ? 6 : 5} fade speed={0.6} />}

      <hemisphereLight args={[night ? '#6a5cc0' : '#fff6e0', night ? '#3a2614' : '#8a6a45', night ? 0.9 : 0.9]} />
      {night && <ambientLight intensity={0.25} color="#ffd9a8" />}
      <directionalLight position={[40, 70, 30]} intensity={night ? 0.15 : 2.1} castShadow={!lite} shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-90} shadow-camera-right={90} shadow-camera-top={90} shadow-camera-bottom={-90} />
      {night && (
        <>
          <pointLight position={[0, H - 2, 0]} intensity={600} distance={Math.max(W, D) * 2} color="#ffcf8a" decay={1.5} />
          <pointLight position={[0, H + 10, D / 2 + 14]} intensity={500} distance={Math.max(W, D) * 2} color="#ffb36b" decay={1.5} />
          {!lite && <pointLight position={[0, H - 3, D / 2]} intensity={120} distance={40} color="#9ff0e0" decay={1.6} />}
          {!lite && <pointLight position={[0, 4, -D / 2 + stageD]} intensity={90} distance={30} color="#ffd56b" decay={1.6} />}
        </>
      )}

      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[Math.max(W, D) * 3 + 120, 64]} />
        <meshStandardMaterial color={night ? '#4a3626' : '#c9a57a'} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color={night ? '#3a2e22' : '#a78058'} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, stageD / 2]} receiveShadow>
        <planeGeometry args={[4, D - stageD]} />
        <meshStandardMaterial color="#0e6a62" roughness={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, D / 2 + 6]}>
        <planeGeometry args={[9, 9]} />
        <meshStandardMaterial map={kolam} transparent roughness={1} />
      </mesh>

      {/* poles */}
      {poles.map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <cylinderGeometry args={[0.25, 0.28, H, 10]} />
          {type === 'theenolai'
            ? <meshStandardMaterial color="#7a5530" roughness={0.9} />
            : type === 'sheet'
              ? <meshStandardMaterial color="#9aa6ad" metalness={0.6} roughness={0.35} />
              : <meshStandardMaterial map={poleTex} roughness={0.8} />}
        </mesh>
      ))}

      <Roof key={type} type={type} W={W} D={D} />
      {type === 'samiyana' && (
        <mesh position={[0, (H - 1.5) / 2, -D / 2 + 0.1]}>
          <planeGeometry args={[W, H - 1.5]} />
          <meshStandardMaterial map={kanat} side={THREE.DoubleSide} roughness={0.9} />
        </mesh>
      )}

      {/* stage */}
      <group position={[0, 0, -D / 2 + stageD / 2 + 0.5]}>
        <mesh position={[0, 1, 0]} castShadow receiveShadow>
          <boxGeometry args={[stageW, 2, stageD]} />
          <meshStandardMaterial color="#063b37" roughness={0.5} />
        </mesh>
        <mesh position={[0, 2.03, 0]}>
          <boxGeometry args={[stageW + 0.1, 0.08, stageD + 0.1]} />
          <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.25} />
        </mesh>
        {[-1.6, 1.6].map((x) => (
          <group key={x} position={[x, 2, -0.6]}>
            <mesh position={[0, 1.6, -0.6]} castShadow>
              <boxGeometry args={[2.2, 3.2, 0.3]} />
              <meshStandardMaterial color="#d4af37" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.8, 0]} castShadow>
              <boxGeometry args={[2.2, 0.5, 1.8]} />
              <meshStandardMaterial color="#0b5c55" roughness={0.45} />
            </mesh>
          </group>
        ))}
      </group>

      <Chairs W={W} D={D} count={clamp(Math.round(guests), 0, 1200)} stageDepth={stageD + 1} />
      <Thoranam W={W} z={D / 2 + 0.4} y={H - 1.6} />
      <SerialLights points={lights} night={night} lite={lite} />
      <BananaTree position={[-W / 2 - 1.4, 0, D / 2 + 0.6]} />
      <BananaTree position={[W / 2 + 1.4, 0, D / 2 + 0.6]} flip />

      {!lite && <ContactShadows position={[0, 0.06, 0]} scale={Math.max(W, D) * 1.6} opacity={night ? 0.25 : 0.45} blur={2.4} far={20} />}
      <OrbitControls makeDefault enablePan={false} autoRotate={autoRotate} autoRotateSpeed={0.6}
        minDistance={20} maxDistance={Math.max(W, D) * 4 + 120} minPolarAngle={0.25} maxPolarAngle={Math.PI / 2.08} target={[0, 5, 0]} />
    </>
  );
}

export default function Pandal3D(props: Pandal3DProps) {
  const { lite = false, interactive = true, paused = false, onContextLost } = props;
  // Unmounting the canvas deliberately releases its GL context; only a loss while mounted is a real problem.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  return (
    <Canvas
      shadows={!lite}
      dpr={lite ? [1, 1.5] : [1, 1.75]}
      frameloop={paused ? 'never' : 'always'}
      camera={{ fov: 42, near: 0.5, far: 2000 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      style={{ pointerEvents: interactive ? 'auto' : 'none' }}
      onCreated={({ gl }) => {
        // Mobile browsers can drop the WebGL context under memory pressure; let the page offer a reload.
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
          if (mounted.current) onContextLost?.();
        });
      }}
    >
      <Scene {...props} />
    </Canvas>
  );
}
