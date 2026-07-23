import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import HappyNewYearView from '../views/HappyNewYearView.vue'
import WorldView from '../views/WorldView.vue'
import OpenGiftView from '../views/OpenGiftView.vue'
import HeartVortexView from '../views/HeartVortexView.vue'
import BlossomView from '../views/BlossomView.vue'
import HeartOfLoveView from '../views/HeartOfLoveView.vue'
import LoveAnimationView from '../views/LoveAnimationView.vue'
import MemoryVaultView from '../views/MemoryVaultView.vue'
import GiftFallView from '../views/GiftFallView.vue'
import HightLineText from '../views/HightLineText.vue'
import SnowballGameView from '../views/SnowballGameView.vue'
import SnowballView from '../views/SnowballView.vue'
import ParticleHeartView from '../views/ParticleHeartView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            redirect: '/login'
        },
        {
            path: '/login',
            name: 'login',
            component: LoginView
        },
        {
            path: '/vault',
            name: 'vault',
            component: MemoryVaultView
        },
        {
            path: '/happynewyear',
            name: 'happynewyear',
            component: HappyNewYearView
        },
        {
            path: '/world',
            name: 'world',
            component: WorldView
        },
        {
            path: '/opengift',
            name: 'opengift',
            component: OpenGiftView
        },
        {
            path: '/heartvortex',
            name: 'heartvortex',
            component: HeartVortexView
        },
        {
            path: '/blossom',
            name: 'blossom',
            component: BlossomView
        },
        {
            path: '/heartoflove',
            name: 'heartoflove',
            component: HeartOfLoveView
        },
        {
            path: '/loveanimation',
            name: 'loveanimation',
            component: LoveAnimationView
        },
        {
            path: '/giftfall',
            name: 'giftfall',
            component: GiftFallView
        },
        {
            path: '/hightlinetext',
            name: 'hightlinetext',
            component: HightLineText
        },
        {
            path: '/snowballgame',
            name: 'snowballgame',
            component: SnowballGameView
        },
        {
            path: '/snowball',
            name: 'snowball',
            component: SnowballView
        },
        {
            path: '/particleheart',
            name: 'particleheart',
            component: ParticleHeartView
        }
    ]
})

export default router
