import { ref, shallowRef } from 'vue'
import { TextureLoader, Shape as ThreeShape } from 'three'
import gsap from 'gsap'
import { toRaw } from 'vue'
import { SPHERE_ITEMS, ORBIT_RADIUS } from './useConfiguration' // Local import since same folder

export function useAnimationLogic(currentFormation, isDancing, groupRefs, formationWrapperRef) {

    const calculatePosition = (index, total) => {
        const angle = (index / total) * Math.PI * 2
        const x = Math.cos(angle) * ORBIT_RADIUS
        const z = Math.sin(angle) * ORBIT_RADIUS
        const y = 0
        return [x, y, z] as [number, number, number]
    }

    const applyBaseFormation = (formation: string) => {
        // Reset Rotation for Base Change
        if (formationWrapperRef.value) {
            gsap.to(formationWrapperRef.value.rotation, { y: 0, duration: 1 })
        }

        if (formation === 'circle') {
            SPHERE_ITEMS.forEach((_, index) => {
                const targetGroup = groupRefs.value[index]
                if (!targetGroup) return
                const rawGroup = toRaw(targetGroup)
                const finalPos = calculatePosition(index, SPHERE_ITEMS.length)

                gsap.to(rawGroup.position, {
                    x: finalPos[0], y: finalPos[1], z: finalPos[2],
                    duration: 1.5,
                    ease: 'power3.out'
                })
                gsap.to(rawGroup.scale, { x: 1, y: 1, z: 1, duration: 1 })
            })
        } else if (formation === 'tree') {
            SPHERE_ITEMS.forEach((_, index) => {
                const targetGroup = groupRefs.value[index]
                if (!targetGroup) return
                const rawGroup = toRaw(targetGroup)

                const angle = index * 0.8
                const radius = 1.5 - (index * 0.1)
                const tx = Math.cos(angle) * radius
                const ty = -1 + (index * 0.45)
                const tz = Math.sin(angle) * radius

                gsap.to(rawGroup.position, {
                    x: tx, y: ty, z: tz,
                    duration: 1.5,
                    ease: 'back.out(1)'
                })
                gsap.to(rawGroup.scale, { x: 0.4, y: 0.4, z: 0.4, duration: 1 })
            })
        } else if (formation === 'fireworks') {
            SPHERE_ITEMS.forEach((_, index) => {
                const targetGroup = groupRefs.value[index]
                if (!targetGroup) return
                const rawGroup = toRaw(targetGroup)

                // Create a timeline for sequencing
                const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 })

                // Step 1: Converge to Peak
                tl.to(rawGroup.position, {
                    x: 0, y: 5 + (index * 0.1), z: 0, // Slight offset to prevent z-fighting
                    duration: 2,
                    ease: 'power2.inOut',
                    delay: index * 0.05 // Stagger slightly
                })

                // Step 2: Explode / Fly Out
                const angle = (index / SPHERE_ITEMS.length) * Math.PI * 2
                const explodeR = 8
                const ex = Math.cos(angle) * explodeR
                const ey = 6 + (Math.random() * 4) // higher
                const ez = Math.sin(angle) * explodeR

                tl.to(rawGroup.position, {
                    x: ex, y: ey, z: ez,
                    duration: 0.8,
                    ease: 'expo.out'
                })

                // Step 3: Move to Tree Positions
                const treeAngle = index * 0.8
                const treeRadius = 1.5 - (index * 0.1)
                const tx = Math.cos(treeAngle) * treeRadius
                const ty = -1 + (index * 0.45)
                const tz = Math.sin(treeAngle) * treeRadius

                tl.to(rawGroup.position, {
                    x: tx, y: ty, z: tz,
                    duration: 2,
                    ease: 'power3.inOut',
                    delay: 1 // Wait a bit after explode
                })

                // Stay at Tree for a bit
                tl.to({}, { duration: 2 })
            })
        }
    }

    return {
        calculatePosition,
        applyBaseFormation
    }
}
