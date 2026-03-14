import { Position, TileType } from './types';
import { mapTiles, MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, getTileColor, getBuildingHeight } from './mapData';

const HALF_W = TILE_SIZE / 2;
const HALF_H = TILE_SIZE / 4;

export function toIso(x: number, y: number): { sx: number; sy: number } {
  return {
    sx: (x - y) * HALF_W,
    sy: (x + y) * HALF_H,
  };
}

export function fromIso(sx: number, sy: number): { x: number; y: number } {
  return {
    x: (sx / HALF_W + sy / HALF_H) / 2,
    y: (sy / HALF_H - sx / HALF_W) / 2,
  };
}

export function renderMap(
  ctx: CanvasRenderingContext2D,
  camera: Position,
  canvasW: number,
  canvasH: number,
  zoom: number
) {
  ctx.save();
  ctx.translate(canvasW / 2, canvasH / 3);
  ctx.scale(zoom, zoom);
  ctx.translate(-camera.x, -camera.y);

  // Render tiles back to front for proper overlap
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      const tile = mapTiles[y]?.[x] ?? 0;
      const { sx, sy } = toIso(x, y);
      
      renderTile(ctx, sx, sy, tile);
    }
  }

  ctx.restore();
}

function renderTile(ctx: CanvasRenderingContext2D, sx: number, sy: number, tile: number) {
  const color = getTileColor(tile);
  const height = getBuildingHeight(tile);

  // Draw flat tile (diamond)
  ctx.beginPath();
  ctx.moveTo(sx, sy - HALF_H);
  ctx.lineTo(sx + HALF_W, sy);
  ctx.lineTo(sx, sy + HALF_H);
  ctx.lineTo(sx - HALF_W, sy);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Road markings
  if (tile === TileType.ROAD) {
    ctx.beginPath();
    ctx.moveTo(sx - 2, sy - 2);
    ctx.lineTo(sx + 2, sy + 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Water shimmer
  if (tile === TileType.WATER) {
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.ellipse(sx, sy, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw building height
  if (height > 0 && tile !== TileType.TREE) {
    // Left face
    ctx.beginPath();
    ctx.moveTo(sx - HALF_W, sy);
    ctx.lineTo(sx, sy + HALF_H);
    ctx.lineTo(sx, sy + HALF_H - height);
    ctx.lineTo(sx - HALF_W, sy - height);
    ctx.closePath();
    ctx.fillStyle = darken(color, 0.2);
    ctx.fill();
    ctx.stroke();

    // Right face
    ctx.beginPath();
    ctx.moveTo(sx + HALF_W, sy);
    ctx.lineTo(sx, sy + HALF_H);
    ctx.lineTo(sx, sy + HALF_H - height);
    ctx.lineTo(sx + HALF_W, sy - height);
    ctx.closePath();
    ctx.fillStyle = darken(color, 0.35);
    ctx.fill();
    ctx.stroke();

    // Top face
    ctx.beginPath();
    ctx.moveTo(sx, sy - HALF_H - height);
    ctx.lineTo(sx + HALF_W, sy - height);
    ctx.lineTo(sx, sy + HALF_H - height);
    ctx.lineTo(sx - HALF_W, sy - height);
    ctx.closePath();
    ctx.fillStyle = lighten(color, 0.1);
    ctx.fill();
    ctx.stroke();

    // Windows for buildings
    if (tile === TileType.BUILDING || tile === TileType.BUILDING_RED || tile === TileType.BUILDING_LIGHT) {
      drawWindows(ctx, sx, sy, height, tile);
    }
  }

  // Tree rendering
  if (tile === TileType.TREE) {
    // Trunk
    ctx.fillStyle = '#5c4033';
    ctx.fillRect(sx - 2, sy - 10, 4, 10);
    
    // Canopy - layered circles
    const colors = ['#1a5c28', '#2d7a3a', '#3d9a4a'];
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(sx + (i - 1) * 4, sy - 15 - i * 3, 8 - i, 0, Math.PI * 2);
      ctx.fillStyle = colors[i];
      ctx.fill();
    }
  }
}

function drawWindows(ctx: CanvasRenderingContext2D, sx: number, sy: number, height: number, tile: number) {
  const windowColor = tile === TileType.BUILDING_RED ? '#ffeb3b' : '#ffd54f';
  const windowSize = 3;
  
  // Front face windows
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      const wx = sx - 6 + col * 8;
      const wy = sy - height + 8 + row * 10;
      ctx.fillStyle = Math.random() > 0.3 ? windowColor : 'rgba(0,0,0,0.3)';
      ctx.fillRect(wx, wy, windowSize, windowSize + 1);
    }
  }
}

function darken(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.max(0, r * (1 - amount))}, ${Math.max(0, g * (1 - amount))}, ${Math.max(0, b * (1 - amount))})`;
}

function lighten(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.min(255, r * (1 + amount))}, ${Math.min(255, g * (1 + amount))}, ${Math.min(255, b * (1 + amount))})`;
}

export function renderCharacter(
  ctx: CanvasRenderingContext2D,
  pos: Position,
  camera: Position,
  canvasW: number,
  canvasH: number,
  zoom: number,
  charImage: HTMLImageElement | null
) {
  ctx.save();
  ctx.translate(canvasW / 2, canvasH / 3);
  ctx.scale(zoom, zoom);
  ctx.translate(-camera.x, -camera.y);

  const { sx, sy } = toIso(pos.x, pos.y);

  if (charImage && charImage.complete) {
    const size = 40;
    ctx.drawImage(charImage, sx - size / 2, sy - size + 5, size, size);
  } else {
    // Fallback circle
    ctx.beginPath();
    ctx.arc(sx, sy - 12, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#e040fb';
    ctx.fill();
    ctx.strokeStyle = '#1a0a20';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.restore();
}

export function renderNPCs(
  ctx: CanvasRenderingContext2D,
  npcs: { pos: Position; icon: string; name: string }[],
  camera: Position,
  canvasW: number,
  canvasH: number,
  zoom: number,
  time: number
) {
  ctx.save();
  ctx.translate(canvasW / 2, canvasH / 3);
  ctx.scale(zoom, zoom);
  ctx.translate(-camera.x, -camera.y);

  for (const npc of npcs) {
    const { sx, sy } = toIso(npc.pos.x, npc.pos.y);
    const floatY = Math.sin(time * 0.003) * 3;

    // NPC shadow
    ctx.beginPath();
    ctx.ellipse(sx, sy + 2, 10, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();

    // NPC icon background
    ctx.beginPath();
    ctx.arc(sx, sy - 15 + floatY, 14, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 10, 20, 0.85)';
    ctx.fill();
    ctx.strokeStyle = 'hsla(320, 100%, 60%, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // NPC emoji
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(npc.icon, sx, sy - 14 + floatY);

    // Interaction prompt "!" floating above
    const pulseScale = 0.8 + Math.sin(time * 0.005) * 0.2;
    ctx.font = `bold ${14 * pulseScale}px Syne, sans-serif`;
    ctx.fillStyle = '#ff4081';
    ctx.shadowColor = 'rgba(255, 64, 129, 0.8)';
    ctx.shadowBlur = 10;
    ctx.fillText('!', sx, sy - 35 + floatY);
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

export function renderPathPreview(
  ctx: CanvasRenderingContext2D,
  path: Position[],
  camera: Position,
  canvasW: number,
  canvasH: number,
  zoom: number,
  time: number
) {
  if (path.length < 2) return;

  ctx.save();
  ctx.translate(canvasW / 2, canvasH / 3);
  ctx.scale(zoom, zoom);
  ctx.translate(-camera.x, -camera.y);

  ctx.strokeStyle = 'hsla(320, 100%, 60%, 0.4)';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.lineDashOffset = -time * 0.02;

  ctx.beginPath();
  for (let i = 0; i < path.length; i++) {
    const { sx, sy } = toIso(path[i].x, path[i].y);
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Target marker
  const last = path[path.length - 1];
  const { sx, sy } = toIso(last.x, last.y);
  const pulse = 0.7 + Math.sin(time * 0.005) * 0.3;
  ctx.beginPath();
  ctx.arc(sx, sy, 5 * pulse, 0, Math.PI * 2);
  ctx.fillStyle = `hsla(320, 100%, 60%, ${pulse})`;
  ctx.fill();

  ctx.restore();
}
