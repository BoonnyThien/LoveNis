import * as THREE from 'three'

export class GeometryGenerator {
  /**
   * Generates a parametric heart geometry
   * @param subdivisions Number of subdivisions for the geometry density
   * @returns THREE.BufferGeometry
   */
  static generateHeartGeometry(subdivisions = 100): THREE.BufferGeometry {
    const points: THREE.Vector3[] = []
    
    for (let i = 0; i < subdivisions; i++) {
      for (let j = 0; j < subdivisions; j++) {
        const u = (i / subdivisions) * Math.PI * 2
        const v = (j / subdivisions)
        
        // Heart parametric equation
        const x = 16 * Math.pow(Math.sin(u), 3)
        const y = 13 * Math.cos(u) - 5 * Math.cos(2*u) - 2 * Math.cos(3*u) - Math.cos(4*u)
        const z = (Math.random() - 0.5) * 2 // slight thickness for 3d feel, mostly 2D
        
        points.push(new THREE.Vector3(x * v, y * v, z * v))
      }
    }
    
    return new THREE.BufferGeometry().setFromPoints(points)
  }
}
