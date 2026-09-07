import { Workout } from '@/types/workout';
import { rarityConfigs } from '@/data/rarityConfig';
import { motion } from 'motion/react';
import { Activity, Dumbbell, PersonStanding } from 'lucide-react';

interface WorkoutCardProps {
  workout: Workout;
  onClick?: () => void;
}

const positionIcons = {
  pull: Activity,
  push: Dumbbell,
  legs: PersonStanding,
};

const positionLabels = {
  pull: 'PULL',
  push: 'PUSH',
  legs: 'LEGS',
};

export function WorkoutCard({ workout, onClick }: WorkoutCardProps) {
  const rarityConfig = rarityConfigs[workout.rarity];
  const PositionIcon = positionIcons[workout.position];

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -8 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative cursor-pointer w-64 h-96 perspective-1000"
      style={{
        filter: `drop-shadow(0 10px 30px ${rarityConfig.colors.glow})`,
      }}
    >
      {/* Card Container */}
      <div className="relative w-full h-full rounded-3xl overflow-hidden">
        {/* Background with geometric pattern */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${rarityConfig.colors.primary} 0%, ${rarityConfig.colors.secondary} 100%)`,
          }}
        >
          {/* Geometric crystal pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="none">
            <defs>
              <pattern id={`pattern-${workout.id}`} x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <polygon points="0,0 50,30 100,0" fill="white" opacity="0.1" />
                <polygon points="0,100 50,70 100,100" fill="white" opacity="0.1" />
                <line x1="50" y1="0" x2="50" y2="100" stroke="white" strokeWidth="0.5" opacity="0.3" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="white" strokeWidth="0.5" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#pattern-${workout.id})`} />
          </svg>

          {/* Diagonal shine effect */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `linear-gradient(120deg, transparent 0%, ${rarityConfig.colors.accent} 50%, transparent 100%)`,
              transform: 'skewX(-15deg)',
            }}
          />
        </div>

        {/* Border glow effect */}
        <div
          className="absolute inset-0 rounded-3xl"
          style={{
            border: `2px solid ${rarityConfig.colors.accent}`,
            boxShadow: `inset 0 0 20px ${rarityConfig.colors.glow}, 0 0 20px ${rarityConfig.colors.glow}`,
          }}
        />

        {/* Content Layer */}
        <div className="relative z-10 p-6 h-full flex flex-col">
          {/* Top Section: Level & Position */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex flex-col items-center">
              <div className="text-6xl font-black text-gray-900" style={{ lineHeight: 1, textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                {workout.level}
              </div>
              <div
                className="mt-1 px-3 py-1 rounded-full text-xs font-bold text-gray-900"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                {positionLabels[workout.position]}
              </div>
            </div>

            {/* Position Icon */}
            <div
              className="p-3 rounded-full"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <PositionIcon className="w-6 h-6 text-gray-900" />
            </div>
          </div>

          {/* Middle Section: Workout Name */}
          <div className="flex-1 flex items-center justify-center">
            <h3 className="text-2xl font-black text-gray-900 tracking-wider" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}>
              {workout.name}
            </h3>
          </div>

          {/* Separator after name */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-900/40 to-transparent mb-4" />

          {/* Bottom Section: Stats Grid (2x3) with vertical separator */}
          <div className="flex items-start gap-4 mb-4">
            {/* Left Column - First 3 stats */}
            <div className="flex-1 space-y-2">
              {Object.entries(workout.stats).slice(0, 3).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900 opacity-80">{key}</span>
                  <span className="text-xl font-black text-gray-900" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Vertical Separator */}
            <div className="w-px h-20 bg-gradient-to-b from-transparent via-gray-900/40 to-transparent" />

            {/* Right Column - Last 3 stats */}
            <div className="flex-1 space-y-2">
              {Object.entries(workout.stats).slice(3, 6).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900 opacity-80">{key}</span>
                  <span className="text-xl font-black text-gray-900" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Short separator before rarity */}
          <div className="mx-auto w-24 h-px bg-gradient-to-r from-transparent via-gray-900/40 to-transparent mb-4" />

          {/* Footer: Rarity Label */}
          <div className="mt-4 text-center">
            <div
              className="inline-block px-6 py-2 rounded-full text-xs font-black tracking-widest text-gray-900"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
              }}
            >
              {rarityConfig.displayName}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}