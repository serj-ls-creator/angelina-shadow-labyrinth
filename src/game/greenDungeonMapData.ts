import { TileType as T } from './types';

export const GREEN_WIDTH = 120;
export const GREEN_HEIGHT = 90;

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateGreenMaze(): number[][] {
  const map: number[][] = [];
  for (let y = 0; y < GREEN_HEIGHT; y++) {
    map.push(new Array(GREEN_WIDTH).fill(T.DUNGEON_WALL));
  }

  const rand = seededRandom(31415);
  const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];

  const cellW = Math.floor((GREEN_WIDTH - 1) / 2);
  const cellH = Math.floor((GREEN_HEIGHT - 1) / 2);
  const visited = new Uint8Array(cellW * cellH);

  const carve = (cx: number, cy: number) => { map[cy * 2 + 1][cx * 2 + 1] = T.DUNGEON_FLOOR; };
  const carvePassage = (cx1: number, cy1: number, cx2: number, cy2: number) => {
    map[cy1 * 2 + 1 + (cy2 - cy1)][cx1 * 2 + 1 + (cx2 - cx1)] = T.DUNGEON_FLOOR;
  };

  const stack: [number, number][] = [];
  visited[0] = 1;
  carve(0, 0);
  stack.push([0, 0]);

  while (stack.length > 0) {
    const [cx, cy] = stack[stack.length - 1];
    const neighbors: [number, number][] = [];
    for (const [dx, dy] of dirs) {
      const nx = cx + dx, ny = cy + dy;
      if (nx >= 0 && nx < cellW && ny >= 0 && ny < cellH && !visited[ny * cellW + nx]) {
        neighbors.push([nx, ny]);
      }
    }
    if (neighbors.length === 0) { stack.pop(); continue; }
    const [nx, ny] = neighbors[Math.floor(rand() * neighbors.length)];
    visited[ny * cellW + nx] = 1;
    carvePassage(cx, cy, nx, ny);
    carve(nx, ny);
    stack.push([nx, ny]);
  }

  // Open rooms
  const rooms: { x: number; y: number; w: number; h: number }[] = [];
  for (let i = 0; i < 18; i++) {
    const w = Math.floor(rand() * 5) + 4;
    const h = Math.floor(rand() * 5) + 4;
    const rx = Math.floor(rand() * (GREEN_WIDTH - w - 4)) + 2;
    const ry = Math.floor(rand() * (GREEN_HEIGHT - h - 4)) + 2;
    let overlaps = false;
    for (const r of rooms) {
      if (rx < r.x + r.w + 2 && rx + w + 2 > r.x && ry < r.y + r.h + 2 && ry + h + 2 > r.y) {
        overlaps = true; break;
      }
    }
    if (overlaps) continue;
    rooms.push({ x: rx, y: ry, w, h });
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        map[ry + dy][rx + dx] = T.DUNGEON_FLOOR;
      }
    }
  }

  // Decorate walls (mossy buildings) — only on walls that have NO adjacent floor
  // so they never block corridors. They're purely visual on solid wall blocks.
  for (let y = 1; y < GREEN_HEIGHT - 1; y++) {
    for (let x = 1; x < GREEN_WIDTH - 1; x++) {
      if (map[y][x] !== T.DUNGEON_WALL) continue;
      let adjFloor = 0;
      for (const [dx, dy] of dirs) {
        const t = map[y + dy]?.[x + dx];
        if (t === T.DUNGEON_FLOOR || t === T.DUNGEON_MOSS) adjFloor++;
      }
      // Only decorate fully-enclosed walls (interior wall blocks), never corridor borders
      if (adjFloor === 0 && rand() > 0.85) {
        const roll = rand();
        if (roll < 0.4) map[y][x] = T.BLUE_BUILDING_GREEN;
        else if (roll < 0.7) map[y][x] = T.DUNGEON_BUILDING_BROWN;
        else map[y][x] = T.BLUE_BUILDING_YELLOW;
      }
    }
  }

  // Floor decorations — lots of moss
  for (let y = 1; y < GREEN_HEIGHT - 1; y++) {
    for (let x = 1; x < GREEN_WIDTH - 1; x++) {
      if (map[y][x] !== T.DUNGEON_FLOOR) continue;
      const r = rand();
      if (r > 0.92) map[y][x] = T.DUNGEON_MOSS;
      else if (r > 0.915) map[y][x] = T.DUNGEON_BONES;
      // Note: CRYSTAL removed from random floor decoration to keep corridors passable
    }
  }

  // Water pools — only in large rooms, with a guaranteed walkable border around them
  for (const room of rooms) {
    if (rand() > 0.5 && room.w >= 6 && room.h >= 6) {
      const pw = Math.min(room.w - 4, Math.floor(rand() * 2) + 2);
      const ph = Math.min(room.h - 4, Math.floor(rand() * 2) + 2);
      const px = room.x + Math.floor((room.w - pw) / 2);
      const py = room.y + Math.floor((room.h - ph) / 2);
      for (let dy = 0; dy < ph; dy++) {
        for (let dx = 0; dx < pw; dx++) {
          map[py + dy][px + dx] = T.WATER;
        }
      }
    }
  }

  // Add extra random passages to create loops and shortcuts (makes maze more open)
  const extraPassages = 80;
  for (let i = 0; i < extraPassages; i++) {
    const x = 2 + Math.floor(rand() * (GREEN_WIDTH - 4));
    const y = 2 + Math.floor(rand() * (GREEN_HEIGHT - 4));
    if (map[y][x] === T.DUNGEON_WALL) {
      // Only break wall if it separates two floor areas (creates a passage, not a hole into nothing)
      const horiz = (map[y][x - 1] === T.DUNGEON_FLOOR && map[y][x + 1] === T.DUNGEON_FLOOR);
      const vert = (map[y - 1][x] === T.DUNGEON_FLOOR && map[y + 1][x] === T.DUNGEON_FLOOR);
      if (horiz || vert) map[y][x] = T.DUNGEON_FLOOR;
    }
  }

  // Portal in top-left
  map[1][1] = T.PORTAL;
  map[1][2] = T.DUNGEON_FLOOR;
  map[2][1] = T.DUNGEON_FLOOR;

  // CONNECTIVITY PASS: ensure every floor tile is reachable from spawn (2,1).
  // For each disconnected floor region, carve a straight tunnel to the nearest reachable tile.
  const isFloorTile = (t: number) =>
    t === T.DUNGEON_FLOOR || t === T.DUNGEON_MOSS || t === T.DUNGEON_BONES || t === T.PORTAL;

  const floodFrom = (sx: number, sy: number): boolean[][] => {
    const visited: boolean[][] = Array.from({ length: GREEN_HEIGHT }, () => new Array(GREEN_WIDTH).fill(false));
    if (!isFloorTile(map[sy]?.[sx])) return visited;
    const q: [number, number][] = [[sx, sy]];
    visited[sy][sx] = true;
    while (q.length) {
      const [x, y] = q.shift()!;
      for (const [dx, dy] of dirs) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= GREEN_WIDTH || ny < 0 || ny >= GREEN_HEIGHT) continue;
        if (visited[ny][nx]) continue;
        if (!isFloorTile(map[ny][nx])) continue;
        visited[ny][nx] = true;
        q.push([nx, ny]);
      }
    }
    return visited;
  };

  for (let pass = 0; pass < 30; pass++) {
    const reach = floodFrom(2, 1);
    // Find an unreachable floor tile
    let target: [number, number] | null = null;
    for (let y = 1; y < GREEN_HEIGHT - 1 && !target; y++) {
      for (let x = 1; x < GREEN_WIDTH - 1; x++) {
        if (isFloorTile(map[y][x]) && !reach[y][x]) { target = [x, y]; break; }
      }
    }
    if (!target) break;

    // Find nearest reachable tile (Manhattan)
    let nearest: [number, number] | null = null;
    let bestDist = Infinity;
    for (let y = 1; y < GREEN_HEIGHT - 1; y++) {
      for (let x = 1; x < GREEN_WIDTH - 1; x++) {
        if (!reach[y][x]) continue;
        const d = Math.abs(x - target[0]) + Math.abs(y - target[1]);
        if (d < bestDist) { bestDist = d; nearest = [x, y]; }
      }
    }
    if (!nearest) break;

    // Carve an L-shaped tunnel from nearest to target
    let [cx, cy] = nearest;
    const [tx, ty] = target;
    while (cx !== tx) {
      cx += cx < tx ? 1 : -1;
      if (map[cy][cx] === T.DUNGEON_WALL || !isFloorTile(map[cy][cx])) map[cy][cx] = T.DUNGEON_FLOOR;
    }
    while (cy !== ty) {
      cy += cy < ty ? 1 : -1;
      if (map[cy][cx] === T.DUNGEON_WALL || !isFloorTile(map[cy][cx])) map[cy][cx] = T.DUNGEON_FLOOR;
    }
  }

  // COLORED CUBES PASS — replace ~25% of plain wall tiles with vibrant colored cubes.
  // Walls remain non-walkable; only their visual tile id changes, so layout is preserved.
  const cubeTypes = [
    T.GREEN_CUBE_PINK, T.GREEN_CUBE_CYAN, T.GREEN_CUBE_YELLOW,
    T.GREEN_CUBE_RED, T.GREEN_CUBE_BLUE, T.GREEN_CUBE_ORANGE,
  ];
  const cubeRand = seededRandom(424242);
  for (let y = 1; y < GREEN_HEIGHT - 1; y++) {
    for (let x = 1; x < GREEN_WIDTH - 1; x++) {
      if (map[y][x] !== T.DUNGEON_WALL) continue;
      if (cubeRand() < 0.25) {
        map[y][x] = cubeTypes[Math.floor(cubeRand() * cubeTypes.length)];
      }
    }
  }

  return map;
}

export const greenDungeonTiles = generateGreenMaze();

export function getGreenPortalPos(): { x: number; y: number } {
  for (let y = 0; y < GREEN_HEIGHT; y++) {
    for (let x = 0; x < GREEN_WIDTH; x++) {
      if (greenDungeonTiles[y][x] === T.PORTAL) return { x, y };
    }
  }
  return { x: 1, y: 1 };
}

export function getGreenSpawnPos(): { x: number; y: number } {
  const portal = getGreenPortalPos();
  const checkDirs = [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }];
  for (const d of checkDirs) {
    const nx = portal.x + d.x, ny = portal.y + d.y;
    if (isGreenWalkable(greenDungeonTiles[ny]?.[nx])) return { x: nx, y: ny };
  }
  return { x: 2, y: 1 };
}

export function isGreenWalkable(tile: number): boolean {
  return tile === T.DUNGEON_FLOOR || tile === T.DUNGEON_DOOR || tile === T.PORTAL ||
         tile === T.DUNGEON_MOSS || tile === T.DUNGEON_BONES;
}

export function getGreenTileColor(tile: number): string {
  switch (tile) {
    case T.DUNGEON_FLOOR: return '#1f3a1f';
    case T.DUNGEON_WALL: return '#0a1f0a';
    case T.DUNGEON_DOOR: return '#3d5c2e';
    case T.PORTAL: return '#9b59b6';
    case T.LAVA: return '#e74c3c';
    case T.CRYSTAL: return '#7CFC00';
    case T.DUNGEON_MOSS: return '#2d5a2d';
    case T.DUNGEON_BONES: return '#7a8a6a';
    case T.WATER: return '#1a5c4a';
    case T.BLUE_BUILDING_GREEN: return '#2d8a3a';
    case T.BLUE_BUILDING_YELLOW: return '#a8c93a';
    case T.DUNGEON_BUILDING_BROWN: return '#3e4a26';
    // Colored cubes — vibrant neon palette
    case T.GREEN_CUBE_PINK: return '#ff3ea5';
    case T.GREEN_CUBE_CYAN: return '#22d3ee';
    case T.GREEN_CUBE_YELLOW: return '#facc15';
    case T.GREEN_CUBE_RED: return '#ef4444';
    case T.GREEN_CUBE_BLUE: return '#3b82f6';
    case T.GREEN_CUBE_ORANGE: return '#fb923c';
    default: return '#0a1f0a';
  }
}

export function getGreenBuildingHeight(tile: number): number {
  switch (tile) {
    case T.DUNGEON_WALL: return 20;
    case T.CRYSTAL: return 15;
    case T.BLUE_BUILDING_GREEN: return 28;
    case T.BLUE_BUILDING_YELLOW: return 24;
    case T.DUNGEON_BUILDING_BROWN: return 22;
    case T.GREEN_CUBE_PINK:
    case T.GREEN_CUBE_CYAN:
    case T.GREEN_CUBE_YELLOW:
    case T.GREEN_CUBE_RED:
    case T.GREEN_CUBE_BLUE:
    case T.GREEN_CUBE_ORANGE:
      return 22;
    default: return 0;
  }
}

// Items dropped on the floor in green dungeon
export interface FloorItem {
  id: string;
  itemId: string;
  pos: { x: number; y: number };
  collected: boolean;
}

// BFS from spawn — returns set of reachable tile keys "x,y"
function computeReachable(): Set<string> {
  const reachable = new Set<string>();
  const spawn = getGreenSpawnPos();
  const queue: { x: number; y: number }[] = [spawn];
  reachable.add(`${spawn.x},${spawn.y}`);
  const dirs4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (queue.length > 0) {
    const { x, y } = queue.shift()!;
    for (const [dx, dy] of dirs4) {
      const nx = x + dx, ny = y + dy;
      const key = `${nx},${ny}`;
      if (reachable.has(key)) continue;
      if (nx < 0 || nx >= GREEN_WIDTH || ny < 0 || ny >= GREEN_HEIGHT) continue;
      if (!isGreenWalkable(greenDungeonTiles[ny][nx])) continue;
      reachable.add(key);
      queue.push({ x: nx, y: ny });
    }
  }
  return reachable;
}

export function generateGreenFloorItems(): FloorItem[] {
  const reachable = computeReachable();

  // Only consider floor tiles that are actually reachable from spawn
  const candidates: { x: number; y: number }[] = [];
  for (let y = 4; y < GREEN_HEIGHT - 2; y++) {
    for (let x = 4; x < GREEN_WIDTH - 2; x++) {
      if (greenDungeonTiles[y][x] === T.DUNGEON_FLOOR && reachable.has(`${x},${y}`)) {
        candidates.push({ x, y });
      }
    }
  }
  const rand = seededRandom(8675309);
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  const pool = [
    'tea', 'donut', 'apple',
    'bathbomb', 'megaphone', 'flash',
    'watershoes', 'compass', 'glitter', 'bearhat',
  ];

  const items: FloorItem[] = [];
  const count = Math.min(8, pool.length);
  if (candidates.length === 0) return items;
  const spacing = Math.max(1, Math.floor(candidates.length / count));
  for (let i = 0; i < count && i * spacing < candidates.length; i++) {
    items.push({
      id: `gitem_${i}`,
      itemId: pool[i % pool.length],
      pos: candidates[i * spacing],
      collected: false,
    });
  }
  return items;
}

