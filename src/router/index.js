import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import HappyNewYearView from '../views/HappyNewYearView.vue'
import WorldView from '../views/WorldView.vue'
import OpenGiftView from '../views/OpenGiftView.vue'
import TwelveView from '../views/TwelveView.vue'
import HeartVortexView from '../views/HeartVortexView.vue'
import BlossomView from '../views/BlossomView.vue'
import HeartOfLoveView from '../views/HeartOfLoveView.vue'
import LoveAnimationView from '../views/LoveAnimationView.vue'

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
            path: '/happy-new-year',
            name: 'happy-new-year',
            component: HappyNewYearView
        },
        {
            path: '/world',
            name: 'world',
            component: WorldView
        },
        {
            path: '/open-gift',
            name: 'open-gift',
            component: OpenGiftView
        },
        {
            path: '/twelve',
            name: 'twelve',
            component: TwelveView
        },
        {
            path: '/heart-vortex',
            name: 'heart-vortex',
            component: HeartVortexView
        },
        {
            path: '/blossom',
            name: 'blossom',
            component: BlossomView
        },
        {
            path: '/heart-of-love',
            name: 'heart-of-love',
            component: HeartOfLoveView
        },
        {
            path: '/love-animation',
            name: 'love-animation',
            component: LoveAnimationView
        }
    ]
})

export default router
