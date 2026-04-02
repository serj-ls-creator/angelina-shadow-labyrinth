import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Position, MapId } from '../game/types';
import { findPath } from '../game/pathfinding';
import { renderMap, renderCharacter, renderNPCs, renderPathPreview, renderMonsters, renderMika, renderCoins, toIso, fromIso } from '../game/renderer';
import { npcs as npcData } from '../game/dialogueData';
import { NPC, DialogueNode, QuestEntry } from '../game/types';
import { dialogues } from '../game/dialogueData';
import { getCurrentMapData, findPortalNearby } from '../game/mapSystem';
import { Monster, CombatState, PlayerCombatStats, generateDungeonMonsters, generateBlueMonsters, createInitialPlayerStats, performAttack, getXpForLevel, hasLineOfSight, getRandomPatrolTarget, findFarthestPoint } from '../game/combatSystem';
import { isDungeonWalkable, dungeonTiles, DUNGEON_WIDTH, DUNGEON_HEIGHT } from '../game/dungeonMapData';
import { isBlueWalkable, blueDungeonTiles, BLUE_WIDTH, BLUE_HEIGHT, getBlueBowPos } from '../game/blueDungeonMapData';
import { useIsMobile } from '../hooks/use-mobile';
import { InventoryItem, Coin, generateCityCoins, generateDungeonCoins, generateMonsterLoot, getItemDef, ActiveEffect } from '../game/inventorySystem';
import { TileType } from '../game/types';
import characterSrc from '@/assets/character-kuromi-girl.png';
import mikaSrc from '@/assets/character-mika.png';
import DialogueBox from './DialogueBox';
import CombatUI from './CombatUI';
import GameHUD from './GameHUD';
import QuestLog from './QuestLog';
import MiniMap from './MiniMap';
import InventoryUI from './InventoryUI';
import ShopUI from './ShopUI';
import { playCoinSound, playHitSound, playPlayerHitSound, playVictorySound, playDefeatSound, playPortalSound, playHealSound, playBuySound, playUseItemSound, playCombatStartSound, playBowPickupSound } from '../game/soundSystem';

const PLAYER_SPEED = 0.06;
const NPC_INTERACT_DIST = 2.5;
const CAMERA_LERP = 0.08;
const MONSTER_INTERACT_DIST = 2;
const MONSTER_SPEED = 0.012;
const MONSTER_CHASE_SPEED = 0.02;
const MONSTER_UPDATE_INTERVAL = 500;
const COIN_PICKUP_DIST = 1.5;
const COIN_MAGNET_DIST = 3.5;

export default function GameCanvas() {
  const isMobile = useIsMobile();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const charImgRef = useRef<HTMLImageElement | null>(null);
  const mikaImgRef = useRef<HTMLImageElement | null>(null);

  const playerRef = useRef<Position>({ x: 15, y: 15 });
  const targetRef = useRef<Position | null>(null);
  const pathRef = useRef<Position[]>([]);
  const pathIndexRef = useRef(0);
  const cameraRef = useRef<Position>({ x: 0, y: 0 });
  const zoomRef = useRef(0.7);

  const [currentMap, setCurrentMap] = useState<MapId>('city');
  const currentMapRef = useRef<MapId>('city');

  const [npcs, setNpcs] = useState<NPC[]>(npcData.map(n => ({ ...n })));
  const [currentDialogue, setCurrentDialogue] = useState<DialogueNode | null>(null);
  const [activeNpc, setActiveNpc] = useState<NPC | null>(null);
  const [questLog, setQuestLog] = useState<QuestEntry[]>([
    { id: 'main', title: 'Знайти Міку', description: 'Подружка Міку зникла. Потрібно розпитати людей у місті.', completed: false, timestamp: '14 годин тому' },
  ]);
  const [showQuestLog, setShowQuestLog] = useState(false);
  const [gameTime, setGameTime] = useState('21:47');
  const [transitioning, setTransitioning] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  // Inventory & coins
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [coins, setCoins] = useState(0);
  const [showInventory, setShowInventory] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([]);
  const [lootMessage, setLootMessage] = useState<string | null>(null);

  // Coin data in refs for performance
  const cityCoinsRef = useRef<Coin[]>(generateCityCoins());
  const dungeonCoinsRef = useRef<Coin[]>(
    generateDungeonCoins(dungeonTiles, DUNGEON_WIDTH, DUNGEON_HEIGHT, isDungeonWalkable, 'dungeon', 54321)
  );
  const blueCoinsRef = useRef<Coin[]>(
    generateDungeonCoins(blueDungeonTiles, BLUE_WIDTH, BLUE_HEIGHT, isBlueWalkable, 'blueDungeon', 11111)
  );

  // Mika position
  const mikaPos = useRef<Position>(findFarthestPoint());

  // Blue dungeon monsters
  const blueMonstersRef = useRef<Monster[]>(generateBlueMonsters());

  // Bow collected state
  const [hasBow, setHasBow] = useState(false);

  // Combat state
  const monstersRef = useRef<Monster[]>(generateDungeonMonsters());
  const [playerStats, setPlayerStats] = useState<PlayerCombatStats>(createInitialPlayerStats);
  const playerStatsRef = useRef<PlayerCombatStats>(createInitialPlayerStats());
  const [combat, setCombat] = useState<CombatState>({
    active: false, monster: null, playerTurn: true, log: [], result: 'none',
  });
  const defendingRef = useRef(false);
  const lastMonsterUpdateRef = useRef(0);
  const combatStartPendingRef = useRef(false);
  const [playerPosState, setPlayerPosState] = useState<Position>({ x: 15, y: 15 });
  const playerPosUpdateTimer = useRef(0);

  // Helper: check if player has a passive item
  const hasItem = useCallback((itemId: string) => {
    return inventory.some(i => i.itemId === itemId);
  }, [inventory]);

  const hasActiveEffect = useCallback((effectType: string) => {
    return activeEffects.some(e => e.type === effectType && e.endsAt > Date.now());
  }, [activeEffects]);

  // Keep playerStats ref in sync
  useEffect(() => { playerStatsRef.current = playerStats; }, [playerStats]);

  useEffect(() => {
    const img = new Image();
    img.src = characterSrc;
    img.onload = () => { charImgRef.current = img; };
    const mikaImg = new Image();
    mikaImg.src = mikaSrc;
    mikaImg.onload = () => { mikaImgRef.current = mikaImg; };
  }, []);

  useEffect(() => {
    const { sx, sy } = toIso(playerRef.current.x, playerRef.current.y);
    cameraRef.current = { x: sx, y: sy };
  }, []);

  // Add item to inventory
  const addToInventory = useCallback((itemId: string, qty = 1) => {
    setInventory(prev => {
      const existing = prev.find(i => i.itemId === itemId);
      if (existing) {
        return prev.map(i => i.itemId === itemId ? { ...i, quantity: i.quantity + qty } : i);
      }
      return [...prev, { itemId, quantity: qty }];
    });
  }, []);

  // Use item from inventory
  const useItem = useCallback((itemId: string) => {
    const def = getItemDef(itemId);
    if (!def) return;

    const effect = def.effect;

    switch (effect.type) {
      case 'heal':
        setPlayerStats(ps => ({ ...ps, hp: Math.min(ps.maxHp, ps.hp + effect.amount) }));
        break;
      case 'fullHeal':
        setPlayerStats(ps => ({ ...ps, hp: ps.maxHp }));
        break;
      case 'overheal':
        setPlayerStats(ps => ({ ...ps, hp: ps.hp + effect.amount }));
        break;
      case 'invisibility':
        setActiveEffects(prev => [...prev, { type: 'invisibility', endsAt: Date.now() + effect.duration }]);
        break;
      case 'flashFreeze':
        setActiveEffects(prev => [...prev, { type: 'flashFreeze', endsAt: Date.now() + effect.duration }]);
        break;
      case 'timeStop':
        setActiveEffects(prev => [...prev, { type: 'timeStop', endsAt: Date.now() + effect.duration }]);
        break;
      case 'slowEnemies':
        setActiveEffects(prev => [...prev, { type: 'slowEnemies', endsAt: Date.now() + effect.duration }]);
        break;
      case 'teleportRandom': {
        // Find random safe spot in current map
        const mapData = getCurrentMapData(currentMapRef.current);
        const candidates: Position[] = [];
        for (let y = 0; y < mapData.height; y++) {
          for (let x = 0; x < mapData.width; x++) {
            if (mapData.isWalkable(mapData.tiles[y]?.[x])) candidates.push({ x, y });
          }
        }
        if (candidates.length > 0) {
          const p = candidates[Math.floor(Math.random() * candidates.length)];
          playerRef.current = { ...p };
          pathRef.current = [];
          pathIndexRef.current = 0;
          targetRef.current = null;
        }
        break;
      }
      case 'bombAoe': {
        // Kill nearby monsters
        const px = playerRef.current.x;
        const py = playerRef.current.y;
        monstersRef.current = monstersRef.current.map(m => {
          if (!m.isAlive) return m;
          if (Math.hypot(m.pos.x - px, m.pos.y - py) < 3) {
            return { ...m, isAlive: false };
          }
          return m;
        });
        break;
      }
      case 'knockback': {
        const px = playerRef.current.x;
        const py = playerRef.current.y;
        monstersRef.current = monstersRef.current.map(m => {
          if (!m.isAlive) return m;
          const dist = Math.hypot(m.pos.x - px, m.pos.y - py);
          if (dist < 4 && dist > 0) {
            const dx = (m.pos.x - px) / dist;
            const dy = (m.pos.y - py) / dist;
            const newX = m.pos.x + dx * 4;
            const newY = m.pos.y + dy * 4;
            if (isDungeonWalkable(dungeonTiles[Math.floor(newY)]?.[Math.floor(newX)])) {
              return { ...m, pos: { x: newX, y: newY } };
            }
          }
          return m;
        });
        break;
      }
      case 'speedBoost':
      case 'waterWalk':
      case 'damageReduction':
      case 'coinMagnet':
      case 'discoLight':
      case 'glitterTrail':
      case 'luckyDrop':
      case 'shinyDrop':
      case 'compass':
      case 'meleeWeapon':
      case 'projectile':
      case 'freezeProjectile':
      case 'hologram':
      case 'chickenTransform':
        // Passive items - no action on use, just keep in inventory
        return; // Don't consume
    }

    // Consume item if consumable
    if (def.consumable) {
      setInventory(prev => {
        return prev.map(i => {
          if (i.itemId !== itemId) return i;
          return { ...i, quantity: i.quantity - 1 };
        }).filter(i => i.quantity > 0);
      });
    }
    // Non-consumable non-reusable (perfume)
    if (!def.consumable && effect.type === 'invisibility' && !(effect as any).reusable) {
      // already handled above
    }
  }, []);

  // Buy from shop
  const handleBuy = useCallback((itemId: string) => {
    const def = getItemDef(itemId);
    if (!def) return;
    setCoins(prev => {
      if (prev < def.price) return prev;
      addToInventory(itemId);
      return prev - def.price;
    });
  }, [addToInventory]);

  // Restart game
  const handleRestart = useCallback(() => {
    playerRef.current = { x: 15, y: 15 };
    targetRef.current = null;
    pathRef.current = [];
    pathIndexRef.current = 0;
    currentMapRef.current = 'city';
    setCurrentMap('city');
    monstersRef.current = generateDungeonMonsters();
    blueMonstersRef.current = generateBlueMonsters();
    setPlayerPosState({ x: 15, y: 15 });
    setPlayerStats(createInitialPlayerStats());
    mikaPos.current = findFarthestPoint();
    setGameWon(false);
    setHasBow(false);
    setCurrentDialogue(null);
    setActiveNpc(null);
    setQuestLog([
      { id: 'main', title: 'Знайти Міку', description: 'Подружка Міку зникла. Потрібно розпитати людей у місті.', completed: false, timestamp: '14 годин тому' },
    ]);
    setNpcs(npcData.map(n => ({ ...n })));
    setCombat({ active: false, monster: null, playerTurn: true, log: [], result: 'none' });
    setInventory([]);
    setCoins(0);
    setActiveEffects([]);
    cityCoinsRef.current = generateCityCoins();
    dungeonCoinsRef.current = generateDungeonCoins(dungeonTiles, DUNGEON_WIDTH, DUNGEON_HEIGHT, isDungeonWalkable, 'dungeon', 54321);
    blueCoinsRef.current = generateDungeonCoins(blueDungeonTiles, BLUE_WIDTH, BLUE_HEIGHT, isBlueWalkable, 'blueDungeon', 11111);
    const { sx, sy } = toIso(15, 15);
    cameraRef.current = { x: sx, y: sy };
  }, []);

  const switchMap = useCallback((toMap: MapId, spawnPos: Position) => {
    setTransitioning(true);
    pathRef.current = [];
    pathIndexRef.current = 0;
    targetRef.current = null;

    setTimeout(() => {
      playerRef.current = { ...spawnPos };
      currentMapRef.current = toMap;
      setCurrentMap(toMap);
      const { sx, sy } = toIso(spawnPos.x, spawnPos.y);
      cameraRef.current = { x: sx, y: sy };
      setTimeout(() => setTransitioning(false), 300);
    }, 500);
  }, []);

  // Combat actions
  const combatRand = useCallback(() => Math.random(), []);

  const startCombat = useCallback((monster: Monster) => {
    pathRef.current = [];
    pathIndexRef.current = 0;
    targetRef.current = null;
    defendingRef.current = false;
    setCombat({
      active: true,
      monster: { ...monster },
      playerTurn: true,
      log: [`⚔️ ${monster.name} перегороджує шлях!`],
      result: 'none',
    });
  }, []);

  const handleCombatAttack = useCallback(() => {
    setCombat(prev => {
      if (!prev.monster || prev.result !== 'none' || !prev.playerTurn) return prev;
      const stats = playerStatsRef.current;
      const { damage, critical } = performAttack(stats, prev.monster, combatRand);
      const newMonsterHp = prev.monster.hp - damage;
      const log = [...prev.log, `⚔️ Ти ${critical ? 'КРИТ! ' : ''}завдаєш ${damage} шкоди!`];

      if (newMonsterHp <= 0) {
        const mId = prev.monster!.id;
        monstersRef.current = monstersRef.current.map(m => m.id === mId ? { ...m, isAlive: false } : m);
        const xpGain = prev.monster.xpReward;
        
        // Generate loot
        const loot = generateMonsterLoot(
          inventory.some(i => i.itemId === 'luckycoin'),
          inventory.some(i => i.itemId === 'shinycloak')
        );
        setCoins(c => c + loot.coins);
        let lootMsg = `+${loot.coins} 🪙`;
        if (loot.itemId) {
          addToInventory(loot.itemId);
          const itemDef = getItemDef(loot.itemId);
          lootMsg += ` + ${itemDef?.icon} ${itemDef?.name}`;
        }
        setLootMessage(lootMsg);
        setTimeout(() => setLootMessage(null), 2500);

        setPlayerStats(ps => {
          const newXp = ps.xp + xpGain;
          const needed = getXpForLevel(ps.level);
          if (newXp >= needed) {
            return {
              ...ps, xp: newXp - needed, level: ps.level + 1,
              maxHp: ps.maxHp + 10, hp: Math.min(ps.hp + 15, ps.maxHp + 10),
              attack: ps.attack + 2, defense: ps.defense + 1,
            };
          }
          return { ...ps, xp: newXp };
        });
        return { ...prev, monster: { ...prev.monster, hp: 0 }, log: [...log, `🎉 ${prev.monster.name} переможений! ${lootMsg}`], result: 'win' };
      }

      setTimeout(() => {
        setCombat(c => {
          if (!c.monster || c.result !== 'none') return c;
          const def = defendingRef.current ? { defense: playerStatsRef.current.defense * 2 } : playerStatsRef.current;
          const { damage: mDmg, critical: mCrit } = performAttack(c.monster, def, combatRand);
          let actualDmg = defendingRef.current ? Math.max(1, Math.floor(mDmg / 2)) : mDmg;
          // Bear hat passive: -2 damage
          if (inventory.some(i => i.itemId === 'bearhat')) {
            actualDmg = Math.max(1, actualDmg - 2);
          }
          defendingRef.current = false;

          setPlayerStats(ps => {
            const newHp = ps.hp - actualDmg;
            if (newHp <= 0) {
              setCombat(cc => ({
                ...cc,
                log: [...cc.log, `💀 ${c.monster!.name} завдає ${actualDmg} шкоди! Тебе переможено...`],
                result: 'lose',
                playerTurn: false,
              }));
              return { ...ps, hp: 0 };
            }
            return { ...ps, hp: newHp };
          });

          return {
            ...c,
            monster: { ...c.monster, hp: newMonsterHp },
            log: [...c.log, `${mCrit ? '💥 КРИТ! ' : ''}${c.monster.name} завдає ${actualDmg} шкоди!`],
            playerTurn: true,
          };
        });
      }, 600);

      return { ...prev, monster: { ...prev.monster, hp: newMonsterHp }, log, playerTurn: false };
    });
  }, [combatRand, inventory, addToInventory]);

  const handleCombatDefend = useCallback(() => {
    setCombat(prev => {
      if (!prev.monster || prev.result !== 'none' || !prev.playerTurn) return prev;
      defendingRef.current = true;
      const log = [...prev.log, '🛡️ Ти приймаєш захисну стійку!'];

      setTimeout(() => {
        setCombat(c => {
          if (!c.monster || c.result !== 'none') return c;
          const def = { defense: playerStatsRef.current.defense * 2 };
          const { damage: mDmg } = performAttack(c.monster, def, combatRand);
          let actualDmg = Math.max(1, Math.floor(mDmg / 2));
          if (inventory.some(i => i.itemId === 'bearhat')) {
            actualDmg = Math.max(1, actualDmg - 2);
          }
          defendingRef.current = false;

          setPlayerStats(ps => {
            const newHp = ps.hp - actualDmg;
            if (newHp <= 0) {
              setCombat(cc => ({ ...cc, log: [...cc.log, `💀 Навіть блок не допоміг...`], result: 'lose', playerTurn: false }));
              return { ...ps, hp: 0 };
            }
            return { ...ps, hp: newHp };
          });

          return {
            ...c,
            log: [...c.log, `🛡️ Блок! ${c.monster.name} завдає лише ${actualDmg} шкоди!`],
            playerTurn: true,
          };
        });
      }, 600);

      return { ...prev, log, playerTurn: false };
    });
  }, [combatRand, inventory]);

  const handleCombatFlee = useCallback(() => {
    setCombat(prev => {
      if (prev.result !== 'none') return prev;
      if (Math.random() > 0.4) {
        return { ...prev, log: [...prev.log, '🏃 Вдалося втекти!'], result: 'fled' };
      }
      setTimeout(() => {
        setCombat(c => {
          if (!c.monster || c.result !== 'none') return c;
          const { damage: mDmg } = performAttack(c.monster, playerStatsRef.current, combatRand);
          let actualDmg = mDmg;
          if (inventory.some(i => i.itemId === 'bearhat')) {
            actualDmg = Math.max(1, actualDmg - 2);
          }
          setPlayerStats(ps => {
            const newHp = ps.hp - actualDmg;
            if (newHp <= 0) {
              setCombat(cc => ({ ...cc, log: [...cc.log, `💀 Не вдалося втекти...`], result: 'lose' }));
              return { ...ps, hp: 0 };
            }
            return { ...ps, hp: newHp };
          });
          return { ...c, log: [...c.log, `❌ Не вдалося втекти! ${c.monster.name} завдає ${actualDmg} шкоди!`], playerTurn: true };
        });
      }, 600);
      return { ...prev, log: [...prev.log, '❌ Втеча не вдалася!'], playerTurn: false };
    });
  }, [combatRand, inventory]);

  const handleCombatEnd = useCallback(() => {
    if (combat.result === 'lose') {
      setPlayerStats(ps => ({ ...ps, hp: Math.max(10, Math.floor(ps.maxHp / 2)) }));
      switchMap('city', { x: 15, y: 15 });
    }
    combatStartPendingRef.current = false;
    setCombat({ active: false, monster: null, playerTurn: true, log: [], result: 'none' });
  }, [combat.result, switchMap]);

  const lastClickRef = useRef(0);
  const lastTouchRef = useRef(0);

  const startDialogue = useCallback((npc: NPC) => {
    setActiveNpc(npc);
    setCurrentDialogue(dialogues[npc.dialogueId]);
    setNpcs(prev => prev.map(n => n.id === npc.id ? { ...n, hasInteracted: true } : n));
  }, []);

  const handleCanvasInteraction = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const now = Date.now();
    const isTouchEvent = 'changedTouches' in e || 'touches' in e;

    if (isTouchEvent) {
      lastTouchRef.current = now;
    } else if (now - lastTouchRef.current < 450) {
      return;
    }

    if (now - lastClickRef.current < 120) return;
    lastClickRef.current = now;

    if (currentDialogue || transitioning || combat.active || showShop || showInventory) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isTouchEvent) e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('changedTouches' in e && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return;
    }

    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;

    const zoom = zoomRef.current;
    const worldX = (canvasX - canvas.width / 2) / zoom + cameraRef.current.x;
    const worldY = (canvasY - canvas.height / 3) / zoom + cameraRef.current.y;

    const tile = fromIso(worldX, worldY);
    const tileX = Math.floor(tile.x);
    const tileY = Math.floor(tile.y);

    const mapData = getCurrentMapData(currentMapRef.current);

    // Check portal interaction
    const portal = findPortalNearby(currentMapRef.current, { x: tileX, y: tileY }, 2);
    if (portal) {
      const path = findPath(
        { x: Math.round(playerRef.current.x), y: Math.round(playerRef.current.y) },
        { x: Math.round(portal.tilePos.x), y: Math.round(portal.tilePos.y) },
        mapData.tiles, mapData.width, mapData.height, mapData.isWalkable
      );
      if (path.length > 1) {
        const walkPath = path.slice(1);
        pathRef.current = walkPath;
        pathIndexRef.current = 0;
        targetRef.current = walkPath[walkPath.length - 1];
        setTimeout(() => {
          switchMap(portal.toMap, portal.toPos);
        }, walkPath.length * 120);
      } else {
        switchMap(portal.toMap, portal.toPos);
      }
      return;
    }

    // Check Mika interaction (dungeon only)
    if (currentMapRef.current === 'dungeon' && !gameWon) {
      const mika = mikaPos.current;
      const mdx = mika.x - tileX;
      const mdy = mika.y - tileY;
      if (Math.sqrt(mdx * mdx + mdy * mdy) < NPC_INTERACT_DIST) {
        const path = findPath(
          { x: Math.round(playerRef.current.x), y: Math.round(playerRef.current.y) },
          { x: Math.round(mika.x), y: Math.round(mika.y) },
          mapData.tiles, mapData.width, mapData.height, mapData.isWalkable
        );
        if (path.length > 1) {
          const walkPath = path.slice(1);
          if (walkPath.length > 1) walkPath.pop();
          pathRef.current = walkPath;
          pathIndexRef.current = 0;
          targetRef.current = walkPath[walkPath.length - 1];
          setTimeout(() => {
            startDialogue({
              id: 'mika', name: 'Міка', pos: mika, dialogueId: 'mika_start',
              icon: '👧', hasInteracted: false, description: 'Твоя загублена подружка',
            });
          }, walkPath.length * 120);
        } else {
          startDialogue({
            id: 'mika', name: 'Міка', pos: mika, dialogueId: 'mika_start',
            icon: '👧', hasInteracted: false, description: 'Твоя загублена подружка',
          });
        }
        return;
      }
    }

    // Check monster interaction (dungeon or blueDungeon)
    if (currentMapRef.current === 'dungeon' || currentMapRef.current === 'blueDungeon') {
      const curMonsters = currentMapRef.current === 'blueDungeon' ? blueMonstersRef.current : monstersRef.current;
      for (const monster of curMonsters) {
        if (!monster.isAlive) continue;
        const dx = monster.pos.x - tileX;
        const dy = monster.pos.y - tileY;
        if (Math.sqrt(dx * dx + dy * dy) < MONSTER_INTERACT_DIST) {
          const path = findPath(
            { x: Math.round(playerRef.current.x), y: Math.round(playerRef.current.y) },
            { x: Math.round(monster.pos.x), y: Math.round(monster.pos.y) },
            mapData.tiles, mapData.width, mapData.height, mapData.isWalkable
          );
          if (path.length > 1) {
            const walkPath = path.slice(1);
            if (walkPath.length > 1) walkPath.pop();
            pathRef.current = walkPath;
            pathIndexRef.current = 0;
            targetRef.current = walkPath[walkPath.length - 1];
            setTimeout(() => startCombat(monster), walkPath.length * 120);
          } else {
            startCombat(monster);
          }
          return;
        }
      }
    }

    // Check NPC interaction (only in city)
    if (currentMapRef.current === 'city') {
      for (const npc of npcs) {
        const dx = npc.pos.x - tileX;
        const dy = npc.pos.y - tileY;
        if (Math.sqrt(dx * dx + dy * dy) < NPC_INTERACT_DIST) {
          const path = findPath(
            { x: Math.round(playerRef.current.x), y: Math.round(playerRef.current.y) },
            { x: Math.round(npc.pos.x), y: Math.round(npc.pos.y) },
            mapData.tiles, mapData.width, mapData.height, mapData.isWalkable
          );
          if (path.length > 0) {
            if (path.length > 1) path.pop();
            const walkPath = path.slice(1);
            if (walkPath.length === 0) {
              startDialogue(npc);
              return;
            }
            pathRef.current = walkPath;
            pathIndexRef.current = 0;
            targetRef.current = walkPath[walkPath.length - 1];
            setTimeout(() => { startDialogue(npc); }, walkPath.length * 120);
          } else {
            startDialogue(npc);
          }
          return;
        }
      }
    }

    // Normal movement
    if (tileX >= 0 && tileX < mapData.width && tileY >= 0 && tileY < mapData.height && mapData.isWalkable(mapData.tiles[tileY]?.[tileX])) {
      const path = findPath(
        { x: Math.round(playerRef.current.x), y: Math.round(playerRef.current.y) },
        { x: tileX, y: tileY },
        mapData.tiles, mapData.width, mapData.height, mapData.isWalkable
      );
      if (path.length > 0) {
        const walkPath = path.slice(1);
        if (walkPath.length === 0) return;
        pathRef.current = walkPath;
        pathIndexRef.current = 0;
        targetRef.current = walkPath[walkPath.length - 1];
      }
    }
  }, [currentDialogue, npcs, transitioning, switchMap, startCombat, combat.active, gameWon, startDialogue, showShop, showInventory]);

  const handleDialogueResponse = useCallback((nextId: string) => {
    const next = dialogues[nextId];
    if (next) {
      // Check for shop open trigger
      if (next.text === 'OPEN_SHOP') {
        setCurrentDialogue(null);
        setActiveNpc(null);
        setShowShop(true);
        return;
      }
      if (next.questUpdate) {
        if (next.questUpdate === 'ПЕРЕМОГА') {
          setGameWon(true);
          setQuestLog(prev => prev.map(q => q.id === 'main' ? { ...q, completed: true } : q));
        } else {
          setQuestLog(prev => [...prev, {
            id: `quest_${Date.now()}`,
            title: 'Нова підказка!',
            description: next.questUpdate!,
            completed: false,
            timestamp: gameTime,
          }]);
        }
      }
      setCurrentDialogue(next);
    } else {
      setCurrentDialogue(null);
      setActiveNpc(null);
    }
  }, [gameTime]);

  const handleDialogueEnd = useCallback(() => {
    if (currentDialogue?.questUpdate) {
      if (currentDialogue.text === 'OPEN_SHOP') {
        setCurrentDialogue(null);
        setActiveNpc(null);
        setShowShop(true);
        return;
      }
      if (currentDialogue.questUpdate === 'ПЕРЕМОГА') {
        setGameWon(true);
        setQuestLog(prev => prev.map(q => q.id === 'main' ? { ...q, completed: true } : q));
      } else {
        setQuestLog(prev => [...prev, {
          id: `quest_${Date.now()}`,
          title: 'Нова підказка!',
          description: currentDialogue.questUpdate!,
          completed: false,
          timestamp: gameTime,
        }]);
      }
    }
    setCurrentDialogue(null);
    setActiveNpc(null);
  }, [currentDialogue, gameTime]);

  // Coin pickup & bow pickup logic
  const checkCoinPickup = useCallback(() => {
    const px = playerRef.current.x;
    const py = playerRef.current.y;
    const pickupDist = hasItem('magnet') ? COIN_MAGNET_DIST : COIN_PICKUP_DIST;
    const map = currentMapRef.current;

    const coinsArr = map === 'city' ? cityCoinsRef.current : map === 'blueDungeon' ? blueCoinsRef.current : dungeonCoinsRef.current;
    let newlyCollected = 0;
    for (const coin of coinsArr) {
      if (coin.collected) continue;
      const dist = Math.hypot(coin.pos.x - px, coin.pos.y - py);
      if (dist < pickupDist) {
        coin.collected = true;
        newlyCollected++;
      }
    }
    if (newlyCollected > 0) {
      setCoins(prev => prev + newlyCollected);
    }

    // Check bow pickup in blue dungeon
    if (map === 'blueDungeon' && !hasBow) {
      const bowPos = getBlueBowPos();
      const dist = Math.hypot(bowPos.x - px, bowPos.y - py);
      if (dist < 1.5) {
        setHasBow(true);
        setLootMessage('🎀 Знайдено бантик Міки!');
        setTimeout(() => setLootMessage(null), 3000);
        // Replace bow tile with floor
        blueDungeonTiles[bowPos.y][bowPos.x] = TileType.DUNGEON_FLOOR;
      }
    }
  }, [hasItem, hasBow]);

  // Monster AI update - works for both dungeons
  const updateMonsterAI = useCallback((time: number, dt: number) => {
    const curMap = currentMapRef.current;
    if (curMap !== 'dungeon' && curMap !== 'blueDungeon') return;
    if (combat.active) return;

    const isFrozen = activeEffects.some(e =>
      (e.type === 'flashFreeze' || e.type === 'timeStop') && e.endsAt > Date.now()
    );
    if (isFrozen) return;

    const isInvisible = activeEffects.some(e => e.type === 'invisibility' && e.endsAt > Date.now());
    const playerPos = playerRef.current;
    const shouldUpdate = time - lastMonsterUpdateRef.current > MONSTER_UPDATE_INTERVAL;
    if (shouldUpdate) lastMonsterUpdateRef.current = time;

    const dtScale = Math.min(dt, 33) / 16.667;
    const speedScale = isMobile ? 0.68 : 1;
    const isSlowed = activeEffects.some(e => e.type === 'slowEnemies' && e.endsAt > Date.now());
    const slowMult = isSlowed ? 0.5 : 1;

    const isBlue = curMap === 'blueDungeon';
    const mapTilesArr = isBlue ? blueDungeonTiles : dungeonTiles;
    const walkCheck = isBlue ? isBlueWalkable : isDungeonWalkable;
    const mWidth = isBlue ? BLUE_WIDTH : DUNGEON_WIDTH;
    const mHeight = isBlue ? BLUE_HEIGHT : DUNGEON_HEIGHT;
    const currentMonstersRef = isBlue ? blueMonstersRef : monstersRef;

    const isWalkableAt = (x: number, y: number) => {
      const tx = Math.floor(x), ty = Math.floor(y);
      const tile = mapTilesArr[ty]?.[tx];
      return tile !== undefined && walkCheck(tile);
    };

    const tryMove = (from: Position, to: Position): Position => {
      if (isWalkableAt(to.x, to.y)) return to;
      if (isWalkableAt(to.x, from.y)) return { x: to.x, y: from.y };
      if (isWalkableAt(from.x, to.y)) return { x: from.x, y: to.y };
      return from;
    };

    const prevMonsters = currentMonstersRef.current;
    let changed = false;

    const nextMonsters = prevMonsters.map((m) => {
      if (!m.isAlive) return m;

      let canSeePlayer = m.state === 'chase' && !isInvisible;
      if (shouldUpdate) {
        canSeePlayer = !isInvisible && hasLineOfSight(m.pos, playerPos, 8, mapTilesArr);
      }

      let newState = m.state;
      if (canSeePlayer) newState = 'chase';
      else if (shouldUpdate && m.state === 'chase') newState = 'patrol';

      const distToPlayer = Math.hypot(m.pos.x - playerPos.x, m.pos.y - playerPos.y);
      if (distToPlayer < 1.1 && !isInvisible) {
        if (!combatStartPendingRef.current) {
          combatStartPendingRef.current = true;
          const encounterMonster = m;
          setTimeout(() => {
            combatStartPendingRef.current = false;
            startCombat(encounterMonster);
          }, 0);
        }
        return m;
      }

      let newPos = m.pos;
      let newPatrolTarget = m.patrolTarget;

      if (newState === 'chase') {
        const dx = playerPos.x - m.pos.x;
        const dy = playerPos.y - m.pos.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 1.2) {
          const step = MONSTER_CHASE_SPEED * speedScale * dtScale * slowMult;
          const nextPos = {
            x: m.pos.x + (dx / dist) * step,
            y: m.pos.y + (dy / dist) * step,
          };
          const moved = tryMove(m.pos, nextPos);
          if (moved.x !== m.pos.x || moved.y !== m.pos.y) {
            newPos = moved;
            changed = true;
          }
        }
      } else {
        if (shouldUpdate) {
          if (!newPatrolTarget || Math.hypot(m.pos.x - newPatrolTarget.x, m.pos.y - newPatrolTarget.y) < 0.35) {
            newPatrolTarget = getRandomPatrolTarget(m.pos, Math.random, mapTilesArr, mWidth, mHeight, walkCheck);
          }
        }

        if (newPatrolTarget) {
          const dx = newPatrolTarget.x - m.pos.x;
          const dy = newPatrolTarget.y - m.pos.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 0.15) {
            const step = MONSTER_SPEED * speedScale * dtScale * slowMult;
            const nextPos = {
              x: m.pos.x + (dx / dist) * step,
              y: m.pos.y + (dy / dist) * step,
            };
            const moved = tryMove(m.pos, nextPos);
            if (moved.x !== m.pos.x || moved.y !== m.pos.y) {
              newPos = moved;
              changed = true;
            } else if (shouldUpdate) {
              newPatrolTarget = null;
            }
          }
        }
      }

      if (newPos !== m.pos || newState !== m.state || newPatrolTarget !== m.patrolTarget) {
        changed = true;
        return { ...m, pos: newPos, state: newState, patrolTarget: newPatrolTarget };
      }

      return m;
    });

    if (changed) currentMonstersRef.current = nextMonsters;
  }, [combat.active, isMobile, startCombat, activeEffects]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let lastTime = -1;
    let coinCheckTimer = 0;

    const loop = (time: number) => {
      if (lastTime < 0) lastTime = time;
      const dt = Math.min(time - lastTime, 33);
      lastTime = time;

      // Update player movement
      if (pathRef.current.length > 0 && pathIndexRef.current < pathRef.current.length) {
        const target = pathRef.current[pathIndexRef.current];
        const dx = target.x - playerRef.current.x;
        const dy = target.y - playerRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 0.15) {
          playerRef.current = { ...target };
          pathIndexRef.current++;
          if (pathIndexRef.current >= pathRef.current.length) {
            pathRef.current = [];
            pathIndexRef.current = 0;
            targetRef.current = null;
          }
        } else {
          const maxStep = PLAYER_SPEED * dt;
          const step = Math.min(maxStep, dist);
          playerRef.current = {
            x: playerRef.current.x + (dx / dist) * step,
            y: playerRef.current.y + (dy / dist) * step,
          };
        }
      }

      // Coin pickup check (throttled)
      coinCheckTimer += dt;
      if (coinCheckTimer > 200) {
        coinCheckTimer = 0;
        checkCoinPickup();
      }

      if (time - playerPosUpdateTimer.current > 100) {
        playerPosUpdateTimer.current = time;
        setPlayerPosState({ ...playerRef.current });
      }

      // Update monster AI
      updateMonsterAI(time, dt);

      // Camera
      const targetIso = toIso(playerRef.current.x, playerRef.current.y);
      cameraRef.current = {
        x: cameraRef.current.x + (targetIso.sx - cameraRef.current.x) * CAMERA_LERP,
        y: cameraRef.current.y + (targetIso.sy - cameraRef.current.y) * CAMERA_LERP,
      };

      // Render
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const mapId = currentMapRef.current;
      ctx.fillStyle = mapId === 'dungeon' ? 'hsl(240, 20%, 5%)' : mapId === 'blueDungeon' ? 'hsl(220, 40%, 5%)' : 'hsl(260, 25%, 8%)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const zoom = zoomRef.current;
      renderMap(ctx, cameraRef.current, canvas.width, canvas.height, zoom, mapId);

      // Render coins
      const currentCoins = mapId === 'city' ? cityCoinsRef.current : mapId === 'blueDungeon' ? blueCoinsRef.current : dungeonCoinsRef.current;
      renderCoins(ctx, currentCoins, cameraRef.current, canvas.width, canvas.height, zoom, time);

      renderPathPreview(ctx, pathRef.current.slice(pathIndexRef.current), cameraRef.current, canvas.width, canvas.height, zoom, time);
      
      if (mapId === 'city') {
        renderNPCs(ctx, npcs, cameraRef.current, canvas.width, canvas.height, zoom, time);
      }
      
      if (mapId === 'dungeon') {
        const aliveMonsters = monstersRef.current.filter(m => m.isAlive);
        renderMonsters(ctx, aliveMonsters, cameraRef.current, canvas.width, canvas.height, zoom, time);
        renderMika(ctx, mikaPos.current, cameraRef.current, canvas.width, canvas.height, zoom, mikaImgRef.current, time);
      }

      if (mapId === 'blueDungeon') {
        const aliveMonsters = blueMonstersRef.current.filter(m => m.isAlive);
        renderMonsters(ctx, aliveMonsters, cameraRef.current, canvas.width, canvas.height, zoom, time);
      }
      
      renderCharacter(ctx, playerRef.current, cameraRef.current, canvas.width, canvas.height, zoom, charImgRef.current);

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [npcs, currentMap, updateMonsterAI, checkCoinPickup]);

  // Pinch zoom
  useEffect(() => {
    let lastDist = 0;
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (lastDist > 0) {
          const delta = (dist - lastDist) * 0.003;
          zoomRef.current = Math.max(0.3, Math.min(1.5, zoomRef.current + delta));
        }
        lastDist = dist;
      }
    };
    const handleTouchEnd = () => { lastDist = 0; };
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomRef.current = Math.max(0.3, Math.min(1.5, zoomRef.current - e.deltaY * 0.001));
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const mapData = getCurrentMapData(currentMap);

  return (
    <div className="fixed inset-0 overflow-hidden bg-background">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-pointer"
        onClick={handleCanvasInteraction}
        onTouchEnd={handleCanvasInteraction}
      />

      {/* Transition overlay */}
      {transitioning && (
        <div className="absolute inset-0 bg-black z-50 transition-opacity duration-500 flex items-center justify-center">
          <p className="text-primary text-xl font-bold animate-pulse">
            {currentMap === 'city' ? '⚔️ Вхід до підземелля...' : currentMap === 'blueDungeon' ? '🔵 Синє підземелля...' : '🏙️ Повернення до міста...'}
          </p>
        </div>
      )}

      {/* Victory overlay */}
      {gameWon && (
        <div className="fixed top-1/4 left-1/2 -translate-x-1/2 z-50 glass-panel px-6 py-4 neon-glow text-center space-y-2">
          <h2 className="font-display text-2xl text-primary font-bold">🎉 ПЕРЕМОГА! 🎉</h2>
          <p className="text-foreground text-sm">Ти знайшла Міку та її бантик! Подружки знову разом! 💕🎀</p>
          <button
            onClick={handleRestart}
            className="mt-2 px-4 py-2 rounded-md bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-xs font-display transition-all active:scale-95"
          >
            Грати знову
          </button>
        </div>
      )}

      {/* Loot message */}
      {lootMessage && (
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 glass-panel px-4 py-2 neon-glow animate-float">
          <p className="text-foreground text-sm font-bold font-display">{lootMessage}</p>
        </div>
      )}

      <GameHUD
        questCount={questLog.length}
        onQuestLogToggle={() => setShowQuestLog(prev => !prev)}
        onInventoryToggle={() => setShowInventory(prev => !prev)}
        playerStats={playerStats}
        coins={coins}
        currentMap={currentMap}
      />

      {/* Map indicator */}
      <div className="fixed top-14 right-3 z-40">
        <div className="glass-panel px-3 py-1 rounded-full text-xs font-bold" style={{ 
          color: currentMap === 'dungeon' ? '#e74c3c' : currentMap === 'blueDungeon' ? '#3498db' : '#4a9e5c' 
        }}>
          {currentMap === 'dungeon' ? '⚔️ Підземелля' : currentMap === 'blueDungeon' ? '🔵 Синє підземелля' : '🏙️ Місто'}
          {hasBow && currentMap !== 'city' && ' 🎀'}
        </div>
      </div>

      <MiniMap
        playerPos={playerPosState}
        npcs={currentMap === 'city' ? npcs : []}
        mapTiles={mapData.tiles}
        mapWidth={mapData.width}
        mapHeight={mapData.height}
        isDungeon={currentMap === 'dungeon' || currentMap === 'blueDungeon'}
      />

      {/* Start button under minimap */}
      <div className="fixed z-40" style={{ top: (currentMap === 'dungeon' || currentMap === 'blueDungeon') ? '190px' : '130px', left: '12px' }}>
        <button
          onClick={handleRestart}
          className="glass-panel px-3 py-1.5 text-xs font-display font-bold text-primary 
                     hover:bg-primary/20 active:scale-95 transition-all border border-primary/30"
        >
          🔄 Start
        </button>
      </div>

      {showQuestLog && (
        <QuestLog
          entries={questLog}
          onClose={() => setShowQuestLog(false)}
        />
      )}

      {showInventory && (
        <InventoryUI
          items={inventory}
          coins={coins}
          playerStats={playerStats}
          onUse={useItem}
          onClose={() => setShowInventory(false)}
          characterImg={charImgRef.current}
        />
      )}

      {showShop && (
        <ShopUI
          coins={coins}
          inventory={inventory}
          onBuy={handleBuy}
          onClose={() => setShowShop(false)}
        />
      )}

      {currentDialogue && (() => {
        // Filter responses based on conditions
        const filteredDialogue = {
          ...currentDialogue,
          responses: currentDialogue.responses?.filter(r => {
            if (r.condition === 'has_bow') return hasBow;
            return true;
          }),
        };
        return (
          <DialogueBox
            dialogue={filteredDialogue}
            npcName={activeNpc?.name || ''}
            npcIcon={activeNpc?.icon || ''}
            onResponse={handleDialogueResponse}
            onEnd={handleDialogueEnd}
          />
        );
      })()}

      <CombatUI
        combat={combat}
        playerStats={playerStats}
        onAttack={handleCombatAttack}
        onDefend={handleCombatDefend}
        onFlee={handleCombatFlee}
        onEnd={handleCombatEnd}
      />
    </div>
  );
}
