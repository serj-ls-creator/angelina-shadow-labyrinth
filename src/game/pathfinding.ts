import { Position } from './types';
import { mapTiles, MAP_WIDTH, MAP_HEIGHT, isWalkable } from './mapData';

interface AStarNode {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: AStarNode | null;
}

function heuristic(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function findPath(start: Position, end: Position): Position[] {
  const sx = Math.round(start.x);
  const sy = Math.round(start.y);
  const ex = Math.round(end.x);
  const ey = Math.round(end.y);

  if (ex < 0 || ex >= MAP_WIDTH || ey < 0 || ey >= MAP_HEIGHT) return [];
  if (!isWalkable(mapTiles[ey]?.[ex])) return [];

  const openSet: AStarNode[] = [];
  const closedSet = new Set<string>();

  const startNode: AStarNode = {
    x: sx, y: sy, g: 0,
    h: heuristic({ x: sx, y: sy }, { x: ex, y: ey }),
    f: 0, parent: null,
  };
  startNode.f = startNode.h;
  openSet.push(startNode);

  const dirs = [
    { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 },
    { x: 1, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 }, { x: -1, y: -1 },
  ];

  let iterations = 0;
  const maxIterations = 2000;

  while (openSet.length > 0 && iterations < maxIterations) {
    iterations++;
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;

    if (current.x === ex && current.y === ey) {
      const path: Position[] = [];
      let node: AStarNode | null = current;
      while (node) {
        path.unshift({ x: node.x, y: node.y });
        node = node.parent;
      }
      return path;
    }

    closedSet.add(`${current.x},${current.y}`);

    for (const dir of dirs) {
      const nx = current.x + dir.x;
      const ny = current.y + dir.y;
      const key = `${nx},${ny}`;

      if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) continue;
      if (closedSet.has(key)) continue;
      if (!isWalkable(mapTiles[ny][nx])) continue;

      // Diagonal movement check
      if (dir.x !== 0 && dir.y !== 0) {
        if (!isWalkable(mapTiles[current.y][nx]) || !isWalkable(mapTiles[ny][current.x])) continue;
      }

      const g = current.g + (dir.x !== 0 && dir.y !== 0 ? 1.414 : 1);
      const existing = openSet.find(n => n.x === nx && n.y === ny);

      if (existing) {
        if (g < existing.g) {
          existing.g = g;
          existing.f = g + existing.h;
          existing.parent = current;
        }
      } else {
        const h = heuristic({ x: nx, y: ny }, { x: ex, y: ey });
        openSet.push({ x: nx, y: ny, g, h, f: g + h, parent: current });
      }
    }
  }

  return [];
}
