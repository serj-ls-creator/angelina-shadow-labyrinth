import { MapId, Portal, Position, TileType } from './types';
import { mapTiles, MAP_WIDTH, MAP_HEIGHT, isWalkable } from './mapData';
import { dungeonTiles, DUNGEON_WIDTH, DUNGEON_HEIGHT, isDungeonWalkable, getDungeonSpawnPos, getDungeonPortalPos } from './dungeonMapData';
import { blueDungeonTiles, BLUE_WIDTH, BLUE_HEIGHT, isBlueWalkable, getBlueSpawnPos, getBluePortalPos } from './blueDungeonMapData';

// Portal: red building near green zone at (23, 6) -> dungeon
export const CITY_PORTAL_TILE = { x: 23, y: 5 };
export const CITY_PORTAL_ENTRY = { x: 23, y: 6 };

// Portal: red building near old lady at (8, 4) -> blue dungeon
export const BLUE_PORTAL_TILE = { x: 8, y: 3 };
export const BLUE_PORTAL_ENTRY = { x: 8, y: 4 };

export const portals: Portal[] = [
  // City -> Dungeon (red building near green zone)
  {
    fromMap: 'city',
    toMap: 'dungeon',
    fromPos: CITY_PORTAL_TILE,
    toPos: getDungeonSpawnPos(),
    tilePos: CITY_PORTAL_ENTRY,
  },
  // City -> Blue Dungeon (red building near old lady)
  {
    fromMap: 'city',
    toMap: 'blueDungeon',
    fromPos: BLUE_PORTAL_TILE,
    toPos: getBlueSpawnPos(),
    tilePos: BLUE_PORTAL_ENTRY,
  },
];

// Reverse portals
const dp = getDungeonPortalPos();
portals.push({
  fromMap: 'dungeon',
  toMap: 'city',
  fromPos: dp,
  toPos: { x: CITY_PORTAL_TILE.x, y: CITY_PORTAL_TILE.y + 1 },
  tilePos: dp,
});

const bp = getBluePortalPos();
portals.push({
  fromMap: 'blueDungeon',
  toMap: 'city',
  fromPos: bp,
  toPos: { x: BLUE_PORTAL_TILE.x, y: BLUE_PORTAL_TILE.y + 1 },
  tilePos: bp,
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
  if (mapId === 'blueDungeon') {
    return {
      tiles: blueDungeonTiles,
      width: BLUE_WIDTH,
      height: BLUE_HEIGHT,
      isWalkable: isBlueWalkable,
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
