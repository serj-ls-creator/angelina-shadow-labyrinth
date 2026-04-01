import { Position, TileType, MapId } from './types';
import { mapTiles, MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, getTileColor, getBuildingHeight } from './mapData';
import { dungeonTiles, DUNGEON_WIDTH, DUNGEON_HEIGHT, getDungeonTileColor, getDungeonBuildingHeight } from './dungeonMapData';
import { blueDungeonTiles, BLUE_WIDTH, BLUE_HEIGHT, getBlueTileColor, getBlueBuildingHeight } from './blueDungeonMapData';

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

function getMapData(mapId: MapId) {
  if (mapId === 'dungeon') {
    return { tiles: dungeonTiles, width: DUNGEON_WIDTH, height: DUNGEON_HEIGHT };
  }
  if (mapId === 'blueDungeon') {
    return { tiles: blueDungeonTiles, width: BLUE_WIDTH, height: BLUE_HEIGHT };
  }
  return { tiles: mapTiles, width: MAP_WIDTH, height: MAP_HEIGHT };
}

export function renderMap(
  ctx: CanvasRenderingContext2D,
  camera: Position,
  canvasW: number,
  canvasH: number,
  zoom: number,
  mapId: MapId = 'city'
) {
  const { tiles, width, height } = getMapData(mapId);

  ctx.save();
  ctx.translate(canvasW / 2, canvasH / 3);
  ctx.scale(zoom, zoom);
  ctx.translate(-camera.x, -camera.y);

  const halfW = (canvasW / 2) / zoom;
  const halfH = (canvasH / 3) / zoom;
  const viewLeft = camera.x - halfW - TILE_SIZE;
  const viewRight = camera.x + halfW + TILE_SIZE;
  const viewTop = camera.y - halfH - 60;
  const viewBottom = camera.y + halfH + TILE_SIZE;

  const topLeft = fromIso(viewLeft, viewTop);
  const topRight = fromIso(viewRight, viewTop);
  const botLeft = fromIso(viewLeft, viewBottom);
  const botRight = fromIso(viewRight, viewBottom);

  const minTileX = Math.max(0, Math.floor(Math.min(topLeft.x, botLeft.x)) - 2);
  const maxTileX = Math.min(width - 1, Math.ceil(Math.max(topRight.x, botRight.x)) + 2);
  const minTileY = Math.max(0, Math.floor(Math.min(topLeft.y, topRight.y)) - 2);
  const maxTileY = Math.min(height - 1, Math.ceil(Math.max(botLeft.y, botRight.y)) + 2);

  for (let y = minTileY; y <= maxTileY; y++) {
    for (let x = minTileX; x <= maxTileX; x++) {
      const tile = tiles[y]?.[x] ?? 0;
      if (tile === 0) continue;
      const { sx, sy } = toIso(x, y);
      if (sx < viewLeft || sx > viewRight || sy < viewTop || sy > viewBottom) continue;
      renderTile(ctx, sx, sy, tile, x, y, mapId);
    }
  }

  ctx.restore();
}

function renderTile(ctx: CanvasRenderingContext2D, sx: number, sy: number, tile: number, tileX: number, tileY: number, mapId: MapId) {
  const isDungeon = mapId === 'dungeon';
  const color = isDungeon ? getDungeonTileColor(tile) : getTileColor(tile);
  const height = isDungeon ? getDungeonBuildingHeight(tile) : getBuildingHeight(tile, tileX, tileY);

  ctx.beginPath();
  ctx.moveTo(sx, sy - HALF_H);
  ctx.lineTo(sx + HALF_W, sy);
  ctx.lineTo(sx, sy + HALF_H);
  ctx.lineTo(sx - HALF_W, sy);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = isDungeon ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  if (!isDungeon) {
    if (tile === TileType.ROAD) {
      ctx.beginPath();
      ctx.moveTo(sx - 2, sy - 2);
      ctx.lineTo(sx + 2, sy + 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  if (tile === TileType.WATER) {
    ctx.fillStyle = isDungeon ? 'rgba(100,180,255,0.2)' : 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.ellipse(sx, sy, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    if (isDungeon) {
      ctx.fillStyle = 'rgba(50,120,200,0.15)';
      ctx.beginPath();
      ctx.ellipse(sx - 3, sy + 1, 5, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (isDungeon) {
    if (tile === TileType.LAVA) {
      ctx.fillStyle = 'rgba(255,200,50,0.3)';
      ctx.beginPath();
      ctx.ellipse(sx, sy, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,100,0,0.15)';
      ctx.beginPath();
      ctx.ellipse(sx, sy, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (tile === TileType.PORTAL) {
      ctx.fillStyle = 'rgba(156,39,176,0.4)';
      ctx.beginPath();
      ctx.ellipse(sx, sy, 16, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(200,100,255,0.3)';
      ctx.beginPath();
      ctx.ellipse(sx, sy, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (tile === TileType.DUNGEON_BONES) {
      ctx.fillStyle = 'rgba(200,200,180,0.5)';
      ctx.fillRect(sx - 3, sy - 1, 6, 2);
      ctx.fillRect(sx - 1, sy - 3, 2, 6);
    }

    if (tile === TileType.DUNGEON_MOSS) {
      ctx.fillStyle = 'rgba(50,120,50,0.3)';
      ctx.beginPath();
      ctx.arc(sx - 3, sy, 3, 0, Math.PI * 2);
      ctx.arc(sx + 2, sy - 1, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (height > 0 && tile !== TileType.TREE) {
    ctx.beginPath();
    ctx.moveTo(sx - HALF_W, sy);
    ctx.lineTo(sx, sy + HALF_H);
    ctx.lineTo(sx, sy + HALF_H - height);
    ctx.lineTo(sx - HALF_W, sy - height);
    ctx.closePath();
    ctx.fillStyle = darken(color, 0.2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(sx + HALF_W, sy);
    ctx.lineTo(sx, sy + HALF_H);
    ctx.lineTo(sx, sy + HALF_H - height);
    ctx.lineTo(sx + HALF_W, sy - height);
    ctx.closePath();
    ctx.fillStyle = darken(color, 0.35);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(sx, sy - HALF_H - height);
    ctx.lineTo(sx + HALF_W, sy - height);
    ctx.lineTo(sx, sy + HALF_H - height);
    ctx.lineTo(sx - HALF_W, sy - height);
    ctx.closePath();
    ctx.fillStyle = isDungeon ? darken(color, 0.1) : lighten(color, 0.1);
    ctx.fill();
    ctx.stroke();

    if (!isDungeon && (tile === TileType.BUILDING || tile === TileType.BUILDING_RED || tile === TileType.BUILDING_LIGHT)) {
      drawWindows(ctx, sx, sy, height, tile, tileX, tileY);
    }

    if (isDungeon && (tile === TileType.DUNGEON_BUILDING_PURPLE || tile === TileType.DUNGEON_BUILDING_BROWN || tile === TileType.DUNGEON_BUILDING_ORANGE)) {
      drawDungeonWindows(ctx, sx, sy, height, tile, tileX, tileY);
    }

    if (tile === TileType.CRYSTAL) {
      ctx.fillStyle = 'rgba(0,188,212,0.3)';
      ctx.beginPath();
      ctx.ellipse(sx, sy - height / 2, 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (tile === TileType.TREE && !isDungeon) {
    ctx.fillStyle = '#5c4033';
    ctx.fillRect(sx - 2, sy - 10, 4, 10);
    const colors = ['#1a5c28', '#2d7a3a', '#3d9a4a'];
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(sx + (i - 1) * 4, sy - 15 - i * 3, 8 - i, 0, Math.PI * 2);
      ctx.fillStyle = colors[i];
      ctx.fill();
    }
  }

  if (!isDungeon && tile === TileType.BUILDING_RED && tileX === 23 && tileY === 6) {
    ctx.fillStyle = 'rgba(156,39,176,0.5)';
    ctx.beginPath();
    ctx.ellipse(sx, sy - height / 2, 8, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(200,100,255,0.4)';
    ctx.beginPath();
    ctx.ellipse(sx, sy - height / 2, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function seededRand(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 113.3) * 43758.5453;
  return n - Math.floor(n);
}

function drawWindows(ctx: CanvasRenderingContext2D, sx: number, sy: number, height: number, tile: number, tileX: number, tileY: number) {
  const litColor = tile === TileType.BUILDING_RED ? '#ffeb3b' : '#ffd54f';
  const darkColor = 'rgba(20,15,30,0.7)';
  const rows = height > 28 ? 3 : 2;
  const cols = 2;
  const ww = 3;
  const wh = 3;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const t = (col + 0.3) / (cols + 0.2);
      const rowT = (row + 1) / (rows + 1);
      const baseX = sx - HALF_W + t * HALF_W;
      const baseY = sy + t * HALF_H;
      const wy = baseY - height * (1 - rowT * 0.8) + 2;
      const wx = baseX;
      const lit = seededRand(tileX, tileY, row * 10 + col) > 0.35;
      ctx.fillStyle = lit ? litColor : darkColor;
      ctx.fillRect(wx - ww / 2, wy, ww, wh);
    }
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const t = (col + 0.3) / (cols + 0.2);
      const rowT = (row + 1) / (rows + 1);
      const baseX = sx + t * HALF_W;
      const baseY = sy + HALF_H - t * HALF_H;
      const wy = baseY - height * (1 - rowT * 0.8) + 2;
      const wx = baseX;
      const lit = seededRand(tileX + 100, tileY, row * 10 + col) > 0.35;
      ctx.fillStyle = lit ? litColor : darkColor;
      ctx.fillRect(wx - ww / 2, wy, ww, wh);
    }
  }
}

function drawDungeonWindows(ctx: CanvasRenderingContext2D, sx: number, sy: number, height: number, tile: number, tileX: number, tileY: number) {
  const glowColors: Record<number, string> = {
    [TileType.DUNGEON_BUILDING_PURPLE]: '#ce93d8',
    [TileType.DUNGEON_BUILDING_BROWN]: '#ffab91',
    [TileType.DUNGEON_BUILDING_ORANGE]: '#ffcc80',
  };
  const litColor = glowColors[tile] || '#ffd54f';
  const darkColor = 'rgba(10,5,15,0.8)';
  const rows = height > 25 ? 3 : 2;
  const ww = 2.5;
  const wh = 3;

  for (let row = 0; row < rows; row++) {
    const t = 0.5;
    const rowT = (row + 1) / (rows + 1);
    const baseX = sx - HALF_W + t * HALF_W;
    const baseY = sy + t * HALF_H;
    const wy = baseY - height * (1 - rowT * 0.8) + 2;
    const lit = seededRand(tileX, tileY, row * 7 + 3) > 0.4;
    ctx.fillStyle = lit ? litColor : darkColor;
    ctx.fillRect(baseX - ww / 2, wy, ww, wh);
  }

  for (let row = 0; row < rows; row++) {
    const t = 0.5;
    const rowT = (row + 1) / (rows + 1);
    const baseX = sx + t * HALF_W;
    const baseY = sy + HALF_H - t * HALF_H;
    const wy = baseY - height * (1 - rowT * 0.8) + 2;
    const lit = seededRand(tileX + 50, tileY, row * 7 + 3) > 0.4;
    ctx.fillStyle = lit ? litColor : darkColor;
    ctx.fillRect(baseX - ww / 2, wy, ww, wh);
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

export function renderMika(
  ctx: CanvasRenderingContext2D,
  pos: Position,
  camera: Position,
  canvasW: number,
  canvasH: number,
  zoom: number,
  mikaImage: HTMLImageElement | null,
  time: number
) {
  ctx.save();
  ctx.translate(canvasW / 2, canvasH / 3);
  ctx.scale(zoom, zoom);
  ctx.translate(-camera.x, -camera.y);

  const { sx, sy } = toIso(pos.x, pos.y);
  const floatY = Math.sin(time * 0.003) * 2;

  // Glow effect
  const pulse = 0.5 + Math.sin(time * 0.004) * 0.3;
  ctx.fillStyle = `rgba(255, 150, 200, ${pulse * 0.3})`;
  ctx.beginPath();
  ctx.ellipse(sx, sy - 10 + floatY, 20, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  if (mikaImage && mikaImage.complete) {
    const size = 42;
    ctx.drawImage(mikaImage, sx - size / 2, sy - size + 5 + floatY, size, size);
  } else {
    ctx.beginPath();
    ctx.arc(sx, sy - 12 + floatY, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#ffb6c1';
    ctx.fill();
    ctx.strokeStyle = '#ff69b4';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👧', sx, sy - 12 + floatY);
  }

  // Name label
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffb6c1';
  ctx.shadowColor = 'rgba(255, 105, 180, 0.8)';
  ctx.shadowBlur = 8;
  ctx.fillText('Міка 💕', sx, sy - 38 + floatY);
  ctx.shadowBlur = 0;

  // Exclamation
  const pulseScale = 0.8 + Math.sin(time * 0.005) * 0.2;
  ctx.font = `bold ${14 * pulseScale}px Syne, sans-serif`;
  ctx.fillStyle = '#ff69b4';
  ctx.shadowColor = 'rgba(255, 105, 180, 0.8)';
  ctx.shadowBlur = 10;
  ctx.fillText('!', sx, sy - 48 + floatY);
  ctx.shadowBlur = 0;

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

    ctx.beginPath();
    ctx.ellipse(sx, sy + 2, 10, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(sx, sy - 15 + floatY, 14, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 10, 20, 0.85)';
    ctx.fill();
    ctx.strokeStyle = 'hsla(320, 100%, 60%, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(npc.icon, sx, sy - 14 + floatY);

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

  const last = path[path.length - 1];
  const { sx, sy } = toIso(last.x, last.y);
  const pulse = 0.7 + Math.sin(time * 0.005) * 0.3;
  ctx.beginPath();
  ctx.arc(sx, sy, 5 * pulse, 0, Math.PI * 2);
  ctx.fillStyle = `hsla(320, 100%, 60%, ${pulse})`;
  ctx.fill();

  ctx.restore();
}

export function renderMonsters(
  ctx: CanvasRenderingContext2D,
  monsters: { pos: Position; icon: string; name: string; hp: number; maxHp: number }[],
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

  for (const m of monsters) {
    const { sx, sy } = toIso(m.pos.x, m.pos.y);
    const floatY = Math.sin(time * 0.004 + m.pos.x * 3) * 2;

    ctx.beginPath();
    ctx.ellipse(sx, sy + 2, 8, 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(sx, sy - 12 + floatY, 12, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(40, 10, 10, 0.9)';
    ctx.fill();
    ctx.strokeStyle = 'hsla(0, 80%, 50%, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(m.icon, sx, sy - 11 + floatY);

    const hpPct = m.hp / m.maxHp;
    const barW = 18;
    const barH = 3;
    const barX = sx - barW / 2;
    const barY = sy - 26 + floatY;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = hpPct > 0.5 ? '#4caf50' : hpPct > 0.25 ? '#ff9800' : '#f44336';
    ctx.fillRect(barX, barY, barW * hpPct, barH);

    const pulse = 0.5 + Math.sin(time * 0.006 + m.pos.y) * 0.5;
    ctx.fillStyle = `rgba(255, 50, 50, ${pulse * 0.6})`;
    ctx.font = `bold 10px sans-serif`;
    ctx.fillText('⚔', sx, sy - 30 + floatY);
  }

  ctx.restore();
}

export function renderCoins(
  ctx: CanvasRenderingContext2D,
  coins: { pos: Position; collected: boolean }[],
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

  for (const c of coins) {
    if (c.collected) continue;
    const { sx, sy } = toIso(c.pos.x, c.pos.y);
    const floatY = Math.sin(time * 0.005 + c.pos.x * 2 + c.pos.y) * 3;
    const pulse = 0.7 + Math.sin(time * 0.006 + c.pos.x) * 0.3;

    // Glow
    ctx.fillStyle = `rgba(255, 215, 0, ${pulse * 0.25})`;
    ctx.beginPath();
    ctx.ellipse(sx, sy - 6 + floatY, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Coin
    ctx.font = `${12 + pulse * 3}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🪙', sx, sy - 8 + floatY);
  }

  ctx.restore();
}
