# LoveNis Project - AI Agent System Prompt (Optimized Context)

> 💡 **Cách sử dụng:** Dán toàn bộ nội dung này vào Cursor/Cline/Aider context hoặc lưu làm system prompt cho chat CLI kế tiếp. Nó sẽ tăng tốc độ phân tích và tính chính xác lên 10x.

---

## 📋 PROJECT IDENTITY & SCOPE

**Project Name:** LoveNis  
**Type:** Romantic Gift Web Application with 3D Visual Effects  
**Primary Stack:** Vue 3 + TypeScript + Three.js (or TresJS) + Vite  
**Target Outcome:** Create an immersive 3D particle heart experience with glowing bloom effects on dark background  
**Current Status:** MVP with incomplete routes and UI lighting issues  

---

## 🛠 TECH STACK (DETAILED)

```
Frontend:
  ├─ Vue 3 (Composition API)
  ├─ TypeScript
  ├─ TresJS (Vue wrapper for Three.js) OR Three.js vanilla
  ├─ Tailwind CSS (UI/2D layers)
  └─ Vite (build tool)

3D Graphics:
  ├─ Three.js core (geometry, materials, scene management)
  ├─ Particle systems (Points geometry for heart mesh)
  ├─ Post-processing (UnrealBloomPass for glow effect)
  ├─ Shaders (optional: custom GLSL for advanced effects)
  └─ Camera controls (orbit or fixed perspective)
```

---

## 📁 DIRECTORY STRUCTURE (ACTUAL)

```
LoveNis/
├─ src/
│  ├─ router/
│  │  └─ index.js               # Route definitions
│  ├─ views/                    # Pages / Views
│  │  ├─ LoginView.vue          # Initial switch/login screen
│  │  ├─ HeartVortexView.vue    # Particle Heart Scene
│  │  ├─ HeartOfLoveView.vue    # Heart Project wrapper
│  │  └─ ...
│  ├─ components/
│  │  ├─ scenes/                # 3D scene components (TresJS/ThreeJS)
│  │  │  ├─ HeartVortexScene.vue
│  │  │  ├─ HomeScene.vue
│  │  │  └─ shaders/
│  │  └─ ...
│  ├─ composables/
│  │  ├─ useHeartGeometry.ts    # Math for volumetric heart
│  │  └─ ...
│  └─ App.vue
├─ package.json
└─ LOVENIS_AI_CONTEXT.md        # This file
```

---

## 🎯 CORE 3D MECHANICS (TARGET STATE)

### Heart Particle System
```typescript
// Heart surface parametric (Wolfram "Sexy Heart")
const hx = 16 * Math.pow(Math.sin(t), 3) * 0.1
const hy = (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) * 0.1
```

### Post-Processing Pipeline
```typescript
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

const composer = new EffectComposer(renderer);
const bloomPass = new UnrealBloomPass(
  resolution,
  1.2,     // strength (Intensity of glow)
  0.5,     // radius (Spread of glow)
  0.0      // threshold (Only glow bright particles)
);
composer.addPass(bloomPass);
```

---

## 🐛 KNOWN ISSUES & FIXES

| Issue | Location | Root Cause | Quick Fix | Priority |
|-------|----------|-----------|-----------|----------|
| Login UI drowning | `LoginView.vue` | Needs background layering | Add semi-transparent bg div (`.form-section`) | 🔴 HIGH |
| Particle heart not glowing | `HeartVortexScene.vue` | No UnrealBloomPass | Add `EffectComposer + UnrealBloomPass` | 🔴 HIGH |
| Ambient Light too high | `HomeScene.vue` & others | AmbientLight intensity = 1.0+ | Reduce `AmbientLight.intensity` to 0.4-0.6 | 🟡 MEDIUM |
