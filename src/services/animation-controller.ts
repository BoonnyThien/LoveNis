import { ParticleSystem } from './particle-system'
import { PostProcessingManager } from './post-processing'
import * as THREE from 'three'

export class AnimationController {
  private time = 0
  private sequence = 0
  private duration = 21.08 // 21.08 seconds
  
  constructor(
    private particleSystem: ParticleSystem,
    private postProcessing: PostProcessingManager,
    private heartMesh: THREE.Points | THREE.Mesh,
    private sourceGeometry: THREE.BufferGeometry
  ) {}

  public update(deltaTime: number) {
    this.time += deltaTime
    
    // Loop reset
    if (this.time >= this.duration) {
      this.time = 0
      this.sequence = 0
      this.particleSystem.clear()
    }

    // Sequence 1: Heart formation (0-2s)
    if (this.time >= 0 && this.time < 2) {
      this.sequence = 1
      const progress = this.time / 2
      // Fade in heart
      if (this.heartMesh.material instanceof THREE.Material) {
        this.heartMesh.material.opacity = progress
        this.heartMesh.material.transparent = true
      }
      this.postProcessing.setBloomStrength(0.5)
    }
    
    // Sequence 2: Particle spawn (2-5s)
    else if (this.time >= 2 && this.time < 5) {
      this.sequence = 2
      const progress = (this.time - 2) / 3
      // Heart remains visible
      if (this.heartMesh.material instanceof THREE.Material) {
        this.heartMesh.material.opacity = 1.0
      }
      // Emit particles
      const emitRate = Math.floor(progress * 100) // ramp up
      this.particleSystem.setGravity(false)
      this.particleSystem.emit(emitRate, this.sourceGeometry, 0.2) // low velocity
      
      // Ramp bloom
      this.postProcessing.setBloomStrength(0.5 + progress)
    }
    
    // Sequence 3: Major Burst (5-10s)
    else if (this.time >= 5 && this.time < 10) {
      this.sequence = 3
      const progress = (this.time - 5) / 5
      
      // Fade out heart
      if (this.heartMesh.material instanceof THREE.Material) {
        this.heartMesh.material.opacity = Math.max(0, 1.0 - progress * 2)
      }
      
      // Heavy emission
      this.particleSystem.setGravity(true)
      this.particleSystem.emit(200, this.sourceGeometry, 1.0 + progress) // high velocity
      
      this.postProcessing.setBloomStrength(2.5) // max bloom
    }
    
    // Sequence 4: Cloud (10-15s)
    else if (this.time >= 10 && this.time < 15) {
      this.sequence = 4
      
      // Heart invisible
      if (this.heartMesh.material instanceof THREE.Material) {
        this.heartMesh.material.opacity = 0
      }
      
      // Stop emission, physics continues naturally
      this.particleSystem.setGravity(true)
      this.postProcessing.setBloomStrength(2.5)
    }
    
    // Sequence 5: Loop Reset (15-21.08s)
    else if (this.time >= 15) {
      this.sequence = 5
      const progress = (this.time - 15) / 6.08
      
      // Fade out bloom
      this.postProcessing.setBloomStrength(Math.max(0.5, 2.5 - progress * 2))
    }

    // Always update particle system physics
    this.particleSystem.update(deltaTime)
  }
}
