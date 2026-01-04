import { Card } from './ui/card';
import { Badge } from './ui/badge';

export interface WorkoutData {
  workoutName: string;
  duration: string;
  totalDuration: string;
  sets: number;
  reps: number;
  calories: number;
  energy: number;
}

interface WorkoutShareCardProps {
  workoutData: WorkoutData;
  backgroundImage: string;
}

export function WorkoutShareCard({ workoutData, backgroundImage }: WorkoutShareCardProps) {
  return (
    <Card className="relative w-full max-w-sm h-[600px] overflow-hidden rounded-2xl border-0 shadow-2xl">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-center items-center p-6 text-white text-center">
        {/* Top Section - Workout Title */}
        <div className="space-y-3 mb-12">
          <Badge className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30">
            Workout Complete
          </Badge>
          <h1 className="font-black tracking-tight uppercase" style={{ fontSize: '2.5rem', lineHeight: '0.9', letterSpacing: '-0.02em' }}>
            {workoutData.workoutName}
          </h1>
        </div>

        {/* Bottom Section - Stats */}
        <div className="space-y-5">
          {/* Duration */}
          <div>
            <p className="text-xs uppercase tracking-wide opacity-70 mb-1">Süre</p>
            <p className="font-black" style={{ fontSize: '1.75rem', lineHeight: '1', letterSpacing: '-0.01em' }}>{workoutData.duration}</p>
          </div>

          {/* Total Duration */}
          <div>
            <p className="text-xs uppercase tracking-wide opacity-70 mb-1">Toplam Süre</p>
            <p className="font-black" style={{ fontSize: '1.75rem', lineHeight: '1', letterSpacing: '-0.01em' }}>{workoutData.totalDuration}</p>
          </div>

          {/* Sets & Reps */}
          <div>
            <p className="text-xs uppercase tracking-wide opacity-70 mb-1">Set x Tekrar</p>
            <p className="font-black" style={{ fontSize: '1.75rem', lineHeight: '1', letterSpacing: '-0.01em' }}>{workoutData.sets} x {workoutData.reps}</p>
          </div>

          {/* Calories */}
          <div>
            <p className="text-xs uppercase tracking-wide opacity-70 mb-1">Kalori</p>
            <p className="font-black" style={{ fontSize: '1.75rem', lineHeight: '1', letterSpacing: '-0.01em' }}>{workoutData.calories}</p>
          </div>

          {/* Energy */}
          <div>
            <p className="text-xs uppercase tracking-wide opacity-70 mb-1">Harcanan Enerji</p>
            <p className="font-black" style={{ fontSize: '1.75rem', lineHeight: '1', letterSpacing: '-0.01em' }}>{workoutData.energy} kJ</p>
          </div>
        </div>

        {/* App Branding */}
        <div className="mt-12">
          <p className="text-xs opacity-50 tracking-wider uppercase">Powered by MyWorkout</p>
        </div>
      </div>
    </Card>
  );
}