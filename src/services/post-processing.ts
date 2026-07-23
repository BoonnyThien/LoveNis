import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'

export class PostProcessingManager {
  private composer: EffectComposer
  private renderPass: RenderPass
  private bloomPass: UnrealBloomPass

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    width: number,
    height: number
  ) {
    this.composer = new EffectComposer(renderer)
    
    this.renderPass = new RenderPass(scene, camera)
    this.composer.addPass(this.renderPass)
    
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      2.5,  // strength
      1.0,  // radius
      0.15  // threshold
    )
    this.composer.addPass(this.bloomPass)
  }

  public setSize(width: number, height: number) {
    this.composer.setSize(width, height)
  }
  
  public setBloomStrength(strength: number) {
    this.bloomPass.strength = strength
  }

  public render() {
    this.composer.render()
  }
}
