import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ArrowLeft, Pause, Play, Square, Activity, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export const LiveExercise = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [exercise, setExercise] = useState<any>(null);
  const [error, setError] = useState('');
  
  // HUD State
  const [reps, setReps] = useState(0);
  const [formScore, setFormScore] = useState(100);
  const [status, setStatus] = useState('Connecting...');
  const [feedback, setFeedback] = useState('Please wait...');
  const [isPaused, setIsPaused] = useState(false);
  const [sessionFinished, setSessionFinished] = useState(false);
  
  const [duration, setDuration] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  const TARGET_REPS = exercise?.repetitions || 10;
  
  // Timer
  useEffect(() => {
      if (sessionFinished || isPaused) return;
      const interval = setInterval(() => {
          setDuration(d => d + 1);
      }, 1000);
      return () => clearInterval(interval);
  }, [sessionFinished, isPaused]);

  // Format Duration
  const formatTime = (secs: number) => {
      const m = Math.floor(secs / 60).toString().padStart(2, '0');
      const s = (secs % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
  };

  const getScoreColor = (score: number) => {
      if (score >= 90) return 'text-green-500';
      if (score >= 80) return 'text-blue-500';
      if (score >= 60) return 'text-yellow-500';
      return 'text-red-500';
  };

  const getScoreLabel = (score: number) => {
      if (score >= 90) return 'Excellent';
      if (score >= 80) return 'Good';
      if (score >= 60) return 'Fair';
      return 'Needs Improvement';
  };

  useEffect(() => {
    const init = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        // Fetch exercise details
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/v1/exercises`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const found = data.find((ex: any) => ex.id === parseInt(id || '0'));
                if (found) {
                    setExercise(found);
                    startCameraAndWS(token, found.name);
                } else {
                    setError("Exercise not found.");
                }
            } else {
                setError("Failed to load exercise.");
            }
        } catch (err) {
            setError("Error loading exercise.");
        }
    };
    init();

    return () => {
        stopAll();
    };
  }, [id, navigate]);

  const stopAll = () => {
      if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
      }
      if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
      }
  };

  const startCameraAndWS = async (token: string, exerciseName: string) => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
              video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15 } } 
          });
          streamRef.current = stream;
          if (videoRef.current) {
              videoRef.current.srcObject = stream;
          }

          // Open WS
          const wsUrl = `ws://127.0.0.1:8000/api/v1/exercises/ws/live?token=${token}&exercise_name=${encodeURIComponent(exerciseName)}`;
          const ws = new WebSocket(wsUrl);
          wsRef.current = ws;

          ws.onopen = () => {
              setStatus("Ready");
              setFeedback("Get into starting position.");
              sendFramesLoop();
          };

          ws.onmessage = (event) => {
              const message = JSON.parse(event.data);
              if (message.type === 'analysis_result') {
                  const data = message.data;
                  if (data.status !== "Not Supported") {
                      setReps(data.reps);
                      setFormScore(data.form_score);
                      setStatus(data.status);
                      setFeedback(data.feedback);
                  } else {
                      setStatus(data.status);
                      setFeedback(data.feedback);
                  }
                  drawSkeleton(data.landmarks);
              }
          };

          ws.onerror = (e) => {
              console.error("WS Error:", e);
              setError("Connection to analysis server lost.");
          };

      } catch (err) {
          console.error(err);
          setError("Failed to access camera. Please allow camera permissions.");
      }
  };

  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const sendFramesLoop = () => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      if (isPaused || sessionFinished) {
          setTimeout(sendFramesLoop, 100);
          return;
      }

      if (videoRef.current) {
          const video = videoRef.current;
          
          if (video.videoWidth > 0 && video.videoHeight > 0) {
              if (!offscreenCanvasRef.current) {
                  offscreenCanvasRef.current = document.createElement('canvas');
              }
              const canvas = offscreenCanvasRef.current;
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                  const base64Frame = canvas.toDataURL('image/jpeg', 0.5);
                  wsRef.current.send(JSON.stringify({
                      type: 'frame',
                      data: base64Frame
                  }));
              }
          }
      }

      // Send at ~10 FPS to avoid overloading the backend
      setTimeout(sendFramesLoop, 100);
  };

  const drawSkeleton = (landmarks: any[]) => {
      if (!canvasRef.current || !videoRef.current || !landmarks) return;
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const rect = video.getBoundingClientRect();
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
          canvas.width = rect.width;
          canvas.height = rect.height;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Key connections for pose drawing
      const connections = [
          [11, 12], // shoulders
          [11, 13], [13, 15], // left arm
          [12, 14], [14, 16], // right arm
          [11, 23], [12, 24], [23, 24], // torso
          [0, 11], [0, 12], // neck to shoulders
          [0, 7], [0, 8], [7, 9], [8, 10] // face/head
      ];

      // Draw connections
      ctx.strokeStyle = 'rgba(79, 142, 247, 0.7)';
      ctx.lineWidth = 3;
      connections.forEach(([i, j]) => {
          const lm1 = landmarks[i];
          const lm2 = landmarks[j];
          if (lm1 && lm2 && (lm1.visibility ?? 1) > 0.4 && (lm2.visibility ?? 1) > 0.4) {
              ctx.beginPath();
              ctx.moveTo(lm1.x * canvas.width, lm1.y * canvas.height);
              ctx.lineTo(lm2.x * canvas.width, lm2.y * canvas.height);
              ctx.stroke();
          }
      });

      // Draw keypoints
      landmarks.forEach((lm, idx) => {
          if ((lm.visibility ?? 1) > 0.4) {
              const x = lm.x * canvas.width;
              const y = lm.y * canvas.height;
              ctx.beginPath();
              ctx.arc(x, y, idx <= 10 ? 5 : 4, 0, 2 * Math.PI);
              ctx.fillStyle = idx <= 10 ? '#60A5FA' : '#3B82F6';
              ctx.fill();
              ctx.strokeStyle = '#FFFFFF';
              ctx.lineWidth = 1.5;
              ctx.stroke();
          }
      });
  };

  const handleFinish = () => {
      setSessionFinished(true);
      setIsPaused(true);
      stopAll();
  };

  const handleSaveSession = async () => {
      setIsSaving(true);
      try {
          const token = localStorage.getItem('token');
          const payload = {
              exercise_id: exercise.id,
              completed_reps: reps,
              target_reps: TARGET_REPS,
              form_score: formScore,
              duration: duration,
              feedback: feedback,
              skipped: false
          };

          const res = await fetch('http://127.0.0.1:8000/api/v1/exercises/sessions', {
              method: 'POST',
              headers: { 
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
          });
          
          if (res.ok) {
              navigate('/dashboard/progress');
          } else {
              alert("Failed to save session.");
          }
      } catch (err) {
          alert("Error saving session.");
      } finally {
          setIsSaving(false);
      }
  };

  if (error) {
      return (
          <div className="flex flex-col items-center justify-center h-96">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Oops!</h2>
              <p className="text-gray-500 mb-6">{error}</p>
              <Button onClick={() => navigate(-1)} variant="outline">Go Back</Button>
          </div>
      );
  }

  if (!exercise) {
      return <div className="p-8 text-center">Loading...</div>;
  }

  if (sessionFinished) {
      return (
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pt-8">
              <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden">
                  <div className="bg-gray-900 p-8 text-center">
                      <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                      <h2 className="text-3xl font-bold text-white mb-2">Session Complete</h2>
                      <p className="text-gray-400">Great job completing your exercise!</p>
                  </div>
                  
                  <CardContent className="p-8 space-y-8">
                      <div className="grid grid-cols-2 gap-6">
                          <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
                              <p className="text-sm font-medium text-gray-500 mb-1 uppercase tracking-wider">Exercise</p>
                              <p className="text-xl font-bold text-gray-900">{exercise.name}</p>
                          </div>
                          <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
                              <p className="text-sm font-medium text-gray-500 mb-1 uppercase tracking-wider">Completed Reps</p>
                              <p className="text-xl font-bold text-gray-900">
                                  {reps} <span className="text-gray-400 text-sm">/ {TARGET_REPS}</span>
                              </p>
                          </div>
                          <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
                              <p className="text-sm font-medium text-gray-500 mb-1 uppercase tracking-wider">Form Score</p>
                              <p className={`text-xl font-bold ${getScoreColor(formScore)}`}>
                                  {formScore}% <span className="text-sm font-normal text-gray-500">({getScoreLabel(formScore)})</span>
                              </p>
                          </div>
                          <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
                              <p className="text-sm font-medium text-gray-500 mb-1 uppercase tracking-wider">Duration</p>
                              <p className="text-xl font-bold text-gray-900">{formatTime(duration)}</p>
                          </div>
                      </div>

                      <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
                          <p className="text-sm font-semibold text-blue-900 mb-2 uppercase tracking-wider flex items-center">
                              <Activity className="w-4 h-4 mr-2" />
                              Final Form Feedback
                          </p>
                          <p className="text-blue-800 text-lg">"{feedback}"</p>
                      </div>

                      <Button 
                          onClick={handleSaveSession} 
                          className="w-full h-14 text-lg bg-[#4F8EF7] hover:bg-blue-600 rounded-xl"
                          disabled={isSaving}
                      >
                          {isSaving ? "Saving..." : "Save Session"}
                      </Button>
                  </CardContent>
              </Card>
          </div>
      );
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4 animate-in fade-in duration-300">
      
      <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                  <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                  <h1 className="text-2xl font-bold text-gray-900">{exercise.name}</h1>
                  <p className="text-sm text-gray-500 flex items-center">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2"></span>
                      Live Analysis Active
                  </p>
              </div>
          </div>
          
          <div className="flex space-x-3">
              <Button 
                  variant="outline" 
                  className={isPaused ? "border-green-200 text-green-700 bg-green-50" : "border-yellow-200 text-yellow-700 bg-yellow-50"}
                  onClick={() => setIsPaused(!isPaused)}
              >
                  {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                  {isPaused ? "Resume" : "Pause"}
              </Button>
              <Button variant="danger" onClick={handleFinish} className="bg-red-500 hover:bg-red-600">
                  <Square className="w-4 h-4 mr-2" />
                  Finish
              </Button>
          </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
          
          {/* Main Video View */}
          <div className="lg:col-span-2 relative bg-black rounded-3xl overflow-hidden shadow-2xl ring-1 ring-gray-900/10 flex items-center justify-center">
              <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className={`w-full h-full object-contain ${isPaused ? 'opacity-50' : ''}`}
              />
              <canvas 
                  ref={canvasRef} 
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              />
              
              {isPaused && (
                  <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black/80 backdrop-blur px-8 py-4 rounded-full text-white font-semibold text-lg tracking-wider flex items-center shadow-2xl">
                          <Pause className="w-6 h-6 mr-3 text-yellow-400" />
                          PAUSED
                      </div>
                  </div>
              )}
          </div>

          {/* HUD Sidebar */}
          <div className="flex flex-col space-y-4">
              
              <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
                  <div className="p-6 bg-gradient-to-br from-[#4F8EF7] to-blue-600 text-white">
                      <div className="flex items-center justify-between mb-4">
                          <span className="uppercase text-sm font-semibold tracking-wider text-blue-100">Rep Count</span>
                          <Clock className="w-5 h-5 text-blue-200" />
                      </div>
                      <div className="flex items-baseline">
                          <span className="text-6xl font-black">{reps}</span>
                          <span className="text-2xl text-blue-200 ml-2">/ {TARGET_REPS}</span>
                      </div>
                  </div>
              </Card>

              <Card className="bg-white border-0 shadow-lg rounded-2xl">
                  <CardContent className="p-6">
                      <span className="uppercase text-xs font-semibold tracking-wider text-gray-500 block mb-2">Exercise Form Score</span>
                      <div className="flex items-center justify-between mb-1">
                          <span className={`text-4xl font-bold ${getScoreColor(formScore)}`}>{formScore}%</span>
                          <Badge variant="outline" className={`border-0 ${getScoreColor(formScore)} bg-opacity-10`}>
                              {getScoreLabel(formScore)}
                          </Badge>
                      </div>
                      
                      <div className="w-full bg-gray-100 rounded-full h-2 mt-4">
                          <div 
                              className={`h-2 rounded-full transition-all duration-500 ease-out ${
                                  formScore >= 90 ? 'bg-green-500' : formScore >= 80 ? 'bg-blue-500' : formScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`} 
                              style={{ width: `${formScore}%` }}
                          ></div>
                      </div>
                  </CardContent>
              </Card>

              <Card className="bg-white border-0 shadow-lg rounded-2xl flex-1 flex flex-col">
                  <CardContent className="p-6 flex flex-col h-full">
                      <span className="uppercase text-xs font-semibold tracking-wider text-gray-500 block mb-4">Live Feedback</span>
                      
                      <div className="mb-4">
                          <Badge variant={status === 'Good Form' ? 'success' : status === 'Not Supported' ? 'secondary' : 'warning'} className="mb-2">
                              {status}
                          </Badge>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4 flex-1 border border-gray-100 flex items-center justify-center text-center relative overflow-hidden">
                          {status === 'Not Supported' && (
                              <AlertCircle className="absolute -right-4 -bottom-4 w-24 h-24 text-gray-200 opacity-50" />
                          )}
                          <p className="text-lg font-medium text-gray-800 z-10 leading-relaxed">
                              "{feedback}"
                          </p>
                      </div>
                  </CardContent>
              </Card>

              <p className="text-xs text-center text-gray-400 px-4 mt-2">
                  Exercise form feedback is AI-generated and is intended for educational purposes only. Stop if you experience pain or discomfort and consult a qualified physiotherapist when appropriate.
              </p>

          </div>
      </div>
    </div>
  );
};
