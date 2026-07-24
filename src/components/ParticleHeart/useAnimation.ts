import gsap from 'gsap';
import { Howl } from 'howler';
import type * as THREE from 'three';
import type { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import type { ParticleSystemState } from './Types';

interface AnimationDeps {
  heartMaterial: THREE.PointsMaterial;
  particleState: ParticleSystemState;
  bloomPass: UnrealBloomPass;
  resetParticles: () => void;
}

export function useAnimation({ heartMaterial, particleState, bloomPass, resetParticles }: AnimationDeps) {
  let timeline: gsap.core.Timeline | null = null;
  let audio: Howl | null = null;

  const initAudio = () => {
    audio = new Howl({
      src: ['/audio/music.mp3'], // Assuming this path or a placeholder
      volume: 0.4,
      loop: true,
      html5: true,
      onloaderror: () => {
        console.warn('Audio failed to load. The animation will continue without audio.');
      }
    });
  };

  const createTimeline = () => {
    timeline = gsap.timeline({ repeat: -1, paused: true });

    // Initial state
    heartMaterial.opacity = 0;
    particleState.emissionRate = 0;
    particleState.velocityMultiplier = 1.0;
    particleState.gravity = -0.05;
    bloomPass.strength = 0.5; // Start bloom

    // [0.0s - 0.5s] Sequence 1: Fade heart opacity to 1
    timeline.to(heartMaterial, { opacity: 1, duration: 0.5, ease: 'power2.inOut' }, 0);
    
    // [2.0s - 5.0s] Sequence 2: Ramp up emissionRate and bloom
    timeline.to(particleState, { emissionRate: 3000, duration: 3.0, ease: 'power1.inOut' }, 2.0);
    timeline.to(bloomPass, { strength: 1.5, duration: 3.0, ease: 'power1.inOut' }, 2.0);

    // [5.0s - 10.0s] Sequence 3: Burst (fade heart out, higher velocity, more gravity, high bloom)
    timeline.to(heartMaterial, { opacity: 0, duration: 2.0, ease: 'power2.out' }, 5.0);
    timeline.to(particleState, { velocityMultiplier: 2.0, gravity: -0.1, duration: 5.0, ease: 'power2.in' }, 5.0);
    timeline.to(bloomPass, { strength: 2.5, duration: 5.0, ease: 'power2.in' }, 5.0);

    // [10.0s - 15.0s] Sequence 4: Cloud (Drop emission to 0, bloom to 2.0)
    timeline.to(particleState, { emissionRate: 0, duration: 5.0, ease: 'power2.out' }, 10.0);
    timeline.to(bloomPass, { strength: 2.0, duration: 5.0, ease: 'power1.inOut' }, 10.0);

    // [15.0s - 21.0s] Sequence 5: Reset (Bloom back to 0.5, reset particles at 15.0s)
    timeline.call(() => {
      resetParticles();
    }, [], 15.0);
    
    // reset state smoothly for next loop if needed, bloom to 0.5
    timeline.to(bloomPass, { strength: 0.5, duration: 6.0, ease: 'power2.out' }, 15.0);
    
    // Return particle state back to defaults smoothly before next loop begins
    timeline.to(particleState, { velocityMultiplier: 1.0, gravity: -0.05, duration: 2.0 }, 19.0);
    
    // Timeline is 21s total length
    timeline.to({}, { duration: 21.0 }); // ensures the timeline is exactly 21 seconds long
  };

  const start = () => {
    if (!timeline) createTimeline();
    if (!audio) initAudio();
    
    audio?.play();
    timeline?.play(0);
  };

  const cleanup = () => {
    timeline?.kill();
    audio?.unload();
  };

  return {
    start,
    cleanup
  };
}
