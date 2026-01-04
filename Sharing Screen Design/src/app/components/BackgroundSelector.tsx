import { useState, useEffect } from 'react';
import { Upload, Images, Grid3x3, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';

interface BackgroundSelectorProps {
  onSelectBackground: (url: string) => void;
  currentBackground: string;
  selectedWorkout?: string; // Template adı (örn: "leg-press", "bench-press", "jump-rope-new")
}

// Workout ID'lerini background ID'lerine eşleştir
const WORKOUT_BACKGROUND_MAP: { [key: string]: number } = {
  // Specific workout variations (longer keys first)
  'incline-bench-press': 17,
  'jump-rope-new': 22,
  'jump-rope': 22,
  'battle-rope': 21,
  'barbell-row': 14,
  'seated-row': 14,
  't-bar-row': 14,
  'lat-pulldown': 18,
  'shoulder-press': 5,
  'lateral-raise': 12,
  'front-raise': 12,
  'rear-delt-fly': 5,
  'bench-press': 17,
  'leg-press': 3,
  'leg-curl': 3,
  'leg-extension': 3,
  'calf-raise': 3,
  'chest-fly': 4,
  'bicep-curl': 12,
  'hammer-curl': 12,
  'tricep-extension': 12,
  'tricep-pushdown': 12,
  'preacher-curl': 12,
  'russian-twist': 20,
  'leg-raise': 40,
  'sit-up': 40,
  'ab-wheel': 40,
  'kettlebell-swing': 13,
  'goblet-squat': 13,
  'turkish-get-up': 13,
  'farmer-walk': 46,
  'box-jump': 42,
  'clean-and-jerk': 38,
  'power-clean': 38,
  'shadow-boxing': 48,
  'martial-arts': 31,
  
  // Core movements
  'squat': 16,
  'deadlift': 15,
  'pull-up': 18,
  'push-up': 19,
  'plank': 20,
  'crunch': 40,
  'lunge': 3,
  'dip': 19,
  'shrug': 5,
  'clean': 38,
  'snatch': 38,
  
  // Equipment-based
  'kettlebell': 13,
  'dumbbell': 12,
  'barbell': 14,
  
  // Cardio
  'running': 7,
  'walking': 30,
  'biking': 10,
  'cycling': 10,
  'rowing': 33,
  'treadmill': 34,
  'elliptical': 34,
  
  // Training styles
  'crossfit': 6,
  'hiit': 6,
  'yoga': 8,
  'stretching': 23,
  'pilates': 35,
  'boxing': 9,
  'kickboxing': 32,
  'weightlifting': 5,
  
  // Generic
  'circuit': 1,
  'gym': 1,
};

const PRESET_BACKGROUNDS = [
  // Original 4
  { id: 1, url: 'https://images.unsplash.com/photo-1604480133080-602261a680df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxneW0lMjB3b3Jrb3V0fGVufDF8fHx8MTc2NjkwMzkzNXww&ixlib=rb-4.1.0&q=80&w=1080', name: 'Gym Workout', category: 'Gym' },
  { id: 2, url: 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwdHJhaW5pbmd8ZW58MXx8fHwxNzY2OTY3OTM5fDA&ixlib=rb-4.1.0&q=80&w=1080', name: 'Fitness Training', category: 'Gym' },
  { id: 3, url: 'https://images.unsplash.com/photo-1646495001290-39103b31873a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWclMjB3b3Jrb3V0fGVufDF8fHx8MTc2NzAwNTYyNXww&ixlib=rb-4.1.0&q=80&w=1080', name: 'Leg Workout', category: 'Strength' },
  { id: 4, url: 'https://images.unsplash.com/photo-1597452485669-2c7bb5fef90d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVzdCUyMHdvcmtvdXR8ZW58MXx8fHwxNzY3MDA1NjI2fDA&ixlib=rb-4.1.0&q=80&w=1080', name: 'Chest Workout', category: 'Strength' },
  
  // New additions from API calls
  { id: 5, url: 'https://images.unsplash.com/photo-1653927956711-f2222a45e040?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWlnaHRsaWZ0aW5nJTIwZ3ltfGVufDF8fHx8MTc2Njk0MTk3NHww&ixlib=rb-4.1.0&q=80&w=1080', name: 'Weightlifting', category: 'Strength' },
  { id: 6, url: 'https://images.unsplash.com/photo-1639511205180-7b2865b2f467?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcm9zc2ZpdCUyMHRyYWluaW5nfGVufDF8fHx8MTc2Njk4NzUxNHww&ixlib=rb-4.1.0&q=80&w=1080', name: 'CrossFit', category: 'HIIT' },
  { id: 7, url: 'https://images.unsplash.com/photo-1669806954505-936e77929af6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxydW5uaW5nJTIwY2FyZGlvfGVufDF8fHx8MTc2NzAwNzU1N3ww&ixlib=rb-4.1.0&q=80&w=1080', name: 'Running', category: 'Cardio' },
  { id: 8, url: 'https://images.unsplash.com/photo-1641971215228-c677f3a28cd8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b2dhJTIwZml0bmVzc3xlbnwxfHx8fDE3NjY4OTMzOTV8MA&ixlib=rb-4.1.0&q=80&w=1080', name: 'Yoga', category: 'Flexibility' },
  { id: 9, url: 'https://images.unsplash.com/photo-1517438322307-e67111335449?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib3hpbmclMjB0cmFpbmluZ3xlbnwxfHx8fDE3NjY5MTYyMjV8MA&ixlib=rb-4.1.0&q=80&w=1080', name: 'Boxing', category: 'Combat' },
  { id: 10, url: 'https://images.unsplash.com/photo-1635706055150-5827085ca635?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjeWNsaW5nJTIwd29ya291dHxlbnwxfHx8fDE3NjY5MzgzMDB8MA&ixlib=rb-4.1.0&q=80&w=1080', name: 'Cycling', category: 'Cardio' },
  { id: 11, url: 'https://images.unsplash.com/photo-1558617320-e695f0d420de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzd2ltbWluZyUyMHBvb2x8ZW58MXx8fHwxNzY3MDAxMDMwfDA&ixlib=rb-4.1.0&q=80&w=1080', name: 'Swimming', category: 'Cardio' },
  { id: 12, url: 'https://images.unsplash.com/photo-1573858129122-33bdb25d6950?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkdW1iYmVsbCUyMHRyYWluaW5nfGVufDF8fHx8MTc2NzAxMDczMXww&ixlib=rb-4.1.0&q=80&w=1080', name: 'Dumbbell', category: 'Strength' },
  { id: 13, url: 'https://images.unsplash.com/photo-1710814824560-943273e8577e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrZXR0bGViZWxsJTIwd29ya291dHxlbnwxfHx8fDE3NjY5NDE5MTB8MA&ixlib=rb-4.1.0&q=80&w=1080', name: 'Kettlebell', category: 'Strength' },
  { id: 14, url: 'https://images.unsplash.com/photo-1581907311217-98a34b592a9c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXJiZWxsJTIwbGlmdGluZ3xlbnwxfHx8fDE3NjcwMTA3MzJ8MA&ixlib=rb-4.1.0&q=80&w=1080', name: 'Barbell', category: 'Strength' },
  { id: 15, url: 'https://images.unsplash.com/photo-1744551472900-d23f4997e1cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZWFkbGlmdCUyMHBvd2VybGlmdGluZ3xlbnwxfHx8fDE3NjcwMTA3MzZ8MA&ixlib=rb-4.1.0&q=80&w=1080', name: 'Deadlift', category: 'Powerlifting' },
  { id: 16, url: 'https://images.unsplash.com/photo-1683147779485-24912f480130?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcXVhdCUyMHdvcmtvdXR8ZW58MXx8fHwxNzY3MDEwNzM3fDA&ixlib=rb-4.1.0&q=80&w=1080', name: 'Squat', category: 'Powerlifting' },
  { id: 17, url: 'https://images.unsplash.com/photo-1690731033723-ad718c6e585a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZW5jaCUyMHByZXNzfGVufDF8fHx8MTc2NzAxMDczN3ww&ixlib=rb-4.1.0&q=80&w=1080', name: 'Bench Press', category: 'Powerlifting' },
  { id: 18, url: 'https://images.unsplash.com/photo-1516208962313-9d183d94f577?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwdWxsdXAlMjBjYWxpc3RoZW5pY3N8ZW58MXx8fHwxNzY3MDEwNzM3fDA&ixlib=rb-4.1.0&q=80&w=1080', name: 'Pull-up', category: 'Calisthenics' },
  { id: 19, url: 'https://images.unsplash.com/photo-1686247166156-0bca3e8b55d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwdXNodXAlMjBleGVyY2lzZXxlbnwxfHx8fDE3NjY5OTMwODl8MA&ixlib=rb-4.1.0&q=80&w=1080', name: 'Push-up', category: 'Calisthenics' },
  { id: 20, url: 'https://images.unsplash.com/photo-1765302741884-e846c7a178df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbGFuayUyMGNvcmV8ZW58MXx8fHwxNzY2OTM0OTk1fDA&ixlib=rb-4.1.0&q=80&w=1080', name: 'Plank', category: 'Core' },
  { id: 21, url: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXR0bGUlMjByb3BlfGVufDF8fHx8MTc2NzAxMDczOXww&ixlib=rb-4.1.0&q=80&w=1080', name: 'Battle Rope', category: 'HIIT' },
  { id: 22, url: 'https://images.unsplash.com/photo-1514994667787-b48ca37155f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqdW1wJTIwcm9wZXxlbnwxfHx8fDE3NjcwMTA3Mzl8MA&ixlib=rb-4.1.0&q=80&w=1080', name: 'Jump Rope', category: 'Cardio' },
  { id: 23, url: 'https://images.unsplash.com/photo-1607914660217-754fdd90041d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJldGNoaW5nJTIwZmxleGliaWxpdHl8ZW58MXx8fHwxNzY2OTQ4NDcyfDA&ixlib=rb-4.1.0&q=80&w=1080', name: 'Stretching', category: 'Flexibility' },
  { id: 24, url: 'https://images.unsplash.com/photo-1605235186531-bbd852b09e69?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRvb3IlMjBjeWNsaW5nfGVufDF8fHx8MTc2NzAxMDczOXww&ixlib=rb-4.1.0&q=80&w=1080', name: 'Spin Class', category: 'Cardio' },
  
  // Dynamically generated variations (using Unsplash's variation system)
  { id: 25, url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=1080&q=80', name: 'Gym Floor', category: 'Gym' },
  { id: 26, url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=1080&q=80', name: 'Rope Training', category: 'HIIT' },
  { id: 27, url: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=1080&q=80', name: 'Medicine Ball', category: 'Functional' },
  { id: 28, url: 'https://images.unsplash.com/photo-1623874514711-0f321325f318?w=1080&q=80', name: 'TRX Training', category: 'Functional' },
  { id: 29, url: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1080&q=80', name: 'Mountain Climbing', category: 'Outdoor' },
  { id: 30, url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1080&q=80', name: 'Trail Running', category: 'Outdoor' },
  { id: 31, url: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=1080&q=80', name: 'Martial Arts', category: 'Combat' },
  { id: 32, url: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=1080&q=80', name: 'Kickboxing', category: 'Combat' },
  { id: 33, url: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=1080&q=80', name: 'Rowing Machine', category: 'Cardio' },
  { id: 34, url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1080&q=80', name: 'Treadmill', category: 'Cardio' },
  { id: 35, url: 'https://images.unsplash.com/photo-1519311965067-36d3e5f33d39?w=1080&q=80', name: 'Pilates', category: 'Flexibility' },
  { id: 36, url: 'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=1080&q=80', name: 'Rock Climbing', category: 'Outdoor' },
  { id: 37, url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1080&q=80', name: 'Gym Equipment', category: 'Gym' },
  { id: 38, url: 'https://images.unsplash.com/photo-1556817411-31ae72fa3ea0?w=1080&q=80', name: 'Olympic Lifting', category: 'Powerlifting' },
  { id: 39, url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1080&q=80', name: 'Weight Plates', category: 'Strength' },
  { id: 40, url: 'https://images.unsplash.com/photo-1508215885820-4585e56135c8?w=1080&q=80', name: 'Abs Workout', category: 'Core' },
  { id: 41, url: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=1080&q=80', name: 'Stadium Stairs', category: 'Outdoor' },
  { id: 42, url: 'https://images.unsplash.com/photo-1550345332-09e3ac987658?w=1080&q=80', name: 'Sprint Training', category: 'Cardio' },
  { id: 43, url: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=1080&q=80', name: 'Gymnastics', category: 'Calisthenics' },
  { id: 44, url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1080&q=80', name: 'Dance Fitness', category: 'Dance' },
  { id: 45, url: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1080&q=80', name: 'Spin Bike', category: 'Cardio' },
  { id: 46, url: 'https://images.unsplash.com/photo-1603988363607-e1e4a66962c6?w=1080&q=80', name: 'Free Weights', category: 'Strength' },
  { id: 47, url: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=1080&q=80', name: 'Training Session', category: 'Gym' },
  { id: 48, url: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=1080&q=80', name: 'Shadow Boxing', category: 'Combat' },
  { id: 49, url: 'https://images.unsplash.com/photo-1522844990619-4951c40f7eda?w=1080&q=80', name: 'Aerobics', category: 'Dance' },
  { id: 50, url: 'https://images.unsplash.com/photo-1613043016969-082f2e8a7a31?w=1080&q=80', name: 'Squat Rack', category: 'Gym' },
];

export function BackgroundSelector({ onSelectBackground, currentBackground, selectedWorkout }: BackgroundSelectorProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Seçilen workout'a göre otomatik background ayarla
  useEffect(() => {
    if (selectedWorkout) {
      const workoutKey = selectedWorkout.toLowerCase();
      
      // Exact match'i ara
      let backgroundId = WORKOUT_BACKGROUND_MAP[workoutKey];
      
      // Kısmi match'i ara (en uzun key'i tercih et)
      if (!backgroundId) {
        const sortedKeys = Object.keys(WORKOUT_BACKGROUND_MAP).sort((a, b) => b.length - a.length);
        for (const key of sortedKeys) {
          if (workoutKey.includes(key)) {
            backgroundId = WORKOUT_BACKGROUND_MAP[key];
            break;
          }
        }
      }
      
      // Default backup
      backgroundId = backgroundId || 1;
      
      // Background'ı bul ve ayarla
      const matchedBackground = PRESET_BACKGROUNDS.find(bg => bg.id === backgroundId);
      if (matchedBackground && matchedBackground.url !== currentBackground) {
        console.log(`🎨 Auto-selecting background for "${selectedWorkout}": ${matchedBackground.name}`);
        onSelectBackground(matchedBackground.url);
      }
    }
  }, [selectedWorkout, currentBackground, onSelectBackground]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImage(result);
        onSelectBackground(result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-4 flex items-center gap-2">
          <Images className="w-5 h-5" />
          Arka Plan Seç
        </h3>
        
        {/* Preset Backgrounds */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {PRESET_BACKGROUNDS.map((bg) => (
            <Card
              key={bg.id}
              className={`relative h-32 cursor-pointer overflow-hidden transition-all hover:scale-105 ${
                currentBackground === bg.url ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => onSelectBackground(bg.url)}
            >
              <img 
                src={bg.url} 
                alt={bg.name}
                className="w-full h-full object-cover"
              />
              {currentBackground === bg.url && (
                <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                  <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                    Seçili
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Upload Custom Background */}
        <div className="space-y-2">
          <label htmlFor="upload-bg">
            <Button 
              variant="outline" 
              className="w-full cursor-pointer"
              onClick={() => document.getElementById('upload-bg')?.click()}
              type="button"
            >
              <Upload className="w-4 h-4 mr-2" />
              Kendi Görselini Yükle
            </Button>
          </label>
          <input
            id="upload-bg"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          
          {uploadedImage && (
            <Card 
              className={`relative h-32 overflow-hidden cursor-pointer ${
                currentBackground === uploadedImage ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => onSelectBackground(uploadedImage)}
            >
              <img 
                src={uploadedImage} 
                alt="Uploaded"
                className="w-full h-full object-cover"
              />
              {currentBackground === uploadedImage && (
                <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                  <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                    Seçili
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}