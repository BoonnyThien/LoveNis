import * as THREE from 'three';

export interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
  age: number;
  lifetime: number;
  alpha: number;
  isActive: boolean;
}

export interface ParticleSystemState {
  emissionRate: number;
  velocityMultiplier: number;
  gravity: number;
}
