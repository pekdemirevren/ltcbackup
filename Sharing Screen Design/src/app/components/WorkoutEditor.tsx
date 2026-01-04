import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import type { WorkoutData } from './WorkoutShareCard';

interface WorkoutEditorProps {
  workoutData: WorkoutData;
  onUpdate: (data: WorkoutData) => void;
}

export function WorkoutEditor({ workoutData, onUpdate }: WorkoutEditorProps) {
  const handleChange = (field: keyof WorkoutData, value: string | number) => {
    onUpdate({
      ...workoutData,
      [field]: value
    });
  };

  return (
    <Card className="p-6 space-y-4">
      <h3 className="mb-4">Antrenman Detayları</h3>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="workoutName">Antrenman Adı</Label>
          <Input
            id="workoutName"
            value={workoutData.workoutName}
            onChange={(e) => handleChange('workoutName', e.target.value)}
            placeholder="LEG DAY"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="duration">Süre</Label>
            <Input
              id="duration"
              value={workoutData.duration}
              onChange={(e) => handleChange('duration', e.target.value)}
              placeholder="45:00"
            />
          </div>

          <div>
            <Label htmlFor="totalDuration">Toplam Süre</Label>
            <Input
              id="totalDuration"
              value={workoutData.totalDuration}
              onChange={(e) => handleChange('totalDuration', e.target.value)}
              placeholder="1:15:00"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sets">Set Sayısı</Label>
            <Input
              id="sets"
              type="number"
              value={workoutData.sets}
              onChange={(e) => handleChange('sets', parseInt(e.target.value) || 0)}
              placeholder="4"
            />
          </div>

          <div>
            <Label htmlFor="reps">Tekrar Sayısı</Label>
            <Input
              id="reps"
              type="number"
              value={workoutData.reps}
              onChange={(e) => handleChange('reps', parseInt(e.target.value) || 0)}
              placeholder="12"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="calories">Kalori (kcal)</Label>
            <Input
              id="calories"
              type="number"
              value={workoutData.calories}
              onChange={(e) => handleChange('calories', parseInt(e.target.value) || 0)}
              placeholder="450"
            />
          </div>

          <div>
            <Label htmlFor="energy">Enerji (kJ)</Label>
            <Input
              id="energy"
              type="number"
              value={workoutData.energy}
              onChange={(e) => handleChange('energy', parseInt(e.target.value) || 0)}
              placeholder="1880"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
