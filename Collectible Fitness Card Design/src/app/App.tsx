import { useState } from 'react';
import { Workout } from '@/types/workout';
import { mockWorkouts } from '@/data/mockWorkouts';
import { WorkoutCollection } from './components/WorkoutCollection';
import { WorkoutDetail } from './components/WorkoutDetail';
import { PlayMode } from './components/PlayMode';
import { CompletionScreen } from './components/CompletionScreen';

type AppScreen = 'collection' | 'detail' | 'play' | 'complete';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('collection');
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);

  const handleSelectWorkout = (workout: Workout) => {
    setSelectedWorkout(workout);
    setCurrentScreen('detail');
  };

  const handleStartWorkout = () => {
    setCurrentScreen('play');
  };

  const handleCompleteWorkout = () => {
    setCurrentScreen('complete');
  };

  const handleBackToCollection = () => {
    setCurrentScreen('collection');
    setSelectedWorkout(null);
  };

  const handleBackToDetail = () => {
    setCurrentScreen('detail');
  };

  const handleRestartWorkout = () => {
    setCurrentScreen('play');
  };

  return (
    <div className="size-full">
      {currentScreen === 'collection' && (
        <WorkoutCollection workouts={mockWorkouts} onSelectWorkout={handleSelectWorkout} />
      )}

      {currentScreen === 'detail' && selectedWorkout && (
        <WorkoutDetail workout={selectedWorkout} onBack={handleBackToCollection} onStartWorkout={handleStartWorkout} />
      )}

      {currentScreen === 'play' && selectedWorkout && (
        <PlayMode workout={selectedWorkout} onBack={handleBackToDetail} onComplete={handleCompleteWorkout} />
      )}

      {currentScreen === 'complete' && selectedWorkout && (
        <CompletionScreen
          workout={selectedWorkout}
          onBackToCollection={handleBackToCollection}
          onRestartWorkout={handleRestartWorkout}
        />
      )}
    </div>
  );
}
