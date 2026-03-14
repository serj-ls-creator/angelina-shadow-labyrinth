import { useRef, useEffect, useState, useCallback } from 'react';
import { Position } from '../game/types';
import { findPath } from '../game/pathfinding';
import { renderMap, renderCharacter, renderNPCs, renderPathPreview, toIso, fromIso } from '../game/renderer';
import { isWalkable, mapTiles } from '../game/mapData';
import { npcs as npcData } from '../game/dialogueData';
import { NPC, DialogueNode, QuestEntry } from '../game/types';
import { dialogues } from '../game/dialogueData';
import characterSrc from '@/assets/character-kuromi-girl.png';
import DialogueBox from './DialogueBox';
import GameHUD from './GameHUD';
import QuestLog from './QuestLog';
import MiniMap from './MiniMap';

const TILE_SIZE = 64;
const HALF_W = TILE_SIZE / 2;
const HALF_H = TILE_SIZE / 4;
const PLAYER_SPEED = 0.06;
const NPC_INTERACT_DIST = 2.5;
const CAMERA_LERP = 0.08;

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const charImgRef = useRef<HTMLImageElement | null>(null);

  const playerRef = useRef<Position>({ x: 15, y: 15 });
  const targetRef = useRef<Position | null>(null);
  const pathRef = useRef<Position[]>([]);
  const pathIndexRef = useRef(0);
  const cameraRef = useRef<Position>({ x: 0, y: 0 });
  const zoomRef = useRef(0.7);

  const [npcs, setNpcs] = useState<NPC[]>(npcData.map(n => ({ ...n })));
  const [currentDialogue, setCurrentDialogue] = useState<DialogueNode | null>(null);
  const [activeNpc, setActiveNpc] = useState<NPC | null>(null);
  const [questLog, setQuestLog] = useState<QuestEntry[]>([
    { id: 'main', title: 'Найти Мику', description: 'Подруга Мику пропала. Нужно расспросить людей в городе.', completed: false, timestamp: '14 часов назад' },
  ]);
  const [showQuestLog, setShowQuestLog] = useState(false);
  const [gameTime, setGameTime] = useState('21:47');

  // Load character image
  useEffect(() => {
    const img = new Image();
    img.src = characterSrc;
    img.onload = () => { charImgRef.current = img; };
  }, []);

  // Initialize camera
  useEffect(() => {
    const { sx, sy } = toIso(playerRef.current.x, playerRef.current.y);
    cameraRef.current = { x: sx, y: sy };
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (currentDialogue) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;

    // Convert screen to world
    const zoom = zoomRef.current;
    const worldX = (canvasX - canvas.width / 2) / zoom + cameraRef.current.x;
    const worldY = (canvasY - canvas.height / 3) / zoom + cameraRef.current.y;

    const tile = fromIso(worldX, worldY);
    const tileX = Math.floor(tile.x);
    const tileY = Math.floor(tile.y);

    // Check NPC interaction
    for (const npc of npcs) {
      const dx = npc.pos.x - tileX;
      const dy = npc.pos.y - tileY;
      if (Math.sqrt(dx * dx + dy * dy) < NPC_INTERACT_DIST) {
        // Walk to NPC then interact
        const path = findPath(
          { x: Math.round(playerRef.current.x), y: Math.round(playerRef.current.y) },
          { x: Math.round(npc.pos.x), y: Math.round(npc.pos.y) }
        );
        if (path.length > 0) {
          // Remove last step so we don't stand on NPC
          if (path.length > 1) path.pop();
          pathRef.current = path;
          pathIndexRef.current = 0;
          targetRef.current = path[path.length - 1];
          // Set a flag to interact after reaching
          setTimeout(() => {
            startDialogue(npc);
          }, path.length * 120);
        } else {
          startDialogue(npc);
        }
        return;
      }
    }

    // Normal movement
    if (tileX >= 0 && tileX < 40 && tileY >= 0 && tileY < 30 && isWalkable(mapTiles[tileY]?.[tileX])) {
      const path = findPath(
        { x: Math.round(playerRef.current.x), y: Math.round(playerRef.current.y) },
        { x: tileX, y: tileY }
      );
      if (path.length > 0) {
        pathRef.current = path;
        pathIndexRef.current = 0;
        targetRef.current = path[path.length - 1];
      }
    }
  }, [currentDialogue, npcs]);

  const startDialogue = useCallback((npc: NPC) => {
    setActiveNpc(npc);
    setCurrentDialogue(dialogues[npc.dialogueId]);
    setNpcs(prev => prev.map(n => n.id === npc.id ? { ...n, hasInteracted: true } : n));
  }, []);

  const handleDialogueResponse = useCallback((nextId: string) => {
    const next = dialogues[nextId];
    if (next) {
      if (next.questUpdate) {
        setQuestLog(prev => [...prev, {
          id: `quest_${Date.now()}`,
          title: 'Новая зацепка!',
          description: next.questUpdate!,
          completed: false,
          timestamp: gameTime,
        }]);
      }
      setCurrentDialogue(next);
    } else {
      setCurrentDialogue(null);
      setActiveNpc(null);
    }
  }, [gameTime]);

  const handleDialogueEnd = useCallback(() => {
    if (currentDialogue?.questUpdate) {
      setQuestLog(prev => [...prev, {
        id: `quest_${Date.now()}`,
        title: 'Новая зацепка!',
        description: currentDialogue.questUpdate!,
        completed: false,
        timestamp: gameTime,
      }]);
    }
    setCurrentDialogue(null);
    setActiveNpc(null);
  }, [currentDialogue, gameTime]);

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

    let lastTime = 0;

    const loop = (time: number) => {
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
          playerRef.current = {
            x: playerRef.current.x + (dx / dist) * PLAYER_SPEED * dt,
            y: playerRef.current.y + (dy / dist) * PLAYER_SPEED * dt,
          };
        }
      }

      // Update camera (smooth follow)
      const targetIso = toIso(playerRef.current.x, playerRef.current.y);
      cameraRef.current = {
        x: cameraRef.current.x + (targetIso.sx - cameraRef.current.x) * CAMERA_LERP,
        y: cameraRef.current.y + (targetIso.sy - cameraRef.current.y) * CAMERA_LERP,
      };

      // Render
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Background
      ctx.fillStyle = 'hsl(260, 25%, 8%)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const zoom = zoomRef.current;
      renderMap(ctx, cameraRef.current, canvas.width, canvas.height, zoom);
      renderPathPreview(ctx, pathRef.current.slice(pathIndexRef.current), cameraRef.current, canvas.width, canvas.height, zoom, time);
      renderNPCs(ctx, npcs, cameraRef.current, canvas.width, canvas.height, zoom, time);
      renderCharacter(ctx, playerRef.current, cameraRef.current, canvas.width, canvas.height, zoom, charImgRef.current);

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [npcs]);

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

  return (
    <div className="fixed inset-0 overflow-hidden bg-background">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-pointer"
        onClick={handleCanvasClick}
        onTouchStart={handleCanvasClick}
      />

      <GameHUD
        gameTime={gameTime}
        questCount={questLog.length}
        onQuestLogToggle={() => setShowQuestLog(prev => !prev)}
      />

      <MiniMap
        playerPos={playerRef.current}
        npcs={npcs}
      />

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
    </div>
  );
}
