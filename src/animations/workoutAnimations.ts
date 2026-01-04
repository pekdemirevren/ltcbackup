export type WorkoutAnimationKey = 'leg-press' | 'default';

export const workoutAnimations: Record<WorkoutAnimationKey, string> = {
  'leg-press': `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body{display:flex;justify-content:center;align-items:center;height:100vh;background-color:transparent;margin:0;}
svg{width:200px;height:200px;stroke:#8ce63d;stroke-width:12;stroke-linecap:round;stroke-linejoin:round;fill:none;}
.filled{fill:#8ce63d;stroke:none;}
.hollow-circle{fill:none;stroke:#8ce63d;}
.weight-sled{animation:press-slide 2s ease-in-out infinite;}
@keyframes press-slide{0%{transform:translate(0,0);}50%{transform:translate(-35px,-35px);}100%{transform:translate(0,0);}}
.leg{animation:leg-extend 2s ease-in-out infinite;}
@keyframes leg-extend{0%{d:path("M 135 140 L 115 100 L 90 85");}50%{d:path("M 135 140 L 100 80 L 55 50");}100%{d:path("M 135 140 L 115 100 L 90 85");}}
</style>
</head>
<body>
<svg viewBox="0 0 200 200">
<line x1="40" y1="170" x2="190" y2="170"/><line x1="140" y1="160" x2="180" y2="120"/><line x1="20" y1="50" x2="50" y2="80" stroke-width="10"/><line x1="40" y1="170" x2="20" y2="50" stroke-width="10"/><line x1="145" y1="150" x2="170" y2="125"/><circle cx="175" cy="110" r="9" class="filled"/><circle cx="40" cy="140" r="12" class="hollow-circle" stroke-width="8"/><circle cx="40" cy="140" r="4" class="filled"/><g class="weight-sled"><line x1="75" y1="100" x2="110" y2="70" stroke-width="10"/><circle cx="70" cy="100" r="20" class="hollow-circle" stroke-width="10"/><circle cx="70" cy="100" r="6" class="filled"/></g><path class="leg" d="M 135 140 L 115 100 L 90 85" fill="none" stroke-width="12"/>
</svg>
</body></html>`,
  default: `<!DOCTYPE html><html><head><style>body{display:flex;justify-content:center;align-items:center;height:100vh;background:transparent;margin:0;}svg{width:200px;height:200px;}circle{fill:#00ff00;stroke:#8ce63d;stroke-width:8;animation:spin 2s linear infinite;}@keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}</style></head><body><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg></body></html>`,
};
