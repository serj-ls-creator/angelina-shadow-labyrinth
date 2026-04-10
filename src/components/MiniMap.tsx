import { Position, NPC, TileType } from '../game/types';

interface MiniMapProps {
  playerPos: Position;
  npcs: NPC[];
  mapTiles: number[][];
  mapWidth: number;
  mapHeight: number;
  isDungeon?: boolean;
}

export default function MiniMap({ playerPos, npcs, mapTiles, mapWidth, mapHeight, isDungeon }: MiniMapProps) {
  const size = 100;

  return (
    <div>
      <div className="glass-panel p-1 rounded-full overflow-hidden neon-glow" 
           style={{ width: size + 8, height: size + 8 }}>
        <svg width={size} height={size * (mapHeight / mapWidth)} 
             viewBox={`0 0 ${mapWidth} ${mapHeight}`}
             className="rounded-full">
          <rect width={mapWidth} height={mapHeight} fill={isDungeon ? 'hsl(240,20%,5%)' : 'hsl(260,25%,8%)'} />
          
          {mapTiles.map((row, y) =>
            row.map((tile, x) => {
              let fill = 'transparent';
              if (isDungeon) {
                if (tile === TileType.DUNGEON_FLOOR || tile === TileType.DUNGEON_MOSS || tile === TileType.DUNGEON_BONES || tile === TileType.DUNGEON_DOOR) fill = '#3a3a4a';
                else if (tile === TileType.DUNGEON_WALL) fill = '#1a1a2e';
                else if (tile === TileType.LAVA) fill = '#e74c3c';
                else if (tile === TileType.CRYSTAL) fill = '#00bcd4';
                else if (tile === TileType.PORTAL) fill = '#9b59b6';
              } else {
                if (tile === TileType.WATER) fill = '#3498db';
                else if (tile === TileType.ROAD || tile === TileType.BRIDGE) fill = '#3a3d4a';
                else if (tile === TileType.BUILDING || tile === TileType.BUILDING_RED || tile === TileType.BUILDING_LIGHT) fill = '#6b5b3e';
                else if (tile === TileType.GRASS || tile === TileType.PARK || tile === TileType.TREE) fill = '#2d7a3a';
                else if (tile === TileType.SIDEWALK) fill = '#8a7e6e';
              }
              
              if (fill === 'transparent') return null;
              return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />;
            })
          )}

          {npcs.map(npc => (
            <circle key={npc.id} cx={npc.pos.x + 0.5} cy={npc.pos.y + 0.5} r={0.8}
                    fill="#ff4081" opacity={0.8} />
          ))}

          <circle cx={playerPos.x + 0.5} cy={playerPos.y + 0.5} r={isDungeon ? 1.5 : 1}
                  fill="#e040fb" stroke="#fff" strokeWidth={0.3} />
        </svg>
      </div>
    </div>
  );
}
