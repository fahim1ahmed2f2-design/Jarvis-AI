/**
 * JARVIS Agent Town — World Coordinate System
 * Step 1: 2.5D Isometric & Spatial Projection Engine
 */

import { WorldPosition, ScreenPosition, CameraState } from './types';

// Standard 2.5D Isometric Projection Constants (dimetric ratio 2:1)
const ISO_ANGLE = Math.PI / 6; // 30 degrees
const COS_30 = Math.cos(ISO_ANGLE); // ~0.866
const SIN_30 = Math.sin(ISO_ANGLE); // 0.5
const ISO_RATIO = 0.58; // Visual aspect ratio for sleek futuristic perspective

export class WorldCoordinateSystem {
  /**
   * Projects 3D World coordinates (x, y, z) to 2D Screen pixel coordinates (screenX, screenY)
   */
  public static worldToScreen(
    worldPos: WorldPosition,
    camera: CameraState
  ): ScreenPosition {
    const wx = worldPos.x;
    const wy = worldPos.y;
    const wz = worldPos.z || 0;

    // Isometric projection
    const isoX = (wx - wy) * COS_30;
    const isoY = (wx + wy) * SIN_30 * ISO_RATIO - wz;

    // Apply Camera translation and zoom
    const screenX = (isoX + camera.x) * camera.zoom + camera.viewportWidth / 2;
    const screenY = (isoY + camera.y) * camera.zoom + camera.viewportHeight / 2;

    return { x: screenX, y: screenY };
  }

  /**
   * Projects 2D Screen pixel coordinates back into World coordinates (z = 0 plane)
   * Useful for mouse interaction, hover detection, and raycasting.
   */
  public static screenToWorld(
    screenPos: ScreenPosition,
    camera: CameraState,
    targetZ: number = 0
  ): WorldPosition {
    // Inverse camera translation and zoom
    const isoX = (screenPos.x - camera.viewportWidth / 2) / camera.zoom - camera.x;
    const isoY = (screenPos.y - camera.viewportHeight / 2) / camera.zoom - camera.y + targetZ;

    // Inverse isometric projection
    const yRatio = isoY / (SIN_30 * ISO_RATIO);
    const xRatio = isoX / COS_30;

    const wx = (yRatio + xRatio) / 2;
    const wy = (yRatio - xRatio) / 2;

    return { x: wx, y: wy, z: targetZ };
  }

  /**
   * Calculates render depth for Y-sorting
   * Objects with higher depth values are rendered in front of objects with lower depth values.
   */
  public static calculateRenderDepth(pos: WorldPosition, baseOffset: number = 0): number {
    // In isometric projection, entities positioned further down the screen (higher X + Y) are in front
    const zOffset = (pos.z || 0) * 0.1;
    return pos.x + pos.y * 1.05 + baseOffset + zOffset;
  }

  /**
   * Linear interpolation helper
   */
  public static lerp(start: number, end: number, t: number): number {
    return start + (end - start) * Math.max(0, Math.min(1, t));
  }

  /**
   * Interpolate between two 3D positions
   */
  public static lerpPosition(
    start: WorldPosition,
    end: WorldPosition,
    t: number
  ): WorldPosition {
    return {
      x: this.lerp(start.x, end.x, t),
      y: this.lerp(start.y, end.y, t),
      z: this.lerp(start.z || 0, end.z || 0, t),
      rotation: this.lerp(start.rotation || 0, end.rotation || 0, t)
    };
  }

  /**
   * Euclidean 2D distance between positions
   */
  public static distance2D(p1: WorldPosition, p2: WorldPosition): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Euclidean 3D distance between positions
   */
  public static distance3D(p1: WorldPosition, p2: WorldPosition): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = (p1.z || 0) - (p2.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Check if a 2D screen point is within a bounding radius
   */
  public static isPointInRadius(
    point: ScreenPosition,
    target: ScreenPosition,
    radius: number
  ): boolean {
    const dx = point.x - target.x;
    const dy = point.y - target.y;
    return dx * dx + dy * dy <= radius * radius;
  }
}
