import { TileType as T } from './types';

export const DUNGEON_WIDTH = 120;
export const DUNGEON_HEIGHT = 90;

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateMaze(): number[][] {
  const map: number[][] = [];
  for (let y = 0; y < DUNGEON_HEIGHT; y++) {
    map.push(new Array(DUNGEON_WIDTH).fill(T.DUNGEON_WALL));
  }

  const rand = seededRandom(42069);
  const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];

  // Maze cells: odd coordinates are cells, even are walls
  const cellW = Math.floor((DUNGEON_WIDTH - 1) / 2);
  const cellH = Math.floor((DUNGEON_HEIGHT - 1) / 2);
  const visited = new Uint8Array(cellW * cellH);

  const carve = (cx: number, cy: number) => {
    map[cy * 2 + 1][cx * 2 + 1] = T.DUNGEON_FLOOR;
  };

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

  // Widen some corridors
  for (let y = 1; y < DUNGEON_HEIGHT - 1; y++) {
    for (let x = 1; x < DUNGEON_WIDTH - 1; x++) {
      if (map[y][x] === T.DUNGEON_FLOOR && rand() > 0.7) {
        const d = dirs[Math.floor(rand() * 4)];
        const nx = x + d[0], ny = y + d[1];
        if (ny > 0 && ny < DUNGEON_HEIGHT - 1 && nx > 0 && nx < DUNGEON_WIDTH - 1) {
          if (map[ny][nx] === T.DUNGEON_WALL) {
            let fc = 0;
            for (const [ddx, ddy] of dirs) {
              if (map[ny + ddy]?.[nx + ddx] === T.DUNGEON_FLOOR) fc++;
            }
            if (fc <= 2) map[ny][nx] = T.DUNGEON_FLOOR;
          }
        }
      }
    }
  }

  // Create open rooms
  const rooms: { x: number; y: number; w: number; h: number }[] = [];
  for (let i = 0; i < 20; i++) {
    const w = Math.floor(rand() * 5) + 4;
    const h = Math.floor(rand() * 5) + 4;
    const rx = Math.floor(rand() * (DUNGEON_WIDTH - w - 4)) + 2;
    const ry = Math.floor(rand() * (DUNGEON_HEIGHT - h - 4)) + 2;
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

  // Buildings: replace WALL tiles that are adjacent to floor (part of walls, not blocking passages)
  for (let y = 1; y < DUNGEON_HEIGHT - 1; y++) {
    for (let x = 1; x < DUNGEON_WIDTH - 1; x++) {
      if (map[y][x] !== T.DUNGEON_WALL) continue;
      // Check if this wall is adjacent to at least one floor tile
      let adjFloor = 0;
      let adjWall = 0;
      for (const [dx, dy] of dirs) {
        const t = map[y + dy]?.[x + dx];
        if (t === T.DUNGEON_FLOOR || t === T.DUNGEON_MOSS || t === T.DUNGEON_BONES) adjFloor++;
        if (t === T.DUNGEON_WALL) adjWall++;
      }
      // Only decorate walls that face corridors/rooms but won't block passage
      if (adjFloor >= 1 && adjFloor <= 2 && adjWall >= 2 && rand() > 0.85) {
        const roll = rand();
        if (roll < 0.33) map[y][x] = T.DUNGEON_BUILDING_PURPLE;
        else if (roll < 0.66) map[y][x] = T.DUNGEON_BUILDING_BROWN;
        else map[y][x] = T.DUNGEON_BUILDING_ORANGE;
      }
    }
  }

  // Floor decorations (only on floor tiles, never blocking)
  for (let y = 1; y < DUNGEON_HEIGHT - 1; y++) {
    for (let x = 1; x < DUNGEON_WIDTH - 1; x++) {
      if (map[y][x] !== T.DUNGEON_FLOOR) continue;
      const r = rand();
      if (r > 0.97) map[y][x] = T.DUNGEON_MOSS;
      else if (r > 0.96) map[y][x] = T.DUNGEON_BONES;
      else if (r > 0.955) map[y][x] = T.CRYSTAL;
    }
  }

  // Water pools in some rooms
  for (const room of rooms) {
    if (rand() > 0.4 && room.w >= 5 && room.h >= 5) {
      const poolW = Math.floor(rand() * 3) + 2;
      const poolH = Math.floor(rand() * 3) + 2;
      const px = room.x + Math.floor((room.w - poolW) / 2);
      const py = room.y + Math.floor((room.h - poolH) / 2);
      for (let dy = 0; dy < poolH; dy++) {
        for (let dx = 0; dx < poolW; dx++) {
          map[py + dy][px + dx] = T.WATER;
        }
      }
    }
  }

  // Lava pools in some rooms
  for (const room of rooms) {
    if (rand() > 0.6 && room.w >= 5 && room.h >= 5) {
      const lx = room.x + Math.floor(room.w / 2) - 1;
      const ly = room.y + Math.floor(room.h / 2) - 1;
      // Don't place lava if water already there
      if (map[ly][lx] !== T.WATER) {
        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            if (rand() > 0.3 && map[ly + dy][lx + dx] === T.DUNGEON_FLOOR) {
              map[ly + dy][lx + dx] = T.LAVA;
            }
          }
        }
      }
    }
  }

  // Also add some water streams in corridors
  for (let i = 0; i < 8; i++) {
    const sx = Math.floor(rand() * (DUNGEON_WIDTH - 10)) + 5;
    const sy = Math.floor(rand() * (DUNGEON_HEIGHT - 10)) + 5;
    let cx = sx, cy = sy;
    for (let step = 0; step < 12; step++) {
      if (cx > 0 && cx < DUNGEON_WIDTH - 1 && cy > 0 && cy < DUNGEON_HEIGHT - 1) {
        if (map[cy][cx] === T.DUNGEON_FLOOR) {
          map[cy][cx] = T.WATER;
        }
      }
      // Random walk
      const d = dirs[Math.floor(rand() * 4)];
      cx += d[0];
      cy += d[1];
    }
  }

  // Portal in top-left area
  map[1][1] = T.PORTAL;
  // Ensure tile next to portal is walkable for spawning
  map[1][2] = T.DUNGEON_FLOOR;
  map[2][1] = T.DUNGEON_FLOOR;

  return map;
}

export const dungeonTiles = generateMaze();

export function getDungeonPortalPos(): { x: number; y: number } {
  for (let y = 0; y < DUNGEON_HEIGHT; y++) {
    for (let x = 0; x < DUNGEON_WIDTH; x++) {
      if (dungeonTiles[y][x] === T.PORTAL) return { x, y };
    }
  }
  return { x: 1, y: 1 };
}

export function getDungeonSpawnPos(): { x: number; y: number } {
  // Find a walkable tile near the portal
  const portal = getDungeonPortalPos();
  const checkDirs = [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 },
                     { x: 1, y: 1 }, { x: -1, y: 1 }, { x: 1, y: -1 }];
  for (const d of checkDirs) {
    const nx = portal.x + d.x, ny = portal.y + d.y;
    if (isDungeonWalkable(dungeonTiles[ny]?.[nx])) return { x: nx, y: ny };
  }
  return { x: 2, y: 1 };
}

export function isDungeonWalkable(tile: number): boolean {
  return tile === T.DUNGEON_FLOOR || tile === T.DUNGEON_DOOR || tile === T.PORTAL ||
         tile === T.DUNGEON_MOSS || tile === T.DUNGEON_BONES;
}

export function getDungeonTileColor(tile: number): string {
  switch (tile) {
    case T.DUNGEON_FLOOR: return '#2a2a3a';
    case T.DUNGEON_WALL: return '#1a1a2e';
    case T.DUNGEON_DOOR: return '#5c4033';
    case T.PORTAL: return '#9b59b6';
    case T.LAVA: return '#e74c3c';
    case T.CRYSTAL: return '#00bcd4';
    case T.DUNGEON_MOSS: return '#2d4a2d';
    case T.DUNGEON_BONES: return '#8a8a7a';
    case T.WATER: return '#1a3a5c';
    case T.DUNGEON_BUILDING_PURPLE: return '#6a1b9a';
    case T.DUNGEON_BUILDING_BROWN: return '#4e342e';
    case T.DUNGEON_BUILDING_ORANGE: return '#bf360c';
    default: return '#1a1a2e';
  }
}

export function getDungeonBuildingHeight(tile: number): number {
  switch (tile) {
    case T.DUNGEON_WALL: return 20;
    case T.CRYSTAL: return 15;
    case T.DUNGEON_BUILDING_PURPLE: return 30;
    case T.DUNGEON_BUILDING_BROWN: return 25;
    case T.DUNGEON_BUILDING_ORANGE: return 22;
    default: return 0;
  }
}
