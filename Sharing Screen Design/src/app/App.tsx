import { useState } from 'react';
import { WorkoutShareCard, type WorkoutData } from './components/WorkoutShareCard';
import { BackgroundSelector } from './components/BackgroundSelector';
import { WorkoutEditor } from './components/WorkoutEditor';
import { Button } from './components/ui/button';
import { Share2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';

const INITIAL_WORKOUT_DATA: WorkoutData = {
  workoutName: 'LEG DAY',
  duration: '45:00',
  totalDuration: '1:15:00',
  sets: 4,
  reps: 12,
  calories: 450,
  energy: 1880
};

const INITIAL_BACKGROUND = 'https://images.unsplash.com/photo-1604480133080-602261a680df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxneW0lMjB3b3Jrb3V0fGVufDF8fHx8MTc2NjkwMzkzNXww&ixlib=rb-4.1.0&q=80&w=1080';

function App() {
  const [workoutData, setWorkoutData] = useState<WorkoutData>(INITIAL_WORKOUT_DATA);
  const [backgroundImage, setBackgroundImage] = useState<string>(INITIAL_BACKGROUND);

  const handleShare = () => {
    toast.success('Paylaşım için hazır!', {
      description: 'Antrenman kartınız paylaşıma hazır.'
    });
  };

  const handleDownload = () => {
    toast.success('İndirme başlatıldı!', {
      description: 'Görsel cihazınıza kaydediliyor.'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <Toaster />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-white mb-2">Workout Paylaşım Ekranı</h1>
          <p className="text-slate-400">Antrenmanını özelleştir ve paylaş</p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Side - Preview */}
          <div className="flex flex-col items-center gap-6">
            <WorkoutShareCard 
              workoutData={workoutData}
              backgroundImage={backgroundImage}
            />
            
            {/* Action Buttons */}
            <div className="flex gap-3 w-full max-w-sm">
              <Button 
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Paylaş
              </Button>
              <Button 
                variant="outline"
                className="flex-1"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4 mr-2" />
                İndir
              </Button>
            </div>
          </div>

          {/* Right Side - Editor */}
          <div className="space-y-6">
            <WorkoutEditor 
              workoutData={workoutData}
              onUpdate={setWorkoutData}
            />
            
            <BackgroundSelector 
              currentBackground={backgroundImage}
              onSelectBackground={setBackgroundImage}
            />

            {/* Quick Presets */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <h3 className="mb-4 text-white">Hızlı Şablonlar</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => setWorkoutData({
                    workoutName: 'LEG DAY',
                    duration: '45:00',
                    totalDuration: '1:15:00',
                    sets: 4,
                    reps: 12,
                    calories: 450,
                    energy: 1880
                  })}
                >
                  Leg Day
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setWorkoutData({
                    workoutName: 'CHEST DAY',
                    duration: '50:00',
                    totalDuration: '1:20:00',
                    sets: 5,
                    reps: 10,
                    calories: 380,
                    energy: 1590
                  })}
                >
                  Chest Day
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setWorkoutData({
                    workoutName: 'BACK DAY',
                    duration: '55:00',
                    totalDuration: '1:25:00',
                    sets: 4,
                    reps: 10,
                    calories: 420,
                    energy: 1760
                  })}
                >
                  Back Day
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setWorkoutData({
                    workoutName: 'ARM DAY',
                    duration: '40:00',
                    totalDuration: '1:10:00',
                    sets: 3,
                    reps: 15,
                    calories: 320,
                    energy: 1340
                  })}
                >
                  Arm Day
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
