/* =============================================================================
 * useHeartGeometry.ts
 * 
 * Hồi 2: Thuật toán tạo hình — Volumetric Heart Particle Generator
 * 
 * Generates Float32Array buffers of 3D coordinates forming a volumetric heart
 * shape using parametric equations, plus per-particle random attributes for
 * downstream shader consumption.
 * 
 * MATH FOUNDATION:
 *   Heart surface parametric (Wolfram "Sexy Heart"):
 *     x(t) = 16 · sin³(t)
 *     y(t) = 13·cos(t) - 5·cos(2t) - 2·cos(3t) - cos(4t)
 *   
 *   Volumetric fill is achieved by:
 *     1. Sampling the parametric curve to get a surface point
 *     2. Extruding along the z-axis with a depth envelope
 *     3. Scaling inward with a random [0..1] radius factor
 *        to fill the interior volume (not just the shell)
 *
 * COMPATIBLE WITH:
 *   - TresJS <TresBufferAttribute> (attach="geometry-position")
 *   - Three.js BufferGeometry.setAttribute()
 *   - Hồi 3 custom shaders (vertex attributes)
 * ============================================================================= */

import { Shape as ThreeShape, ShapeGeometry, Vector2 } from 'three'

/* ---------------------------------------------------------------------------
 * TYPE DEFINITIONS
 * --------------------------------------------------------------------------- */

/** Configuration for the heart particle generator */
export interface HeartGeneratorConfig {
  /** Global uniform scale applied to all axes (default: 0.15) */
  scale: number
  /** Maximum depth along Z-axis (default: 2.0) */
  depthScale: number
  /** Controls how much particles cluster near the surface vs fill interior
   *  0.0 = uniform fill, 1.0 = strong surface bias (default: 0.35) */
  surfaceBias: number
  /** Noise amplitude to break up mathematical perfection (default: 0.08) */
  noiseAmount: number
  /** Y-axis offset to center the heart vertically (default: 0.0) */
  yOffset: number
}

/** Complete output of the heart particle generator */
export interface HeartParticleData {
  /** Float32Array of (x, y, z) positions — length = count × 3 */
  positions: Float32Array
  /** Float32Array of per-particle random seeds — length = count × 4
   *  [randomSeed, phaseOffset, speedFactor, sizeVariance] per particle */
  randoms: Float32Array
  /** Float32Array of per-particle velocity vectors — length = count × 3
   *  Pre-calculated flow directions for vortex animation */
  velocities: Float32Array
  /** Total number of particles */
  count: number
}

/** Individual particle attribute set for shader binding */
export interface ParticleAttributes {
  /** Random seed [0, 1] for deterministic per-particle variation */
  seed: number
  /** Phase offset [0, 2π] for temporal desynchronization */
  phase: number
  /** Speed multiplier [0.2, 1.8] for animation velocity */
  speed: number
  /** Size variance [0.3, 1.0] for point size modulation */
  size: number
}

/* ---------------------------------------------------------------------------
 * CONSTANTS
 * --------------------------------------------------------------------------- */

const TWO_PI = Math.PI * 2
const HALF_PI = Math.PI * 0.5

/** Default generator configuration */
const DEFAULT_CONFIG: HeartGeneratorConfig = {
  scale: 0.15,
  depthScale: 2.0,
  surfaceBias: 0.35,
  noiseAmount: 0.08,
  yOffset: 0.0
}

/* ---------------------------------------------------------------------------
 * CORE MATH UTILITIES
 * --------------------------------------------------------------------------- */

/**
 * Attempt to generate a seeded pseudo-random using an integer hash.
 * This allows reproducible random sequences per-particle without external deps.
 * Uses a simple xorshift32 variant.
 */
function seededRandom(seed: number): () => number {
  let s = seed | 0
  return () => {
    s ^= s << 13
    s ^= s >> 17
    s ^= s << 5
    // Normalize to [0, 1]
    return ((s < 0 ? ~s + 1 : s) % 1000000) / 1000000
  }
}

/**
 * Heart surface parametric equation (2D profile).
 * 
 * Based on the classic Wolfram "Heart Curve":
 *   x(t) = 16 · sin³(t)
 *   y(t) = 13·cos(t) - 5·cos(2t) - 2·cos(3t) - cos(4t)
 * 
 * @param t - Parameter angle in [0, 2π]
 * @returns [x, y] coordinates of the heart contour point
 */
function heartParametric(t: number): [number, number] {
  const sinT = Math.sin(t)
  const x = 16 * sinT * sinT * sinT  // 16·sin³(t)
  const y = 13 * Math.cos(t)
           - 5 * Math.cos(2 * t)
           - 2 * Math.cos(3 * t)
           - Math.cos(4 * t)
  return [x, y]
}

/**
 * Compute the heart's depth envelope at a given height fraction.
 * The heart is thickest at the center and tapers toward top lobes and bottom tip.
 * Uses a smooth bell-curve profile for natural volumetric appearance.
 * 
 * @param normalizedY - Y position normalized to [0, 1] range (0=bottom tip, 1=top lobes)
 * @returns depth multiplier [0, 1]
 */
function depthEnvelope(normalizedY: number): number {
  // Smooth bell curve peaking around y=0.55 (center mass of heart)
  // Using a cosine-based envelope for C1 continuity
  const center = 0.55
  const width = 0.55
  const d = (normalizedY - center) / width
  return Math.max(0, Math.cos(d * HALF_PI) * Math.cos(d * HALF_PI))
}

/**
 * Compute a vortex flow vector for a particle at position (x, y, z).
 * Creates a swirling, upward-spiraling motion field centered on the heart.
 * 
 * @param x - World-space X coordinate
 * @param y - World-space Y coordinate
 * @param z - World-space Z coordinate
 * @returns [vx, vy, vz] normalized flow direction
 */
function computeFlowVector(x: number, y: number, z: number): [number, number, number] {
  // Tangential swirl component (perpendicular to radial direction in XZ plane)
  const r = Math.sqrt(x * x + z * z) + 0.001 // Avoid division by zero
  const tangentX = -z / r
  const tangentZ = x / r

  // Upward drift component (stronger at bottom, fading at top)
  const upwardBias = Math.max(0, 1.0 - (y + 1.0) * 0.3)

  // Slight inward pull toward center (centripetal)
  const inwardX = -x * 0.15
  const inwardZ = -z * 0.15

  // Combine: swirl + upward + inward
  const vx = tangentX * 0.6 + inwardX
  const vy = upwardBias * 0.3
  const vz = tangentZ * 0.6 + inwardZ

  // Normalize
  const mag = Math.sqrt(vx * vx + vy * vy + vz * vz) + 0.0001
  return [vx / mag, vy / mag, vz / mag]
}

/* ---------------------------------------------------------------------------
 * HEART BOUNDARY TEST (Bézier Shape Path — matches useHeartShape.ts contour)
 * 
 * This creates a 2D heart path using the SAME Bézier control points as
 * the existing useHeartShape.ts, then uses it for rejection sampling
 * to ensure particles only spawn inside the heart boundary.
 * --------------------------------------------------------------------------- */

/**
 * Build the 2D heart shape path matching the project's existing Bézier heart.
 * Uses the same scale factors (sx=4, sy=4) and control points as useHeartShape.ts.
 */
function buildHeartBoundaryShape(): ThreeShape {
  const sx = 4, sy = 4
  const shape = new ThreeShape()

  const P0 = { x: 0, y: -2 * sy }
  const P1 = { x: -1.5 * sx, y: 0.5 * sy }
  const P3 = { x: 0, y: 1 * sy }       // Cleft
  const P5 = { x: 1.5 * sx, y: 0.5 * sy }

  const C1 = { x: -1.2 * sx, y: 2.0 * sy }
  const C2 = { x: -0.4 * sx, y: 2.9 * sy }
  const C3 = { x: 0.4 * sx, y: 2.9 * sy }
  const C4 = { x: 1.2 * sx, y: 2.0 * sy }

  shape.moveTo(P0.x, P0.y)
  shape.lineTo(P1.x, P1.y)
  shape.bezierCurveTo(C1.x, C1.y, C2.x, C2.y, P3.x, P3.y)
  shape.bezierCurveTo(C3.x, C3.y, C4.x, C4.y, P5.x, P5.y)
  shape.lineTo(P0.x, P0.y)

  return shape
}

/**
 * Create a point-in-heart test function using raycast-style winding number.
 * Pre-samples the boundary path for efficient inside/outside testing.
 */
function createHeartPointTester(): (px: number, py: number) => boolean {
  const shape = buildHeartBoundaryShape()
  const points = shape.getPoints(128) // Densely sample the path

  return (px: number, py: number): boolean => {
    // Ray casting algorithm (even-odd rule)
    let inside = false
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x, yi = points[i].y
      const xj = points[j].x, yj = points[j].y

      const intersect = ((yi > py) !== (yj > py))
        && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)

      if (intersect) inside = !inside
    }
    return inside
  }
}

/* ---------------------------------------------------------------------------
 * PRIMARY GENERATOR — DUAL STRATEGY
 * 
 * Strategy A (Primary): Parametric + volumetric fill
 *   - Fast, deterministic, uses heart equation directly
 *   - Fills the volume by scaling inward from surface
 * 
 * Strategy B (Boundary-aware): Bézier rejection sampling
 *   - Uses the project's existing heart Bézier path for boundary testing
 *   - Ensures perfect match with the heart mesh in HomeScene.vue
 * --------------------------------------------------------------------------- */

/**
 * Generate heart particles and text particles.
 * 
 * @param count - Number of particles to generate (e.g. 8000)
 * @param config - Optional configuration overrides
 * @returns HeartParticleData with positions, randoms, and velocities
 */
export function generateHeartParticles(
  count: number,
  config: Partial<HeartGeneratorConfig> = {}
): HeartParticleData {
  const cfg: HeartGeneratorConfig = { ...DEFAULT_CONFIG, ...config }

  // Output buffers
  const positions = new Float32Array(count * 3)
  const randoms = new Float32Array(count * 4)
  const velocities = new Float32Array(count * 3)

  // PIXEL SAMPLING FOR TEXT
  // We draw "Love" and "Thúy" to a canvas, scan the pixels, and use those coords.
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  
  const textPixels: {x: number, y: number}[] = []
  
  if (ctx) {
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    ctx.fillStyle = 'white'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    // Fallback to Arial/serif if custom fonts fail
    ctx.font = 'bold 80px "Dancing Script", cursive, sans-serif'
    
    ctx.fillText('Love', canvas.width * 0.28, canvas.height * 0.5)
    ctx.fillText('Thúy', canvas.width * 0.72, canvas.height * 0.5)
    
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    const density = 2 // sample every 2 pixels
    for (let y = 0; y < canvas.height; y += density) {
      for (let x = 0; x < canvas.width; x += density) {
        const idx = (y * canvas.width + x) * 4
        if (imgData[idx] > 128) {
          // Map to 3D space: X spans ~[-3.5, 3.5], Y spans ~[0, 2.5]
          const mappedX = (x / canvas.width - 0.5) * 7.0
          const mappedY = -(y / canvas.height - 0.5) * 3.5 + 1.2
          textPixels.push({ x: mappedX, y: mappedY })
        }
      }
    }
  }

  // Split particle count: ~30% for text, 70% for heart vortex
  const textCount = textPixels.length > 0 ? Math.floor(count * 0.3) : 0
  const heartCount = count - textCount

  for (let i = 0; i < count; i++) {
    const rng = seededRandom(i * 7919 + 1013) // Prime-seeded per particle
    const isText = (i < textCount && textPixels.length > 0) ? 1.0 : 0.0;
    
    const i3 = i * 3
    const i4 = i * 4
    
    if (isText > 0.5) {
      // --- TEXT PARTICLE (Pixel Sampling Mapping) ---
      const px = textPixels[Math.floor(rng() * textPixels.length)]
      
      // Volumetric scatter for text (prevents dense overdraw)
      const noiseX = (rng() - 0.5) * 0.15
      const noiseY = (rng() - 0.5) * 0.15
      const noiseZ = (rng() - 0.5) * 1.5 // Deep Z spread for holographic feel
      
      positions[i3]     = px.x + noiseX
      positions[i3 + 1] = px.y + noiseY
      positions[i3 + 2] = noiseZ
      
      randoms[i4]     = rng()
      randoms[i4 + 1] = rng() * TWO_PI
      randoms[i4 + 2] = 0.5 + rng() * 1.0
      randoms[i4 + 3] = 1.0 // isText flag
      
    } else {
      // --- HEART VORTEX PARTICLE ---
      // We don't even need to compute position here, the vertex shader handles it.
      // We just pass 0s to save CPU, except for attributes needed by shader.
      positions[i3]     = 0.0
      positions[i3 + 1] = 0.0
      positions[i3 + 2] = 0.0
      
      randoms[i4]     = rng()                        // seed
      randoms[i4 + 1] = rng() * TWO_PI               // phaseOffset
      randoms[i4 + 2] = 0.2 + rng() * 1.6            // speedFactor
      randoms[i4 + 3] = 0.0                          // isText flag
    }
    
    // Velocity is unused by new shader, but we fill it to satisfy geometry signature
    velocities[i3]     = 0
    velocities[i3 + 1] = 0
    velocities[i3 + 2] = 0
  }

  return { positions, randoms, velocities, count }
}

/* ---------------------------------------------------------------------------
 * ALTERNATIVE GENERATOR — Bézier Boundary Rejection Sampling
 * 
 * This variant uses the SAME heart Bézier path as useHeartShape.ts,
 * ensuring the particle cloud exactly matches the extruded mesh silhouette.
 * Slower than parametric (due to rejection), but geometrically precise.
 * --------------------------------------------------------------------------- */

/**
 * Generate heart particles using rejection sampling against the Bézier boundary.
 * 
 * @param count - Number of particles to generate
 * @param config - Optional configuration overrides
 * @returns HeartParticleData with positions, randoms, and velocities
 */
export function generateHeartParticlesBezier(
  count: number,
  config: Partial<HeartGeneratorConfig> = {}
): HeartParticleData {
  const cfg: HeartGeneratorConfig = { ...DEFAULT_CONFIG, ...config }
  const isInside = createHeartPointTester()

  const positions = new Float32Array(count * 3)
  const randoms = new Float32Array(count * 4)
  const velocities = new Float32Array(count * 3)

  // Bézier heart bounding box (from useHeartShape.ts scale factors)
  // sx=4, sy=4 → x ∈ [-6, 6], y ∈ [-8, 11.6]
  const boundsMinX = -7, boundsMaxX = 7
  const boundsMinY = -9, boundsMaxY = 12
  const boundsRangeX = boundsMaxX - boundsMinX
  const boundsRangeY = boundsMaxY - boundsMinY

  let accepted = 0
  let attempts = 0
  const maxAttempts = count * 20 // Safety cap to prevent infinite loops

  const rng = seededRandom(42)

  while (accepted < count && attempts < maxAttempts) {
    attempts++

    // Random point in bounding box
    const testX = boundsMinX + rng() * boundsRangeX
    const testY = boundsMinY + rng() * boundsRangeY

    // Rejection test: is this point inside the heart boundary?
    if (!isInside(testX, testY)) continue

    // Accepted! Compute Z depth using the envelope
    const normalizedY = (testY - boundsMinY) / boundsRangeY
    const maxDepthHere = cfg.depthScale * depthEnvelope(normalizedY)
    const testZ = (rng() * 2 - 1) * maxDepthHere

    // Add noise
    const noiseX = (rng() * 2 - 1) * cfg.noiseAmount * 4
    const noiseY = (rng() * 2 - 1) * cfg.noiseAmount * 4
    const noiseZ = (rng() * 2 - 1) * cfg.noiseAmount * 2

    // Final position
    const finalX = (testX + noiseX) * cfg.scale
    const finalY = (testY + noiseY) * cfg.scale + cfg.yOffset
    const finalZ = (testZ + noiseZ) * cfg.scale

    const i3 = accepted * 3
    positions[i3]     = finalX
    positions[i3 + 1] = finalY
    positions[i3 + 2] = finalZ

    // Random attributes
    const i4 = accepted * 4
    randoms[i4]     = rng()
    randoms[i4 + 1] = rng() * TWO_PI
    randoms[i4 + 2] = 0.2 + rng() * 1.6
    randoms[i4 + 3] = 0.3 + rng() * 0.7

    // Flow velocity
    const [vx, vy, vz] = computeFlowVector(finalX, finalY, finalZ)
    velocities[i3]     = vx
    velocities[i3 + 1] = vy
    velocities[i3 + 2] = vz

    accepted++
  }

  // If we hit maxAttempts before filling all particles, fill remaining at center
  if (accepted < count) {
    console.warn(
      `[useHeartGeometry] Rejection sampling only filled ${accepted}/${count} particles. ` +
      `Remaining ${count - accepted} placed at heart center.`
    )
    for (let i = accepted; i < count; i++) {
      const i3 = i * 3
      positions[i3] = 0
      positions[i3 + 1] = cfg.yOffset
      positions[i3 + 2] = 0

      const i4 = i * 4
      randoms[i4] = rng()
      randoms[i4 + 1] = rng() * TWO_PI
      randoms[i4 + 2] = 0.5
      randoms[i4 + 3] = 0.5

      velocities[i3] = 0
      velocities[i3 + 1] = 0.3
      velocities[i3 + 2] = 0
    }
  }

  return { positions, randoms, velocities, count }
}

/* ---------------------------------------------------------------------------
 * VUE COMPOSABLE WRAPPER
 * 
 * Provides reactive access to the heart geometry data for use in
 * Vue 3 <script setup> components with TresJS.
 * --------------------------------------------------------------------------- */

/**
 * Vue composable that generates and returns heart particle geometry data.
 * 
 * @param count - Number of particles (default: 50000)
 * @param config - Optional configuration overrides
 * @param useBezier - If true, uses Bézier boundary sampling (slower but
 *                    geometrically matches the project's existing heart mesh)
 * @returns Reactive HeartParticleData
 * 
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useHeartGeometry } from '@/composables/useHeartGeometry'
 * 
 * const { positions, randoms, velocities, count } = useHeartGeometry(50000)
 * </script>
 * 
 * <template>
 *   <TresPoints>
 *     <TresBufferGeometry>
 *       <TresBufferAttribute
 *         attach="attributes-position"
 *         :count="count"
 *         :array="positions"
 *         :item-size="3"
 *       />
 *       <TresBufferAttribute
 *         attach="attributes-aRandom"
 *         :count="count"
 *         :array="randoms"
 *         :item-size="4"
 *       />
 *       <TresBufferAttribute
 *         attach="attributes-aVelocity"
 *         :count="count"
 *         :array="velocities"
 *         :item-size="3"
 *       />
 *     </TresBufferGeometry>
 *     <TresShaderMaterial :vertex-shader="vs" :fragment-shader="fs" />
 *   </TresPoints>
 * </template>
 * ```
 */
export function useHeartGeometry(
  count: number = 50000,
  config: Partial<HeartGeneratorConfig> = {},
  useBezier: boolean = false
): HeartParticleData {
  const generator = useBezier ? generateHeartParticlesBezier : generateHeartParticles
  return generator(count, config)
}
