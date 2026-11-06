export const ASCII_COLUMNS = 100;
export const ASCII_ROWS = 48;

type Point = [number, number, number];
type SurfacePoint = { position: Point; shade: number; seed: number };
const TAU = Math.PI * 2;
const SHADES = '.:+=*#%@';

// Sample both wings of the OpsPilot mark, including front/back and side faces.
// Geometry is created once rather than rebuilt every frame.
const mark: SurfacePoint[] = [];
const wings: [Point, Point, Point][] = [
  [[-1.15, -1.05, 0], [0, 1.2, 0], [0, -0.32, 0]],
  [[-1.15, -1.05, 0], [0, -0.32, 0], [-0.72, -1.05, 0]],
  [[1.15, -1.05, 0], [0, 1.2, 0], [0, -0.32, 0]],
  [[1.15, -1.05, 0], [0, -0.32, 0], [0.72, -1.05, 0]],
];

wings.forEach(([a, b, c], wing) => {
  for (let u = 0; u <= 1; u += 0.025) {
    for (let v = 0; v <= 1 - u; v += 0.025) {
      const x = a[0] + (b[0] - a[0]) * u + (c[0] - a[0]) * v;
      const y = a[1] + (b[1] - a[1]) * u + (c[1] - a[1]) * v;
      for (const z of [-0.17, 0.17]) {
        mark.push({ position: [x, y, z], shade: wing < 2 ? 0.9 : 0.48, seed: x * 12.7 + y * 7.9 });
      }
    }
  }
  for (const [from, to] of [[a, b], [b, c], [c, a]]) {
    for (let t = 0; t <= 1; t += 0.025) {
      for (let z = -0.17; z <= 0.17; z += 0.05) {
        mark.push({
          position: [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t, z],
          shade: 0.3,
          seed: t * 20,
        });
      }
    }
  }
});

function rotate([x, y, z]: Point, yaw: number, tilt: number): Point {
  const rx = x * Math.cos(yaw) + z * Math.sin(yaw);
  const rz = z * Math.cos(yaw) - x * Math.sin(yaw);
  return [rx, y * Math.cos(tilt) - rz * Math.sin(tilt), y * Math.sin(tilt) + rz * Math.cos(tilt)];
}

function orbit(angle: number, lane: number, time: number): Point {
  const radius = lane === 0 ? 3.15 : 2.8;
  return rotate(
    [Math.cos(angle) * radius, Math.sin(angle) * radius, 0],
    lane === 0 ? 0.3 : 1.05 + Math.sin(time * 0.2) * 0.25,
    lane === 0 ? 1.12 + Math.sin(time * 0.25) * 0.12 : -0.55,
  );
}

/** A depth-buffered ASCII sculpture, orbital nodes, and flowing signal trails. */
export function createHeroFrame(time: number, pointerX = 0, pointerY = 0) {
  const cells = Array<string>(ASCII_COLUMNS * ASCII_ROWS).fill(' ');
  const depth = new Float32Array(cells.length).fill(-Infinity);
  const cameraYaw = pointerX * 0.14;
  const cameraTilt = pointerY * 0.1;

  const plot = (point: Point, character: string) => {
    const [x, y, z] = rotate(point, cameraYaw, cameraTilt);
    const perspective = 7.5 / (7.5 - z);
    const column = Math.round(ASCII_COLUMNS / 2 + x * 12 * perspective);
    const row = Math.round(ASCII_ROWS / 2 - y * 6.1 * perspective);
    if (column < 1 || column >= ASCII_COLUMNS - 1 || row < 1 || row >= ASCII_ROWS - 1) return;
    const index = row * ASCII_COLUMNS + column;
    if (z < depth[index]) return;
    depth[index] = z;
    cells[index] = character;
  };

  // Two sparse orbital paths slowly precess around the control plane.
  for (let lane = 0; lane < 2; lane++) {
    for (let step = 0; step < 150; step++) {
      const angle = step / 150 * TAU + time * 0.055;
      plot(orbit(angle, lane, time), step % 5 === 0 ? ':' : '.');
    }
  }

  // Wireframe satellites represent deployments, infrastructure and logs.
  for (let node = 0; node < 3; node++) {
    const angle = time * 0.32 + node * TAU / 3;
    const center = orbit(angle, node % 2, time);
    const size = 0.22;
    for (let axis = 0; axis < 3; axis++) {
      for (const first of [-size, size]) {
        for (const second of [-size, size]) {
          for (let step = 0; step <= 8; step++) {
            const local: Point = [0, 0, 0];
            local[axis] = -size + step / 8 * size * 2;
            local[(axis + 1) % 3] = first;
            local[(axis + 2) % 3] = second;
            const point = rotate(local, time * 0.7 + node, 0.5);
            plot([center[0] + point[0], center[1] + point[1], center[2] + point[2]], step === 0 || step === 8 ? '+' : ':');
          }
        }
      }
    }

    // Packets spiral inward continuously; their tails make motion legible.
    for (let packet = 0; packet < 4; packet++) {
      const progress = (time * 0.24 + packet / 4 + node / 9) % 1;
      for (let tail = 0; tail < 6; tail++) {
        const t = Math.max(0, progress - tail * 0.018);
        const path = orbit(angle - t * 1.7, node % 2, time);
        const scale = 1 - t * 0.88;
        plot([path[0] * scale, path[1] * scale, path[2] * scale], tail === 0 ? '*' : tail < 3 ? '+' : '.');
      }
    }
  }

  // Deterministic particle offsets let the mark disperse and reform smoothly.
  const cycle = time % 16;
  const scatter = cycle > 11 ? Math.sin((cycle - 11) / 5 * Math.PI) ** 2 * 0.8 : 0;
  const yaw = Math.sin(time * 0.48) * 0.65;
  const tilt = Math.sin(time * 0.35) * 0.16;
  for (const { position, shade, seed } of mark) {
    const displaced: Point = [
      position[0] * (1 + scatter * 0.65) + Math.sin(seed * 2.3) * scatter * 0.25,
      position[1] + Math.cos(seed * 1.7) * scatter * 0.4,
      position[2] + Math.sin(seed) * scatter * 1.7,
    ];
    const point = rotate(displaced, yaw, tilt);
    point[1] += Math.sin(time * 0.85) * 0.13;
    const scan = Math.sin(position[1] * 4 - time * 2.4) * 0.12;
    const light = Math.max(0, Math.min(1, shade + scan - scatter * 0.3));
    plot(point, SHADES[Math.round(light * (SHADES.length - 1))]);
  }

  return Array.from({ length: ASCII_ROWS }, (_, row) =>
    cells.slice(row * ASCII_COLUMNS, (row + 1) * ASCII_COLUMNS).join(''),
  ).join('\n');
}
