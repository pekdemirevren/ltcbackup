import { Workout } from '@/types/workout';
import { rarityConfigs } from '@/data/rarityConfig';
import { Button } from './ui/button';
import { ArrowLeft, Play, Clock, Dumbbell, Trophy } from 'lucide-react';
import { motion } from 'motion/react';

interface WorkoutDetailProps {
  workout: Workout;
  onBack: () => void;
  onStartWorkout: () => void;
}

export function WorkoutDetail({ workout, onBack, onStartWorkout }: WorkoutDetailProps) {
  const rarityConfig = rarityConfigs[workout.rarity];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Button onClick={onBack} variant="ghost" className="mb-6 text-gray-400 hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Collection
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Large Card */}
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <div
              className="relative w-full max-w-md mx-auto aspect-[2/3] rounded-3xl overflow-hidden"
              style={{
                filter: `drop-shadow(0 20px 60px ${rarityConfig.colors.glow})`,
              }}
            >
              {/* Background */}
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${rarityConfig.colors.primary} 0%, ${rarityConfig.colors.secondary} 100%)`,
                }}
              >
                <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="none">
                  <defs>
                    <pattern id={`pattern-detail`} x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                      <polygon points="0,0 50,30 100,0" fill="white" opacity="0.1" />
                      <polygon points="0,100 50,70 100,100" fill="white" opacity="0.1" />
                      <line x1="50" y1="0" x2="50" y2="100" stroke="white" strokeWidth="0.5" opacity="0.3" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill={`url(#pattern-detail)`} />
                </svg>
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    background: `linear-gradient(120deg, transparent 0%, ${rarityConfig.colors.accent} 50%, transparent 100%)`,
                    transform: 'skewX(-15deg)',
                  }}
                />
              </div>

              <div
                className="absolute inset-0 rounded-3xl"
                style={{
                  border: `3px solid ${rarityConfig.colors.accent}`,
                  boxShadow: `inset 0 0 30px ${rarityConfig.colors.glow}`,
                }}
              />

              {/* Content */}
              <div className="relative z-10 p-8 h-full flex flex-col">
                <div className="text-8xl font-black text-gray-900 mb-2" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.3)' }}>
                  {workout.level}
                </div>
                <div
                  className="inline-block self-start px-4 py-2 rounded-full text-sm font-bold text-gray-900 mb-8"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  {workout.position.toUpperCase()}
                </div>

                <div className="flex-1 flex items-center justify-center">
                  <div
                    className="text-center px-6 py-4 rounded-2xl w-full"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(15px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    <h1 className="text-4xl font-black text-gray-900 tracking-wider" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>
                      {workout.name}
                    </h1>
                  </div>
                </div>

                <div
                  className="mt-8 p-6 rounded-2xl"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    backdropFilter: 'blur(15px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }}
                >
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                    {Object.entries(workout.stats).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-base font-bold text-gray-900 opacity-80">{key}</span>
                        <span className="text-3xl font-black text-gray-900" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <div
                    className="inline-block px-8 py-3 rounded-full text-base font-black tracking-widest text-gray-900"
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

          {/* Right: Workout Details */}
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <div className="space-y-6">
              {/* Info Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
                  <Clock className="w-6 h-6 text-blue-400 mb-2" />
                  <div className="text-3xl font-black text-white">{workout.duration}</div>
                  <div className="text-sm text-gray-400 font-medium">MINUTES</div>
                </div>
                <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
                  <Dumbbell className="w-6 h-6 text-green-400 mb-2" />
                  <div className="text-3xl font-black text-white">{workout.exercises.length}</div>
                  <div className="text-sm text-gray-400 font-medium">EXERCISES</div>
                </div>
              </div>

              {/* Start Button */}
              <Button
                onClick={onStartWorkout}
                size="lg"
                className="w-full text-xl font-black py-8 rounded-2xl"
                style={{
                  background: `linear-gradient(135deg, ${rarityConfig.colors.primary} 0%, ${rarityConfig.colors.secondary} 100%)`,
                  color: '#000',
                  boxShadow: `0 10px 30px ${rarityConfig.colors.glow}`,
                }}
              >
                <Play className="w-6 h-6 mr-3" />
                START WORKOUT
              </Button>

              {/* Exercises List */}
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <h2 className="text-xl font-black text-white uppercase">Exercises</h2>
                </div>
                <div className="space-y-3">
                  {workout.exercises.map((exercise, index) => (
                    <div key={exercise.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-black text-gray-500">#{index + 1}</span>
                            <h3 className="font-bold text-white">{exercise.name}</h3>
                          </div>
                          <div className="flex gap-4 text-sm text-gray-400">
                            <span>
                              <span className="font-bold text-white">{exercise.sets}</span> sets
                            </span>
                            <span>
                              <span className="font-bold text-white">{exercise.reps}</span> reps
                            </span>
                            <span>
                              <span className="font-bold text-white">{exercise.rest}s</span> rest
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
