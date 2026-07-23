import { ref } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

export const useThreeSetup = () => {
  const canvas = ref<HTMLCanvasElement | null>(null)
  let renderer: THREE.WebGLRenderer | null = null
  let scene: THREE.Scene | null = null
  let camera: THREE.PerspectiveCamera | null = null
  let controls: OrbitControls | null = null

  const init = (width = 576, height = 1024) => {
    if (!canvas.value) {
      console.error('Canvas element not found')
      return
    }
    // Scene
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)

    // Camera
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000)
    camera.position.set(0, 0, 500)

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas: canvas.value, antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)

    // Controls (optional for debugging)
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
  }

  const render = (callback?: () => void) => {
    if (!renderer || !scene || !camera) return
    requestAnimationFrame(() => render(callback))
    controls?.update()
    renderer.render(scene, camera)
    callback && callback()
  }

  const getScene = () => scene
  const getCamera = () => camera
  const getRenderer = () => renderer

  return { canvas, init, render, getScene, getCamera, getRenderer }
}
