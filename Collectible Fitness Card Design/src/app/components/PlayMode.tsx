import { useState, useEffect } from 'react';
import { Workout, Exercise } from '@/types/workout';
import { rarityConfigs } from '@/data/rarityConfig';
import { Button } from './ui/button';
import { ArrowLeft, Play, Pause, SkipForward, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Progress } from './ui/progress';

interface PlayModeProps {
  workout: Workout;
  onBack: () => void;
  onComplete: () => void;
}

type TimerPhase = 'exercise' | 'rest';

export function PlayMode({ workout, onBack, onComplete }: PlayModeProps) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [phase, setPhase] = useState<TimerPhase>('exercise');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const currentExercise = workout.exercises[currentExerciseIndex];
  const rarityConfig = rarityConfigs[workout.rarity];
  const totalSets = currentExercise?.sets || 0;
  const progress = ((currentExerciseIndex * 100) / workout.exercises.length) + ((currentSet / totalSets) * (100 / workout.exercises.length));

  // Timer effect
  useEffect(() => {
    if (!isRunning || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleTimerComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeRemaining]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    if (phase === 'rest') {
      handleNextSet();
    }
  };

  const startExercise = () => {
    setPhase('exercise');
    setIsRunning(false);
    setTimeRemaining(0);
  };

  const startRest = () => {
    setPhase('rest');
    setTimeRemaining(currentExercise.rest);
    setIsRunning(true);
  };

  const handleCompleteSet = () => {
    if (currentSet < totalSets) {
      startRest();
    } else {
      handleNextExercise();
    }
  };

  const handleNextSet = () => {
    if (currentSet < totalSets) {
      setCurrentSet((prev) => prev + 1);
      startExercise();
    } else {
      handleNextExercise();
    }
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < workout.exercises.length - 1) {
      setCurrentExerciseIndex((prev) => prev + 1);
      setCurrentSet(1);
      startExercise();
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    setIsRunning(false);
    handleNextSet();
  };

  const toggleTimer = () => {
    setIsRunning((prev) => !prev);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="min-h-screen p-8"
      style={{
        background: `linear-gradient(135deg, ${rarityConfig.colors.secondary} 0%, ${rarityConfig.colors.primary} 100%)`,
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-gray-900 hover:text-gray-700 bg-white/20 backdrop-blur-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Exit Workout
          </Button>
          <div className="text-sm font-bold text-gray-900 bg-white/30 backdrop-blur-lg px-4 py-2 rounded-full">
            {currentExerciseIndex + 1} / {workout.exercises.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progress} className="h-3 bg-white/30" />
        </div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentExerciseIndex}-${currentSet}-${phase}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.3 }}
            className="bg-white/20 backdrop-blur-2xl rounded-3xl p-8 border border-white/30"
            style={{
              boxShadow: `0 20px 60px ${rarityConfig.colors.glow}`,
            }}
          >
            {/* Exercise Info */}
            <div className="text-center mb-8">
              <div className="text-sm font-bold text-gray-900 opacity-70 mb-2">
                SET {currentSet} OF {totalSets}
              </div>
              <h1 className="text-5xl font-black text-gray-900 mb-4" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}>
                {currentExercise.name}
              </h1>
              <div className="text-3xl font-bold text-gray-900 opacity-90">
                {currentExercise.reps} REPS
              </div>
            </div>

            {/* Timer Display */}
            {phase === 'rest' && (
              <div className="text-center mb-8">
                <div className="text-8xl font-black text-gray-900 mb-4" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.1)' }}>
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-xl font-bold text-gray-900 opacity-70">REST TIME</div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              {phase === 'exercise' ? (
                <Button
                  onClick={handleCompleteSet}
                  size="lg"
                  className="text-2xl font-black py-8 px-12 rounded-2xl bg-gray-900 text-white hover:bg-gray-800"
                >
                  <CheckCircle2 className="w-6 h-6 mr-3" />
                  COMPLETE SET
                </Button>
              ) : (
                <>
                  <Button
                    onClick={toggleTimer}
                    size="lg"
                    className="text-xl font-black py-8 px-10 rounded-2xl bg-gray-900 text-white hover:bg-gray-800"
                  >
                    {isRunning ? (
                      <>
                        <Pause className="w-6 h-6 mr-3" />
                        PAUSE
                      </>
                    ) : (
                      <>
                        <Play className="w-6 h-6 mr-3" />
                        RESUME
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleSkip}
                    size="lg"
                    variant="outline"
                    className="text-xl font-black py-8 px-10 rounded-2xl bg-white/30 backdrop-blur-lg border-2 border-gray-900 text-gray-900 hover:bg-white/50"
                  >
                    <SkipForward className="w-6 h-6 mr-3" />
                    SKIP
                  </Button>
                </>
              )}
            </div>

            {/* Next Up Preview */}
            {currentSet < totalSets || currentExerciseIndex < workout.exercises.length - 1 ? (
              <div className="mt-8 pt-6 border-t border-gray-900/20">
                <div className="text-xs font-bold text-gray-900 opacity-60 mb-2">NEXT UP</div>
                <div className="text-lg font-bold text-gray-900">
                  {currentSet < totalSets
                    ? `Set ${currentSet + 1}: ${currentExercise.name}`
                    : workout.exercises[currentExerciseIndex + 1]?.name}
                </div>
              </div>
            ) : (
              <div className="mt-8 pt-6 border-t border-gray-900/20">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">🎉 Last set! Finish strong!</div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Workout Info Footer */}
        <div className="mt-6 text-center">
          <div className="inline-block bg-white/20 backdrop-blur-lg px-6 py-3 rounded-full">
            <span className="text-lg font-black text-gray-900">{workout.name}</span>
            <span className="mx-3 text-gray-900 opacity-50">•</span>
            <span className="text-sm font-bold text-gray-900 opacity-70">{rarityConfig.displayName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
