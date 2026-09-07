import { useState, useMemo } from 'react';
import { Workout, RarityTier, WorkoutPosition } from '@/types/workout';
import { WorkoutCard } from './WorkoutCard';
import { Button } from './ui/button';
import { Filter, Trophy, Activity, Dumbbell, PersonStanding } from 'lucide-react';

interface WorkoutCollectionProps {
  workouts: Workout[];
  onSelectWorkout: (workout: Workout) => void;
}

export function WorkoutCollection({ workouts, onSelectWorkout }: WorkoutCollectionProps) {
  const [selectedRarity, setSelectedRarity] = useState<RarityTier | 'all'>('all');
  const [selectedPosition, setSelectedPosition] = useState<WorkoutPosition | 'all'>('all');

  const filteredWorkouts = useMemo(() => {
    return workouts.filter((workout) => {
      const rarityMatch = selectedRarity === 'all' || workout.rarity === selectedRarity;
      const positionMatch = selectedPosition === 'all' || workout.position === selectedPosition;
      return rarityMatch && positionMatch;
    });
  }, [workouts, selectedRarity, selectedPosition]);

  const rarities: Array<RarityTier | 'all'> = ['all', 'bronze', 'silver', 'gold', 'pro', 'legend'];
  const positions: Array<WorkoutPosition | 'all'> = ['all', 'pull', 'push', 'legs'];

  const positionIcons = {
    all: Filter,
    pull: Activity,
    push: Dumbbell,
    legs: PersonStanding,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-10 h-10 text-yellow-500" />
          <h1 className="text-5xl font-black text-white tracking-tight">WORKOUT COLLECTION</h1>
        </div>

        {/* Filter Section */}
        <div className="space-y-4">
          {/* Rarity Filter */}
          <div>
            <div className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Rarity</div>
            <div className="flex gap-2 flex-wrap">
              {rarities.map((rarity) => (
                <Button
                  key={rarity}
                  onClick={() => setSelectedRarity(rarity)}
                  variant={selectedRarity === rarity ? 'default' : 'outline'}
                  size="sm"
                  className={`uppercase font-bold ${
                    selectedRarity === rarity
                      ? 'bg-white text-gray-900 hover:bg-gray-100'
                      : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                  }`}
                >
                  {rarity}
                </Button>
              ))}
            </div>
          </div>

          {/* Position Filter */}
          <div>
            <div className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Position</div>
            <div className="flex gap-2 flex-wrap">
              {positions.map((position) => {
                const Icon = positionIcons[position];
                return (
                  <Button
                    key={position}
                    onClick={() => setSelectedPosition(position)}
                    variant={selectedPosition === position ? 'default' : 'outline'}
                    size="sm"
                    className={`uppercase font-bold ${
                      selectedPosition === position
                        ? 'bg-white text-gray-900 hover:bg-gray-100'
                        : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {position}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-gray-500 text-sm font-medium">
          {filteredWorkouts.length} {filteredWorkouts.length === 1 ? 'workout' : 'workouts'} found
        </div>
      </div>

      {/* Cards Grid */}
      <div className="max-w-7xl mx-auto">
        {filteredWorkouts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 place-items-center">
            {filteredWorkouts.map((workout) => (
              <WorkoutCard key={workout.id} workout={workout} onClick={() => onSelectWorkout(workout)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-500 text-xl">No workouts match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
