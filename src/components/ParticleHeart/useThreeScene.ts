import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export function useThreeScene(canvas: HTMLCanvasElement) {
  const container = canvas.parentElement as HTMLElement;
  
  // Scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // Camera
  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.z = 50;

  // Renderer
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Post-Processing
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(container.clientWidth, container.clientHeight),
    0.15, // threshold
    2.5,  // strength
    1.0   // radius
  );
  composer.addPass(bloomPass);

  // Heart Geometry
  const createHeartGeometry = () => {
    const points: THREE.Vector3[] = [];
    const vertexCount = 2000;
    
    for (let i = 0; i < vertexCount; i++) {
      const u = (i / vertexCount) * Math.PI * 2;
      
      // Parametric heart equation
      const x = 16 * Math.pow(Math.sin(u), 3);
      const y = 13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u);
      const z = 0;
      
      points.push(new THREE.Vector3(x * 1.2, y * 1.2, z));
    }
    
    return new THREE.BufferGeometry().setFromPoints(points);
  };

  const heartGeometry = createHeartGeometry();
  const heartMaterial = new THREE.PointsMaterial({
    color: new THREE.Color(0xff1744), // red/pink
    size: 2,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  
  const heartMesh = new THREE.Points(heartGeometry, heartMaterial);
  scene.add(heartMesh);

  // Resize handler
  const handleResize = () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    composer.setSize(width, height);
    bloomPass.resolution.set(width, height);
  };

  window.addEventListener('resize', handleResize);

  const cleanup = () => {
    window.removeEventListener('resize', handleResize);
    renderer.dispose();
    heartGeometry.dispose();
    heartMaterial.dispose();
  };

  return {
    scene,
    camera,
    renderer,
    composer,
    bloomPass,
    heartMesh,
    heartGeometry,
    cleanup
  };
}
