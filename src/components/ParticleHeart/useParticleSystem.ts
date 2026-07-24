import * as THREE from 'three';
import type { Particle, ParticleSystemState } from './Types';

export function useParticleSystem(scene: THREE.Scene, heartGeometry: THREE.BufferGeometry) {
  const maxParticles = 10000;
  const particles: Particle[] = [];
  
  // Create particle pool
  for (let i = 0; i < maxParticles; i++) {
    particles.push({
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      acceleration: new THREE.Vector3(),
      age: 0,
      lifetime: 0,
      alpha: 0,
      isActive: false
    });
  }

  // Create geometry
  const particleGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(maxParticles * 3);
  const colors = new Float32Array(maxParticles * 3);
  const alphas = new Float32Array(maxParticles);
  
  // Init arrays
  for (let i = 0; i < maxParticles; i++) {
    // default white/pinkish color
    colors[i * 3] = 1.0;
    colors[i * 3 + 1] = 0.2;
    colors[i * 3 + 2] = 0.4;
    alphas[i] = 0;
  }
  
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  particleGeometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
  
  // Custom shader material to support individual alpha per particle
  const particleMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }
    },
    vertexShader: `
      attribute float alpha;
      attribute vec3 color;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vColor = color;
        vAlpha = alpha;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = 3.0 * (100.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        // Soft circular particle
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;
        float intensity = 1.0 - (dist * 2.0);
        gl_FragColor = vec4(vColor, vAlpha * intensity);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  
  const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particleSystem);
  
  const state: ParticleSystemState = {
    emissionRate: 0,
    velocityMultiplier: 1.0,
    gravity: -0.05
  };
  
  let leftoverEmission = 0;
  
  const emitParticles = (count: number) => {
    const heartPositions = heartGeometry.getAttribute('position').array as Float32Array;
    const vertexCount = heartPositions.length / 3;
    
    let emitted = 0;
    for (let i = 0; i < maxParticles && emitted < count; i++) {
      const p = particles[i];
      if (!p.isActive) {
        // Pick random vertex
        const vIdx = Math.floor(Math.random() * vertexCount) * 3;
        const hx = heartPositions[vIdx];
        const hy = heartPositions[vIdx + 1];
        const hz = heartPositions[vIdx + 2];
        
        p.position.set(hx, hy, hz);
        
        // Radial velocity out from center (0,0,0) or roughly outward
        const angle = Math.atan2(hy, hx) + (Math.random() - 0.5) * 0.5;
        const speed = (Math.random() * 0.5 + 0.5) * state.velocityMultiplier;
        p.velocity.set(Math.cos(angle) * speed, Math.sin(angle) * speed, (Math.random() - 0.5) * speed * 0.5);
        
        p.age = 0;
        p.lifetime = Math.random() * 2 + 2; // 2-4 seconds
        p.alpha = 1.0;
        p.isActive = true;
        
        emitted++;
      }
    }
  };
  
  const resetParticles = () => {
    for (let i = 0; i < maxParticles; i++) {
      particles[i].isActive = false;
      particles[i].alpha = 0;
      alphas[i] = 0;
    }
    particleGeometry.getAttribute('alpha').needsUpdate = true;
  };
  
  const update = (deltaTime: number) => {
    // Handle emission rate
    const particlesToEmit = state.emissionRate * deltaTime + leftoverEmission;
    const emitCount = Math.floor(particlesToEmit);
    leftoverEmission = particlesToEmit - emitCount;
    
    if (emitCount > 0) {
      emitParticles(emitCount);
    }
    
    const positionsAttr = particleGeometry.getAttribute('position') as THREE.BufferAttribute;
    const alphasAttr = particleGeometry.getAttribute('alpha') as THREE.BufferAttribute;
    
    for (let i = 0; i < maxParticles; i++) {
      const p = particles[i];
      if (p.isActive) {
        p.age += deltaTime;
        
        if (p.age >= p.lifetime) {
          p.isActive = false;
          p.alpha = 0;
          alphasAttr.setX(i, 0);
          continue;
        }
        
        // Physics
        p.velocity.y += state.gravity * deltaTime * 60; // normalized gravity to 60fps
        p.velocity.multiplyScalar(0.98); // Drag
        p.position.addScaledVector(p.velocity, deltaTime * 60);
        
        // Alpha calculation
        const lifeRatio = p.age / p.lifetime;
        p.alpha = 1.0 - Math.pow(lifeRatio, 2); // fade out faster at the end
        
        positionsAttr.setXYZ(i, p.position.x, p.position.y, p.position.z);
        alphasAttr.setX(i, p.alpha);
      }
    }
    
    positionsAttr.needsUpdate = true;
    alphasAttr.needsUpdate = true;
    particleMaterial.uniforms.uTime.value += deltaTime;
  };

  const cleanup = () => {
    particleGeometry.dispose();
    particleMaterial.dispose();
  };
  
  return {
    state,
    update,
    resetParticles,
    cleanup
  };
}
