export interface Position {
  x: number;
  y: number;
}

export interface IsoPosition {
  isoX: number;
  isoY: number;
}

export enum TileType {
  EMPTY = 0,
  ROAD = 1,
  SIDEWALK = 2,
  BUILDING = 3,
  BUILDING_RED = 4,
  BUILDING_LIGHT = 5,
  TREE = 6,
  WATER = 7,
  GRASS = 8,
  BRIDGE = 9,
  PARK = 10,
  // Dungeon tiles
  DUNGEON_FLOOR = 11,
  DUNGEON_WALL = 12,
  DUNGEON_DOOR = 13,
  PORTAL = 14,
  LAVA = 15,
  CRYSTAL = 16,
  DUNGEON_MOSS = 17,
  DUNGEON_BONES = 18,
  DUNGEON_BUILDING_PURPLE = 19,
  DUNGEON_BUILDING_BROWN = 20,
  DUNGEON_BUILDING_ORANGE = 21,
  // Blue dungeon buildings
  BLUE_BUILDING_YELLOW = 22,
  BLUE_BUILDING_ORANGE = 23,
  BLUE_BUILDING_GREEN = 24,
  BLUE_BUILDING_PURPLE = 25,
  BOW_ITEM = 26,
}

export type MapId = 'city' | 'dungeon' | 'blueDungeon';

export interface Portal {
  fromMap: MapId;
  toMap: MapId;
  fromPos: Position;
  toPos: Position;  // where the player spawns in the target map
  tilePos: Position; // the tile with the portal
}

export interface GameCharacter {
  pos: Position;
  targetPos: Position | null;
  path: Position[];
  speed: number;
  isMoving: boolean;
  direction: number; // 0-7 for 8 directions
}

export interface NPC {
  id: string;
  name: string;
  pos: Position;
  dialogueId: string;
  icon: string;
  hasInteracted: boolean;
  description: string;
}

export interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  responses?: DialogueResponse[];
  next?: string;
  questUpdate?: string;
}

export interface DialogueResponse {
  text: string;
  nextId: string;
  condition?: string;
}

export interface QuestEntry {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  timestamp: string;
}

export interface GameState {
  player: GameCharacter;
  npcs: NPC[];
  questLog: QuestEntry[];
  currentDialogue: DialogueNode | null;
  activeNpc: NPC | null;
  camera: Position;
  zoom: number;
}
