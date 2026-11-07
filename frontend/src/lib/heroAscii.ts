export const ASCII_COLUMNS = 100;
export const ASCII_ROWS = 48;
export const CHAPTER_SECONDS = 7;
export const HERO_CHAPTERS = [
  { label: 'Connect', description: 'Your repositories, runtimes, and applications. One project.' },
  { label: 'Stream', description: 'Every source flowing into one continuous view.' },
  { label: 'Correlate', description: 'Follow the thread from deployment activity to runtime logs.' },
] as const;

const TAU = Math.PI * 2;
const SHADES = Array.from('.:+=*#%@', character => character.charCodeAt(0));
type Point = readonly [number, number, number];
// Each vertex packs x, y, z, shade. Negative shades encode literal ASCII glyphs.
type Model = Float32Array;

function line(points: number[], a: Point, b: Point, glyph = ':') {
  const steps = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / 0.055);
  for (let step = 0; step <= steps; step++) {
    const t = steps ? step / steps : 0;
    points.push(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, -glyph.charCodeAt(0));
  }
}

function cube(points: number[], x: number, y: number, z: number, size: number) {
  for (let axis = 0; axis < 3; axis++) {
    for (const a of [-size, size]) {
      for (const b of [-size, size]) {
        const start: [number, number, number] = [x, y, z];
        const end: [number, number, number] = [x, y, z];
        start[axis] -= size;
        end[axis] += size;
        start[(axis + 1) % 3] += a;
        end[(axis + 1) % 3] += a;
        start[(axis + 2) % 3] += b;
        end[(axis + 2) % 3] += b;
        line(points, start, end);
      }
    }
  }
}

function makeMark(): Model {
  const points: number[] = [];
  // Rasterize each wing once, avoiding overlapping triangle samples.
  for (let y = -1.05; y <= 1.2; y += 0.045) {
    const outer = (1.2 - y) / 2.25 * 1.15;
    const inner = y < -0.32 ? (-0.32 - y) / 0.73 * 0.72 : 0;
    for (let x = inner; x <= outer; x += 0.045) {
      for (const side of [-1, 1]) {
        for (const z of [-0.17, 0.17]) points.push(x * side, y, z, side < 0 ? 0.82 : 0.42);
      }
    }
    for (let z = -0.17; z <= 0.17; z += 0.045) {
      for (const side of [-1, 1]) {
        points.push(outer * side, y, z, 0.25, inner * side, y, z, 0.25);
      }
    }
  }
  return new Float32Array(points);
}

function makeSources(): Model[] {
  const models: number[][] = Array.from({ length: 5 }, () => []);
  // Git: two branches and three commit nodes.
  line(models[0], [-0.24, -0.4, 0], [-0.24, 0.4, 0], '|');
  line(models[0], [-0.24, -0.12, 0], [0.3, 0.22, 0], '/');
  for (const [x, y] of [[-0.24, -0.4], [-0.24, 0.4], [0.3, 0.22]]) cube(models[0], x, y, 0, 0.1);
  // CI/CD: three connected steps.
  for (let i = -1; i <= 1; i++) cube(models[1], i * 0.36, 0, 0, 0.12);
  line(models[1], [-0.36, 0, 0], [0.36, 0, 0], '-');
  // Docker: a stack of containers.
  cube(models[2], -0.19, -0.16, 0, 0.17);
  cube(models[2], 0.19, -0.16, 0, 0.17);
  cube(models[2], 0, 0.22, 0, 0.17);
  // Kubernetes: pods arranged around their cluster.
  for (let i = 0; i < 3; i++) {
    const angle = i * TAU / 3;
    const x = Math.cos(angle) * 0.35;
    const y = Math.sin(angle) * 0.35;
    cube(models[3], x, y, 0, 0.12);
    line(models[3], [0, 0, 0], [x, y, 0], '.');
  }
  // Application logs: layered lines moving into the ingestion stream.
  for (let i = 0; i < 4; i++) {
    const y = 0.3 - i * 0.2;
    line(models[4], [-0.35, y, 0], [0.35 - (i % 2) * 0.16, y, 0], '=');
    models[4].push(-0.48, y, 0, -62);
  }
  return models.map(points => new Float32Array(points));
}

const MARK = makeMark();
const SOURCES = makeSources();
const ANCHORS: readonly Point[] = [
  [-2.7, 1.4, 0], [0, 2.65, -0.7], [2.65, 1.25, 0.3],
  [2.35, -1.55, 0.8], [-2.45, -1.4, 0.6],
];
const CIRCLE = Float32Array.from({ length: 192 * 2 }, (_, index) =>
  index % 2 ? Math.sin(Math.floor(index / 2) / 192 * TAU) : Math.cos(index / 2 / 192 * TAU),
);

export function heroChapterAt(time: number) {
  return Math.floor(Math.max(0, time) / CHAPTER_SECONDS) % HERO_CHAPTERS.length;
}

/** An independent renderer owns reusable buffers; frame generation never shares mutable state. */
export function createHeroRenderer() {
  const stride = ASCII_COLUMNS + 1;
  const cells = new Uint16Array(stride * ASCII_ROWS - 1);
  const depth = new Float32Array(ASCII_COLUMNS * ASCII_ROWS);
  const positions = new Float32Array(15);
  let cameraCos = 1, cameraSin = 0, tiltCos = 1, tiltSin = 0;

  const plot = (x: number, y: number, z: number, glyph: number) => {
    const rx = x * cameraCos + z * cameraSin;
    const rz = z * cameraCos - x * cameraSin;
    const ry = y * tiltCos - rz * tiltSin;
    const dz = y * tiltSin + rz * tiltCos;
    const perspective = 7.8 / (7.8 - dz);
    const column = Math.round(ASCII_COLUMNS / 2 + rx * 12.1 * perspective);
    const row = Math.round(ASCII_ROWS / 2 - ry * 6.1 * perspective);
    if (column < 1 || column >= ASCII_COLUMNS - 1 || row < 1 || row >= ASCII_ROWS - 1) return;
    const index = row * ASCII_COLUMNS + column;
    if (dz < depth[index]) return;
    depth[index] = dz;
    cells[row * stride + column] = glyph;
  };

  const stamp = (model: Model, x: number, y: number, z: number, yaw: number, tilt: number, scan: number) => {
    // Object rotations are evaluated once per model, not once per vertex.
    const cy = Math.cos(yaw), sy = Math.sin(yaw), ct = Math.cos(tilt), st = Math.sin(tilt);
    for (let index = 0; index < model.length; index += 4) {
      const px = model[index], py = model[index + 1], pz = model[index + 2], shade = model[index + 3];
      const rx = px * cy + pz * sy;
      const rz = pz * cy - px * sy;
      const highlight = Math.max(0, 1 - Math.abs(py - scan) * 3) * 0.2;
      const glyph = shade < 0 ? -shade : SHADES[Math.min(7, Math.round((shade + highlight) * 7))];
      plot(x + rx, y + py * ct - rz * st, z + py * st + rz * ct, glyph);
    }
  };

  const render = (time: number, pointerX = 0, pointerY = 0) => {
    cells.fill(32);
    depth.fill(-Infinity);
    for (let row = 0; row < ASCII_ROWS - 1; row++) cells[row * stride + ASCII_COLUMNS] = 10;
    const camera = Math.sin(time * 0.15) * 0.1 + pointerX * 0.16;
    const tilt = 0.08 + pointerY * 0.1;
    cameraCos = Math.cos(camera); cameraSin = Math.sin(camera);
    tiltCos = Math.cos(tilt); tiltSin = Math.sin(tilt);
    const chapter = heroChapterAt(time);
    const local = time % CHAPTER_SECONDS;
    const blend = Math.min(1, local, CHAPTER_SECONDS - local);
    const stream = chapter === 1 ? blend : 0;
    const correlate = chapter === 2 ? blend : 0;

    // Project boundary: a tilted, gently breathing orbit enclosing the sources.
    const boundaryTilt = 0.48 + Math.sin(time * 0.18) * 0.08;
    const bc = Math.cos(boundaryTilt), bs = Math.sin(boundaryTilt);
    for (let i = 0; i < CIRCLE.length; i += 2) {
      const x = CIRCLE[i] * 3.48;
      const y = CIRCLE[i + 1] * 3.05;
      plot(x, y * bc, y * bs - 0.4, i % 12 ? 46 : 58);
    }

    for (let source = 0; source < 5; source++) {
      const anchor = ANCHORS[source];
      const x = anchor[0] + Math.sin(time * 0.4 + source) * 0.1;
      const y = anchor[1] + Math.cos(time * 0.5 + source * 2) * 0.12;
      const z = anchor[2] + Math.sin(time * 0.35 + source) * 0.14;
      positions[source * 3] = x; positions[source * 3 + 1] = y; positions[source * 3 + 2] = z;
      stamp(SOURCES[source], x, y, z, Math.sin(time * 0.6 + source) * 0.6, 0.15, -10);

      // Source-to-hub paths bend in depth. More packets appear in Stream.
      for (let step = 0; step <= 48; step++) {
        const t = step / 48;
        const bend = Math.sin(t * Math.PI);
        const scale = 1 - t * 0.88;
        const px = x * scale - y * bend * 0.16;
        const py = y * scale + x * bend * 0.09;
        const pz = z * scale + bend * 0.35;
        const packet = (t - time * 0.38 - source * 0.19) % 0.34;
        const distance = (packet + 0.34) % 0.34;
        const active = distance < 0.045 + stream * 0.025;
        if (active || step % 3 === 0) plot(px, py, pz, active ? (distance < 0.018 ? 42 : 43) : 46);
      }
    }

    // An ordered telemetry ribbon forms during the streaming chapter.
    if (stream > 0) {
      for (let i = 0; i < 128; i++) {
        const angle = i / 128 * TAU + time * 0.35;
        const x = Math.cos(angle) * (1.5 + stream * 0.35);
        const z = Math.sin(angle) * (1.5 + stream * 0.35);
        const wave = Math.sin(angle * 5 - time * 2) * 0.12 * stream;
        plot(x, -0.5 + z * 0.3 + wave, z, i % 4 ? 46 : 58);
      }
    }

    // Correlate follows Git -> Kubernetes -> application logs; it represents
    // related context, not deployment execution or automatic remediation.
    if (correlate > 0) {
      const route = [0, 3, 4];
      for (let link = 0; link < 2; link++) {
        const from = route[link] * 3, to = route[link + 1] * 3;
        for (let step = 0; step <= 72; step++) {
          const t = step / 72;
          const bend = Math.sin(t * Math.PI);
          const progress = (local / CHAPTER_SECONDS * 2.8 - link - t + 3) % 3;
          const active = progress < 0.14;
          if (step % 3 && !active) continue;
          plot(
            positions[from] + (positions[to] - positions[from]) * t,
            positions[from + 1] + (positions[to + 1] - positions[from + 1]) * t + bend * 0.4,
            positions[from + 2] + (positions[to + 2] - positions[from + 2]) * t + bend * 0.8,
            active ? 43 : 46,
          );
        }
      }
      const focus = route[Math.min(2, Math.floor(local / CHAPTER_SECONDS * 3))] * 3;
      const radius = 0.6 + Math.sin(local * 2) * 0.06;
      for (let i = 0; i < CIRCLE.length; i += 8) {
        plot(positions[focus] + CIRCLE[i] * radius, positions[focus + 1] + CIRCLE[i + 1] * radius,
          positions[focus + 2] + 0.12, 46);
      }
    }

    stamp(MARK, 0, Math.sin(time * 0.8) * 0.08, 0.1,
      Math.sin(time * 0.45) * 0.5, Math.sin(time * 0.3) * 0.1,
      1.4 - (time * 0.55 % 2.8));
    return String.fromCharCode(...cells);
  };
  return { render };
}
