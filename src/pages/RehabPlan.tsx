import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Calendar, PlayCircle, CheckCircle2, Circle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const RehabPlan = () => {
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchPlan = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/rehab/active', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPlan(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  const handleTrack = async (exerciseId: number, skipped: boolean) => {
    const token = localStorage.getItem('token');
    try {
      await fetch('http://127.0.0.1:8000/api/v1/rehab/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          exercise_id: exerciseId,
          plan_id: plan.id,
          skipped: skipped
        })
      });
      // Optionally re-fetch history or update local state
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading your personalized plan...</div>;
  }

  if (!plan) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">No Active Plan</h2>
        <p className="text-gray-500">You need to complete a posture assessment first.</p>
        <Button onClick={() => navigate('/dashboard/assessment')}>Take Assessment</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Today's Routine</h1>
          <p className="text-gray-500 mt-1">Based on your recent assessment.</p>
        </div>
        <div className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
          <Calendar className="w-4 h-4" />
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
        </div>
      </header>

      <div className="space-y-4">
        {plan.exercises?.map((planEx: any) => (
          <Card key={planEx.id} className="overflow-hidden transition-all hover:shadow-md border-gray-100">
            <CardContent className="p-0">
              <div className="flex flex-col sm:flex-row">
                <div 
                  className="w-full sm:w-48 h-48 sm:h-auto bg-gray-100 bg-cover bg-center cursor-pointer" 
                  style={{ backgroundImage: `url('https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400')` }}
                  onClick={() => navigate(`/dashboard/exercises/${planEx.exercise.id}`)}
                >
                  <div className="w-full h-full flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors">
                    <PlayCircle className="w-12 h-12 text-white opacity-80" />
                  </div>
                </div>
                
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{planEx.exercise.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{planEx.exercise.target_muscle}</p>
                      </div>
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                        {planEx.exercise.difficulty}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-6 mt-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Sets</span>
                        <span className="text-lg font-medium text-gray-900">{planEx.sets}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Reps</span>
                        <span className="text-lg font-medium text-gray-900">{planEx.repetitions}</span>
                      </div>
                      {planEx.duration_seconds && (
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Hold</span>
                          <span className="text-lg font-medium text-gray-900">{planEx.duration_seconds}s</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 mt-6">
                    <Button 
                      className="flex-1" 
                      onClick={() => handleTrack(planEx.exercise.id, false)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Mark Complete
                    </Button>
                    <Button 
                      variant="outline" 
                      className="px-6"
                      onClick={() => handleTrack(planEx.exercise.id, true)}
                    >
                      Skip
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
