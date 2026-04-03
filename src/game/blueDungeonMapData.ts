import { TileType as T } from './types';

export const BLUE_WIDTH = 120;
export const BLUE_HEIGHT = 90;

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateSpiralMaze(): number[][] {
  const map: number[][] = [];
  for (let y = 0; y < BLUE_HEIGHT; y++) {
    map.push(new Array(BLUE_WIDTH).fill(T.DUNGEON_WALL));
  }

  const rand = seededRandom(98765);
  const cx = Math.floor(BLUE_WIDTH / 2);
  const cy = Math.floor(BLUE_HEIGHT / 2);

  // Use recursive backtracker maze on a grid of cells spaced 2 apart
  // This ensures walls between every corridor
  const cellW = Math.floor((BLUE_WIDTH - 2) / 2);
  const cellH = Math.floor((BLUE_HEIGHT - 2) / 2);
  const visited = new Uint8Array(cellW * cellH);
  
  const cellToMap = (cx2: number, cy2: number): [number, number] => [cx2 * 2 + 1, cy2 * 2 + 1];
  const carve = (mx: number, my: number) => {
    if (mx >= 1 && mx < BLUE_WIDTH - 1 && my >= 1 && my < BLUE_HEIGHT - 1) {
      map[my][mx] = T.DUNGEON_FLOOR;
    }
  };

  // Iterative backtracker to avoid stack overflow
  const stack: [number, number][] = [];
  const startCx = 0, startCy = cellH - 1; // bottom-left
  visited[startCy * cellW + startCx] = 1;
  const [smx, smy] = cellToMap(startCx, startCy);
  carve(smx, smy);
  stack.push([startCx, startCy]);

  const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];

  while (stack.length > 0) {
    const [curX, curY] = stack[stack.length - 1];
    // Find unvisited neighbors
    const neighbors: number[] = [];
    for (let d = 0; d < 4; d++) {
      const nx = curX + dirs[d][0];
      const ny = curY + dirs[d][1];
      if (nx >= 0 && nx < cellW && ny >= 0 && ny < cellH && !visited[ny * cellW + nx]) {
        neighbors.push(d);
      }
    }

    if (neighbors.length === 0) {
      stack.pop();
      continue;
    }

    // Pick random neighbor
    const d = neighbors[Math.floor(rand() * neighbors.length)];
    const nx = curX + dirs[d][0];
    const ny = curY + dirs[d][1];
    visited[ny * cellW + nx] = 1;

    // Carve the cell and the wall between
    const [mx, my] = cellToMap(curX, curY);
    const [nmx, nmy] = cellToMap(nx, ny);
    // Carve wall between
    carve(mx + dirs[d][0], my + dirs[d][1]);
    // Carve destination cell
    carve(nmx, nmy);

    stack.push([nx, ny]);
  }

  // Ensure center room is carved and connected
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      if (cy + dy >= 1 && cy + dy < BLUE_HEIGHT - 1 && cx + dx >= 1 && cx + dx < BLUE_WIDTH - 1) {
        map[cy + dy][cx + dx] = T.DUNGEON_FLOOR;
      }
    }
  }

  // Carve a guaranteed path from bottom-left to center using spiral
  const spiralPath: [number, number][] = [];
  let sl = 2, sr = BLUE_WIDTH - 3, st = 2, sb = BLUE_HEIGHT - 3;
  let sx = sl, sy = sb;
  let sdir = 0;

  while (sl < sr && st < sb) {
    if (sdir === 0) { for (; sx <= sr; sx++) spiralPath.push([sx, sy]); sx--; sy--; sb -= 5; sdir = 1; }
    else if (sdir === 1) { for (; sy >= st; sy--) spiralPath.push([sx, sy]); sy++; sx--; sr -= 5; sdir = 2; }
    else if (sdir === 2) { for (; sx >= sl; sx--) spiralPath.push([sx, sy]); sx++; sy++; st += 5; sdir = 3; }
    else { for (; sy <= sb; sy++) spiralPath.push([sx, sy]); sy--; sx++; sl += 5; sdir = 0; }
    if (Math.abs(sx - cx) < 5 && Math.abs(sy - cy) < 5) break;
  }
  // Connect to center
  const lastPt = spiralPath[spiralPath.length - 1] || [sx, sy];
  let fpx = lastPt[0], fpy = lastPt[1];
  while (fpx !== cx) { fpx += fpx < cx ? 1 : -1; spiralPath.push([fpx, fpy]); }
  while (fpy !== cy) { fpy += fpy < cy ? 1 : -1; spiralPath.push([fpx, fpy]); }
  for (const [px, py] of spiralPath) carve(px, py);

  // Place bow in center
  map[cy][cx] = T.BOW_ITEM;

  // Buildings as part of walls (adjacent to floor)
  const buildingTypes = [T.BLUE_BUILDING_YELLOW, T.BLUE_BUILDING_ORANGE, T.BLUE_BUILDING_GREEN, T.BLUE_BUILDING_PURPLE];
  for (let y = 1; y < BLUE_HEIGHT - 1; y++) {
    for (let x = 1; x < BLUE_WIDTH - 1; x++) {
      if (map[y][x] !== T.DUNGEON_WALL) continue;
      let adjFloor = 0, adjWall = 0;
      for (const [dx, dy] of dirs) {
        const t = map[y + dy]?.[x + dx];
        if (t === T.DUNGEON_FLOOR || t === T.DUNGEON_MOSS || t === T.DUNGEON_BONES || t === T.BOW_ITEM) adjFloor++;
        if (t === T.DUNGEON_WALL) adjWall++;
      }
      if (adjFloor >= 1 && adjFloor <= 2 && adjWall >= 2 && rand() > 0.8) {
        map[y][x] = buildingTypes[Math.floor(rand() * buildingTypes.length)];
      }
    }
  }

  // Floor decorations
  for (let y = 1; y < BLUE_HEIGHT - 1; y++) {
    for (let x = 1; x < BLUE_WIDTH - 1; x++) {
      if (map[y][x] !== T.DUNGEON_FLOOR) continue;
      const r = rand();
      if (r > 0.97) map[y][x] = T.DUNGEON_MOSS;
      else if (r > 0.96) map[y][x] = T.DUNGEON_BONES;
      else if (r > 0.955) map[y][x] = T.CRYSTAL;
    }
  }

  // Water pools scattered
  for (let i = 0; i < 15; i++) {
    const wx = Math.floor(rand() * (BLUE_WIDTH - 10)) + 5;
    const wy = Math.floor(rand() * (BLUE_HEIGHT - 10)) + 5;
    const pw = Math.floor(rand() * 4) + 2;
    const ph = Math.floor(rand() * 4) + 2;
    for (let dy = 0; dy < ph; dy++) {
      for (let dx = 0; dx < pw; dx++) {
        const tx = wx + dx, ty = wy + dy;
        if (tx < BLUE_WIDTH - 1 && ty < BLUE_HEIGHT - 1 && map[ty][tx] === T.DUNGEON_FLOOR) {
          map[ty][tx] = T.WATER;
        }
      }
    }
  }

  // Water streams
  for (let i = 0; i < 10; i++) {
    let sx = Math.floor(rand() * (BLUE_WIDTH - 10)) + 5;
    let sy = Math.floor(rand() * (BLUE_HEIGHT - 10)) + 5;
    for (let step = 0; step < 15; step++) {
      if (sx > 0 && sx < BLUE_WIDTH - 1 && sy > 0 && sy < BLUE_HEIGHT - 1) {
        if (map[sy][sx] === T.DUNGEON_FLOOR) map[sy][sx] = T.WATER;
      }
      const d = dirs[Math.floor(rand() * 4)];
      sx += d[0]; sy += d[1];
    }
  }

  // Portal in bottom-left corner area
  map[BLUE_HEIGHT - 2][1] = T.PORTAL;
  map[BLUE_HEIGHT - 2][2] = T.DUNGEON_FLOOR;
  map[BLUE_HEIGHT - 3][1] = T.DUNGEON_FLOOR;

  return map;
}

export const blueDungeonTiles = generateSpiralMaze();

export function getBluePortalPos(): { x: number; y: number } {
  for (let y = 0; y < BLUE_HEIGHT; y++) {
    for (let x = 0; x < BLUE_WIDTH; x++) {
      if (blueDungeonTiles[y][x] === T.PORTAL) return { x, y };
    }
  }
  return { x: 1, y: BLUE_HEIGHT - 2 };
}

export function getBlueSpawnPos(): { x: number; y: number } {
  const portal = getBluePortalPos();
  const checkDirs = [{ x: 1, y: 0 }, { x: 0, y: -1 }, { x: -1, y: 0 }, { x: 0, y: 1 }];
  for (const d of checkDirs) {
    const nx = portal.x + d.x, ny = portal.y + d.y;
    if (isBlueWalkable(blueDungeonTiles[ny]?.[nx])) return { x: nx, y: ny };
  }
  return { x: 2, y: BLUE_HEIGHT - 2 };
}

export function isBlueWalkable(tile: number): boolean {
  return tile === T.DUNGEON_FLOOR || tile === T.DUNGEON_DOOR || tile === T.PORTAL ||
         tile === T.DUNGEON_MOSS || tile === T.DUNGEON_BONES || tile === T.BOW_ITEM;
}

export function getBlueTileColor(tile: number): string {
  switch (tile) {
    case T.DUNGEON_FLOOR: return '#1a2a4a';
    case T.DUNGEON_WALL: return '#0a1530';
    case T.DUNGEON_DOOR: return '#3a3050';
    case T.PORTAL: return '#9b59b6';
    case T.LAVA: return '#e74c3c';
    case T.CRYSTAL: return '#00bcd4';
    case T.DUNGEON_MOSS: return '#1a3a2a';
    case T.DUNGEON_BONES: return '#6a6a7a';
    case T.WATER: return '#0a2a5a';
    case T.BOW_ITEM: return '#ffb6c1';
    case T.BLUE_BUILDING_YELLOW: return '#c9b01a';
    case T.BLUE_BUILDING_ORANGE: return '#bf5a0c';
    case T.BLUE_BUILDING_GREEN: return '#1a6a2e';
    case T.BLUE_BUILDING_PURPLE: return '#5a1b8a';
    default: return '#0a1530';
  }
}

export function getBlueBuildingHeight(tile: number): number {
  switch (tile) {
    case T.DUNGEON_WALL: return 20;
    case T.CRYSTAL: return 15;
    case T.BLUE_BUILDING_YELLOW: return 28;
    case T.BLUE_BUILDING_ORANGE: return 25;
    case T.BLUE_BUILDING_GREEN: return 22;
    case T.BLUE_BUILDING_PURPLE: return 30;
    default: return 0;
  }
}

export function getBlueBowPos(): { x: number; y: number } {
  return { x: Math.floor(BLUE_WIDTH / 2), y: Math.floor(BLUE_HEIGHT / 2) };
}
