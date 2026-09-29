import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PlayCircle, AlertCircle, RefreshCcw, ChevronDown } from 'lucide-react';
import { Button } from '../components/ui/Button';

const POSTURE_OPTIONS = [
  { label: "Forward Neck", value: "forward_neck" },
  { label: "Uneven Shoulder", value: "uneven_shoulder" },
  { label: "Round Shoulder", value: "round_shoulder" },
  { label: "Body Lean Right", value: "body_lean_right" },
  { label: "Body Lean Left", value: "body_lean_left" }
];

export const Exercises = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const selectedIssue = searchParams.get('issue') || '';

  const fetchRecommendations = async (issue: string) => {
    setLoading(true);
    setError(false);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/rehab/recommendations`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ posture_issue: issue })
      });
      if (response.ok) {
          const data = await response.json();
          setExercises(data.recommendations || []);
      } else {
          setError(true);
      }
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedIssue) {
      fetchRecommendations(selectedIssue);
    } else {
      setExercises([]);
    }
  }, [selectedIssue]);

  const handleIssueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val) {
      setSearchParams({ issue: val });
    } else {
      setSearchParams({});
    }
  };

  const getLabelForIssue = (val: string) => {
    return POSTURE_OPTIONS.find(opt => opt.value === val)?.label || val;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Exercise Recommendation</h1>
        <p className="text-gray-500">Find exercises recommended for your specific posture concern.</p>
      </header>

      {/* Selector */}
      <div className="max-w-md relative">
        <select 
          value={selectedIssue}
          onChange={handleIssueChange}
          className="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-3 px-4 pr-10 rounded-xl leading-tight focus:outline-none focus:ring-2 focus:ring-[#4F8EF7] shadow-sm"
        >
          <option value="" disabled>Select your posture issue</option>
          {POSTURE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
          <ChevronDown className="w-5 h-5" />
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* States */}
      {!selectedIssue && (
        <div className="text-center py-20 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <p className="text-gray-500 text-lg">Choose a posture concern above to receive recommended exercises.</p>
        </div>
      )}

      {selectedIssue && loading && (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4F8EF7] mx-auto mb-4"></div>
          <p className="text-gray-500 text-lg">Finding exercises for your posture...</p>
        </div>
      )}

      {selectedIssue && !loading && error && (
        <div className="text-center py-20 px-4 bg-red-50 rounded-2xl border border-red-100">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 text-lg mb-6">Unable to load recommendations. Please try again.</p>
          <Button onClick={() => fetchRecommendations(selectedIssue)} variant="outline" className="border-red-200 text-red-600 hover:bg-red-100">
            <RefreshCcw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      )}

      {selectedIssue && !loading && !error && exercises.length === 0 && (
        <div className="text-center py-20 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <p className="text-gray-500 text-lg">Exercises for this posture concern are currently being added.</p>
        </div>
      )}

      {selectedIssue && !loading && !error && exercises.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Recommended for: <span className="text-[#4F8EF7]">{getLabelForIssue(selectedIssue)}</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {exercises.map((exercise) => (
              <Card key={exercise.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col h-full">
                <div className="relative h-48 overflow-hidden rounded-t-[20px] bg-gray-100 shrink-0">
                  <img 
                    src={`https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400`} 
                    alt={exercise.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <PlayCircle className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute top-3 right-3 flex space-x-2">
                    <Badge variant="danger" className="bg-white/90 backdrop-blur text-red-600 border-red-200 shadow-sm">
                      {getLabelForIssue(exercise.target_issue)}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-5 flex flex-col flex-grow">
                  <div className="mb-2">
                    <h3 className="font-semibold text-lg text-gray-900 line-clamp-1" title={exercise.name}>{exercise.name}</h3>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-3">
                    <Badge variant={exercise.difficulty === 'Beginner' ? 'success' : 'warning'} className="text-xs">
                      {exercise.difficulty}
                    </Badge>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {exercise.sets || 3} sets × {exercise.repetitions || '10'} reps
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2 mb-6 flex-grow">{exercise.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 pt-4 mt-auto border-t border-gray-100">
                    <span className="flex items-center font-medium">
                      <PlayCircle className="w-4 h-4 mr-1.5 text-gray-400" />
                      {exercise.duration || "5 mins"}
                    </span>
                    <Button 
                      size="sm" 
                      onClick={() => navigate(`/dashboard/exercises/${exercise.id}`)}
                      className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg px-4"
                    >
                      View Exercise
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
