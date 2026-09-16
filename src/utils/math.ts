import * as THREE from 'three';

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function lerpColor(c1: THREE.Color, c2: THREE.Color, t: number, out: THREE.Color): THREE.Color {
  out.r = lerp(c1.r, c2.r, t);
  out.g = lerp(c1.g, c2.g, t);
  out.b = lerp(c1.b, c2.b, t);
  return out;
}

/**
 * Generates a glowing circular canvas texture for particles and glow halos.
 */
export function createGlowTexture(size = 128, innerRadius = 0, outerRadius = 0.5): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const center = size / 2;
    const gradient = ctx.createRadialGradient(
      center, center, innerRadius * size,
      center, center, outerRadius * size
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(0, 240, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(0, 160, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates a procedural segmented ring texture with sci-fi ticks
 */
export function createRingTexture(segments = 36, dashRatio = 0.6): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 1024, 64);
    const segWidth = 1024 / segments;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < segments; i++) {
      if (i % 4 === 0) {
        // Longer tick
        ctx.fillRect(i * segWidth, 10, segWidth * 0.8, 44);
      } else if (i % 2 === 0) {
        ctx.fillRect(i * segWidth, 20, segWidth * dashRatio, 24);
      } else {
        ctx.fillRect(i * segWidth, 28, segWidth * dashRatio * 0.5, 8);
      }
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}
