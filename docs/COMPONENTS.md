# Component Map — LoveNis Memory Vault

## Memory Vault (mới)
```
src/components/
├── LoveAudioPlayer.vue       # Props: src, title, autoplay, type
├── MemoryUploader.vue        # Emit: @uploaded(memories[])
└── memory/
    ├── CoverflowView.vue     # Props: memories[]
    └── TimelineView.vue      # Props: memories[] (Step 4)

src/composables/
├── useMemories.js            # CRUD + upload + state toàn cục
├── useCoverflow.js           # Three.js Coverflow (shallowRef)
└── useTimeline3D.js          # Three.js Timeline (Step 4)
```

## Dùng nhanh
```vue
<!-- Upload -->
<MemoryUploader @uploaded="onUploaded" />

<!-- Coverflow -->
<CoverflowView :memories="memories" />

<!-- Audio player -->
<LoveAudioPlayer :src="memory.media_url" :title="memory.title" />

<!-- Fetch data -->
<script setup>
const { memories, fetchMemories } = useMemories()
onMounted(() => fetchMemories())
</script>
```

## Analytics (cũ — không đổi)
```
src/utils/analytics.ts
functions/api/track-visitor.js
functions/api/track-card-click.js
functions/api/stats.js
```
