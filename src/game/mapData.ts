import { TileType as T } from './types';

// Map inspired by the reference: Amsterdam-style city with canals
// 40x30 grid
const _ = T.EMPTY;
const R = T.ROAD;
const S = T.SIDEWALK;
const B = T.BUILDING;
const X = T.BUILDING_RED;
const L = T.BUILDING_LIGHT;
const E = T.TREE;
const W = T.WATER;
const G = T.GRASS;
const P = T.BRIDGE;
const K = T.PARK;

export const MAP_WIDTH = 40;
export const MAP_HEIGHT = 30;
export const TILE_SIZE = 64;

// Row by row city map with canals
export const mapTiles: number[][] = [
  // Row 0-4: Top section - buildings and roads
  [S,S,B,B,S,R,R,S,B,B,S,S,R,R,S,S,B,B,S,R,R,S,S,E,G,G,G,G,E,S,R,R,S,B,B,S,S,R,R,S],
  [S,S,B,B,S,R,R,S,B,B,S,S,R,R,S,S,B,B,S,R,R,S,E,G,G,K,K,G,G,E,R,R,S,B,B,S,S,R,R,S],
  [R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R],
  [R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R],
  [S,S,B,L,S,R,R,S,X,X,S,S,R,R,S,S,W,W,W,W,W,W,W,W,G,K,K,G,W,W,W,W,W,S,S,B,S,R,R,S],
  // Row 5-9: Canal ring begins
  [S,E,B,B,S,R,R,S,B,B,S,S,R,R,S,W,W,S,S,S,S,S,S,S,S,G,G,S,S,S,S,S,W,W,S,B,E,R,R,S],
  [R,R,R,R,R,R,R,R,R,R,R,R,R,R,P,W,S,S,B,B,B,S,S,X,X,S,S,B,B,S,S,S,S,W,R,R,R,R,R,R],
  [R,R,R,R,R,R,R,R,R,R,R,R,R,R,P,W,S,S,B,B,B,S,S,B,B,S,S,B,B,S,E,S,S,W,R,R,R,R,R,R],
  [S,S,L,L,S,R,R,S,B,B,S,S,R,R,S,W,S,B,B,B,B,B,S,S,S,S,B,B,B,S,S,S,W,W,S,S,B,R,R,S],
  [S,E,B,B,S,R,R,S,B,B,S,E,R,R,S,W,W,S,B,B,S,S,S,S,S,S,S,B,B,S,S,W,W,S,S,E,B,R,R,S],
  // Row 10-14: Inner canal and old town
  [R,R,R,R,R,R,R,R,R,R,R,R,R,R,S,S,W,W,S,S,S,S,S,S,S,S,S,S,S,W,W,S,S,R,R,R,R,R,R,R],
  [R,R,R,R,R,R,R,R,R,R,R,R,R,R,S,S,S,W,W,S,B,B,S,S,B,B,S,S,W,W,S,S,R,R,R,R,R,R,R,R],
  [S,S,B,B,S,R,R,S,X,S,E,S,R,R,S,S,S,S,W,W,B,B,B,L,B,B,W,W,W,S,S,S,R,R,S,S,B,B,S,S],
  [S,S,B,B,S,R,R,S,B,S,S,S,R,R,S,S,E,S,S,W,W,B,B,B,B,W,W,S,S,S,E,S,R,R,S,S,B,B,S,S],
  [S,E,B,B,S,R,R,S,B,B,S,S,R,R,S,S,S,S,S,S,W,W,S,S,W,W,S,S,S,S,S,S,R,R,S,E,B,B,S,S],
  // Row 15-19: Central area with inner canal
  [R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,P,P,W,W,P,P,W,W,P,P,R,R,R,R,R,R,R,R,R,R,R,R],
  [R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,P,P,W,W,P,P,W,W,P,P,R,R,R,R,R,R,R,R,R,R,R,R],
  [S,S,B,B,S,R,R,S,B,B,S,S,R,R,S,S,S,S,S,W,W,S,S,S,S,W,W,S,S,S,S,R,R,S,S,B,B,S,S,S],
  [S,E,B,B,S,R,R,S,B,B,S,E,R,R,S,S,E,S,W,W,S,S,B,B,S,S,W,W,S,E,S,R,R,S,E,B,B,S,S,S],
  [S,S,L,B,S,R,R,S,B,B,S,S,R,R,S,S,S,W,W,S,S,B,B,B,B,S,S,W,W,S,S,R,R,S,S,X,B,S,S,S],
  // Row 20-24: Southern canal ring
  [R,R,R,R,R,R,R,R,R,R,R,R,R,R,S,S,W,W,S,S,B,B,S,S,B,B,S,S,W,W,S,S,R,R,R,R,R,R,R,R],
  [R,R,R,R,R,R,R,R,R,R,R,R,R,R,S,W,W,S,S,S,S,S,S,S,S,S,S,S,S,W,W,S,R,R,R,R,R,R,R,R],
  [S,S,B,B,S,R,R,S,B,B,S,S,R,R,P,W,S,S,E,S,S,S,E,S,S,S,E,S,S,S,W,P,R,R,S,S,B,B,S,S],
  [S,E,B,B,S,R,R,S,X,B,S,E,R,R,S,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,S,R,R,S,E,B,B,S,S],
  [S,S,B,B,S,R,R,S,B,B,S,S,R,R,S,S,S,S,R,R,R,R,R,R,R,R,S,S,S,S,S,S,R,R,S,S,B,B,S,S],
  // Row 25-29: Bottom section
  [R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R],
  [R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R],
  [S,S,B,B,S,R,R,S,B,L,S,E,R,R,S,S,B,B,S,R,R,S,B,B,S,R,R,S,S,B,B,S,R,R,S,S,X,B,S,S],
  [S,E,B,B,S,R,R,S,B,B,S,S,R,R,S,E,B,B,S,R,R,S,B,B,S,R,R,S,E,B,B,S,R,R,S,E,B,B,S,S],
  [S,S,B,B,S,R,R,S,B,B,S,S,R,R,S,S,B,B,S,R,R,S,B,B,S,R,R,S,S,B,B,S,R,R,S,S,B,B,S,S],
];

// Walkable tiles
export function isWalkable(tile: number): boolean {
  return tile === T.ROAD || tile === T.SIDEWALK || tile === T.BRIDGE || tile === T.GRASS || tile === T.PARK;
}

// Tile colors for rendering
export function getTileColor(tile: number): string {
  switch (tile) {
    case T.ROAD: return '#3a3d4a';
    case T.SIDEWALK: return '#c8bfaa';
    case T.BUILDING: return '#8b7355';
    case T.BUILDING_RED: return '#c0392b';
    case T.BUILDING_LIGHT: return '#d4c5a0';
    case T.TREE: return '#2d7a3a';
    case T.WATER: return '#3498db';
    case T.GRASS: return '#4a9e5c';
    case T.BRIDGE: return '#7f8c8d';
    case T.PARK: return '#5cb85c';
    default: return '#c8bfaa';
  }
}

// Building height for isometric rendering
export function getBuildingHeight(tile: number): number {
  switch (tile) {
    case T.BUILDING: return 30;
    case T.BUILDING_RED: return 25;
    case T.BUILDING_LIGHT: return 35;
    case T.TREE: return 20;
    default: return 0;
  }
}
