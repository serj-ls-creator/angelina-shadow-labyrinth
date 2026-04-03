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

  // Carve a path of width 1 (plus neighbors for width ~3)
  const carvePath = (path: [number, number][]) => {
    for (const [px, py] of path) {
      if (px >= 1 && px < BLUE_WIDTH - 1 && py >= 1 && py < BLUE_HEIGHT - 1) {
        map[py][px] = T.DUNGEON_FLOOR;
      }
    }
  };

  const carveWide = (x: number, y: number, w: number = 1) => {
    for (let dy = -w; dy <= w; dy++) {
      for (let dx = -w; dx <= w; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 1 && nx < BLUE_WIDTH - 1 && ny >= 1 && ny < BLUE_HEIGHT - 1) {
          map[ny][nx] = T.DUNGEON_FLOOR;
        }
      }
    }
  };

  // Generate spiral path from bottom-left to center
  // Tighter spiral with spacing of 3 instead of 4
  const spiralPath: [number, number][] = [];
  let left = 2, right = BLUE_WIDTH - 3, top = 2, bottom = BLUE_HEIGHT - 3;
  let x = left, y = bottom; // start bottom-left
  let dir = 0; // 0=right, 1=up, 2=left, 3=down

  while (left < right && top < bottom) {
    if (dir === 0) { // right
      for (; x <= right; x++) spiralPath.push([x, y]);
      x--; y--;
      bottom -= 3;
      dir = 1;
    } else if (dir === 1) { // up
      for (; y >= top; y--) spiralPath.push([x, y]);
      y++; x--;
      right -= 3;
      dir = 2;
    } else if (dir === 2) { // left
      for (; x >= left; x--) spiralPath.push([x, y]);
      x++; y++;
      top += 3;
      dir = 3;
    } else { // down
      for (; y <= bottom; y++) spiralPath.push([x, y]);
      y--; x++;
      left += 3;
      dir = 0;
    }

    // Check if we reached near center
    if (Math.abs(x - cx) < 4 && Math.abs(y - cy) < 4) break;
  }

  // Connect last spiral point to center
  const lastPt = spiralPath[spiralPath.length - 1] || [x, y];
  let fx = lastPt[0], fy = lastPt[1];
  while (fx !== cx) {
    fx += fx < cx ? 1 : -1;
    spiralPath.push([fx, fy]);
  }
  while (fy !== cy) {
    fy += fy < cy ? 1 : -1;
    spiralPath.push([fx, fy]);
  }

  // Carve the spiral path with width 1 (narrow corridors)
  for (const [px, py] of spiralPath) {
    carveWide(px, py, 0);
  }

  // Add many long dead-end branches from the spiral path
  const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  for (let i = 0; i < spiralPath.length; i += 4) {
    if (rand() > 0.5) continue;
    const [bx, by] = spiralPath[i];
    const d = dirs[Math.floor(rand() * 4)];
    let bLen = Math.floor(rand() * 30) + 12;
    let nx = bx, ny = by;
    const branch: [number, number][] = [];

    for (let step = 0; step < bLen; step++) {
      nx += d[0];
      ny += d[1];
      if (nx < 2 || nx >= BLUE_WIDTH - 2 || ny < 2 || ny >= BLUE_HEIGHT - 2) break;
      branch.push([nx, ny]);

      // Occasional perpendicular sub-branch (more frequent)
      if (rand() > 0.75 && step > 2) {
        const pd = d[0] === 0 ? [1, 0] : [0, 1];
        const sign = rand() > 0.5 ? 1 : -1;
        let sx = nx, sy = ny;
        const subLen = Math.floor(rand() * 15) + 6;
        for (let ss = 0; ss < subLen; ss++) {
          sx += pd[0] * sign;
          sy += pd[1] * sign;
          if (sx < 2 || sx >= BLUE_WIDTH - 2 || sy < 2 || sy >= BLUE_HEIGHT - 2) break;
          branch.push([sx, sy]);
          
          // Third-level sub-branches
          if (rand() > 0.85 && ss > 3) {
            let tx = sx, ty = sy;
            const thirdLen = Math.floor(rand() * 8) + 3;
            for (let tt = 0; tt < thirdLen; tt++) {
              tx += d[0];
              ty += d[1];
              if (tx < 2 || tx >= BLUE_WIDTH - 2 || ty < 2 || ty >= BLUE_HEIGHT - 2) break;
              branch.push([tx, ty]);
            }
          }
        }
      }
    }

    for (const [bpx, bpy] of branch) {
      carveWide(bpx, bpy, 0);
    }
  }

  // Create center room for bow
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      if (cy + dy >= 1 && cy + dy < BLUE_HEIGHT - 1 && cx + dx >= 1 && cx + dx < BLUE_WIDTH - 1) {
        map[cy + dy][cx + dx] = T.DUNGEON_FLOOR;
      }
    }
  }

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
