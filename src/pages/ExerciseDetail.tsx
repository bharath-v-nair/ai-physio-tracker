import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Clock, Target, AlertTriangle, Lightbulb, PlayCircle } from 'lucide-react';

// Exercises with a live camera analyser (backend/app/ai/exercises/exercise_factory.py)
const LIVE_EXERCISES = ['Neck Side-Bend Stretch', 'Wall Angels', 'Shoulder Shrugs', 'Chin Tucks'];

export const ExerciseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState<any>(null);

  useEffect(() => {
    // In a real app, you would fetch this specific exercise from the backend.
    // For now, we will simulate fetching the list and filtering.
    const fetchExercise = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/exercises`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const found = data.find((ex: any) => ex.id === parseInt(id || '0'));
                
                // Parse JSON strings if they exist
                if (found) {
                    if (typeof found.instructions === 'string') found.instructions = JSON.parse(found.instructions);
                    if (typeof found.common_mistakes === 'string') found.common_mistakes = JSON.parse(found.common_mistakes);
                    if (typeof found.tips === 'string') found.tips = JSON.parse(found.tips);
                }
                
                setExercise(found);
            }
        } catch (err) {
            console.error(err);
        }
    };
    fetchExercise();
  }, [id]);

  if (!exercise) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300 pb-12">
      <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
      
      <div 
        className="w-full h-64 md:h-96 rounded-2xl bg-cover bg-center shadow-lg relative overflow-hidden"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=1200')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-0 left-0 p-8 text-white">
          <div className="flex items-center space-x-3 mb-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-medium border border-white/30">
              {exercise.difficulty}
            </span>
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-medium border border-white/30">
              {exercise.body_part}
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">{exercise.name}</h1>
          <p className="mt-2 text-gray-200 max-w-2xl">{exercise.description}</p>
          <div className="mt-6 flex gap-4">
            {LIVE_EXERCISES.includes(exercise.name) ? (
                <Button onClick={() => navigate(`/dashboard/exercises/${exercise.id}/live`)} size="lg" className="bg-[#00806E] hover:bg-blue-600 text-white border-0 shadow-lg shadow-blue-900/20">
                <PlayCircle className="w-5 h-5 mr-2" />
                Start Live Exercise
                </Button>
            ) : (
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                    <p className="text-sm font-medium text-white flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-2 text-yellow-300" />
                        Live analysis is currently available for {LIVE_EXERCISES.join(', ')}.
                    </p>
                </div>
            )}
            <Button 
                onClick={() => navigate('/assistant', { state: { context_exercise: exercise.name } })}
                variant="outline" 
                size="lg" 
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-md transition-colors"
            >
                <Lightbulb className="w-5 h-5 mr-2" />
                Ask AI about this exercise
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
        <div className="md:col-span-2 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Instructions</h2>
            <div className="space-y-4">
              {Array.isArray(exercise.instructions) && exercise.instructions.map((step: string, index: number) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-4">
                    {index + 1}
                  </div>
                  <p className="text-gray-700 leading-relaxed mt-1">{step}</p>
                </div>
              ))}
            </div>
          </section>

          {(exercise.common_mistakes && exercise.common_mistakes.length > 0) && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Common Mistakes</h2>
              <Card className="bg-red-50 border-red-100">
                <CardContent className="p-6">
                  <ul className="space-y-3">
                    {exercise.common_mistakes.map((mistake: string, idx: number) => (
                      <li key={idx} className="flex items-start text-red-800">
                        <AlertTriangle className="w-5 h-5 mr-3 text-red-500 shrink-0" />
                        <span>{mistake}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <div className="flex items-center text-gray-500 mb-1">
                  <Target className="w-4 h-4 mr-2" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider">Target Muscle</h3>
                </div>
                <p className="text-lg font-medium text-gray-900">{exercise.target_muscle}</p>
              </div>

              {exercise.safety_notes && (
                <div>
                  <div className="flex items-center text-gray-500 mb-1">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider">Safety Note</h3>
                  </div>
                  <p className="text-sm text-gray-700">{exercise.safety_notes}</p>
                </div>
              )}
              
              {exercise.tips && exercise.tips.length > 0 && (
                <div>
                  <div className="flex items-center text-blue-600 mb-2">
                    <Lightbulb className="w-4 h-4 mr-2" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider">Pro Tips</h3>
                  </div>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {exercise.tips.map((tip: string, idx: number) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
