import { Position, TileType } from './types';
import { dungeonTiles, DUNGEON_WIDTH, DUNGEON_HEIGHT, isDungeonWalkable } from './dungeonMapData';

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

const MONSTER_TEMPLATES: Record<string, Omit<Monster, 'id' | 'pos' | 'isAlive'>> = {
  skeleton: { name: 'Скелет', icon: '💀', hp: 25, maxHp: 25, attack: 6, defense: 2, xpReward: 15, type: 'skeleton' },
  slime: { name: 'Слизь', icon: '🟢', hp: 15, maxHp: 15, attack: 4, defense: 1, xpReward: 8, type: 'slime' },
  demon: { name: 'Демон', icon: '👹', hp: 40, maxHp: 40, attack: 10, defense: 5, xpReward: 30, type: 'demon' },
  golem: { name: 'Голем', icon: '🗿', hp: 50, maxHp: 50, attack: 8, defense: 8, xpReward: 25, type: 'golem' },
  ghost: { name: 'Призрак', icon: '👻', hp: 20, maxHp: 20, attack: 7, defense: 3, xpReward: 12, type: 'ghost' },
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
  
  // Collect walkable floor tiles (skip near portal)
  const candidates: Position[] = [];
  for (let y = 3; y < DUNGEON_HEIGHT - 1; y++) {
    for (let x = 3; x < DUNGEON_WIDTH - 1; x++) {
      const tile = dungeonTiles[y]?.[x];
      if (tile === TileType.DUNGEON_FLOOR && rand() > 0.95) {
        candidates.push({ x, y });
      }
    }
  }
  
  // Place monsters on a subset
  for (let i = 0; i < Math.min(candidates.length, 40); i++) {
    const pos = candidates[i];
    const typeKey = types[Math.floor(rand() * types.length)];
    const template = MONSTER_TEMPLATES[typeKey];
    
    // Scale stats slightly with distance from portal
    const dist = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
    const scale = 1 + (dist / 100) * 0.5;
    
    monsters.push({
      id: `monster_${i}`,
      ...template,
      hp: Math.round(template.hp * scale),
      maxHp: Math.round(template.maxHp * scale),
      attack: Math.round(template.attack * scale),
      pos: { ...pos },
      isAlive: true,
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
