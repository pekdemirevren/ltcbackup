import { Workout } from '@/types/workout';
import { rarityConfigs } from '@/data/rarityConfig';
import { Button } from './ui/button';
import { Trophy, Home, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';

interface CompletionScreenProps {
  workout: Workout;
  onBackToCollection: () => void;
  onRestartWorkout: () => void;
}

export function CompletionScreen({ workout, onBackToCollection, onRestartWorkout }: CompletionScreenProps) {
  const rarityConfig = rarityConfigs[workout.rarity];

  return (
    <div
      className="min-h-screen p-8 flex items-center justify-center"
      style={{
        background: `linear-gradient(135deg, ${rarityConfig.colors.secondary} 0%, ${rarityConfig.colors.primary} 100%)`,
      }}
    >
      <div className="max-w-2xl w-full text-center">
        {/* Trophy Animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', duration: 1, bounce: 0.5 }}
          className="mb-8"
        >
          <Trophy
            className="w-32 h-32 mx-auto text-yellow-300"
            style={{
              filter: 'drop-shadow(0 0 30px rgba(253, 224, 71, 0.8))',
            }}
          />
        </motion.div>

        {/* Completion Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <h1
            className="text-6xl font-black text-gray-900 mb-4"
            style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.1)' }}
          >
            WORKOUT COMPLETE!
          </h1>
          <p className="text-2xl font-bold text-gray-900 opacity-80 mb-8">You crushed it! 💪</p>
        </motion.div>

        {/* Workout Summary Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="bg-white/20 backdrop-blur-2xl rounded-3xl p-8 mb-8 border border-white/30"
          style={{
            boxShadow: `0 20px 60px ${rarityConfig.colors.glow}`,
          }}
        >
          <div className="text-4xl font-black text-gray-900 mb-2">{workout.name}</div>
          <div className="text-lg font-bold text-gray-900 opacity-70 mb-6">{rarityConfig.displayName}</div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-4xl font-black text-gray-900" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}>
                {workout.level}
              </div>
              <div className="text-sm font-bold text-gray-900 opacity-70">LEVEL</div>
            </div>
            <div>
              <div className="text-4xl font-black text-gray-900" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}>
                {workout.exercises.length}
              </div>
              <div className="text-sm font-bold text-gray-900 opacity-70">EXERCISES</div>
            </div>
            <div>
              <div className="text-4xl font-black text-gray-900" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}>
                {workout.duration}
              </div>
              <div className="text-sm font-bold text-gray-900 opacity-70">MINUTES</div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="flex gap-4 justify-center"
        >
          <Button
            onClick={onBackToCollection}
            size="lg"
            className="text-xl font-black py-6 px-10 rounded-2xl bg-gray-900 text-white hover:bg-gray-800"
          >
            <Home className="w-5 h-5 mr-3" />
            COLLECTION
          </Button>
          <Button
            onClick={onRestartWorkout}
            size="lg"
            variant="outline"
            className="text-xl font-black py-6 px-10 rounded-2xl bg-white/30 backdrop-blur-lg border-2 border-gray-900 text-gray-900 hover:bg-white/50"
          >
            <RotateCcw className="w-5 h-5 mr-3" />
            RESTART
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
