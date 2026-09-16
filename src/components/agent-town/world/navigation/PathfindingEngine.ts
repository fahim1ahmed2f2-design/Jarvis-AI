/**
 * JARVIS Agent Town — A* Pathfinding Engine
 * Step 5: Real Agent Walking, Pathfinding and Natural Movement
 */

import { WorldPosition } from '../types';
import { NavNode } from './types';
import { NAVIGATION_NODES } from './NavigationGraph';
import { WorldCoordinateSystem } from '../WorldCoordinateSystem';

export class PathfindingEngine {
  private static pathCache: Map<string, string[]> = new Map();

  /**
   * Finds the shortest obstacle-free waypoint path between any two world positions
   */
  public static findPath(
    startPos: WorldPosition,
    targetPos: WorldPosition
  ): WorldPosition[] {
    // 1. Direct path check if very close
    const directDist = WorldCoordinateSystem.distance2D(startPos, targetPos);
    if (directDist < 15) {
      return [{ ...targetPos }];
    }

    // 2. Snap to nearest graph nodes
    const startNode = this.findNearestNavNode(startPos);
    const targetNode = this.findNearestNavNode(targetPos);

    if (!startNode || !targetNode) {
      return [{ ...targetPos }];
    }

    // 3. A* Search between startNode and targetNode
    const nodeIds = this.findNodePath(startNode.id, targetNode.id);

    // 4. Construct complete continuous path: [startNode, ..., targetNode, targetPos]
    const waypoints: WorldPosition[] = [];

    for (const id of nodeIds) {
      const node = NAVIGATION_NODES[id];
      if (node) {
        waypoints.push({ ...node.position });
      }
    }

    // Append final exact target coordinate if not identical to last node
    const lastPoint = waypoints[waypoints.length - 1];
    if (!lastPoint || WorldCoordinateSystem.distance2D(lastPoint, targetPos) > 4) {
      waypoints.push({ ...targetPos });
    }

    return waypoints;
  }

  /**
   * A* Algorithm on the Navigation Node Graph
   */
  public static findNodePath(startId: string, targetId: string): string[] {
    if (startId === targetId) {
      return [startId];
    }

    const cacheKey = `${startId}->${targetId}`;
    if (this.pathCache.has(cacheKey)) {
      return [...(this.pathCache.get(cacheKey) || [])];
    }

    const openSet = new Set<string>([startId]);
    const cameFrom = new Map<string, string>();

    const gScore = new Map<string, number>();
    gScore.set(startId, 0);

    const fScore = new Map<string, number>();
    const startNode = NAVIGATION_NODES[startId];
    const targetNode = NAVIGATION_NODES[targetId];

    if (!startNode || !targetNode) return [startId, targetId];

    fScore.set(startId, WorldCoordinateSystem.distance2D(startNode.position, targetNode.position));

    while (openSet.size > 0) {
      // Find node in openSet with lowest fScore
      let currentId = '';
      let lowestF = Infinity;
      for (const id of openSet) {
        const score = fScore.get(id) ?? Infinity;
        if (score < lowestF) {
          lowestF = score;
          currentId = id;
        }
      }

      if (currentId === targetId) {
        // Reconstruct path
        const path: string[] = [currentId];
        let curr = currentId;
        while (cameFrom.has(curr)) {
          curr = cameFrom.get(curr)!;
          path.unshift(curr);
        }
        this.pathCache.set(cacheKey, path);
        return path;
      }

      openSet.delete(currentId);
      const currentNode = NAVIGATION_NODES[currentId];
      if (!currentNode) continue;

      const currentG = gScore.get(currentId) ?? Infinity;

      for (const neighborId of currentNode.connections) {
        const neighborNode = NAVIGATION_NODES[neighborId];
        if (!neighborNode) continue;

        const edgeDist = WorldCoordinateSystem.distance2D(currentNode.position, neighborNode.position);
        const tentativeG = currentG + edgeDist;

        if (tentativeG < (gScore.get(neighborId) ?? Infinity)) {
          cameFrom.set(neighborId, currentId);
          gScore.set(neighborId, tentativeG);
          const h = WorldCoordinateSystem.distance2D(neighborNode.position, targetNode.position);
          fScore.set(neighborId, tentativeG + h);
          openSet.add(neighborId);
        }
      }
    }

    // Fallback direct path
    return [startId, targetId];
  }

  /**
   * Find nearest navigation node to a given world position
   */
  public static findNearestNavNode(pos: WorldPosition): NavNode | null {
    let nearest: NavNode | null = null;
    let minDist = Infinity;

    for (const node of Object.values(NAVIGATION_NODES)) {
      const dist = WorldCoordinateSystem.distance2D(pos, node.position);
      if (dist < minDist) {
        minDist = dist;
        nearest = node;
      }
    }

    return nearest;
  }
}
