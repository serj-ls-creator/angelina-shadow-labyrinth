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
