import { MapId, Portal, Position, TileType } from './types';
import { mapTiles, MAP_WIDTH, MAP_HEIGHT, isWalkable } from './mapData';
import { dungeonTiles, DUNGEON_WIDTH, DUNGEON_HEIGHT, isDungeonWalkable, getDungeonSpawnPos, getDungeonPortalPos } from './dungeonMapData';
import { blueDungeonTiles, BLUE_WIDTH, BLUE_HEIGHT, isBlueWalkable, getBlueSpawnPos, getBluePortalPos } from './blueDungeonMapData';
import { greenDungeonTiles, GREEN_WIDTH, GREEN_HEIGHT, isGreenWalkable, getGreenSpawnPos, getGreenPortalPos } from './greenDungeonMapData';
import { museumTiles, MUSEUM_WIDTH, MUSEUM_HEIGHT, isMuseumWalkable, getMuseumSpawnPos, getMuseumEntrancePos } from './museumMapData';

export const CITY_PORTAL_TILE = { x: 23, y: 5 };
export const CITY_PORTAL_ENTRY = { x: 23, y: 6 };

export const BLUE_PORTAL_TILE = { x: 8, y: 3 };
export const BLUE_PORTAL_ENTRY = { x: 8, y: 4 };

export const GREEN_PORTAL_TILE = { x: 36, y: 26 };
export const GREEN_PORTAL_ENTRY = { x: 36, y: 25 };

// Museum entry: clicking the museum building (x=29-30, y=27-29) teleports inside.
// Player walks to the sidewalk in front first.
export const MUSEUM_CITY_TILE = { x: 29, y: 27 };
export const MUSEUM_CITY_ENTRY = { x: 28, y: 27 };

export const portals: Portal[] = [
  { fromMap: 'city', toMap: 'dungeon',     fromPos: CITY_PORTAL_TILE,  toPos: getDungeonSpawnPos(), tilePos: CITY_PORTAL_ENTRY },
  { fromMap: 'city', toMap: 'blueDungeon', fromPos: BLUE_PORTAL_TILE,  toPos: getBlueSpawnPos(),    tilePos: BLUE_PORTAL_ENTRY },
  { fromMap: 'city', toMap: 'greenDungeon',fromPos: GREEN_PORTAL_TILE, toPos: getGreenSpawnPos(),   tilePos: GREEN_PORTAL_ENTRY },
  { fromMap: 'city', toMap: 'museum',      fromPos: MUSEUM_CITY_TILE,  toPos: getMuseumSpawnPos(),  tilePos: MUSEUM_CITY_ENTRY },
];

const dp = getDungeonPortalPos();
portals.push({ fromMap: 'dungeon', toMap: 'city', fromPos: dp, toPos: { x: CITY_PORTAL_TILE.x, y: CITY_PORTAL_TILE.y + 1 }, tilePos: dp });

const bp = getBluePortalPos();
portals.push({ fromMap: 'blueDungeon', toMap: 'city', fromPos: bp, toPos: { x: BLUE_PORTAL_TILE.x, y: BLUE_PORTAL_TILE.y + 1 }, tilePos: bp });

const gp = getGreenPortalPos();
portals.push({ fromMap: 'greenDungeon', toMap: 'city', fromPos: gp, toPos: { x: GREEN_PORTAL_ENTRY.x, y: GREEN_PORTAL_ENTRY.y }, tilePos: gp });

const mp = getMuseumEntrancePos();
portals.push({ fromMap: 'museum', toMap: 'city', fromPos: mp, toPos: { x: MUSEUM_CITY_ENTRY.x, y: MUSEUM_CITY_ENTRY.y }, tilePos: mp });

export function getCurrentMapData(mapId: MapId) {
  if (mapId === 'dungeon')      return { tiles: dungeonTiles,      width: DUNGEON_WIDTH, height: DUNGEON_HEIGHT, isWalkable: isDungeonWalkable };
  if (mapId === 'blueDungeon')  return { tiles: blueDungeonTiles,  width: BLUE_WIDTH,    height: BLUE_HEIGHT,    isWalkable: isBlueWalkable };
  if (mapId === 'greenDungeon') return { tiles: greenDungeonTiles, width: GREEN_WIDTH,   height: GREEN_HEIGHT,   isWalkable: isGreenWalkable };
  if (mapId === 'museum')       return { tiles: museumTiles,       width: MUSEUM_WIDTH,  height: MUSEUM_HEIGHT,  isWalkable: isMuseumWalkable };
  return { tiles: mapTiles, width: MAP_WIDTH, height: MAP_HEIGHT, isWalkable };
}

export function findPortalNearby(mapId: MapId, pos: Position, radius: number = 1.5): Portal | undefined {
  return portals.find(p => {
    if (p.fromMap !== mapId) return false;
    const dx = p.tilePos.x - pos.x;
    const dy = p.tilePos.y - pos.y;
    return Math.sqrt(dx * dx + dy * dy) < radius;
  });
}

// Returns the museum-entry portal if the clicked tile is the museum landmark in the city.
export function findMuseumBuildingPortal(mapId: MapId, tileX: number, tileY: number): Portal | undefined {
  if (mapId !== 'city') return undefined;
  if (tileX < 29 || tileX > 30 || tileY < 27 || tileY > 29) return undefined;
  return portals.find(p => p.fromMap === 'city' && p.toMap === 'museum');
}
