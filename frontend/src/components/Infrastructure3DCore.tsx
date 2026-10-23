import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  Activity,
  Box,
  Cpu,
  GitBranch,
  Radio,
  Rocket,
  ShieldCheck,
} from 'lucide-react';

interface Node3DDef {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  metric: string;
  color: string;
  /** Position on the orbit ellipse, in degrees (0 = right, 90 = top). */
  angle: number;
  depth: number;
  highlightStates: number[];
}

const ORBIT_RX = 1.95;
const ORBIT_RY = 1.7;

const NODES_BASE: Node3DDef[] = [
  { id: 'canary', name: 'Canary Engine', subtitle: 'Automated Rollout', icon: Rocket, metric: 'Rollout 100%', color: '#8A5700', angle: 96, depth: -0.35, highlightStates: [0, 2] },
  { id: 'cicd', name: 'GitHub CI/CD', subtitle: 'Pipeline #8491', icon: GitBranch, metric: '100% Pass', color: '#975B00', angle: 150, depth: 0.4, highlightStates: [0, 2] },
  { id: 'gateway', name: 'Ingress Gateway', subtitle: 'Edge TLS 1.3', icon: Radio, metric: '24ms Edge', color: '#7A5A12', angle: 196, depth: -0.4, highlightStates: [0, 3] },
  { id: 'audit', name: 'Audit & RBAC', subtitle: 'Verified JWT', icon: ShieldCheck, metric: 'Zero Trust', color: '#2A2620', angle: 242, depth: 0.35, highlightStates: [0, 3] },
  { id: 'loki', name: 'Loki & Prometheus', subtitle: '< 1s Live Stream', icon: Activity, metric: '420 eps', color: '#935800', angle: 298, depth: -0.3, highlightStates: [0, 1] },
  { id: 'docker', name: 'Container Runtime', subtitle: 'Docker Daemon', icon: Box, metric: 'Up · Healthy', color: '#3A322C', angle: 344, depth: 0.4, highlightStates: [0, 1] },
  { id: 'k8s', name: 'K8s Clusters', subtitle: '2 Nodes · 8 Pods', icon: Cpu, metric: '14% CPU', color: '#9B4E00', angle: 30, depth: -0.4, highlightStates: [0, 1] },
];

const nodePosition = (node: Node3DDef) => {
  const a = THREE.MathUtils.degToRad(node.angle);
  return new THREE.Vector3(Math.cos(a) * ORBIT_RX, Math.sin(a) * ORBIT_RY, node.depth);
};

/** Soft radial sprite used for particles, glow and the contact shadow. */
const createRadialTexture = (stops: [number, string][]) => {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

// Clear glass shell for a light page: transparent face, bright fresnel edge and a crisp key-light glint.
const GLASS_VERTEX = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = cameraPosition - worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const GLASS_FRAGMENT = /* glsl */ `
  uniform vec3 uKeyDir;
  uniform vec3 uFillDir;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main() {
    vec3 n = normalize(vNormalW);
    vec3 v = normalize(vViewDir);
    float facing = max(dot(n, v), 0.0);
    float fresnel = pow(1.0 - facing, 3.0);
    float glint = pow(max(dot(reflect(-normalize(uKeyDir), n), v), 0.0), 140.0);
    float sheen = pow(max(dot(reflect(-normalize(uFillDir), n), v), 0.0), 18.0);
    vec3 edge = mix(vec3(1.0, 0.96, 0.88), vec3(0.86, 0.62, 0.3), fresnel);
    float alpha = clamp(0.025 + fresnel * 0.66 + glint * 0.9 + sheen * 0.18, 0.0, 0.92);
    vec3 col = mix(edge, vec3(1.0), clamp(glint + sheen * 0.5, 0.0, 1.0));
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }
`;

// Flat HUD ring. With uCount > 0 it is cut into uCount evenly spaced ticks or dashes, uDuty of each period lit.
// The edge width comes from the position derivative, so there is no seam where atan wraps.
const HUD_RING_VERTEX = /* glsl */ `
  varying vec2 vPos;
  void main() {
    vPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const HUD_RING_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uCount;
  uniform float uDuty;
  varying vec2 vPos;
  void main() {
    float mask = 1.0;
    if (uCount > 0.0) {
      float f = fract((atan(vPos.y, vPos.x) / 6.28318530718 + 0.5) * uCount);
      float w = uCount * length(fwidth(vPos)) / (6.28318530718 * max(length(vPos), 1e-4));
      mask = smoothstep(0.0, w, f) * (1.0 - smoothstep(uDuty - w, uDuty, f));
    }
    if (mask <= 0.0) discard;
    gl_FragColor = vec4(uColor, uOpacity * mask);
    #include <colorspace_fragment>
  }
`;

/** Radar wedge: bright leading edge at +x, trail fading counter-clockwise. */
const createSweepTexture = () => {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const c = size / 2;
    const gradient = ctx.createConicGradient(0, c, c);
    gradient.addColorStop(0, 'rgba(230,154,0,0.5)');
    gradient.addColorStop(0.1, 'rgba(230,154,0,0.14)');
    gradient.addColorStop(0.28, 'rgba(230,154,0,0)');
    gradient.addColorStop(1, 'rgba(230,154,0,0)');
    ctx.beginPath();
    ctx.arc(c, c, c, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(200,125,0,0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(c, c);
    ctx.lineTo(size, c);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

export const Infrastructure3DCore: React.FC<{
  activeState?: number;
  mousePos?: { x: number; y: number };
}> = ({ activeState = 0, mousePos = { x: 0, y: 0 } }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const mousePosRef = useRef(mousePos);
  const activeStateRef = useRef(activeState);
  const badgeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const coreLabelRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const [compact, setCompact] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const hoveredNodeIdRef = useRef<string | null>(null);

  useEffect(() => {
    hoveredNodeIdRef.current = hoveredNodeId;
  }, [hoveredNodeId]);

  useEffect(() => {
    mousePosRef.current = mousePos;
  }, [mousePos]);

  useEffect(() => {
    activeStateRef.current = activeState;
  }, [activeState]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = container.clientWidth || 600;
    let height = container.clientHeight || 540;
    setCompact(width < 600);

    // 1. Renderer, camera and a studio environment for physically based reflections
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      return;
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.35, 8.1);
    camera.lookAt(0, 0, 0);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = new RoomEnvironment();
    const environmentTarget = pmrem.fromScene(environment, 0.04);
    scene.environment = environmentTarget.texture;
    scene.environmentIntensity = 0.85;
    environment.dispose();
    pmrem.dispose();

    // 2. Soft daylight rig: sky/ground bounce, a warm key and a cool rim
    scene.add(new THREE.HemisphereLight(0xffffff, 0xd9cfc2, 0.7));
    const keyLight = new THREE.DirectionalLight(0xfff1dc, 2.1);
    keyLight.position.set(4, 6, 6);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xdfe6ff, 1.1);
    rimLight.position.set(-5, 2, -5);
    scene.add(rimLight);
    const coreLight = new THREE.PointLight(0xffa62b, 5, 6, 2);
    scene.add(coreLight);

    const textures: THREE.Texture[] = [];
    const softDot = createRadialTexture([
      [0, 'rgba(255,255,255,1)'],
      [0.35, 'rgba(255,255,255,0.75)'],
      [1, 'rgba(255,255,255,0)'],
    ]);
    const glowTexture = createRadialTexture([
      [0, 'rgba(255,196,92,0.55)'],
      [0.4, 'rgba(255,183,64,0.22)'],
      [1, 'rgba(255,183,64,0)'],
    ]);
    const shadowTexture = createRadialTexture([
      [0, 'rgba(58,44,30,0.42)'],
      [0.45, 'rgba(58,44,30,0.16)'],
      [1, 'rgba(58,44,30,0)'],
    ]);
    textures.push(softDot, glowTexture, shadowTexture);

    // 3. Hierarchy: parallax group > floating assembly; nodes stay anchored so labels stay readable
    const parallaxGroup = new THREE.Group();
    scene.add(parallaxGroup);
    const floatGroup = new THREE.Group();
    parallaxGroup.add(floatGroup);

    // Contact shadow grounds the floating object on the page
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false }),
    );
    shadow.position.set(0, -1.82, -0.6);
    shadow.scale.set(2.5, 0.42, 1);
    scene.add(shadow);

    // 4. OpsPilot 3D Mascot Pilot Core (Autonomous AI Agent inside the Cockpit Orb)
    const pilotGroup = new THREE.Group();
    pilotGroup.scale.setScalar(1.24);
    pilotGroup.position.set(0, 0.04, 0);
    floatGroup.add(pilotGroup);

    // Premium industrial amber-platinum materials
    const chassisMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x181512,
      metalness: 0.85,
      roughness: 0.28,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15,
    });
    const goldTrimMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xe2a336,
      metalness: 0.95,
      roughness: 0.22,
      clearcoat: 0.6,
    });
    const darkMetalMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x2e2924,
      metalness: 0.9,
      roughness: 0.38,
    });
    const visorMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x060608,
      metalness: 0.95,
      roughness: 0.06,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });
    const eyeEmissiveMaterial = new THREE.MeshStandardMaterial({
      color: 0xffc433,
      emissive: 0xff9900,
      emissiveIntensity: 3.0,
      roughness: 0.15,
    });
    const antennaBulbMaterial = new THREE.MeshStandardMaterial({
      color: 0xffca28,
      emissive: 0xff9500,
      emissiveIntensity: 3.4,
      roughness: 0.1,
    });
    const coreReactorMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffca33,
      emissive: 0xff8c00,
      emissiveIntensity: 2.2,
      metalness: 0.25,
      roughness: 0.15,
      clearcoat: 1.0,
    });

    // --- Head Assembly ---
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.07, 0);
    pilotGroup.add(headGroup);

    // Head chassis: rounded squircle shape extruded with smooth bevel
    const headShape = new THREE.Shape();
    const hw = 0.44;
    const hh = 0.34;
    const hr = 0.10;
    headShape.moveTo(-hw / 2 + hr, -hh / 2);
    headShape.lineTo(hw / 2 - hr, -hh / 2);
    headShape.quadraticCurveTo(hw / 2, -hh / 2, hw / 2, -hh / 2 + hr);
    headShape.lineTo(hw / 2, hh / 2 - hr);
    headShape.quadraticCurveTo(hw / 2, hh / 2, hw / 2 - hr, hh / 2);
    headShape.lineTo(-hw / 2 + hr, hh / 2);
    headShape.quadraticCurveTo(-hw / 2, hh / 2, -hw / 2, hh / 2 - hr);
    headShape.lineTo(-hw / 2, -hh / 2 + hr);
    headShape.quadraticCurveTo(-hw / 2, -hh / 2, -hw / 2 + hr, -hh / 2);

    const headGeo = new THREE.ExtrudeGeometry(headShape, {
      depth: 0.22,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.04,
      bevelThickness: 0.04,
    });
    headGeo.center();
    const headMesh = new THREE.Mesh(headGeo, chassisMaterial);
    headGroup.add(headMesh);

    // Front Visor Screen: glossy recessed obsidian panel
    const visorShape = new THREE.Shape();
    const vw = 0.35;
    const vh = 0.24;
    const vr = 0.06;
    visorShape.moveTo(-vw / 2 + vr, -vh / 2);
    visorShape.lineTo(vw / 2 - vr, -vh / 2);
    visorShape.quadraticCurveTo(vw / 2, -vh / 2, vw / 2, -vh / 2 + vr);
    visorShape.lineTo(vw / 2, vh / 2 - vr);
    visorShape.quadraticCurveTo(vw / 2, vh / 2, vw / 2 - vr, vh / 2);
    visorShape.lineTo(-vw / 2 + vr, vh / 2);
    visorShape.quadraticCurveTo(-vw / 2, vh / 2, -vw / 2, vh / 2 - vr);
    visorShape.lineTo(-vw / 2, -vh / 2 + vr);
    visorShape.quadraticCurveTo(-vw / 2, -vh / 2, -vw / 2 + vr, -vh / 2);

    const visorGeo = new THREE.ExtrudeGeometry(visorShape, {
      depth: 0.012,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.008,
      bevelThickness: 0.008,
    });
    visorGeo.center();
    const visorMesh = new THREE.Mesh(visorGeo, visorMaterial);
    visorMesh.position.set(0, 0, 0.152);
    headGroup.add(visorMesh);

    // Glowing Eyes on the visor (can shift & blink)
    const eyesGroup = new THREE.Group();
    eyesGroup.position.set(0, 0, 0.166);
    const eyeGeo = new THREE.CapsuleGeometry(0.024, 0.038, 12, 16);
    const leftEye = new THREE.Mesh(eyeGeo, eyeEmissiveMaterial);
    const rightEye = new THREE.Mesh(eyeGeo, eyeEmissiveMaterial);
    leftEye.position.set(-0.088, 0.01, 0);
    rightEye.position.set(0.088, 0.01, 0);
    eyesGroup.add(leftEye, rightEye);
    headGroup.add(eyesGroup);

    // Antenna on top with golden beacon bulb
    const antennaBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.04, 0.025, 20),
      goldTrimMaterial,
    );
    antennaBase.position.set(0, 0.21, 0);
    headGroup.add(antennaBase);

    const antennaStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.009, 0.13, 16),
      darkMetalMaterial,
    );
    antennaStem.position.set(0, 0.28, 0);
    headGroup.add(antennaStem);

    const antennaBulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.044, 24, 20),
      antennaBulbMaterial,
    );
    antennaBulb.position.set(0, 0.355, 0);
    headGroup.add(antennaBulb);

    const antennaLight = new THREE.PointLight(0xffaa11, 2.8, 1.4, 2);
    antennaLight.position.set(0, 0.36, 0);
    headGroup.add(antennaLight);

    // Headset Side Ear Pods with gold chamfer rings
    [-1, 1].forEach((side) => {
      const earGroup = new THREE.Group();
      earGroup.position.set(side * 0.245, 0, 0);
      earGroup.rotation.z = Math.PI / 2;

      const earPod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.058, 0.058, 0.036, 24),
        darkMetalMaterial,
      );
      earGroup.add(earPod);

      const earRim = new THREE.Mesh(
        new THREE.TorusGeometry(0.06, 0.006, 12, 32),
        goldTrimMaterial,
      );
      earRim.position.set(0, side * 0.018, 0);
      earRim.rotation.x = Math.PI / 2;
      earGroup.add(earRim);

      headGroup.add(earGroup);
    });

    // --- Torso & Anti-Gravity Chassis Assembly ---
    const bodyGroup = new THREE.Group();
    bodyGroup.position.set(0, -0.19, 0);
    pilotGroup.add(bodyGroup);

    // Gold neck joint ring
    const neckMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.052, 0.052, 0.035, 20),
      goldTrimMaterial,
    );
    neckMesh.position.set(0, 0.115, 0);
    bodyGroup.add(neckMesh);

    // Torso pod
    const torsoGeo = new THREE.CapsuleGeometry(0.12, 0.11, 16, 24);
    const torso = new THREE.Mesh(torsoGeo, chassisMaterial);
    torso.scale.set(1.2, 1.0, 0.9);
    bodyGroup.add(torso);

    // Chest Reactor Arc / Core
    const reactorBezel = new THREE.Mesh(
      new THREE.TorusGeometry(0.048, 0.007, 12, 32),
      goldTrimMaterial,
    );
    reactorBezel.position.set(0, 0.02, 0.108);
    bodyGroup.add(reactorBezel);

    const reactorCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.036, 24, 20),
      coreReactorMaterial,
    );
    reactorCore.position.set(0, 0.02, 0.102);
    bodyGroup.add(reactorCore);

    // Anti-Gravity Thruster ring at bottom
    const thrusterRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.065, 0.008, 12, 32),
      goldTrimMaterial,
    );
    thrusterRing.rotation.x = Math.PI / 2;
    thrusterRing.position.set(0, -0.11, 0);
    bodyGroup.add(thrusterRing);

    const thrusterDiskMat = new THREE.MeshBasicMaterial({
      color: 0xffaa22,
      transparent: true,
      opacity: 0.85,
    });
    const thrusterDisk = new THREE.Mesh(
      new THREE.CircleGeometry(0.055, 24),
      thrusterDiskMat,
    );
    thrusterDisk.rotation.x = Math.PI / 2;
    thrusterDisk.position.set(0, -0.115, 0);
    bodyGroup.add(thrusterDisk);

    // Floating Robotic Paws / Hands
    const makePaw = (side: number) => {
      const pawGroup = new THREE.Group();
      pawGroup.position.set(side * 0.22, -0.14, 0.08);

      const pawGeo = new THREE.CapsuleGeometry(0.028, 0.04, 12, 16);
      const pawMesh = new THREE.Mesh(pawGeo, chassisMaterial);
      pawMesh.rotation.z = side * 0.35;
      pawMesh.rotation.x = 0.2;
      pawGroup.add(pawMesh);

      const pad = new THREE.Mesh(
        new THREE.SphereGeometry(0.015, 12, 12),
        goldTrimMaterial,
      );
      pad.position.set(0, 0.005, 0.025);
      pawGroup.add(pad);

      return pawGroup;
    };
    const leftPaw = makePaw(-1);
    const rightPaw = makePaw(1);
    bodyGroup.add(leftPaw, rightPaw);

    // Holographic stabilization orbit ring around pilot
    const pilotHoloRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.34, 0.004, 8, 64),
      new THREE.MeshBasicMaterial({
        color: 0xe6a122,
        transparent: true,
        opacity: 0.45,
      }),
    );
    pilotHoloRing.rotation.x = Math.PI / 2.2;
    pilotGroup.add(pilotHoloRing);

    const glass = new THREE.Mesh(
      new THREE.SphereGeometry(0.98, 96, 64),
      new THREE.ShaderMaterial({
        uniforms: {
          uKeyDir: { value: new THREE.Vector3(-0.35, 0.55, 1).normalize() },
          uFillDir: { value: new THREE.Vector3(0.6, -0.2, 1).normalize() },
        },
        vertexShader: GLASS_VERTEX,
        fragmentShader: GLASS_FRAGMENT,
        transparent: true,
        depthWrite: false,
      }),
    );
    glass.renderOrder = 2;
    floatGroup.add(glass);

    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: glowTexture, transparent: true, depthWrite: false }),
    );
    halo.scale.setScalar(2.8);
    floatGroup.add(halo);

    // 5. Flight-instrument HUD: flat, viewer-facing layers at staggered depths, so parallax reads as a cockpit display
    const brass = new THREE.MeshPhysicalMaterial({
      color: 0xc9a066,
      metalness: 1,
      roughness: 0.3,
      clearcoat: 0.4,
      clearcoatRoughness: 0.2,
    });

    const hudGroup = new THREE.Group();
    floatGroup.add(hudGroup);

    const makeHudRing = (inner: number, outer: number, color: number, opacity: number, count = 0, duty = 1) =>
      new THREE.Mesh(
        new THREE.RingGeometry(inner, outer, 256, 1),
        new THREE.ShaderMaterial({
          uniforms: {
            uColor: { value: new THREE.Color(color) },
            uOpacity: { value: opacity },
            uCount: { value: count },
            uDuty: { value: duty },
          },
          vertexShader: HUD_RING_VERTEX,
          fragmentShader: HUD_RING_FRAGMENT,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      );

    // A. Radar scope behind the pilot: range rings plus a rotating sweep
    const sweepTexture = createSweepTexture();
    textures.push(sweepTexture);
    const radarGroup = new THREE.Group();
    radarGroup.position.z = -0.45;
    hudGroup.add(radarGroup);
    const radarSweep = new THREE.Mesh(
      new THREE.CircleGeometry(1.2, 96),
      new THREE.MeshBasicMaterial({ map: sweepTexture, transparent: true, opacity: 0.7, depthWrite: false }),
    );
    radarGroup.add(radarSweep, makeHudRing(1.19, 1.2, 0xb87a14, 0.4), makeHudRing(0.6, 0.606, 0xb87a14, 0.18, 60, 0.5));

    // B. Dashed counter-rotating ring between scope and gauge
    const dashRing = makeHudRing(1.1, 1.112, 0xa86f12, 0.5, 96, 0.5);
    dashRing.position.z = -0.12;
    hudGroup.add(dashRing);

    // C. Service health gauge: a faint track; each node gets an arc segment on its bearing (section 7)
    const gaugeInner = 1.25;
    const gaugeOuter = 1.29;
    hudGroup.add(makeHudRing(gaugeInner, gaugeOuter, 0x3a322c, 0.07));

    // D. Heading bezel: minor and major ticks on a fine base line, hunting gently like a heading indicator
    const headingBezel = new THREE.Group();
    headingBezel.position.z = 0.08;
    headingBezel.add(
      makeHudRing(1.395, 1.401, 0xb87a14, 0.55),
      makeHudRing(1.405, 1.445, 0x8a5a14, 0.65, 72, 0.14),
      makeHudRing(1.405, 1.49, 0x3a322c, 0.8, 8, 0.035),
    );
    hudGroup.add(headingBezel);

    // 6. Telemetry nodes: enamel beads with a fine metal bezel
    const nodesGroup = new THREE.Group();
    parallaxGroup.add(nodesGroup);
    const beadGeo = new THREE.SphereGeometry(0.105, 32, 24);
    const bezelGeo = new THREE.TorusGeometry(0.16, 0.009, 12, 64);
    const nodeObjects = NODES_BASE.map((cfg) => {
      const pos = nodePosition(cfg);
      const group = new THREE.Group();
      group.position.copy(pos);
      const beadMat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        emissive: cfg.color,
        emissiveIntensity: 0,
        metalness: 0.15,
        roughness: 0.32,
      });
      group.add(new THREE.Mesh(beadGeo, beadMat));
      const bezel = new THREE.Mesh(bezelGeo, brass);
      group.add(bezel);
      nodesGroup.add(group);
      return { cfg, group, bezel, beadMat, pos };
    });

    // 7. Gauge segments and emitter beads where each node's cable leaves the HUD
    const segmentArc = THREE.MathUtils.degToRad(30);
    const portEmitterGeo = new THREE.SphereGeometry(0.024, 16, 12);
    const portAnchor = (cfg: Node3DDef) => {
      const a = THREE.MathUtils.degToRad(cfg.angle);
      return new THREE.Vector3(Math.cos(a) * gaugeOuter, Math.sin(a) * gaugeOuter, 0);
    };

    const dockingPorts = nodeObjects.map(({ cfg }) => {
      const a = THREE.MathUtils.degToRad(cfg.angle);
      const segmentMat = new THREE.MeshBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const segment = new THREE.Mesh(
        new THREE.RingGeometry(gaugeInner, gaugeOuter, 48, 1, a - segmentArc / 2, segmentArc),
        segmentMat,
      );
      segment.position.z = 0.01;
      hudGroup.add(segment);

      const emitterMat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        emissive: cfg.color,
        emissiveIntensity: 2.2,
        roughness: 0.15,
      });
      const emitter = new THREE.Mesh(portEmitterGeo, emitterMat);
      emitter.position.copy(portAnchor(cfg)).setZ(0.03);
      hudGroup.add(emitter);
      return { cfg, emitterMat, segmentMat };
    });

    // 8. Cables from the core to each node, with a gentle gravity sag, plus an orbit track through the nodes
    const curves: THREE.Curve<THREE.Vector3>[] = [];
    const cableMat = new THREE.MeshStandardMaterial({
      color: 0x947448,
      metalness: 0.62,
      roughness: 0.38,
      transparent: true,
      opacity: 0.72,
    });
    nodeObjects.forEach(({ cfg, pos }) => {
      const start = portAnchor(cfg);
      const control = start.clone().lerp(pos, 0.5);
      control.y -= 0.18;
      control.z += 0.1;
      const curve = new THREE.QuadraticBezierCurve3(start, control, pos.clone());
      curves.push(curve);
      nodesGroup.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.0085, 8, false), cableMat));
    });

    // Orbit track: a true ellipse on the node bearings, drawn as a dashed HUD line rather than a spline through
    // the staggered node depths (which bulged into a lopsided loop)
    const orbitCurve = new THREE.CatmullRomCurve3(
      Array.from({ length: 96 }, (_, i) => {
        const a = (i / 96) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(a) * ORBIT_RX, Math.sin(a) * ORBIT_RY, 0);
      }),
      true,
    );
    curves.push(orbitCurve);
    const orbitTrack = makeHudRing(0.997, 1.003, 0xa86f12, 0.6, 140, 0.42);
    orbitTrack.scale.set(ORBIT_RX, ORBIT_RY, 1);
    nodesGroup.add(orbitTrack);

    // 8. Signal pulses: a soft head with a fading tail travelling along the cables
    const pulseCount = 14;
    const tailLength = 5;
    const pulsePoints = pulseCount * tailLength;
    const pulseGeo = new THREE.BufferGeometry();
    const pulsePositions = new Float32Array(pulsePoints * 3);
    const pulseColors = new Float32Array(pulsePoints * 4);
    const pulseColor = new THREE.Color(0xf2a20c);
    for (let i = 0; i < pulsePoints; i++) {
      const tail = i % tailLength;
      pulseColors.set([pulseColor.r, pulseColor.g, pulseColor.b, 1 - tail / tailLength], i * 4);
    }
    pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePositions, 3));
    pulseGeo.setAttribute('color', new THREE.BufferAttribute(pulseColors, 4));
    const pulses = new THREE.Points(
      pulseGeo,
      new THREE.PointsMaterial({ size: 0.11, map: softDot, vertexColors: true, transparent: true, depthWrite: false }),
    );
    nodesGroup.add(pulses);
    const pulseTracks = Array.from({ length: pulseCount }, () => ({
      curve: Math.floor(Math.random() * curves.length),
      t: Math.random(),
      speed: 0.18 + Math.random() * 0.2,
      inbound: Math.random() > 0.5,
    }));
    const pulsePoint = new THREE.Vector3();

    // 9. Drifting dust motes for depth
    const moteCount = 40;
    const moteGeo = new THREE.BufferGeometry();
    const motePositions = new Float32Array(moteCount * 3);
    const moteSeeds = Array.from({ length: moteCount }, (_, i) => {
      motePositions[i * 3] = (Math.random() - 0.5) * 8;
      motePositions[i * 3 + 1] = (Math.random() - 0.5) * 5.5;
      motePositions[i * 3 + 2] = (Math.random() - 0.5) * 4 - 0.5;
      return { phase: Math.random() * Math.PI * 2, rise: 0.04 + Math.random() * 0.08 };
    });
    moteGeo.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));
    const motes = new THREE.Points(
      moteGeo,
      new THREE.PointsMaterial({ size: 0.06, map: softDot, color: 0xd9a54a, transparent: true, opacity: 0.45, depthWrite: false }),
    );
    scene.add(motes);

    // 10. Loop: frame-rate independent motion, overlay projection, pause when offscreen
    const timer = new THREE.Timer();
    timer.connect(document);
    const timeScale = reducedMotion ? 0.25 : 1;
    const projected = new THREE.Vector3();
    const labelAnchor = new THREE.Vector3(0, -2.2, 0);
    let animId = 0;
    let elapsed = 0;
    let visible = true;

    const toScreen = (v: THREE.Vector3) => {
      projected.copy(v).project(camera);
      return [((projected.x + 1) * width) / 2, ((-projected.y + 1) * height) / 2] as const;
    };

    const animate = () => {
      if (!visible) {
        animId = 0;
        return;
      }
      animId = requestAnimationFrame(animate);
      // performance.now() keeps the clock monotonic; a negative delta would make the damped easing diverge
      timer.update();
      const delta = THREE.MathUtils.clamp(timer.getDelta(), 0, 0.1) * timeScale;
      elapsed += delta;
      const t = elapsed;
      const ease = 1 - Math.exp(-delta * 3.5);

      // Mascot pilot animation & interactive cursor tracking
      const targetHeadRotY = (mousePosRef.current.x || 0) * 0.42;
      const targetHeadRotX = -(mousePosRef.current.y || 0) * 0.28;
      headGroup.rotation.y += (targetHeadRotY - headGroup.rotation.y) * ease;
      headGroup.rotation.x += (targetHeadRotX - headGroup.rotation.x) * ease;

      // Torso follows head with smooth inertia
      bodyGroup.rotation.y += (targetHeadRotY * 0.35 - bodyGroup.rotation.y) * (ease * 0.7);
      bodyGroup.rotation.x += (targetHeadRotX * 0.2 - bodyGroup.rotation.x) * (ease * 0.7);

      // Eye gaze shift on visor
      eyesGroup.position.x += ((mousePosRef.current.x || 0) * 0.02 - eyesGroup.position.x) * ease;
      eyesGroup.position.y += (-(mousePosRef.current.y || 0) * 0.015 - eyesGroup.position.y) * ease;

      // Eye blink cycle: every ~4 seconds, eyes briefly blink
      const blinkCycle = t % 4.2;
      const isBlinking = blinkCycle > 3.95 && blinkCycle < 4.07;
      const targetBlinkScale = isBlinking ? 0.08 : 1.0;
      leftEye.scale.y += (targetBlinkScale - leftEye.scale.y) * 0.38;
      rightEye.scale.y += (targetBlinkScale - rightEye.scale.y) * 0.38;

      // Zero-G paws floating with subtle phase differences
      leftPaw.position.y = -0.14 + Math.sin(t * 1.8) * 0.014;
      rightPaw.position.y = -0.14 + Math.sin(t * 1.8 + 1.2) * 0.014;
      leftPaw.rotation.x = 0.2 + Math.sin(t * 1.5) * 0.07;
      rightPaw.rotation.x = 0.2 + Math.sin(t * 1.5 + 1.5) * 0.07;

      // Pilot gyro holo-ring rotation
      pilotHoloRing.rotation.z += delta * 0.35;

      // Gentle floating bob & breathing
      pilotGroup.position.y = Math.sin(t * 1.3) * 0.035;
      pilotGroup.rotation.z = Math.sin(t * 0.8) * 0.02;

      // Heartbeat pulse for antenna bulb and core reactor
      const breath = 0.5 + 0.5 * Math.sin(t * 1.2);
      antennaBulbMaterial.emissiveIntensity = 2.6 + breath * 1.2;
      coreReactorMaterial.emissiveIntensity = 1.8 + breath * 1.0;
      antennaLight.intensity = 2.2 + breath * 1.0;
      thrusterDiskMat.opacity = 0.6 + breath * 0.3;
      coreLight.intensity = 2.5 + breath * 1.1;
      halo.material.opacity = 0.16 + breath * 0.06;

      // Gentle float, with the contact shadow tightening as the object sinks
      const bob = reducedMotion ? 0 : Math.sin(t * 0.7) * 0.07;
      floatGroup.position.y = bob;
      floatGroup.rotation.z = Math.sin(t * 0.45) * 0.03;
      const lift = (bob + 0.07) / 0.14;
      shadow.scale.set(2.55 - lift * 0.25, 0.42 - lift * 0.04, 1);
      shadow.material.opacity = 0.95 - lift * 0.25;

      // Damped parallax toward the pointer
      parallaxGroup.rotation.x += ((mousePosRef.current.y || 0) * 0.28 - parallaxGroup.rotation.x) * ease;
      parallaxGroup.rotation.y += ((mousePosRef.current.x || 0) * 0.42 - parallaxGroup.rotation.y) * ease;

      // HUD: radar sweeps, the dashed ring counter-rotates, the heading bezel hunts around its bearing
      radarSweep.rotation.z -= delta * 0.9;
      dashRing.rotation.z += delta * 0.12;
      headingBezel.rotation.z = Math.sin(t * 0.22) * 0.35;

      // Interactive Docking Ports: illuminate when node badge is hovered or in activeState
      const activeHover = hoveredNodeIdRef.current;
      const activeSt = activeStateRef.current;
      dockingPorts.forEach(({ cfg, emitterMat, segmentMat }) => {
        const isTarget = cfg.id === activeHover || cfg.highlightStates.includes(activeSt);
        const targetIntensity = isTarget ? 4.4 + 0.8 * Math.sin(t * 3.8) : 1.6 + 0.5 * Math.sin(t * 1.2);
        emitterMat.emissiveIntensity += (targetIntensity - emitterMat.emissiveIntensity) * ease;
        segmentMat.opacity += ((isTarget ? 0.9 : 0.3) - segmentMat.opacity) * ease;
      });

      hudGroup.rotation.z = Math.sin(t * 0.5) * 0.015;

      // Highlighted nodes glow softly; bezels face the viewer
      const state = activeStateRef.current;
      nodeObjects.forEach(({ cfg, bezel, beadMat }, i) => {
        const target = cfg.highlightStates.includes(state) ? 0.35 + 0.2 * Math.sin(t * 2 + i) : 0;
        beadMat.emissiveIntensity += (target - beadMat.emissiveIntensity) * ease;
        bezel.quaternion.copy(camera.quaternion);
      });

      const pulsePos = pulseGeo.attributes.position as THREE.BufferAttribute;
      pulseTracks.forEach((track, i) => {
        const curve = curves[track.curve];
        const length = track.curve === curves.length - 1 ? 3 : 1;
        track.t += (delta * track.speed) / length;
        if (track.t > 1) {
          track.t = 0;
          track.curve = Math.floor(Math.random() * curves.length);
          track.inbound = Math.random() > 0.5;
        }
        for (let k = 0; k < tailLength; k++) {
          const raw = Math.max(track.t - k * 0.018, 0);
          curve.getPoint(track.inbound ? 1 - raw : raw, pulsePoint);
          pulsePos.setXYZ(i * tailLength + k, pulsePoint.x, pulsePoint.y, pulsePoint.z);
        }
      });
      pulsePos.needsUpdate = true;

      const motePos = moteGeo.attributes.position as THREE.BufferAttribute;
      moteSeeds.forEach((seed, i) => {
        let y = motePos.getY(i) + seed.rise * delta;
        if (y > 2.9) y = -2.9;
        motePos.setY(i, y);
        motePos.setX(i, motePos.getX(i) + Math.sin(t * 0.4 + seed.phase) * 0.0015);
      });
      motePos.needsUpdate = true;

      renderer.render(scene, camera);

      // Move HTML labels directly, avoiding a React render every frame
      nodeObjects.forEach(({ cfg, group }) => {
        const el = badgeRefs.current[cfg.id];
        if (!el) return;
        group.getWorldPosition(pulsePoint);
        const [x, y] = toScreen(pulsePoint);
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      });
      if (coreLabelRef.current) {
        const [x, y] = toScreen(labelAnchor);
        coreLabelRef.current.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      width = container.clientWidth || width;
      height = container.clientHeight || height;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      setCompact(width < 600);
    });
    resizeObserver.observe(container);

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible && !animId) animId = requestAnimationFrame(animate);
    });
    visibilityObserver.observe(container);

    animate();
    setReady(true);

    return () => {
      cancelAnimationFrame(animId);
      visible = false;
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      timer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Sprite || object instanceof THREE.LineSegments) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      textures.forEach((texture) => texture.dispose());
      environmentTarget.dispose();
      renderer.dispose();
      scene.clear();
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[380px] sm:min-h-[540px] select-none">
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="absolute inset-0 z-0 overflow-hidden" />

      {ready && (
        <>
          {/* Core caption, anchored beneath the floating assembly */}
          <div ref={coreLabelRef} className="absolute left-0 top-0 z-20 pointer-events-none will-change-transform">
            <div className="-translate-x-1/2 -translate-y-1/2 flex items-center gap-2 whitespace-nowrap rounded-full border border-black/15 bg-white px-3 py-1 shadow-2xs backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-black shadow-[0_0_6px_rgba(0,0,0,0.5)] animate-pulse" />
              <span className="font-tech-mono text-[10px] font-bold tracking-[0.18em] text-black">OPSPILOT // AUTONOMOUS COPILOT</span>
            </div>
          </div>

          {/* Node labels: pinned to each bead and offset outward so they never cover the core */}
          {NODES_BASE.map((node) => {
            const Icon = node.icon;
            const isHovered = hoveredNodeId === node.id;
            const isHighlighted = node.highlightStates.includes(activeState);
            const onLeft = Math.cos(THREE.MathUtils.degToRad(node.angle)) < 0;

            return (
              <div
                key={node.id}
                ref={(el) => {
                  badgeRefs.current[node.id] = el;
                }}
                className={`absolute left-0 top-0 will-change-transform ${isHovered ? 'z-40' : 'z-30'}`}
              >
                {!compact && (
                  <span
                    aria-hidden="true"
                    className={`absolute top-0 h-px w-3 bg-black/30 ${onLeft ? 'right-[6px]' : 'left-[6px]'}`}
                  />
                )}
                <div
                  className={`absolute top-0 -translate-y-1/2 ${
                    compact ? '-translate-x-1/2' : onLeft ? 'right-[18px]' : 'left-[18px]'
                  }`}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                >
                  <div
                    className={`flex items-center gap-2 whitespace-nowrap rounded-full border bg-white backdrop-blur-md transition-[opacity,box-shadow,border-color] duration-300 cursor-default ${
                      compact ? 'p-1' : 'py-1 pl-1 pr-3'
                    } ${
                      isHighlighted
                        ? 'opacity-100 border-black/40 shadow-sm'
                        : 'opacity-70 border-black/15 shadow-2xs'
                    }`}
                  >
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white bg-black"
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    {!compact && (
                      <span className="flex flex-col font-tech-mono leading-tight">
                        <span className="text-[11px] font-bold text-black">{node.name}</span>
                        <span className="text-[9px] font-semibold text-black/70">
                          {node.metric}
                        </span>
                      </span>
                    )}
                  </div>

                  {isHovered && (
                    <div className="absolute left-1/2 top-[calc(100%+8px)] w-52 -translate-x-1/2 rounded-xl border border-black/15 bg-white p-3 text-xs text-black shadow-lg animate-fade-in-up">
                      <div className="mb-1.5 flex items-center justify-between border-b border-black/10 pb-1.5">
                        <span className="font-tech-mono font-bold text-black">
                          {node.name}
                        </span>
                        <span className="font-tech-mono text-[9px] text-black font-semibold">● ONLINE</span>
                      </div>
                      <div className="space-y-1 font-tech-mono text-[10px]">
                        <div className="flex justify-between">
                          <span className="text-black/60">Source</span>
                          <span className="text-black">{node.subtitle}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-black/60">Status</span>
                          <span className="font-bold text-black">{node.metric}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-black/60">Protocol</span>
                          <span className="text-black">gRPC / TLS 1.3</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};
