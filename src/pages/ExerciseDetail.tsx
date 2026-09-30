import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ExerciseDemo, DEMO_KIND } from '../components/exercise/ExerciseDemo';
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
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-3">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
      
      <header className="bg-white border border-rule rounded-[4px] grid md:grid-cols-[1fr_280px] overflow-hidden">
        <div className="p-6 md:p-8 flex flex-col">
          <div className="flex items-center gap-2 mb-3 text-[13px] text-muted">
            <span>{exercise.difficulty}</span><span aria-hidden="true">/</span><span>{exercise.body_part}</span>
          </div>
          <h1 className="text-[34px] md:text-[40px] leading-tight text-ink">{exercise.name}</h1>
          <p className="mt-2 text-muted max-w-xl">{exercise.description}</p>
          <div className="mt-auto pt-6 flex flex-wrap gap-3">
            {LIVE_EXERCISES.includes(exercise.name) ? (
              <Button onClick={() => navigate(`/dashboard/exercises/${exercise.id}/live`)} size="lg">
                <PlayCircle className="w-5 h-5 mr-2" aria-hidden="true" />
                Start with camera
              </Button>
            ) : (
              <p className="text-sm text-muted flex items-center bg-paper border border-rule rounded-[6px] px-3 py-2">
                <AlertTriangle className="w-4 h-4 mr-2 text-flag" aria-hidden="true" />
                Live counting is available for {LIVE_EXERCISES.join(', ')}.
              </p>
            )}
            <Button onClick={() => navigate('/assistant', { state: { context_exercise: exercise.name } })} variant="secondary" size="lg">
              <Lightbulb className="w-5 h-5 mr-2" aria-hidden="true" />
              Ask the assistant
            </Button>
          </div>
        </div>
        {DEMO_KIND[exercise.name] ? (
          <div className="border-t md:border-t-0 md:border-l border-rule p-3 bg-paper">
            <ExerciseDemo exerciseName={exercise.name} />
          </div>
        ) : null}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
        <div className="md:col-span-2 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Instructions</h2>
            <div className="space-y-4">
              {Array.isArray(exercise.instructions) && exercise.instructions.map((step: string, index: number) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full border-[1.5px] border-primary text-primary flex items-center justify-center font-semibold mr-4">
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
                  <h3 className="text-sm font-semibold">Target Muscle</h3>
                </div>
                <p className="text-lg font-medium text-gray-900">{exercise.target_muscle}</p>
              </div>

              {exercise.safety_notes && (
                <div>
                  <div className="flex items-center text-gray-500 mb-1">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    <h3 className="text-sm font-semibold">Safety Note</h3>
                  </div>
                  <p className="text-sm text-gray-700">{exercise.safety_notes}</p>
                </div>
              )}
              
              {exercise.tips && exercise.tips.length > 0 && (
                <div>
                  <div className="flex items-center text-blue-600 mb-2">
                    <Lightbulb className="w-4 h-4 mr-2" />
                    <h3 className="text-sm font-semibold">Pro Tips</h3>
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
