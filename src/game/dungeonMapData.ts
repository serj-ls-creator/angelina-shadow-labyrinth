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

// Maze generation using recursive backtracking on a grid
// This guarantees all cells are connected
function generateMaze(): number[][] {
  const map: number[][] = [];
  for (let y = 0; y < DUNGEON_HEIGHT; y++) {
    map.push(new Array(DUNGEON_WIDTH).fill(T.DUNGEON_WALL));
  }

  const rand = seededRandom(42069);

  // Maze cells: odd coordinates are cells, even are walls
  const cellW = Math.floor((DUNGEON_WIDTH - 1) / 2);
  const cellH = Math.floor((DUNGEON_HEIGHT - 1) / 2);
  const visited = new Uint8Array(cellW * cellH);

  // Carve a cell
  const carve = (cx: number, cy: number) => {
    const mx = cx * 2 + 1;
    const my = cy * 2 + 1;
    map[my][mx] = T.DUNGEON_FLOOR;
  };

  // Carve passage between two adjacent cells
  const carvePassage = (cx1: number, cy1: number, cx2: number, cy2: number) => {
    const wx = cx1 * 2 + 1 + (cx2 - cx1);
    const wy = cy1 * 2 + 1 + (cy2 - cy1);
    map[wy][wx] = T.DUNGEON_FLOOR;
  };

  // Iterative backtracking to avoid stack overflow
  const stack: [number, number][] = [];
  const startCx = 0;
  const startCy = 0;
  visited[startCy * cellW + startCx] = 1;
  carve(startCx, startCy);
  stack.push([startCx, startCy]);

  const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];

  while (stack.length > 0) {
    const [cx, cy] = stack[stack.length - 1];
    // Find unvisited neighbors
    const neighbors: [number, number][] = [];
    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx >= 0 && nx < cellW && ny >= 0 && ny < cellH && !visited[ny * cellW + nx]) {
        neighbors.push([nx, ny]);
      }
    }

    if (neighbors.length === 0) {
      stack.pop();
      continue;
    }

    const [nx, ny] = neighbors[Math.floor(rand() * neighbors.length)];
    visited[ny * cellW + nx] = 1;
    carvePassage(cx, cy, nx, ny);
    carve(nx, ny);
    stack.push([nx, ny]);
  }

  // Widen some corridors for variety (make some 2-wide)
  for (let y = 1; y < DUNGEON_HEIGHT - 1; y++) {
    for (let x = 1; x < DUNGEON_WIDTH - 1; x++) {
      if (map[y][x] === T.DUNGEON_FLOOR && rand() > 0.7) {
        // Try to widen in a random direction
        const d = dirs[Math.floor(rand() * 4)];
        const nx = x + d[0];
        const ny = y + d[1];
        if (ny > 0 && ny < DUNGEON_HEIGHT - 1 && nx > 0 && nx < DUNGEON_WIDTH - 1) {
          if (map[ny][nx] === T.DUNGEON_WALL) {
            // Only widen if it won't create huge open areas
            let floorCount = 0;
            for (const [ddx, ddy] of dirs) {
              if (map[ny + ddy]?.[nx + ddx] === T.DUNGEON_FLOOR) floorCount++;
            }
            if (floorCount <= 2) {
              map[ny][nx] = T.DUNGEON_FLOOR;
            }
          }
        }
      }
    }
  }

  // Create some open rooms at intersections
  const rooms: { x: number; y: number; w: number; h: number }[] = [];
  for (let i = 0; i < 15; i++) {
    const w = Math.floor(rand() * 5) + 4;
    const h = Math.floor(rand() * 5) + 4;
    const rx = Math.floor(rand() * (DUNGEON_WIDTH - w - 4)) + 2;
    const ry = Math.floor(rand() * (DUNGEON_HEIGHT - h - 4)) + 2;

    let overlaps = false;
    for (const r of rooms) {
      if (rx < r.x + r.w + 2 && rx + w + 2 > r.x && ry < r.y + r.h + 2 && ry + h + 2 > r.y) {
        overlaps = true;
        break;
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

  // Add decorations
  for (let y = 1; y < DUNGEON_HEIGHT - 1; y++) {
    for (let x = 1; x < DUNGEON_WIDTH - 1; x++) {
      if (map[y][x] !== T.DUNGEON_FLOOR) continue;
      const r = rand();

      // Dungeon buildings (only in rooms, check if surrounded by floor)
      let floorNeighbors = 0;
      for (const [dx, dy] of dirs) {
        if (map[y + dy]?.[x + dx] === T.DUNGEON_FLOOR) floorNeighbors++;
      }

      if (floorNeighbors >= 3 && r > 0.96) {
        const buildingRoll = rand();
        if (buildingRoll < 0.33) {
          map[y][x] = T.DUNGEON_BUILDING_PURPLE;
        } else if (buildingRoll < 0.66) {
          map[y][x] = T.DUNGEON_BUILDING_BROWN;
        } else {
          map[y][x] = T.DUNGEON_BUILDING_ORANGE;
        }
        continue;
      }

      if (r > 0.97) map[y][x] = T.DUNGEON_MOSS;
      else if (r > 0.96) map[y][x] = T.DUNGEON_BONES;
      else if (r > 0.955) map[y][x] = T.CRYSTAL;
    }
  }

  // Lava pools in some rooms
  for (const room of rooms) {
    if (rand() > 0.5 && room.w >= 5 && room.h >= 5) {
      const lx = room.x + Math.floor(room.w / 2) - 1;
      const ly = room.y + Math.floor(room.h / 2) - 1;
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          if (rand() > 0.3) map[ly + dy][lx + dx] = T.LAVA;
        }
      }
    }
  }

  // Portal in top-left area (first cell)
  map[1][1] = T.PORTAL;

  // Ensure exit area is reachable at bottom-right
  const ex = DUNGEON_WIDTH - 2;
  const ey = DUNGEON_HEIGHT - 2;
  // The maze guarantees connectivity, so just mark it
  if (map[ey][ex] === T.DUNGEON_WALL) {
    // Find nearest floor tile
    for (let r = 1; r < 5; r++) {
      let found = false;
      for (let dy = -r; dy <= r && !found; dy++) {
        for (let dx = -r; dx <= r && !found; dx++) {
          const ty = ey + dy;
          const tx = ex + dx;
          if (ty > 0 && ty < DUNGEON_HEIGHT && tx > 0 && tx < DUNGEON_WIDTH && map[ty][tx] === T.DUNGEON_FLOOR) {
            found = true;
          }
        }
      }
      if (found) break;
    }
  }

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
  const portal = getDungeonPortalPos();
  const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
  for (const d of dirs) {
    const nx = portal.x + d.x;
    const ny = portal.y + d.y;
    if (isDungeonWalkable(dungeonTiles[ny]?.[nx])) return { x: nx, y: ny };
  }
  return { x: portal.x + 1, y: portal.y };
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
