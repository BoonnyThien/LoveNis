// ============================================
// FILE 1: services/gsap-timeline-controller.ts
// ============================================

import gsap from 'gsap';
import type { ParticleSystemState } from './types';

interface TimelineConfig {
  duration: number;
  repeat: number;
  autoplay: boolean;
}

export class GsapTimelineController {
  timeline: gsap.core.Timeline;
  config: TimelineConfig;
  
  constructor(config: Partial<TimelineConfig> = {}) {
    this.config = {
      duration: 21.08,
      repeat: -1,
      autoplay: true,
      ...config
    };
    
    this.timeline = gsap.timeline({
      repeat: this.config.repeat,
      paused: !this.config.autoplay
    });
  }
  
  // Sequence 1: Heart Formation (0-2s)
  sequence1_heartFormation(
    heart: any,
    particleState: ParticleSystemState,
    duration: number = 2
  ) {
    this.timeline.to(heart.material, {
      opacity: 1,
      duration: 0.5,
      ease: 'power2.inOut'
    }, 0);
    
    this.timeline.to(particleState, {
      emissionRate: 0,
      duration: duration - 0.5,
      ease: 'none'
    }, 0.5);
    
    return this;
  }
  
  // Sequence 2: Particle Spawn (2-5s)
  sequence2_particleSpawn(
    particleState: ParticleSystemState,
    bloomPass: any,
    startTime: number = 2,
    duration: number = 3
  ) {
    this.timeline.to(particleState, {
      emissionRate: 3000,
      velocityMultiplier: 0.2,
      duration: duration,
      ease: 'power1.inOut'
    }, startTime);
    
    this.timeline.to(bloomPass, {
      strength: 1.5,
      duration: duration,
      ease: 'power1.inOut'
    }, startTime);
    
    return this;
  }
  
  // Sequence 3: Burst (5-10s)
  sequence3_burst(
    heart: any,
    particleState: ParticleSystemState,
    bloomPass: any,
    startTime: number = 5,
    duration: number = 5,
    onEmit?: () => void
  ) {
    this.timeline.to(heart.material, {
      opacity: 0,
      duration: 2,
      ease: 'power2.out'
    }, startTime);
    
    this.timeline.to(particleState, {
      velocityMultiplier: 2.0,
      gravity: -0.1,
      duration: duration,
      ease: 'power2.in',
      onUpdate: onEmit || (() => {})
    }, startTime);
    
    this.timeline.to(bloomPass, {
      strength: 2.5,
      duration: duration,
      ease: 'power2.in'
    }, startTime);
    
    return this;
  }
  
  // Sequence 4: Particle Cloud (10-15s)
  sequence4_cloud(
    particleState: ParticleSystemState,
    bloomPass: any,
    startTime: number = 10,
    duration: number = 5
  ) {
    this.timeline.to(particleState, {
      emissionRate: 0,
      gravity: -0.1,
      duration: duration,
      ease: 'none'
    }, startTime);
    
    this.timeline.to(bloomPass, {
      strength: 2.0,
      duration: duration,
      ease: 'none'
    }, startTime);
    
    return this;
  }
  
  // Sequence 5: Loop Reset (15-21.08s)
  sequence5_loopReset(
    heart: any,
    bloomPass: any,
    startTime: number = 15,
    duration: number = 6.08,
    onReset?: () => void
  ) {
    this.timeline.call(onReset || (() => {}), [], startTime);
    
    this.timeline.to(bloomPass, {
      strength: 0.5,
      duration: 2,
      ease: 'power2.out'
    }, startTime);
    
    this.timeline.to(heart.material, {
      opacity: 0,
      duration: 1,
      ease: 'power2.out'
    }, startTime);
    
    return this;
  }
  
  play() {
    this.timeline.play();
  }
  
  pause() {
    this.timeline.pause();
  }
  
  stop() {
    this.timeline.stop();
  }
  
  seek(time: number) {
    this.timeline.seek(time);
  }
  
  kill() {
    this.timeline.kill();
  }
  
  getProgress(): number {
    return this.timeline.progress();
  }
  
  getTime(): number {
    return this.timeline.time();
  }
}

// ============================================
// FILE 2: services/popmotion-physics.ts
// ============================================

import { physics } from 'popmotion';
import type { Particle } from './types';

interface PhysicsConfig {
  gravity: number;
  airResistance: number;
}

export class PopmotionPhysics {
  config: PhysicsConfig;
  particlePhysics: Map<Particle, ReturnType<typeof physics>> = new Map();
  
  constructor(config: Partial<PhysicsConfig> = {}) {
    this.config = {
      gravity: -0.1,
      airResistance: 0.98,
      ...config
    };
  }
  
  /**
   * Simulate single particle with physics
   */
  simulateParticle(particle: Particle, deltaTime: number) {
    // Apply acceleration (gravity)
    particle.velocity.y += this.config.gravity * (deltaTime / 1000);
    
    // Apply air resistance (drag)
    particle.velocity.multiplyScalar(this.config.airResistance);
    
    // Update position
    particle.position.add(
      particle.velocity.clone().multiplyScalar(deltaTime / 1000)
    );
    
    // Age particle
    particle.age += deltaTime / 1000;
    
    // Update alpha (lifetime decay - linear fade)
    particle.alpha = Math.max(0, 1 - (particle.age / particle.lifetime));
    
    return particle;
  }
  
  /**
   * Simulate all particles in batch
   */
  simulateParticles(particles: Particle[], deltaTime: number) {
    particles.forEach(particle => {
      if (particle.isActive) {
        this.simulateParticle(particle, deltaTime);
      }
    });
  }
  
  /**
   * Apply gravity to specific particle
   */
  applyGravity(particle: Particle, gravity: number) {
    particle.acceleration.y = gravity;
  }
  
  /**
   * Apply air resistance
   */
  applyAirResistance(particle: Particle, resistance: number) {
    particle.velocity.multiplyScalar(resistance);
  }
  
  /**
   * Calculate particle trajectory (for debugging/visualization)
   */
  calculateTrajectory(
    particle: Particle,
    steps: number = 30,
    deltaTime: number = 0.016
  ): THREE.Vector3[] {
    const trajectory: THREE.Vector3[] = [];
    const tempParticle = {
      ...particle,
      position: particle.position.clone(),
      velocity: particle.velocity.clone(),
      acceleration: particle.acceleration.clone()
    };
    
    for (let i = 0; i < steps; i++) {
      trajectory.push(tempParticle.position.clone());
      this.simulateParticle(tempParticle as any, deltaTime * 1000);
    }
    
    return trajectory;
  }
  
  /**
   * Update physics configuration
   */
  updateConfig(config: Partial<PhysicsConfig>) {
    this.config = { ...this.config, ...config };
  }
}

// ============================================
// FILE 3: services/particle-system-enhanced.ts
// ============================================

import * as THREE from 'three';
import type { Particle } from './types';

interface ParticleEmitterConfig {
  count: number;
  lifetime: { min: number; max: number };
  velocity: { min: number; max: number };
  size: { min: number; max: number };
  color: THREE.Color;
  position: THREE.Vector3;
}

export class ParticleSystemEnhanced {
  particles: Particle[] = [];
  geometry: THREE.BufferGeometry;
  material: THREE.PointsMaterial;
  mesh: THREE.Points;
  
  emissionRate: number = 0;
  velocityMultiplier: number = 1;
  lastEmitTime: number = 0;
  
  config: ParticleEmitterConfig;
  
  constructor(
    particleCount: number = 10000,
    config: Partial<ParticleEmitterConfig> = {}
  ) {
    this.config = {
      count: particleCount,
      lifetime: { min: 5, max: 8 },
      velocity: { min: 0.5, max: 2.0 },
      size: { min: 0.05, max: 0.15 },
      color: new THREE.Color(0xFF1744),
      position: new THREE.Vector3(0, 0, 0),
      ...config
    };
    
    // Initialize particle pool
    this.initializeParticlePool(particleCount);
    
    // Setup geometry and material
    this.setupGeometry(particleCount);
    this.setupMaterial();
    this.mesh = new THREE.Points(this.geometry, this.material);
  }
  
  /**
   * Initialize particle pool
   */
  private initializeParticlePool(count: number) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        position: new THREE.Vector3(0, 0, 0),
        velocity: new THREE.Vector3(0, 0, 0),
        acceleration: new THREE.Vector3(0, 0, 0),
        age: 0,
        lifetime: this.config.lifetime.min,
        size: this.config.size.min,
        color: this.config.color.clone(),
        alpha: 1,
        isActive: false
      });
    }
  }
  
  /**
   * Setup buffer geometry
   */
  private setupGeometry(count: number) {
    this.geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    const color = this.config.color;
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      
      sizes[i] = this.config.size.min;
    }
    
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  }
  
  /**
   * Setup point material
   */
  private setupMaterial() {
    this.material = new THREE.PointsMaterial({
      color: this.config.color,
      size: 1.5,
      vertexColors: true,
      sizeAttenuation: true,
      emissive: this.config.color,
      emissiveIntensity: 1.0,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      depthTest: true
    });
  }
  
  /**
   * Emit particles from source
   */
  emitParticles(
    count: number,
    sourceGeometry?: THREE.BufferGeometry
  ) {
    let emitted = 0;
    
    for (let i = 0; i < this.particles.length && emitted < count; i++) {
      const particle = this.particles[i];
      
      if (!particle.isActive) {
        // Position
        particle.position.copy(this.config.position);
        
        // If source geometry provided, spawn from its surface
        if (sourceGeometry) {
          const positions = sourceGeometry.getAttribute('position').array as Float32Array;
          const randomVertexIndex = Math.floor(Math.random() * (positions.length / 3)) * 3;
          
          particle.position.set(
            positions[randomVertexIndex],
            positions[randomVertexIndex + 1],
            positions[randomVertexIndex + 2]
          );
        }
        
        // Velocity (radial outward)
        const angle = Math.random() * Math.PI * 2;
        const elevation = Math.random() * Math.PI - Math.PI / 2;
        const speed = (this.config.velocity.min + 
          Math.random() * (this.config.velocity.max - this.config.velocity.min)) *
          this.velocityMultiplier;
        
        particle.velocity.set(
          Math.cos(angle) * Math.cos(elevation) * speed,
          Math.sin(elevation) * speed,
          Math.sin(angle) * Math.cos(elevation) * speed
        );
        
        // Lifetime
        particle.age = 0;
        particle.lifetime = this.config.lifetime.min +
          Math.random() * (this.config.lifetime.max - this.config.lifetime.min);
        
        // Size
        particle.size = this.config.size.min +
          Math.random() * (this.config.size.max - this.config.size.min);
        
        // Reset active
        particle.alpha = 1;
        particle.isActive = true;
        
        emitted++;
      }
    }
    
    return emitted;
  }
  
  /**
   * Update particle positions & attributes
   */
  updateParticles(deltaTime: number) {
    const positions = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    const posArray = positions.array as Float32Array;
    
    this.particles.forEach((particle, i) => {
      if (particle.isActive) {
        // Update position in geometry
        posArray[i * 3] = particle.position.x;
        posArray[i * 3 + 1] = particle.position.y;
        posArray[i * 3 + 2] = particle.position.z;
      }
    });
    
    positions.needsUpdate = true;
  }
  
  /**
   * Clear all active particles
   */
  clearParticles() {
    this.particles.forEach(p => (p.isActive = false));
    
    const positions = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    const posArray = positions.array as Float32Array;
    
    for (let i = 0; i < posArray.length; i++) {
      posArray[i] = 0;
    }
    
    positions.needsUpdate = true;
  }
  
  /**
   * Get active particle count
   */
  getActiveCount(): number {
    return this.particles.filter(p => p.isActive).length;
  }
  
  /**
   * Update emission rate
   */
  setEmissionRate(rate: number) {
    this.emissionRate = rate;
  }
  
  /**
   * Update velocity multiplier
   */
  setVelocityMultiplier(multiplier: number) {
    this.velocityMultiplier = multiplier;
  }
  
  /**
   * Get mesh for scene
   */
  getMesh(): THREE.Points {
    return this.mesh;
  }
  
  /**
   * Dispose resources
   */
  dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}

// ============================================
// FILE 4: services/types.ts
// ============================================

import * as THREE from 'three';

export interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
  age: number;
  lifetime: number;
  size: number;
  color: THREE.Color;
  alpha: number;
  isActive: boolean;
}

export interface ParticleSystemState {
  emissionRate: number;
  velocityMultiplier: number;
  gravity: number;
  airResistance: number;
}

export interface ViewportSettings {
  width: number;
  height: number;
  aspectRatio: number;
  pixelRatio: number;
}

export interface AnimationSequence {
  id: number;
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
}

// ============================================
// FILE 5: utils/heart-generator.ts
// ============================================

import * as THREE from 'three';

/**
 * Generate parametric heart geometry
 */
export function generateHeartGeometry(
  vertexCount: number = 2000,
  scale: number = 40
): THREE.BufferGeometry {
  const points: THREE.Vector3[] = [];
  
  for (let i = 0; i < vertexCount; i++) {
    const u = (i / vertexCount) * Math.PI * 2;
    
    for (let j = 0; j < 10; j++) {
      const v = (j / 10) * 1.5;
      
      // Heart parametric equation
      const x = 16 * Math.sin(u) ** 3;
      const y = 13 * Math.cos(u) - 
                5 * Math.cos(2 * u) - 
                2 * Math.cos(3 * u) - 
                Math.cos(4 * u);
      const z = 0;
      
      points.push(new THREE.Vector3(
        x * v * scale / 20,
        y * v * scale / 13,
        z
      ));
    }
  }
  
  return new THREE.BufferGeometry().setFromPoints(points);
}

/**
 * Alternative: Generate heart from SVG path
 */
export function generateHeartFromSVG(): THREE.BufferGeometry {
  const heartShape = new THREE.Shape();
  
  // SVG-like heart path
  heartShape.moveTo(0, 0);
  heartShape.bezierCurveTo(-30, -40, -40, -35, -40, -15);
  heartShape.bezierCurveTo(-40, 0, -20, 20, 0, 30);
  heartShape.bezierCurveTo(20, 20, 40, 0, 40, -15);
  heartShape.bezierCurveTo(40, -35, 30, -40, 0, 0);
  
  const geometry = new THREE.ShapeGeometry(heartShape);
  return geometry;
}

// ============================================
// FILE 6: utils/easing.ts
// ============================================

/**
 * Custom easing functions for smooth animations
 */

export const easing = {
  // Linear
  linear: (t: number) => t,
  
  // Quadratic
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => 1 - (1 - t) * (1 - t),
  easeInOutQuad: (t: number) => 
    t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) * (-2 * t + 2) / 2,
  
  // Cubic
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  
  // Quartic
  easeInQuart: (t: number) => t * t * t * t,
  easeOutQuart: (t: number) => 1 - Math.pow(1 - t, 4),
  easeInOutQuart: (t: number) =>
    t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,
  
  // Exponential
  easeInExpo: (t: number) => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
  easeOutExpo: (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInOutExpo: (t: number) =>
    t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? 
      Math.pow(2, 20 * t - 10) / 2 : 
      (2 - Math.pow(2, -20 * t + 10)) / 2,
  
  // Elastic
  easeInElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : 
      -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  },
  
  easeOutElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 :
      Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }
};

/**
 * Interpolate between two values using easing function
 */
export function interpolate(
  from: number,
  to: number,
  t: number,
  easingFn: (t: number) => number = easing.easeInOutQuad
): number {
  return from + (to - from) * easingFn(t);
}
