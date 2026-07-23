import * as THREE from 'three'

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
  lifetime: number;
  age: number;
  startSize: number;
  color: THREE.Color;
  alpha: number;
  active: boolean;
}

export class ParticleSystem {
  public particles: Particle[] = []
  public geometry: THREE.BufferGeometry
  public material: THREE.ShaderMaterial
  public points: THREE.Points

  private positions: Float32Array
  private colors: Float32Array
  private sizes: Float32Array
  private alphas: Float32Array
  private maxParticles: number

  constructor(maxParticles = 10000) {
    this.maxParticles = maxParticles
    
    // Initialize pool
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        acceleration: new THREE.Vector3(0, -6.0, 0), // gravity per second
        lifetime: 0,
        age: 0,
        startSize: 20.0,
        color: new THREE.Color(0xFF1744),
        alpha: 0,
        active: false
      })
    }

    this.positions = new Float32Array(this.maxParticles * 3)
    this.colors = new Float32Array(this.maxParticles * 3)
    this.sizes = new Float32Array(this.maxParticles)
    this.alphas = new Float32Array(this.maxParticles)

    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3))
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1))
    this.geometry.setAttribute('alpha', new THREE.BufferAttribute(this.alphas, 1))

    this.material = this.createShaderMaterial()
    this.points = new THREE.Points(this.geometry, this.material)
  }

  private createShaderMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
      },
      vertexShader: `
        attribute float size;
        attribute float alpha;
        attribute vec3 color;
        
        varying float vAlpha;
        varying vec3 vColor;
        
        void main() {
          vAlpha = alpha;
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (1000.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        varying vec3 vColor;
        
        void main() {
          vec2 centroid = gl_PointCoord - vec2(0.5);
          float dist = length(centroid);
          
          if (dist > 0.5) discard;
          
          float glow = exp(-dist * dist * 5.0);
          
          gl_FragColor = vec4(vColor * glow, vAlpha * glow);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  }

  public emit(count: number, sourceGeometry: THREE.BufferGeometry, velocityMultiplier = 1.0) {
    const posAttr = sourceGeometry.attributes.position
    if (!posAttr) return

    let emitted = 0
    for (let i = 0; i < this.maxParticles && emitted < count; i++) {
      const p = this.particles[i]
      if (!p.active) {
        // Find a random vertex on the source geometry
        const vIndex = Math.floor(Math.random() * posAttr.count)
        p.position.set(
          posAttr.getX(vIndex),
          posAttr.getY(vIndex),
          posAttr.getZ(vIndex)
        )
        
        // Random velocity outwards from center (approx 15-40 units per second)
        p.velocity.copy(p.position).normalize().multiplyScalar((Math.random() * 25.0 + 15.0) * velocityMultiplier)
        p.acceleration.set(0, -6.0, 0) // reset gravity per second
        
        p.lifetime = Math.random() * 3 + 5 // 5 to 8 seconds
        p.age = 0
        p.alpha = 1.0
        p.active = true
        emitted++
      }
    }
  }
  
  public setGravity(enable: boolean) {
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles[i].acceleration.y = enable ? -6.0 : 0;
    }
  }

  public clear() {
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles[i].active = false
      this.particles[i].alpha = 0
    }
  }

  public update(deltaTime: number) {
    const positions = this.geometry.attributes.position.array as Float32Array
    const colors = this.geometry.attributes.color.array as Float32Array
    const sizes = this.geometry.attributes.size.array as Float32Array
    const alphas = this.geometry.attributes.alpha.array as Float32Array

    let activeCount = 0

    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i]
      
      if (p.active) {
        // Physics with deltaTime
        const frameAcc = p.acceleration.clone().multiplyScalar(deltaTime)
        p.velocity.add(frameAcc)
        // Air resistance
        p.velocity.multiplyScalar(Math.pow(0.8, deltaTime))
        
        const frameVel = p.velocity.clone().multiplyScalar(deltaTime)
        p.position.add(frameVel)
        
        // Age
        p.age += deltaTime
        
        // Alpha decay
        p.alpha = Math.max(0, 1.0 - (p.age / p.lifetime))
        
        if (p.age >= p.lifetime) {
          p.active = false
        } else {
          // Update buffers
          const idx = activeCount * 3
          positions[idx] = p.position.x
          positions[idx + 1] = p.position.y
          positions[idx + 2] = p.position.z
          
          colors[idx] = p.color.r
          colors[idx + 1] = p.color.g
          colors[idx + 2] = p.color.b
          
          sizes[activeCount] = p.startSize
          alphas[activeCount] = p.alpha
          
          activeCount++
        }
      }
    }

    this.geometry.setDrawRange(0, activeCount)
    this.geometry.attributes.position.needsUpdate = true
    this.geometry.attributes.color.needsUpdate = true
    this.geometry.attributes.size.needsUpdate = true
    this.geometry.attributes.alpha.needsUpdate = true
  }
}
