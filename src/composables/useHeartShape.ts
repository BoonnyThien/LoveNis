import { Shape as ThreeShape } from 'three'

export function useHeartShape() {
    const x = 0, y = 0
    const heartShape = new ThreeShape()

    // Size Scale Factors
    const sx = 4;
    const sy = 4;

    const P0 = { x: 0, y: -2 * sy };
    const P1 = { x: -1.5 * sx, y: 0.5 * sy };
    const P3 = { x: 0, y: 1 * sy }; // Cleft
    const P5 = { x: 1.5 * sx, y: 0.5 * sy };

    // Controls (scaled)
    const C1 = { x: -1.2 * sx, y: 2.0 * sy }; // High outer left
    const C2 = { x: -0.4 * sx, y: 2.9 * sy }; // Top left near cleft
    const C3 = { x: 0.4 * sx, y: 2.9 * sy }; // Top right near cleft
    const C4 = { x: 1.2 * sx, y: 2.0 * sy }; // High outer right

    heartShape.moveTo(x + P0.x, y + P0.y);
    heartShape.lineTo(x + P1.x, y + P1.y); // Straight line up-left
    heartShape.bezierCurveTo(x + C1.x, y + C1.y, x + C2.x, y + C2.y, x + P3.x, y + P3.y); // Left Lobe
    heartShape.bezierCurveTo(x + C3.x, y + C3.y, x + C4.x, y + C4.y, x + P5.x, y + P5.y); // Right Lobe
    heartShape.lineTo(x + P0.x, y + P0.y); // Straight line down-center

    const heartExtrudeSettings = {
        depth: 4,
        bevelEnabled: true,
        bevelSegments: 4,
        steps: 2,
        bevelSize: 1.5,
        bevelThickness: 1.5
    }

    return {
        heartShape,
        heartExtrudeSettings
    }
}
