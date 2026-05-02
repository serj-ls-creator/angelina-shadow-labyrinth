import { TileType as T } from './types';

// Museum interior — hand-crafted maze of small rooms with exhibits.
// Walls are thin (single tile) to feel like an indoor floor plan.
// Layout: 30x22. Entry portal at the top-center. Rooms separated by thin walls,
// with doorways (carpet tiles) connecting them. Each room has a different exhibit.
export const MUSEUM_WIDTH = 30;
export const MUSEUM_HEIGHT = 22;

const F = T.MUSEUM_FLOOR;
const W = T.MUSEUM_WALL;
const C = T.MUSEUM_CARPET;
const E = T.MUSEUM_ENTRANCE;
const D = T.EXHIBIT_DINOSAUR;
const P = T.EXHIBIT_PAINTING;
const S = T.EXHIBIT_STATUE;
const G = T.EXHIBIT_GEM;
const V = T.EXHIBIT_VASE;
const M = T.EXHIBIT_MUMMY;
const R = T.EXHIBIT_ROCKET;
const B = T.EXHIBIT_BUTTERFLY;
const O = T.EXHIBIT_ROBOT;
const X = T.EXHIBIT_FOSSIL;
const N = T.MUSEUM_BENCH;
const L = T.MUSEUM_PLANT;

// 30 wide × 22 tall. Walls thin (1 tile). C = doorway (still walkable, visually a rug).
// E = entrance portal (top center) — clicking/walking onto it returns to city.
export const museumTiles: number[][] = [
  // 0
  [W,W,W,W,W,W,W,W,W,W,W,W,W,W,E,E,W,W,W,W,W,W,W,W,W,W,W,W,W,W],
  // 1: foyer
  [W,L,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,L,W],
  // 2
  [W,F,F,F,N,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,N,F,F,F,W],
  // 3 — wall row separating foyer from gallery rows below; doorways at C
  [W,F,W,W,W,W,W,W,C,W,W,W,W,W,F,F,W,W,W,W,W,C,W,W,W,W,W,W,F,W],
  // 4: row of rooms
  [W,F,W,D,F,F,P,W,F,W,S,F,F,G,F,F,W,V,F,F,M,F,W,R,F,F,B,W,F,W],
  // 5
  [W,F,W,F,F,F,F,W,F,W,F,F,F,F,F,F,W,F,F,F,F,F,W,F,F,F,F,W,F,W],
  // 6
  [W,F,W,F,F,F,F,W,F,W,F,F,F,F,F,F,W,F,F,F,F,F,W,F,F,F,F,W,F,W],
  // 7 — bottom wall of upper rooms with doorways
  [W,F,W,W,C,W,W,W,F,W,W,W,C,W,W,W,W,W,W,C,W,W,W,W,W,C,W,W,F,W],
  // 8: corridor
  [W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W],
  // 9: corridor with seating
  [W,F,F,N,F,F,F,F,F,L,F,F,F,F,N,N,F,F,F,F,L,F,F,F,F,F,N,F,F,W],
  // 10: corridor
  [W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W],
  // 11 — top wall of lower rooms
  [W,F,W,W,C,W,W,W,W,W,C,W,W,W,W,W,W,W,W,W,C,W,W,W,W,C,W,W,F,W],
  // 12
  [W,F,W,F,F,F,F,W,F,F,F,F,F,W,F,F,F,F,W,F,F,F,F,W,F,F,F,W,F,W],
  // 13
  [W,F,W,F,F,F,F,W,F,F,F,F,F,W,F,F,F,F,W,F,F,F,F,W,F,F,F,W,F,W],
  // 14: lower exhibits
  [W,F,W,O,F,F,X,W,F,F,B,F,F,W,F,D,P,F,W,F,S,F,F,W,V,F,M,W,F,W],
  // 15 — wall row between lower rooms and bottom row
  [W,F,W,W,W,W,W,W,W,W,W,W,W,W,C,W,W,W,W,W,W,W,W,W,W,W,W,W,F,W],
  // 16: bottom corridor
  [W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W],
  // 17
  [W,F,L,N,F,F,F,F,L,F,F,F,N,F,F,F,F,N,F,F,F,L,F,F,F,N,F,L,F,W],
  // 18 — wall row with doorway to bottom feature room
  [W,F,W,W,W,W,W,C,W,W,W,W,W,W,W,W,W,W,W,W,W,C,W,W,W,W,W,W,F,W],
  // 19 — bottom feature room (big rocket / fossil hall)
  [W,F,W,R,F,F,F,F,F,F,F,O,F,F,F,F,F,F,F,F,F,F,X,F,F,F,F,W,F,W],
  // 20
  [W,F,W,F,F,F,G,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W,F,W],
  // 21
  [W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W],
];

export function isMuseumWalkable(tile: number): boolean {
  return tile === T.MUSEUM_FLOOR
      || tile === T.MUSEUM_CARPET
      || tile === T.MUSEUM_ENTRANCE;
}

export function getMuseumTileColor(tile: number): string {
  switch (tile) {
    case T.MUSEUM_FLOOR: return '#e8d8b4';      // warm marble
    case T.MUSEUM_WALL: return '#cdb993';       // warm sandstone
    case T.MUSEUM_CARPET: return '#a02839';     // crimson rug doorway
    case T.MUSEUM_ENTRANCE: return '#8e44ad';   // portal purple
    case T.EXHIBIT_DINOSAUR: return '#5b7a3a';
    case T.EXHIBIT_PAINTING: return '#6b3a8a';
    case T.EXHIBIT_STATUE: return '#bdbdbd';
    case T.EXHIBIT_GEM: return '#22d3ee';
    case T.EXHIBIT_VASE: return '#c97a3a';
    case T.EXHIBIT_MUMMY: return '#a89060';
    case T.EXHIBIT_ROCKET: return '#cf3a3a';
    case T.EXHIBIT_BUTTERFLY: return '#ff80c8';
    case T.EXHIBIT_ROBOT: return '#7a8aa0';
    case T.EXHIBIT_FOSSIL: return '#8a7458';
    case T.MUSEUM_BENCH: return '#8a5a3a';
    case T.MUSEUM_PLANT: return '#3a8a4a';
    default: return '#e8d8b4';
  }
}

export function getMuseumBuildingHeight(tile: number): number {
  switch (tile) {
    case T.MUSEUM_WALL: return 14;            // thin wall, low height
    case T.EXHIBIT_DINOSAUR: return 18;
    case T.EXHIBIT_PAINTING: return 12;
    case T.EXHIBIT_STATUE: return 16;
    case T.EXHIBIT_GEM: return 8;
    case T.EXHIBIT_VASE: return 12;
    case T.EXHIBIT_MUMMY: return 14;
    case T.EXHIBIT_ROCKET: return 22;
    case T.EXHIBIT_BUTTERFLY: return 6;
    case T.EXHIBIT_ROBOT: return 16;
    case T.EXHIBIT_FOSSIL: return 10;
    case T.MUSEUM_BENCH: return 4;
    case T.MUSEUM_PLANT: return 10;
    default: return 0;
  }
}

export function getMuseumExhibitEmoji(tile: number): string | null {
  switch (tile) {
    case T.EXHIBIT_DINOSAUR: return '🦖';
    case T.EXHIBIT_PAINTING: return '🖼️';
    case T.EXHIBIT_STATUE: return '🗿';
    case T.EXHIBIT_GEM: return '💎';
    case T.EXHIBIT_VASE: return '🏺';
    case T.EXHIBIT_MUMMY: return '🪦';
    case T.EXHIBIT_ROCKET: return '🚀';
    case T.EXHIBIT_BUTTERFLY: return '🦋';
    case T.EXHIBIT_ROBOT: return '🤖';
    case T.EXHIBIT_FOSSIL: return '🦴';
    case T.MUSEUM_BENCH: return '🪑';
    case T.MUSEUM_PLANT: return '🌿';
    default: return null;
  }
}

export function getMuseumEntrancePos(): { x: number; y: number } {
  for (let y = 0; y < MUSEUM_HEIGHT; y++) {
    for (let x = 0; x < MUSEUM_WIDTH; x++) {
      if (museumTiles[y][x] === T.MUSEUM_ENTRANCE) return { x, y };
    }
  }
  return { x: 14, y: 0 };
}

export function getMuseumSpawnPos(): { x: number; y: number } {
  // Spawn one tile below the entrance, on the foyer floor.
  const e = getMuseumEntrancePos();
  return { x: e.x, y: e.y + 1 };
}

// Floor items scattered around the museum (15 total) — only on walkable floor tiles.
export interface MuseumFloorItem {
  id: string;
  itemId: string;
  pos: { x: number; y: number };
  collected: boolean;
}

export function generateMuseumFloorItems(): MuseumFloorItem[] {
  // Hand-picked positions, one per area, all on plain floor.
  const positions: { pos: { x: number; y: number }; itemId: string }[] = [
    { pos: { x: 5,  y: 5  }, itemId: 'tea' },          // dinosaur room
    { pos: { x: 12, y: 5  }, itemId: 'gum' },          // statue/gem room
    { pos: { x: 18, y: 5  }, itemId: 'donut' },        // vase/mummy
    { pos: { x: 25, y: 5  }, itemId: 'flash' },        // rocket/butterfly
    { pos: { x: 5,  y: 9  }, itemId: 'apple' },        // corridor
    { pos: { x: 11, y: 10 }, itemId: 'bathbomb' },     // corridor
    { pos: { x: 17, y: 9  }, itemId: 'megaphone' },    // corridor
    { pos: { x: 23, y: 10 }, itemId: 'compass' },      // corridor
    { pos: { x: 4,  y: 13 }, itemId: 'glitter' },      // robot/fossil
    { pos: { x: 11, y: 12 }, itemId: 'cocoa' },        // butterfly
    { pos: { x: 16, y: 13 }, itemId: 'bear' },         // dino/painting
    { pos: { x: 21, y: 12 }, itemId: 'perfume' },      // statue
    { pos: { x: 25, y: 13 }, itemId: 'discohat' },     // vase/mummy
    { pos: { x: 7,  y: 17 }, itemId: 'plushbear' },    // bottom corridor
    { pos: { x: 16, y: 20 }, itemId: 'teleport' },     // rocket hall
  ];
  return positions.map((p, i) => ({
    id: `museum_item_${i}`,
    itemId: p.itemId,
    pos: p.pos,
    collected: false,
  }));
}
