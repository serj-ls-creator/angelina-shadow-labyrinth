import { useRef, useEffect, useState, useCallback } from 'react';
import { Position, MapId } from '../game/types';
import { findPath } from '../game/pathfinding';
import { renderMap, renderCharacter, renderNPCs, renderPathPreview, renderMonsters, renderMika, toIso, fromIso } from '../game/renderer';
import { npcs as npcData } from '../game/dialogueData';
import { NPC, DialogueNode, QuestEntry } from '../game/types';
import { dialogues } from '../game/dialogueData';
import { getCurrentMapData, findPortalNearby } from '../game/mapSystem';
import { Monster, CombatState, PlayerCombatStats, generateDungeonMonsters, createInitialPlayerStats, performAttack, getXpForLevel, hasLineOfSight, getRandomPatrolTarget, findFarthestPoint } from '../game/combatSystem';
import { isDungeonWalkable, dungeonTiles, DUNGEON_WIDTH, DUNGEON_HEIGHT } from '../game/dungeonMapData';
import characterSrc from '@/assets/character-kuromi-girl.png';
import mikaSrc from '@/assets/character-mika.png';
import DialogueBox from './DialogueBox';
import CombatUI from './CombatUI';
import GameHUD from './GameHUD';
import QuestLog from './QuestLog';
import MiniMap from './MiniMap';

const PLAYER_SPEED = 0.06;
const NPC_INTERACT_DIST = 2.5;
const CAMERA_LERP = 0.08;
const MONSTER_INTERACT_DIST = 2;
const MONSTER_SPEED = 0.015;
const MONSTER_CHASE_SPEED = 0.03;
const MONSTER_UPDATE_INTERVAL = 500; // ms between AI updates

export default function GameCanvas() {
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

  // Mika position
  const mikaPos = useRef<Position>(findFarthestPoint());

  // Combat state - monsters live in ref only, render snapshot updated at lower frequency
  const monstersRef = useRef<Monster[]>(generateDungeonMonsters());
  const [monstersSnapshot, setMonstersSnapshot] = useState<Monster[]>(() => monstersRef.current);
  const monsterSnapshotTimer = useRef(0);
  const [playerStats, setPlayerStats] = useState<PlayerCombatStats>(createInitialPlayerStats);
  const playerStatsRef = useRef<PlayerCombatStats>(createInitialPlayerStats());
  const [combat, setCombat] = useState<CombatState>({
    active: false, monster: null, playerTurn: true, log: [], result: 'none',
  });
  const defendingRef = useRef(false);
  const lastMonsterUpdateRef = useRef(0);
  const [playerPosState, setPlayerPosState] = useState<Position>({ x: 15, y: 15 });
  const playerPosUpdateTimer = useRef(0);

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

  // Restart game
  const handleRestart = useCallback(() => {
    playerRef.current = { x: 15, y: 15 };
    targetRef.current = null;
    pathRef.current = [];
    pathIndexRef.current = 0;
    currentMapRef.current = 'city';
    setCurrentMap('city');
    monstersRef.current = generateDungeonMonsters();
    setMonstersSnapshot(monstersRef.current);
    setPlayerStats(createInitialPlayerStats());
    mikaPos.current = findFarthestPoint();
    setGameWon(false);
    setCurrentDialogue(null);
    setActiveNpc(null);
    setQuestLog([
      { id: 'main', title: 'Знайти Міку', description: 'Подружка Міку зникла. Потрібно розпитати людей у місті.', completed: false, timestamp: '14 годин тому' },
    ]);
    setNpcs(npcData.map(n => ({ ...n })));
    setCombat({ active: false, monster: null, playerTurn: true, log: [], result: 'none' });
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
        // Mark monster as dead in ref
        const mId = prev.monster!.id;
        monstersRef.current = monstersRef.current.map(m => m.id === mId ? { ...m, isAlive: false } : m);
        setMonstersSnapshot([...monstersRef.current]);
        const xpGain = prev.monster.xpReward;
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
        return { ...prev, monster: { ...prev.monster, hp: 0 }, log: [...log, `🎉 ${prev.monster.name} переможений!`], result: 'win' };
      }

      setTimeout(() => {
        setCombat(c => {
          if (!c.monster || c.result !== 'none') return c;
          const def = defendingRef.current ? { defense: playerStatsRef.current.defense * 2 } : playerStatsRef.current;
          const { damage: mDmg, critical: mCrit } = performAttack(c.monster, def, combatRand);
          const actualDmg = defendingRef.current ? Math.max(1, Math.floor(mDmg / 2)) : mDmg;
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
  }, [combatRand]);

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
          const actualDmg = Math.max(1, Math.floor(mDmg / 2));
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
  }, [combatRand]);

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
          setPlayerStats(ps => {
            const newHp = ps.hp - mDmg;
            if (newHp <= 0) {
              setCombat(cc => ({ ...cc, log: [...cc.log, `💀 Не вдалося втекти...`], result: 'lose' }));
              return { ...ps, hp: 0 };
            }
            return { ...ps, hp: newHp };
          });
          return { ...c, log: [...c.log, `❌ Не вдалося втекти! ${c.monster.name} завдає ${mDmg} шкоди!`], playerTurn: true };
        });
      }, 600);
      return { ...prev, log: [...prev.log, '❌ Втеча не вдалася!'], playerTurn: false };
    });
  }, [combatRand]);

  const handleCombatEnd = useCallback(() => {
    if (combat.result === 'lose') {
      setPlayerStats(ps => ({ ...ps, hp: Math.max(10, Math.floor(ps.maxHp / 2)) }));
      switchMap('city', { x: 15, y: 15 });
    }
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

    if (currentDialogue || transitioning || combat.active) return;

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

    // Check monster interaction (dungeon only)
    if (currentMapRef.current === 'dungeon') {
      for (const monster of monstersRef.current) {
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
  }, [currentDialogue, npcs, transitioning, switchMap, startCombat, combat.active, gameWon, startDialogue]);

  const handleDialogueResponse = useCallback((nextId: string) => {
    const next = dialogues[nextId];
    if (next) {
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

  // Monster AI update
  const updateMonsterAI = useCallback((time: number, dt: number) => {
    if (currentMapRef.current !== 'dungeon' || combat.active) return;

    const playerPos = playerRef.current;
    const shouldUpdate = time - lastMonsterUpdateRef.current > MONSTER_UPDATE_INTERVAL;
    if (shouldUpdate) lastMonsterUpdateRef.current = time;

    setMonsters(prevMonsters => {
      let changed = false;
      const newMonsters = prevMonsters.map(m => {
        if (!m.isAlive) return m;

        // Check line of sight to player
        const canSeePlayer = hasLineOfSight(m.pos, playerPos, 8);
        
        let newState = m.state;
        if (canSeePlayer) {
          newState = 'chase';
        } else if (m.state === 'chase') {
          newState = 'patrol';
        }

        // Check if monster is adjacent to player -> start combat
        const distToPlayer = Math.sqrt(
          (m.pos.x - playerPos.x) ** 2 + (m.pos.y - playerPos.y) ** 2
        );
        if (distToPlayer < 1.2) {
          // Monster touches player - start combat
          setTimeout(() => startCombat(m), 0);
          return m;
        }

        let newPos = { ...m.pos };
        let newPatrolTarget = m.patrolTarget;

        if (newState === 'chase') {
          // Move toward player
          const dx = playerPos.x - m.pos.x;
          const dy = playerPos.y - m.pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 1.2) {
            const step = MONSTER_CHASE_SPEED * dt;
            const nx = m.pos.x + (dx / dist) * step;
            const ny = m.pos.y + (dy / dist) * step;
            const tileAtNew = dungeonTiles[Math.round(ny)]?.[Math.round(nx)];
            if (tileAtNew !== undefined && isDungeonWalkable(tileAtNew)) {
              newPos = { x: nx, y: ny };
              changed = true;
            }
          }
        } else {
          // Patrol: pick random target and slowly move
          if (shouldUpdate) {
            if (!newPatrolTarget || (Math.abs(m.pos.x - newPatrolTarget.x) < 0.3 && Math.abs(m.pos.y - newPatrolTarget.y) < 0.3)) {
              newPatrolTarget = getRandomPatrolTarget(m.pos, Math.random);
            }
          }
          if (newPatrolTarget) {
            const dx = newPatrolTarget.x - m.pos.x;
            const dy = newPatrolTarget.y - m.pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0.2) {
              const step = MONSTER_SPEED * dt;
              const nx = m.pos.x + (dx / dist) * step;
              const ny = m.pos.y + (dy / dist) * step;
              const tileAtNew = dungeonTiles[Math.round(ny)]?.[Math.round(nx)];
              if (tileAtNew !== undefined && isDungeonWalkable(tileAtNew)) {
                newPos = { x: nx, y: ny };
                changed = true;
              } else {
                newPatrolTarget = null;
              }
            }
          }
        }

        if (newPos.x !== m.pos.x || newPos.y !== m.pos.y || newState !== m.state || newPatrolTarget !== m.patrolTarget) {
          changed = true;
          return { ...m, pos: newPos, state: newState, patrolTarget: newPatrolTarget };
        }
        return m;
      });
      return changed ? newMonsters : prevMonsters;
    });
  }, [combat.active, startCombat]);

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
      ctx.fillStyle = mapId === 'dungeon' ? 'hsl(240, 20%, 5%)' : 'hsl(260, 25%, 8%)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const zoom = zoomRef.current;
      renderMap(ctx, cameraRef.current, canvas.width, canvas.height, zoom, mapId);
      renderPathPreview(ctx, pathRef.current.slice(pathIndexRef.current), cameraRef.current, canvas.width, canvas.height, zoom, time);
      
      if (mapId === 'city') {
        renderNPCs(ctx, npcs, cameraRef.current, canvas.width, canvas.height, zoom, time);
      }
      
      // Render dungeon entities
      if (mapId === 'dungeon') {
        const aliveMonsters = monstersRef.current.filter(m => m.isAlive);
        renderMonsters(ctx, aliveMonsters, cameraRef.current, canvas.width, canvas.height, zoom, time);
        renderMika(ctx, mikaPos.current, cameraRef.current, canvas.width, canvas.height, zoom, mikaImgRef.current, time);
      }
      
      renderCharacter(ctx, playerRef.current, cameraRef.current, canvas.width, canvas.height, zoom, charImgRef.current);

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [npcs, currentMap, monsters, updateMonsterAI]);

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
          <p className="text-purple-400 text-xl font-bold animate-pulse">
            {currentMap === 'city' ? '⚔️ Вхід до підземелля...' : '🏙️ Повернення до міста...'}
          </p>
        </div>
      )}

      {/* Victory overlay */}
      {gameWon && (
        <div className="fixed top-1/4 left-1/2 -translate-x-1/2 z-50 glass-panel px-6 py-4 neon-glow text-center space-y-2">
          <h2 className="font-display text-2xl text-primary font-bold">🎉 ПЕРЕМОГА! 🎉</h2>
          <p className="text-foreground text-sm">Ти знайшла Міку! Подружки знову разом! 💕</p>
          <button
            onClick={handleRestart}
            className="mt-2 px-4 py-2 rounded-md bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-xs font-display transition-all active:scale-95"
          >
            Грати знову
          </button>
        </div>
      )}

      <GameHUD
        gameTime={gameTime}
        questCount={questLog.length}
        onQuestLogToggle={() => setShowQuestLog(prev => !prev)}
        playerStats={currentMap === 'dungeon' ? playerStats : undefined}
      />

      {/* Map indicator */}
      <div className="fixed top-14 right-3 z-40">
        <div className="glass-panel px-3 py-1 rounded-full text-xs font-bold" style={{ color: currentMap === 'dungeon' ? '#e74c3c' : '#4a9e5c' }}>
          {currentMap === 'dungeon' ? '⚔️ Підземелля' : '🏙️ Місто'}
        </div>
      </div>

      <MiniMap
        playerPos={playerRef.current}
        npcs={currentMap === 'city' ? npcs : []}
        mapTiles={mapData.tiles}
        mapWidth={mapData.width}
        mapHeight={mapData.height}
        isDungeon={currentMap === 'dungeon'}
      />

      {/* Start button under minimap */}
      <div className="fixed z-40" style={{ top: currentMap === 'dungeon' ? '190px' : '130px', left: '12px' }}>
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

      {currentDialogue && (
        <DialogueBox
          dialogue={currentDialogue}
          npcName={activeNpc?.name || ''}
          npcIcon={activeNpc?.icon || ''}
          onResponse={handleDialogueResponse}
          onEnd={handleDialogueEnd}
        />
      )}

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
