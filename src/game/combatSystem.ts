import { Position, TileType } from './types';
import { dungeonTiles, DUNGEON_WIDTH, DUNGEON_HEIGHT, isDungeonWalkable } from './dungeonMapData';
import { blueDungeonTiles, BLUE_WIDTH, BLUE_HEIGHT, isBlueWalkable } from './blueDungeonMapData';

export interface Monster {
  id: string;
  name: string;
  icon: string;
  pos: Position;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  xpReward: number;
  type: 'skeleton' | 'slime' | 'demon' | 'golem' | 'ghost';
  isAlive: boolean;
  // AI state
  state: 'patrol' | 'chase';
  patrolTarget: Position | null;
  lastMoveTime: number;
}

export interface PlayerCombatStats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  xp: number;
  level: number;
}

export interface CombatState {
  active: boolean;
  monster: Monster | null;
  playerTurn: boolean;
  log: string[];
  result: 'none' | 'win' | 'lose' | 'fled';
}

// Stats reduced 3x for easier combat
const MONSTER_TEMPLATES: Record<string, Omit<Monster, 'id' | 'pos' | 'isAlive' | 'state' | 'patrolTarget' | 'lastMoveTime'>> = {
  skeleton: { name: 'Скелет', icon: '💀', hp: 8, maxHp: 8, attack: 2, defense: 1, xpReward: 15, type: 'skeleton' },
  slime: { name: 'Слиз', icon: '🟢', hp: 5, maxHp: 5, attack: 1, defense: 0, xpReward: 8, type: 'slime' },
  demon: { name: 'Демон', icon: '👹', hp: 14, maxHp: 14, attack: 3, defense: 2, xpReward: 30, type: 'demon' },
  golem: { name: 'Голем', icon: '🗿', hp: 17, maxHp: 17, attack: 3, defense: 3, xpReward: 25, type: 'golem' },
  ghost: { name: 'Привид', icon: '👻', hp: 7, maxHp: 7, attack: 2, defense: 1, xpReward: 12, type: 'ghost' },
};

function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateDungeonMonsters(): Monster[] {
  const monsters: Monster[] = [];
  const rand = seededRand(77777);
  const types = Object.keys(MONSTER_TEMPLATES);
  
  // Collect ALL walkable floor tiles (skip portal area)
  const candidates: Position[] = [];
  for (let y = 0; y < DUNGEON_HEIGHT; y++) {
    for (let x = 0; x < DUNGEON_WIDTH; x++) {
      // Skip near portal (top-left)
      if (x < 5 && y < 5) continue;
      const tile = dungeonTiles[y]?.[x];
      if (isDungeonWalkable(tile)) {
        candidates.push({ x, y });
      }
    }
  }
  
  // Shuffle candidates
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  
  // Pick 30 spread across the map by spacing them out
  const spacing = Math.floor(candidates.length / 30);
  for (let i = 0; i < 30 && i * spacing < candidates.length; i++) {
    const pos = candidates[i * spacing];
    const typeKey = types[Math.floor(rand() * types.length)];
    const template = MONSTER_TEMPLATES[typeKey];
    
    monsters.push({
      id: `monster_${i}`,
      ...template,
      pos: { ...pos },
      isAlive: true,
      state: 'patrol',
      patrolTarget: null,
      lastMoveTime: 0,
    });
  }
  
  return monsters;
}

export function createInitialPlayerStats(): PlayerCombatStats {
  return { hp: 50, maxHp: 50, attack: 8, defense: 4, xp: 0, level: 1 };
}

export function getXpForLevel(level: number): number {
  return level * 30;
}

export function performAttack(
  attacker: { attack: number },
  defender: { defense: number },
  rand: () => number
): { damage: number; critical: boolean } {
  const critical = rand() > 0.85;
  const baseDamage = Math.max(1, attacker.attack - defender.defense / 2);
  const variance = 0.8 + rand() * 0.4;
  const damage = Math.round(baseDamage * variance * (critical ? 2 : 1));
  return { damage, critical };
}

// Line of sight check using Bresenham
export function hasLineOfSight(from: Position, to: Position, maxDist: number = 8): boolean {
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  if (dx > maxDist || dy > maxDist) return false;
  
  let x = Math.round(from.x);
  let y = Math.round(from.y);
  const x1 = Math.round(to.x);
  const y1 = Math.round(to.y);
  
  const sx = x < x1 ? 1 : -1;
  const sy = y < y1 ? 1 : -1;
  let err = dx - dy;
  
  while (true) {
    if (x === x1 && y === y1) return true;
    const tile = dungeonTiles[y]?.[x];
    if (tile === undefined) return false;
    // Walls and buildings block LOS
    if (tile === TileType.DUNGEON_WALL || tile === TileType.DUNGEON_BUILDING_PURPLE ||
        tile === TileType.DUNGEON_BUILDING_BROWN || tile === TileType.DUNGEON_BUILDING_ORANGE) {
      return false;
    }
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
}

// Pick a random walkable neighbor for patrol
export function getRandomPatrolTarget(pos: Position, rand: () => number): Position | null {
  const dirs = [
    { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 },
  ];
  // Try a few random steps
  const shuffled = dirs.sort(() => rand() - 0.5);
  for (const d of shuffled) {
    const nx = Math.round(pos.x) + d.x;
    const ny = Math.round(pos.y) + d.y;
    if (nx >= 0 && nx < DUNGEON_WIDTH && ny >= 0 && ny < DUNGEON_HEIGHT) {
      if (isDungeonWalkable(dungeonTiles[ny]?.[nx])) {
        return { x: nx, y: ny };
      }
    }
  }
  return null;
}

// Find farthest walkable point from portal for Mika
export function findFarthestPoint(): Position {
  let best: Position = { x: DUNGEON_WIDTH - 2, y: DUNGEON_HEIGHT - 2 };
  let bestDist = 0;
  
  for (let y = DUNGEON_HEIGHT - 1; y >= 0; y--) {
    for (let x = DUNGEON_WIDTH - 1; x >= 0; x--) {
      if (isDungeonWalkable(dungeonTiles[y]?.[x])) {
        const dist = x + y; // Manhattan from top-left
        if (dist > bestDist) {
          bestDist = dist;
          best = { x, y };
        }
      }
    }
  }
  return best;
}
