import { MapId, Portal, Position, TileType } from './types';
import { mapTiles, MAP_WIDTH, MAP_HEIGHT, isWalkable } from './mapData';
import { dungeonTiles, DUNGEON_WIDTH, DUNGEON_HEIGHT, isDungeonWalkable, getDungeonSpawnPos } from './dungeonMapData';

// Portal: red building near green zone at (23, 6) -> dungeon
// The red building tile is at row 6, col 23-24 (X,X in mapData)
// Player clicks nearby walkable tile to enter
export const CITY_PORTAL_TILE = { x: 23, y: 5 }; // walkable tile next to red building
export const CITY_PORTAL_ENTRY = { x: 23, y: 6 }; // the red building itself

export const portals: Portal[] = [
  {
    fromMap: 'city',
    toMap: 'dungeon',
    fromPos: CITY_PORTAL_TILE,
    toPos: getDungeonSpawnPos(),
    tilePos: CITY_PORTAL_ENTRY,
  },
];

// Dynamically add the reverse portal
const dungeonPortalPos = getDungeonSpawnPos();
// Find the portal tile in dungeon
import { getDungeonPortalPos } from './dungeonMapData';
const dp = getDungeonPortalPos();
portals.push({
  fromMap: 'dungeon',
  toMap: 'city',
  fromPos: dp,
  toPos: { x: CITY_PORTAL_TILE.x, y: CITY_PORTAL_TILE.y + 1 }, // spawn just below portal in city
  tilePos: dp,
});

export function getCurrentMapData(mapId: MapId) {
  if (mapId === 'dungeon') {
    return {
      tiles: dungeonTiles,
      width: DUNGEON_WIDTH,
      height: DUNGEON_HEIGHT,
      isWalkable: isDungeonWalkable,
    };
  }
  return {
    tiles: mapTiles,
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    isWalkable,
  };
}

export function findPortalAt(mapId: MapId, tileX: number, tileY: number): Portal | undefined {
  return portals.find(p => 
    p.fromMap === mapId && 
    Math.abs(p.tilePos.x - tileX) <= 1 && 
    Math.abs(p.tilePos.y - tileY) <= 1
  );
}

export function findPortalNearby(mapId: MapId, pos: Position, radius: number = 1.5): Portal | undefined {
  return portals.find(p => {
    if (p.fromMap !== mapId) return false;
    const dx = p.tilePos.x - pos.x;
    const dy = p.tilePos.y - pos.y;
    return Math.sqrt(dx * dx + dy * dy) < radius;
  });
}
