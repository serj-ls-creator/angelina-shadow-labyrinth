import { TileType as T } from './types';

export const DUNGEON_WIDTH = 120;
export const DUNGEON_HEIGHT = 90;

// Procedural dungeon generation
function createEmptyMap(): number[][] {
  const map: number[][] = [];
  for (let y = 0; y < DUNGEON_HEIGHT; y++) {
    map.push(new Array(DUNGEON_WIDTH).fill(T.DUNGEON_WALL));
  }
  return map;
}

interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateDungeon(): number[][] {
  const map = createEmptyMap();
  const rand = seededRandom(42069);
  const rooms: Room[] = [];

  // Generate rooms
  const maxRooms = 45;
  for (let i = 0; i < 300 && rooms.length < maxRooms; i++) {
    const w = Math.floor(rand() * 10) + 5;
    const h = Math.floor(rand() * 8) + 5;
    const x = Math.floor(rand() * (DUNGEON_WIDTH - w - 4)) + 2;
    const y = Math.floor(rand() * (DUNGEON_HEIGHT - h - 4)) + 2;

    // Check overlap
    let overlaps = false;
    for (const room of rooms) {
      if (x < room.x + room.w + 2 && x + w + 2 > room.x &&
          y < room.y + room.h + 2 && y + h + 2 > room.y) {
        overlaps = true;
        break;
      }
    }
    if (overlaps) continue;

    rooms.push({ x, y, w, h, cx: Math.floor(x + w / 2), cy: Math.floor(y + h / 2) });
  }

  // Carve rooms
  for (const room of rooms) {
    for (let ry = room.y; ry < room.y + room.h; ry++) {
      for (let rx = room.x; rx < room.x + room.w; rx++) {
        map[ry][rx] = T.DUNGEON_FLOOR;
      }
    }
  }

  // Connect rooms with corridors
  for (let i = 1; i < rooms.length; i++) {
    const a = rooms[i - 1];
    const b = rooms[i];

    // L-shaped corridor
    if (rand() > 0.5) {
      carveHCorridor(map, a.cx, b.cx, a.cy);
      carveVCorridor(map, a.cy, b.cy, b.cx);
    } else {
      carveVCorridor(map, a.cy, b.cy, a.cx);
      carveHCorridor(map, a.cx, b.cx, b.cy);
    }
  }

  // Also connect some random rooms for loops
  for (let i = 0; i < 8; i++) {
    const a = rooms[Math.floor(rand() * rooms.length)];
    const b = rooms[Math.floor(rand() * rooms.length)];
    if (a !== b) {
      carveHCorridor(map, a.cx, b.cx, a.cy);
      carveVCorridor(map, a.cy, b.cy, b.cx);
    }
  }

  // Add decorations
  for (const room of rooms) {
    // Lava pools in some rooms
    if (rand() > 0.7 && room.w >= 7 && room.h >= 7) {
      const lx = room.x + Math.floor(room.w / 2) - 1;
      const ly = room.y + Math.floor(room.h / 2) - 1;
      for (let dy = 0; dy < 3; dy++) {
        for (let dx = 0; dx < 3; dx++) {
          if (rand() > 0.3) map[ly + dy][lx + dx] = T.LAVA;
        }
      }
    }

    // Crystals along walls
    if (rand() > 0.5) {
      const spots = [
        { x: room.x, y: room.y + Math.floor(room.h / 2) },
        { x: room.x + room.w - 1, y: room.y + Math.floor(room.h / 2) },
        { x: room.x + Math.floor(room.w / 2), y: room.y },
        { x: room.x + Math.floor(room.w / 2), y: room.y + room.h - 1 },
      ];
      for (const spot of spots) {
        if (rand() > 0.6 && map[spot.y][spot.x] === T.DUNGEON_FLOOR) {
          map[spot.y][spot.x] = T.CRYSTAL;
        }
      }
    }

    // Moss patches
    for (let ry = room.y; ry < room.y + room.h; ry++) {
      for (let rx = room.x; rx < room.x + room.w; rx++) {
        if (map[ry][rx] === T.DUNGEON_FLOOR && rand() > 0.92) {
          map[ry][rx] = T.DUNGEON_MOSS;
        }
        if (map[ry][rx] === T.DUNGEON_FLOOR && rand() > 0.97) {
          map[ry][rx] = T.DUNGEON_BONES;
        }
      }
    }

    // Doors at corridor entries
    for (let ry = room.y; ry < room.y + room.h; ry++) {
      for (const rx of [room.x - 1, room.x + room.w]) {
        if (rx >= 0 && rx < DUNGEON_WIDTH && map[ry]?.[rx] === T.DUNGEON_FLOOR) {
          // Check if it's a narrow passage (wall above and below)
          const above = map[ry - 1]?.[rx === room.x - 1 ? room.x : room.x + room.w - 1];
          const below = map[ry + 1]?.[rx === room.x - 1 ? room.x : room.x + room.w - 1];
          if (above === T.DUNGEON_WALL && below === T.DUNGEON_WALL && rand() > 0.6) {
            map[ry][rx === room.x - 1 ? room.x : room.x + room.w - 1] = T.DUNGEON_DOOR;
          }
        }
      }
    }
  }

  // Place portal back to city in the first room
  const firstRoom = rooms[0];
  map[firstRoom.cy][firstRoom.cx] = T.PORTAL;

  return map;
}

function carveHCorridor(map: number[][], x1: number, x2: number, y: number) {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  for (let x = minX; x <= maxX; x++) {
    if (y >= 0 && y < DUNGEON_HEIGHT && x >= 0 && x < DUNGEON_WIDTH) {
      if (map[y][x] === T.DUNGEON_WALL) map[y][x] = T.DUNGEON_FLOOR;
      // Widen corridors slightly
      if (y + 1 < DUNGEON_HEIGHT && map[y + 1][x] === T.DUNGEON_WALL) {
        map[y + 1][x] = T.DUNGEON_FLOOR;
      }
    }
  }
}

function carveVCorridor(map: number[][], y1: number, y2: number, x: number) {
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  for (let y = minY; y <= maxY; y++) {
    if (y >= 0 && y < DUNGEON_HEIGHT && x >= 0 && x < DUNGEON_WIDTH) {
      if (map[y][x] === T.DUNGEON_WALL) map[y][x] = T.DUNGEON_FLOOR;
      if (x + 1 < DUNGEON_WIDTH && map[y][x + 1] === T.DUNGEON_WALL) {
        map[y][x + 1] = T.DUNGEON_FLOOR;
      }
    }
  }
}

export const dungeonTiles = generateDungeon();

// Find portal position in dungeon (first room center)
export function getDungeonPortalPos(): { x: number; y: number } {
  for (let y = 0; y < DUNGEON_HEIGHT; y++) {
    for (let x = 0; x < DUNGEON_WIDTH; x++) {
      if (dungeonTiles[y][x] === T.PORTAL) return { x, y };
    }
  }
  return { x: 5, y: 5 };
}

// Find a good spawn point near portal
export function getDungeonSpawnPos(): { x: number; y: number } {
  const portal = getDungeonPortalPos();
  // Find adjacent walkable tile
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
    default: return '#1a1a2e';
  }
}

export function getDungeonBuildingHeight(tile: number): number {
  switch (tile) {
    case T.DUNGEON_WALL: return 20;
    case T.CRYSTAL: return 15;
    default: return 0;
  }
}
