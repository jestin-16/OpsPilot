import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
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
  initialPos: [number, number, number];
  highlightStates: number[];
}

const NODES_BASE: Node3DDef[] = [
  {
    id: 'cicd',
    name: 'GitHub CI/CD',
    subtitle: 'Pipeline #8491',
    icon: GitBranch,
    metric: '100% Pass',
    initialPos: [-2.1, 1.2, 0.6],
    highlightStates: [0, 2],
  },
  {
    id: 'canary',
    name: 'Canary Engine',
    subtitle: 'Automated Rollout',
    icon: Rocket,
    metric: 'Rollout 100%',
    initialPos: [0, 2.2, 0.4],
    highlightStates: [0, 2],
  },
  {
    id: 'k8s',
    name: 'K8s Clusters',
    subtitle: '2 Nodes · 8 Pods',
    icon: Cpu,
    metric: '14% CPU',
    initialPos: [2.1, 1.1, -0.5],
    highlightStates: [0, 1],
  },
  {
    id: 'docker',
    name: 'Container Runtime',
    subtitle: 'Docker Daemon',
    icon: Box,
    metric: 'Up · Healthy',
    initialPos: [2.2, -0.45, 0.6],
    highlightStates: [0, 1],
  },
  {
    id: 'loki',
    name: 'Loki & Prometheus',
    subtitle: '< 1s Live Stream',
    icon: Activity,
    metric: '420 eps',
    initialPos: [1.4, -1.9, -0.5],
    highlightStates: [0, 1],
  },
  {
    id: 'audit',
    name: 'Audit & RBAC',
    subtitle: 'Verified JWT',
    icon: ShieldCheck,
    metric: 'Zero Trust',
    initialPos: [-1.5, -1.8, 0.5],
    highlightStates: [0, 3],
  },
  {
    id: 'gateway',
    name: 'Ingress Gateway',
    subtitle: 'Edge TLS 1.3',
    icon: Radio,
    metric: '24ms Edge',
    initialPos: [-2.3, -0.3, -0.6],
    highlightStates: [0, 3],
  },
];

const THEME_PALETTE = {
  cageColor: 0x3a322c,       // Bronze wireframe cage (#3A322C)
  crystalColor: 0xffc107,    // Warm Amber crystal (#FFC107)
  emissiveColor: 0xd97706,   // Deep Amber glow (#D97706)
  ring1: 0xffc107,           // Golden Yellow inner ring (#FFC107)
  ring2: 0x5c4a3d,           // Burnished Bronze middle ring (#5C4A3D)
  ring3: 0xf5d061,           // Champagne Gold outer ring (#F5D061)
  particleColors: [0xffc107, 0xf5d061] as [number, number],
  nodeColors: {
    cicd: '#E69A00',
    canary: '#FFC107',
    k8s: '#D97706',
    docker: '#3A322C',
    loki: '#F59E0B',
    audit: '#1F1F24',
    gateway: '#F5D061',
  } as Record<string, string>,
  lightKey: 0xffc107,
  lightFill: 0xd8d8dc,
  lightRim: 0xf5d061,
  coreTag: 'text-amber-400',
  coreBorderColor: 'border-amber-500/60',
};

export const Infrastructure3DCore: React.FC<{
  activeState?: number;
  mousePos?: { x: number; y: number };
}> = ({ activeState = 0, mousePos = { x: 0, y: 0 } }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [screenCoords, setScreenCoords] = useState<
    Record<string, { x: number; y: number; visible: boolean }>
  >({});
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const currentTheme = THEME_PALETTE;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 600;
    let height = container.clientHeight || 560;

    // 1. Scene, Camera, Renderer with ACES Filmic Tone Mapping
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 8.2);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0); // 100% transparent canvas
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // 2. Multi-point Physical Cinematic Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    // Primary warm golden directional key light
    const keyLight = new THREE.DirectionalLight(currentTheme.lightKey, 3.4);
    keyLight.position.set(6, 7, 5);
    scene.add(keyLight);

    // Platinum specular fill light
    const fillLight = new THREE.DirectionalLight(currentTheme.lightFill, 2.2);
    fillLight.position.set(-6, -4, 4);
    scene.add(fillLight);

    // Rim light for edge brilliance
    const rimLight = new THREE.DirectionalLight(currentTheme.lightRim, 2.6);
    rimLight.position.set(0, -6, -5);
    scene.add(rimLight);

    // Internal radiant point light
    const coreLight = new THREE.PointLight(currentTheme.crystalColor, 4.2, 9, 1.2);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);

    // 3. Central Group for Rotation & Mouse Parallax
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 4. Smooth Realistic Quantum Core Engine
    // Layer A: Optical Glass Translucent Volumetric Shell
    const glassSphereGeo = new THREE.SphereGeometry(1.22, 64, 48);
    const glassSphereMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.58,
      roughness: 0.05,
      metalness: 0.08,
      transmission: 0.88,
      thickness: 0.6,
      attenuationColor: new THREE.Color(0xffc107),
      attenuationDistance: 2.0,
      ior: 1.48,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      depthWrite: false,
    });
    const glassSphereMesh = new THREE.Mesh(glassSphereGeo, glassSphereMat);
    mainGroup.add(glassSphereMesh);

    // Layer B: Precision Bronze Geodesic Lattice
    const cageGeo = new THREE.IcosahedronGeometry(1.25, 2);
    const cageMat = new THREE.MeshStandardMaterial({
      color: currentTheme.cageColor,
      wireframe: true,
      metalness: 0.88,
      roughness: 0.22,
      transparent: true,
      opacity: 0.55,
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    mainGroup.add(cageMesh);

    // Layer C: Smooth 32-Facet Brilliant Cut Amber Gemstone Crystal
    const crystalGeo = new THREE.OctahedronGeometry(0.82, 1);
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: currentTheme.crystalColor,
      emissive: currentTheme.emissiveColor,
      emissiveIntensity: 0.62,
      roughness: 0.05,
      metalness: 0.95,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      reflectivity: 0.98,
      flatShading: true,
    });
    const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    mainGroup.add(crystalMesh);

    // Layer D: Radiant Singularity Orb
    const coreOrbGeo = new THREE.SphereGeometry(0.34, 32, 32);
    const coreOrbMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.96,
    });
    const coreOrbMesh = new THREE.Mesh(coreOrbGeo, coreOrbMat);
    mainGroup.add(coreOrbMesh);

    // 5. High-Precision Metallic Orbital Gimbal Rings
    const ring1Mat = new THREE.MeshPhysicalMaterial({
      color: currentTheme.ring1,
      metalness: 0.94,
      roughness: 0.12,
      clearcoat: 0.9,
      clearcoatRoughness: 0.06,
    });
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.024, 24, 180), ring1Mat);
    ring1.rotation.x = Math.PI / 2.3;
    mainGroup.add(ring1);

    const ring2Mat = new THREE.MeshPhysicalMaterial({
      color: currentTheme.ring2,
      metalness: 0.88,
      roughness: 0.22,
      clearcoat: 0.7,
      clearcoatRoughness: 0.10,
    });
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.022, 24, 180), ring2Mat);
    ring2.rotation.y = Math.PI / 3.2;
    ring2.rotation.x = Math.PI / 6;
    mainGroup.add(ring2);

    const ring3Mat = new THREE.MeshPhysicalMaterial({
      color: currentTheme.ring3,
      metalness: 0.96,
      roughness: 0.10,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });
    const ring3 = new THREE.Mesh(new THREE.TorusGeometry(3.15, 0.020, 24, 180), ring3Mat);
    ring3.rotation.z = Math.PI / 4;
    ring3.rotation.y = -Math.PI / 5;
    mainGroup.add(ring3);

    // Orbital counterweight beads on rings
    const beadGeo = new THREE.SphereGeometry(0.06, 16, 16);
    const beadMat = new THREE.MeshStandardMaterial({
      color: currentTheme.crystalColor,
      emissive: currentTheme.crystalColor,
      emissiveIntensity: 1.5,
      roughness: 0.1,
      metalness: 0.9,
    });
    const bead1 = new THREE.Mesh(beadGeo, beadMat);
    bead1.position.set(2.05, 0, 0);
    ring1.add(bead1);

    const bead2 = new THREE.Mesh(beadGeo, beadMat);
    bead2.position.set(2.6, 0, 0);
    ring2.add(bead2);

    const bead3 = new THREE.Mesh(beadGeo, beadMat);
    bead3.position.set(3.15, 0, 0);
    ring3.add(bead3);

    // 6. 3D Beacons for Telemetry Nodes
    const nodeMeshes: { id: string; mesh: THREE.Group; basePos: THREE.Vector3 }[] = [];

    NODES_BASE.forEach((cfg) => {
      const nodeColorHex = currentTheme.nodeColors[cfg.id] || currentTheme.nodeColors.cicd;
      const nodeGroup = new THREE.Group();
      const basePos = new THREE.Vector3(...cfg.initialPos);
      nodeGroup.position.copy(basePos);

      // Smooth metallic jewel bead
      const sphereGeo = new THREE.SphereGeometry(0.18, 24, 24);
      const sphereMat = new THREE.MeshPhysicalMaterial({
        color: nodeColorHex,
        emissive: nodeColorHex,
        emissiveIntensity: 0.75,
        roughness: 0.12,
        metalness: 0.92,
        clearcoat: 0.9,
      });
      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      nodeGroup.add(sphereMesh);

      // Outer rotating halo ring
      const haloGeo = new THREE.TorusGeometry(0.28, 0.016, 16, 48);
      const haloMat = new THREE.MeshBasicMaterial({
        color: nodeColorHex,
        transparent: true,
        opacity: 0.65,
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      nodeGroup.add(haloMesh);

      mainGroup.add(nodeGroup);
      nodeMeshes.push({ id: cfg.id, mesh: nodeGroup, basePos });
    });

    // 7. Smooth 3D Curved Fiber-Optic Cable Conduits
    const curves: THREE.QuadraticBezierCurve3[] = [];

    const conduitMat = new THREE.MeshStandardMaterial({
      color: currentTheme.cageColor,
      metalness: 0.85,
      roughness: 0.25,
      transparent: true,
      opacity: 0.35,
    });

    nodeMeshes.forEach((node, idx) => {
      // Connect to Core (0,0,0)
      const p0 = new THREE.Vector3(0, 0, 0);
      const p2 = node.basePos;
      const mid = new THREE.Vector3().addVectors(p0, p2).multiplyScalar(0.5);
      const normal = new THREE.Vector3(
        Math.sin(idx * 1.2) * 0.45,
        Math.cos(idx * 1.5) * 0.45,
        Math.sin(idx * 2) * 0.45
      );
      const p1 = mid.add(normal);

      const curve = new THREE.QuadraticBezierCurve3(p0, p1, p2);
      curves.push(curve);

      // Smooth 3D Tube Cable Geometry
      const tubeGeo = new THREE.TubeGeometry(curve, 36, 0.014, 8, false);
      const tubeMesh = new THREE.Mesh(tubeGeo, conduitMat);
      mainGroup.add(tubeMesh);
    });

    // Outer ring connecting neighbor nodes
    const outerConduitMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.9,
      roughness: 0.2,
      transparent: true,
      opacity: 0.24,
    });

    for (let i = 0; i < nodeMeshes.length; i++) {
      const nextIdx = (i + 1) % nodeMeshes.length;
      const p0 = nodeMeshes[i].basePos;
      const p2 = nodeMeshes[nextIdx].basePos;
      const mid = new THREE.Vector3().addVectors(p0, p2).multiplyScalar(0.5);
      const p1 = mid.clone().normalize().multiplyScalar(3.0);

      const curve = new THREE.QuadraticBezierCurve3(p0, p1, p2);
      curves.push(curve);

      const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.012, 8, false);
      const tubeMesh = new THREE.Mesh(tubeGeo, outerConduitMat);
      mainGroup.add(tubeMesh);
    }

    // 8. Dynamic 3D Flowing Signal Data Pulses
    const particleCount = 32;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const particleTrackInfo: { curveIdx: number; t: number; speed: number }[] = [];
    const colA = new THREE.Color(currentTheme.particleColors[0]);
    const colB = new THREE.Color(currentTheme.particleColors[1]);

    for (let i = 0; i < particleCount; i++) {
      const curveIdx = Math.floor(Math.random() * curves.length);
      const t = Math.random();
      particleTrackInfo.push({
        curveIdx,
        t,
        speed: 0.003 + Math.random() * 0.006,
      });

      const pt = curves[curveIdx].getPoint(t);
      particlePositions[i * 3] = pt.x;
      particlePositions[i * 3 + 1] = pt.y;
      particlePositions[i * 3 + 2] = pt.z;

      const c = Math.random() > 0.4 ? colA : colB;
      particleColors[i * 3] = c.r;
      particleColors[i * 3 + 1] = c.g;
      particleColors[i * 3 + 2] = c.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.14,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    mainGroup.add(particleSystem);

    // 9. Dynamic Ambient Floating Bokeh Motes
    const moteCount = 38;
    const moteGeo = new THREE.BufferGeometry();
    const motePositions = new Float32Array(moteCount * 3);
    const moteColors = new Float32Array(moteCount * 3);
    const moteVelocities: { x: number; y: number; z: number }[] = [];
    for (let i = 0; i < moteCount; i++) {
      motePositions[i * 3] = (Math.random() - 0.5) * 8.5;
      motePositions[i * 3 + 1] = (Math.random() - 0.5) * 6.5;
      motePositions[i * 3 + 2] = (Math.random() - 0.5) * 4.5;
      const c = Math.random() > 0.5 ? colA : colB;
      moteColors[i * 3] = c.r;
      moteColors[i * 3 + 1] = c.g;
      moteColors[i * 3 + 2] = c.b;
      moteVelocities.push({
        x: (Math.random() - 0.5) * 0.003,
        y: 0.002 + Math.random() * 0.004,
        z: (Math.random() - 0.5) * 0.003,
      });
    }
    moteGeo.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));
    moteGeo.setAttribute('color', new THREE.BufferAttribute(moteColors, 3));
    const moteMat = new THREE.PointsMaterial({
      size: 0.09,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
    });
    const moteSystem = new THREE.Points(moteGeo, moteMat);
    mainGroup.add(moteSystem);

    // 10. Animation & Projection Loop with Frame-Rate Independence
    let animId: number;
    let clock = new THREE.Clock();

    const handleResize = () => {
      if (!container || !renderer) return;
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    const tempV = new THREE.Vector3();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsedTime = clock.getElapsedTime();

      // Smooth continuous 3D rotation
      ring1.rotation.z += 0.22 * delta;
      ring2.rotation.y += 0.26 * delta;
      ring3.rotation.x += 0.18 * delta;

      cageMesh.rotation.y += 0.32 * delta;
      cageMesh.rotation.x += 0.18 * delta;
      glassSphereMesh.rotation.y += 0.14 * delta;

      crystalMesh.rotation.y -= 0.48 * delta;
      crystalMesh.rotation.z += 0.12 * delta;

      // Smooth orbital satellites gliding along physical metallic rings
      bead1.position.x = Math.cos(elapsedTime * 0.9) * 2.05;
      bead1.position.y = Math.sin(elapsedTime * 0.9) * 2.05;

      bead2.position.x = Math.cos(-elapsedTime * 0.75) * 2.6;
      bead2.position.y = Math.sin(-elapsedTime * 0.75) * 2.6;

      bead3.position.x = Math.cos(elapsedTime * 1.1) * 3.15;
      bead3.position.y = Math.sin(elapsedTime * 1.1) * 3.15;

      // Smooth organic breathing pulse and dynamic crystal radiance
      const pulse = 1 + Math.sin(elapsedTime * 2.2) * 0.05;
      crystalMesh.scale.set(pulse, pulse, pulse);
      coreOrbMesh.scale.set(pulse * 0.92, pulse * 0.92, pulse * 0.92);
      crystalMat.emissiveIntensity = 0.55 + Math.sin(elapsedTime * 2.5) * 0.18;

      // Smooth mouse parallax damping
      const targetRotX = (mousePos.y || 0) * 0.4;
      const targetRotY = (mousePos.x || 0) * 0.6;
      mainGroup.rotation.x += (targetRotX - mainGroup.rotation.x) * 0.05;
      mainGroup.rotation.y += (targetRotY - mainGroup.rotation.y) * 0.05;

      // Update signal particles along tubes
      const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        const info = particleTrackInfo[i];
        info.t += info.speed;
        if (info.t >= 1) {
          info.t = 0;
          info.curveIdx = Math.floor(Math.random() * curves.length);
        }
        const curve = curves[info.curveIdx];
        if (curve) {
          const pt = curve.getPoint(info.t);
          posAttr.setXYZ(i, pt.x, pt.y, pt.z);
        }
      }
      posAttr.needsUpdate = true;

      // Drift ambient bokeh motes
      const motePosAttr = moteGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < moteCount; i++) {
        let y = motePosAttr.getY(i) + moteVelocities[i].y;
        if (y > 3.5) y = -3.5;
        motePosAttr.setY(i, y);
      }
      motePosAttr.needsUpdate = true;

      // Render 3D Scene
      renderer.render(scene, camera);

      // Project 3D Node Positions onto 2D Screen
      const nextCoords: Record<string, { x: number; y: number; visible: boolean }> = {};
      nodeMeshes.forEach((node) => {
        node.mesh.getWorldPosition(tempV);
        tempV.project(camera);

        const x = ((tempV.x + 1) * width) / 2;
        const y = ((-tempV.y + 1) * height) / 2;
        const visible = tempV.z < 1.0;

        nextCoords[node.id] = { x, y, visible };
      });

      crystalMesh.getWorldPosition(tempV);
      tempV.project(camera);
      nextCoords['core'] = {
        x: ((tempV.x + 1) * width) / 2,
        y: ((-tempV.y + 1) * height) / 2,
        visible: true,
      };

      setScreenCoords(nextCoords);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, [mousePos]);

  return (
    <div className="relative w-full h-full min-h-[540px] flex items-center justify-center select-none">
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="absolute inset-0 z-0 overflow-hidden" />

      {/* Center OpsPilot Core Hub HTML Overlay */}
      {screenCoords['core'] && (
        <div
          className="absolute pointer-events-auto transition-transform duration-100 z-20"
          style={{
            left: `${screenCoords['core'].x}px`,
            top: `${screenCoords['core'].y + 42}px`,
            transform: 'translate(-50%, 0)',
          }}
        >
          <div
            className={`px-3.5 py-1.5 rounded-full bg-[#1F1F24]/92 border ${currentTheme.coreBorderColor} shadow-xl backdrop-blur-md flex flex-col items-center whitespace-nowrap`}
          >
            <span className="font-tech-mono text-[10px] font-bold tracking-widest text-white">
              OPSPILOT // CORE
            </span>
            <span
              className={`font-tech-mono text-[8px] font-semibold ${currentTheme.coreTag} flex items-center gap-1`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-ping" />
              3D CONTROL PLANE
            </span>
          </div>
        </div>
      )}

      {/* Projected 3D Nodes (Vector Glass Badges) */}
      {NODES_BASE.map((node) => {
        const coord = screenCoords[node.id];
        if (!coord || !coord.visible) return null;

        const Icon = node.icon;
        const isHovered = hoveredNodeId === node.id;
        const isHighlighted = node.highlightStates.includes(activeState);
        const nodeColor = currentTheme.nodeColors[node.id] || currentTheme.nodeColors.cicd;

        return (
          <div
            key={node.id}
            className={`absolute pointer-events-auto transition-all duration-150 z-30 cursor-pointer ${
              isHovered ? 'scale-110 z-40' : ''
            }`}
            style={{
              left: `${coord.x}px`,
              top: `${coord.y}px`,
              transform: 'translate(-50%, -50%)',
            }}
            onMouseEnter={() => setHoveredNodeId(node.id)}
            onMouseLeave={() => setHoveredNodeId(null)}
          >
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-xl transition-all duration-300 shadow-md ${
                isHighlighted
                  ? 'bg-white/95 border-2 shadow-lg'
                  : 'bg-white/90 border border-[#C8C8CC] hover:bg-white'
              }`}
              style={{
                borderColor: isHighlighted ? nodeColor : undefined,
                boxShadow: isHighlighted ? `0 0 20px ${nodeColor}40` : undefined,
              }}
            >
              <div
                className="h-6 w-6 rounded-full flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: nodeColor }}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className="font-tech-mono text-[11px] font-bold text-[#1A1A1A]">
                    {node.name}
                  </span>
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold font-tech-mono whitespace-nowrap"
                    style={{
                      backgroundColor: `${nodeColor}15`,
                      color: nodeColor,
                      border: `1px solid ${nodeColor}30`,
                    }}
                  >
                    {node.metric}
                  </span>
                </div>
                <span className="font-tech-mono text-[9px] text-[#3A322C] whitespace-nowrap">
                  {node.subtitle}
                </span>
              </div>
            </div>

            {/* Hover Tooltip Popover */}
            {isHovered && (
              <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-48 p-3 rounded-xl bg-[#1F1F24]/98 border border-[#3A322C] shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl text-white text-xs z-50 animate-fade-in-up">
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#3A322C]">
                  <span className="font-tech-mono font-bold" style={{ color: nodeColor }}>
                    {node.name}
                  </span>
                  <span className="text-[9px] text-[#FFC107] font-tech-mono">● ONLINE</span>
                </div>
                <div className="space-y-1 font-tech-mono text-[10px] text-[#E2E2E6]">
                  <div className="flex justify-between">
                    <span className="text-[#A8A8B0]">Protocol</span>
                    <span>gRPC / TLS 1.3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A8A8B0]">Status</span>
                    <span className="text-[#FFC107] font-bold">{node.metric}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A8A8B0]">Sync</span>
                    <span>Real-time</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
