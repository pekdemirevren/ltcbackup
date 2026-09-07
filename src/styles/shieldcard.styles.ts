/**
 * ShieldCard Design System
 * This module exports the finalized SVG paths and geometry definitions
 * for the LT Collector FUT-style cards.
 */

export const ShieldLayout = {
    viewBox: "0 0 200 280",
    paths: {
        // The main shield shape with Concave Notches (Isirik), Smooth Dome (Kubbe),
        // and Softer/Rounded Bottom Corners.
        outline: "M0,60 Q20,60 20,40 Q100,-5 180,40 Q180,60 200,60 L200,215 Q200,225 190,230 L105,278 Q100,282 95,278 L10,230 Q0,225 0,215 Z",

        // Horizontal divider line usually placed at y=180
        divider: {
            x1: 20,
            y1: 180,
            x2: 180,
            y2: 180,
            opacity: 0.5
        }
    },
    colors: {
        defaultFill: '#1C1C1E',
        defaultStroke: '#D4AF37',
        dividerOpacity: 0.5
    }
};
