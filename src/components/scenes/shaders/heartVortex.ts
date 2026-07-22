/* =============================================================================
 * heartVortex.ts
 * 
 * Hồi 3: Hiệu ứng Shader Vật Lý — GLSL Particle Vortex System
 * 
 * Custom vertex + fragment shaders for the HeartVortexScene particle cloud.
 * Animates 50K particles into a glowing, swirling vortex with:
 *   - Curl noise flow perturbation
 *   - Height-based color gradient (deep magenta → cyan → white)
 *   - Distance-attenuated point size
 *   - Smooth circular particle rendering with glow falloff
 * 
 * ATTRIBUTE CONTRACT (from useHeartGeometry.ts — Hồi 2):
 *   attribute vec3 position    → Base heart coordinates
 *   attribute vec4 aRandom     → [seed, phaseOffset, speedFactor, sizeVariance]
 *   attribute vec3 aVelocity   → Pre-computed vortex flow direction
 * 
 * UNIFORM CONTRACT:
 *   uniform float uTime        → Elapsed seconds (from useRenderLoop)
 *   uniform float uPixelRatio  → window.devicePixelRatio
 *   uniform float uPointSize   → Base point size multiplier
 *   uniform float uFlowSpeed   → Global flow animation speed
 *   uniform float uFlowScale   → Amplitude of flow displacement
 *   uniform float uPulseAmplitude → Heart-beat pulse strength
 *   uniform vec3  uColorLow    → Bottom color (particle height gradient)
 *   uniform vec3  uColorMid    → Middle color
 *   uniform vec3  uColorHigh   → Top color / glow core
 * ============================================================================= */

import { ShaderMaterial, AdditiveBlending, Color } from 'three'

/* ---------------------------------------------------------------------------
 * VERTEX SHADER
 * 
 * Responsibilities:
 *   1. Read base position + per-particle attributes
 *   2. Apply time-based curl noise flow perturbation
 *   3. Apply heart-beat pulse (radial oscillation)
 *   4. Compute distance-attenuated gl_PointSize
 *   5. Pass varyings to fragment shader (height, speed, glow factor)
 * --------------------------------------------------------------------------- */

export const vertexShader = /* glsl */ `
  // === UNIFORMS ===
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uPointSize;
  uniform float uFlowSpeed;
  uniform float uPulseAmplitude;

  // === ATTRIBUTES ===
  attribute vec4 aRandom;    // [seed, phaseOffset, speedFactor, sizeVariance]

  // === VARYINGS ===
  varying float vHeight;      // Normalized Y position for color gradient
  varying float vSpeedFactor; 
  varying float vGlowFactor;  
  varying float vAlpha;       
  varying float vProgress;    // Progress from bottom (0) to top (1)
  varying float vIsText;      // 1.0 if particle is inside the text volume, 0.0 otherwise

  void main() {
    // --- UNPACK PER-PARTICLE ATTRIBUTES ---
    float seed        = aRandom.x;     
    float phaseOffset = aRandom.y;     
    float speedFactor = aRandom.z;     
    float isText      = aRandom.w;     // 1.0 if text, 0.0 if heart

    vIsText = isText;

    // We no longer have sizeVariance from aRandom.w, so we generate it from seed
    float sizeVariance = 0.5 + fract(sin(seed * 999.0) * 1000.0) * 0.5;

    // --- HEART VORTEX MATH ---
    float progress = fract(phaseOffset + uTime * speedFactor * uFlowSpeed * 0.15);
    float t = (seed < 0.5) ? (3.14159265 + progress * 3.14159265) : (3.14159265 - progress * 3.14159265);

    float sinT = sin(t);
    float hx = 16.0 * sinT * sinT * sinT;
    float hy = 13.0 * cos(t) - 5.0 * cos(2.0 * t) - 2.0 * cos(3.0 * t) - cos(4.0 * t);
    vec3 heartPos = vec3(hx, hy, 0.0) * 0.15;

    float noiseX = (fract(sin(seed * 12.9898) * 43758.5453) - 0.5) * 2.0;
    float noiseY = (fract(sin(seed * 78.233) * 43758.5453) - 0.5) * 2.0;
    float noiseZ = (fract(sin(seed * 93.989) * 43758.5453) - 0.5) * 2.0;

    vec3 scatterDir = normalize(vec3(noiseX, noiseY + 0.001, noiseZ));
    float randomDist = fract(sin(seed * 54.321) * 43758.5453);
    float scatterDist = pow(randomDist, 1.5);
    float thickness = 0.5 + progress * 1.8; 
    
    vec3 heartOffset = scatterDir * (scatterDist * thickness);

    float swirlAngle = uTime * speedFactor * 2.5 + progress * 12.0;
    float c = cos(swirlAngle);
    float s = sin(swirlAngle);
    heartOffset = vec3(heartOffset.x * c - heartOffset.z * s, heartOffset.y, heartOffset.x * s + heartOffset.z * c);
    
    float pulsePhase = sin(uTime * 2.5 + seed * 0.5) * uPulseAmplitude;
    heartOffset *= (1.0 + pulsePhase);

    vec3 heartDisplaced = heartPos + heartOffset;
    heartDisplaced.y += 0.5;

    // --- TEXT PARTICLES MATH ---
    // Text particles use their exact sampled position but gently pulse
    vec3 textOffset = vec3(noiseX, noiseY, noiseZ) * 0.2 * pulsePhase;
    vec3 textDisplaced = position + textOffset;

    // --- FINAL POSITION ---
    // If isText == 1.0, use text position. If 0.0, use heart position.
    vec3 displaced = mix(heartDisplaced, textDisplaced, isText);

    // --- MVP TRANSFORM ---
    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // --- DISTANCE-ATTENUATED POINT SIZE ---
    float distAttenuation = 280.0 / -mvPosition.z;
    gl_PointSize = uPointSize * sizeVariance * distAttenuation * uPixelRatio;
    
    // Increase size slightly for text particles to ensure legibility
    gl_PointSize = mix(gl_PointSize, gl_PointSize * 1.5, isText);
    gl_PointSize = clamp(gl_PointSize, 0.5, 48.0);

    // --- COMPUTE VARYINGS ---
    vProgress = progress;
    vHeight = clamp((displaced.y + 2.5) / 5.0, 0.0, 1.0);
    vSpeedFactor = speedFactor;
    vGlowFactor = 1.0 + pulsePhase * 2.0;
    vAlpha = 0.7 + seed * 0.3;
  }
`

/* ---------------------------------------------------------------------------
 * FRAGMENT SHADER
 * 
 * Responsibilities:
 *   1. Render smooth circular particles (discard outside radius)
 *   2. Apply radial glow falloff (bright center → soft edge)
 *   3. Height-based color gradient (magenta → cyan → white)
 *   4. Additive blending–ready alpha output
 * --------------------------------------------------------------------------- */

export const fragmentShader = /* glsl */ `
  // === UNIFORMS ===
  uniform vec3 uColorLow;    // Bottom of heart (warm/deep)
  uniform vec3 uColorMid;    // Middle band
  uniform vec3 uColorHigh;   // Top of heart / glow core
  uniform float uTime;

  // === VARYINGS ===
  varying float vHeight;
  varying float vSpeedFactor;
  varying float vGlowFactor;
  varying float vAlpha;
  varying float vProgress;
  varying float vIsText;

  void main() {
    // --- CIRCULAR PARTICLE SHAPE ---
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    if (dist > 0.5) discard;

    // --- SMOOTH GLOW FALLOFF ---
    float coreBrightness = exp(-dist * 8.0);     // Sharp bright center
    float halo = exp(-dist * 3.0) * 0.4;          // Wider soft halo
    float glow = coreBrightness + halo;

    // --- HEIGHT-BASED COLOR GRADIENT ---
    vec3 color;
    if (vHeight < 0.5) {
      float t = vHeight * 2.0;
      color = mix(uColorLow, uColorMid, t);
    } else {
      float t = (vHeight - 0.5) * 2.0;
      color = mix(uColorMid, uColorHigh, t);
    }

    // --- SPEED BRIGHTNESS BOOST ---
    float speedBoost = 0.8 + vSpeedFactor * 0.2;
    color *= speedBoost;

    // --- GLOW INTENSIFICATION ---
    color += uColorHigh * vGlowFactor * 0.15;

    // --- TEXT COLOR OVERRIDE ---
    // If it's a text particle, make it glow brightly with a vivid pink/red color
    vec3 textColor = vec3(1.0, 0.1, 0.4); // Deep romantic pink
    color = mix(color, textColor, vIsText * 0.9);
    glow = mix(glow, glow * 2.0, vIsText); 

    // --- FINAL COMPOSITING ---
    float alpha = mix(glow * vAlpha, 1.0, vIsText); // Text is fully opaque

    // FADE IN (at bottom) AND FADE OUT (at top cleft)
    // progress is 0 at bottom, 1 at top. 
    // Ignore fade for text so it stays bright.
    float fade = smoothstep(0.0, 0.05, vProgress) * smoothstep(1.0, 0.85, vProgress);
    alpha = mix(alpha * fade, alpha, vIsText);

    // Tone-map to prevent wash-out with additive blending
    color = color / (color + vec3(0.3));
    color *= 1.4; // Brightness compensation

    gl_FragColor = vec4(color * glow, alpha);
  }
`

/* ---------------------------------------------------------------------------
 * DEFAULT UNIFORM VALUES
 * --------------------------------------------------------------------------- */

export interface HeartVortexUniforms {
  uTime: { value: number }
  uPixelRatio: { value: number }
  uPointSize: { value: number }
  uFlowSpeed: { value: number }
  uFlowScale: { value: number }
  uPulseAmplitude: { value: number }
  uColorLow: { value: Color }
  uColorMid: { value: Color }
  uColorHigh: { value: Color }
}

/**
 * Create default uniforms for the heart vortex shader.
 * These can be tweaked in real-time for visual tuning.
 */
export function createHeartVortexUniforms(): HeartVortexUniforms {
  return {
    uTime:           { value: 0 },
    uPixelRatio:     { value: Math.min(window.devicePixelRatio, 2) },
    uPointSize:      { value: 3.5 }, // Increased for fluffy cloud look
    uFlowSpeed:      { value: 1.0 },
    uFlowScale:      { value: 0.35 },
    uPulseAmplitude: { value: 0.06 },
    uColorLow:       { value: new Color('#ff2d78') },   // Deep hot pink / magenta
    uColorMid:       { value: new Color('#00d4ff') },   // Electric cyan
    uColorHigh:      { value: new Color('#e0f7ff') },   // Bright ice white
  }
}

/**
 * Create a complete ShaderMaterial instance ready for <primitive :object="material" />.
 * Pre-configured with additive blending, transparency, and depth settings
 * optimized for particle rendering.
 */
export function createHeartVortexMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: createHeartVortexUniforms(),
    transparent: true,
    depthWrite: false,        // Particles don't occlude each other
    depthTest: true,          // But respect scene depth
    blending: AdditiveBlending, // Overlapping particles = brighter (energy look)
  })
}
