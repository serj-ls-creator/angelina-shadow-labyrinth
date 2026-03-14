import { Position, NPC } from '../game/types';
import { MAP_WIDTH, MAP_HEIGHT, mapTiles, isWalkable } from '../game/mapData';
import { TileType } from '../game/types';

interface MiniMapProps {
  playerPos: Position;
  npcs: NPC[];
}

export default function MiniMap({ playerPos, npcs }: MiniMapProps) {
  const size = 100;
  const scale = size / Math.max(MAP_WIDTH, MAP_HEIGHT);

  return (
    <div className="fixed top-14 left-3 z-40">
      <div className="glass-panel p-1 rounded-full overflow-hidden neon-glow" 
           style={{ width: size + 8, height: size + 8 }}>
        <svg width={size} height={size * (MAP_HEIGHT / MAP_WIDTH)} 
             viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
             className="rounded-full">
          {/* Background */}
          <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="hsl(260, 25%, 8%)" />
          
          {/* Tiles */}
          {mapTiles.map((row, y) =>
            row.map((tile, x) => {
              let fill = 'transparent';
              if (tile === TileType.WATER) fill = '#3498db';
              else if (tile === TileType.ROAD || tile === TileType.BRIDGE) fill = '#3a3d4a';
              else if (tile === TileType.BUILDING || tile === TileType.BUILDING_RED || tile === TileType.BUILDING_LIGHT) fill = '#6b5b3e';
              else if (tile === TileType.GRASS || tile === TileType.PARK || tile === TileType.TREE) fill = '#2d7a3a';
              else if (tile === TileType.SIDEWALK) fill = '#8a7e6e';
              
              if (fill === 'transparent') return null;
              return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />;
            })
          )}

          {/* NPCs */}
          {npcs.map(npc => (
            <circle key={npc.id} cx={npc.pos.x + 0.5} cy={npc.pos.y + 0.5} r={0.8}
                    fill="#ff4081" opacity={0.8} />
          ))}

          {/* Player */}
          <circle cx={playerPos.x + 0.5} cy={playerPos.y + 0.5} r={1}
                  fill="#e040fb" stroke="#fff" strokeWidth={0.3} />
        </svg>
      </div>
    </div>
  );
}
