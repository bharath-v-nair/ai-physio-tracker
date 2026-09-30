import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Pause, Play, Square, Activity, AlertCircle, CheckCircle2, Volume2, VolumeX } from 'lucide-react';
import { PoseOverlay } from '../components/exercise/PoseOverlay';
import { ExerciseFeedback } from '../components/exercise/ExerciseFeedback';
import { RepCounter } from '../components/exercise/RepCounter';
import { LIVE_EXERCISES } from './ExerciseDetail';
import { SignalPlot } from '../components/exercise/SignalPlot';
import type { SignalPoint } from '../components/exercise/SignalPlot';

interface LiveState {
    phase: string;
    tHi: number;
    tLo: number;
    unit: string;
    twoSided: boolean;
    holdProgress: number;
    calibrationProgress: number;
    repsBySide: { left: number; right: number } | null;
}

const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
};


export const LiveExercise = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const wsRef = useRef<WebSocket | null>(null);
    const lastLandmarkSentTime = useRef<number>(0);
    
    const [exercise, setExercise] = useState<any>(null);
    const [error, setError] = useState('');
    
    // HUD State
    const [reps, setReps] = useState(0);
    const [formScore, setFormScore] = useState(100);
    const [status, setStatus] = useState('Connecting...');
    const [feedback, setFeedback] = useState('Please wait...');
    const [isPaused, setIsPaused] = useState(false);
    const [live, setLive] = useState<LiveState | null>(null);
    const [signal, setSignal] = useState<SignalPoint[]>([]);
    // Spoken cues matter most for side-on exercises, where the user can't see the screen
    const [voiceOn, setVoiceOn] = useState(true);
    const voiceOnRef = useRef(voiceOn);
    voiceOnRef.current = voiceOn;
    const [sessionFinished, setSessionFinished] = useState(false);
    
    const [duration, setDuration] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState(false);
    
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

            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/exercises`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    const found = data.find((ex: any) => ex.id === parseInt(id || '0'));
                    if (found && !LIVE_EXERCISES.includes(found.name)) {
                        setError("Live counting isn't available for this exercise yet. You can still follow the steps on its page.");
                    } else if (found) {
                        setExercise(found);
                        
                        // Open WS for analysis
                        const wsUrl = `${(import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace('http', 'ws')}/api/v1/exercises/ws/live?token=${token}&exercise_name=${encodeURIComponent(found.name)}`;
                        const ws = new WebSocket(wsUrl);
                        wsRef.current = ws;

                        ws.onopen = () => {
                            setStatus("Ready");
                            setFeedback("Position yourself in front of the camera.");
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
                                    if (data.phase) {
                                        setLive({
                                            phase: data.phase,
                                            tHi: data.t_hi,
                                            tLo: data.t_lo,
                                            unit: data.unit,
                                            twoSided: data.two_sided,
                                            holdProgress: data.hold_progress,
                                            calibrationProgress: data.calibration_progress,
                                            repsBySide: data.reps_by_side,
                                        });
                                        if (data.signal !== null && data.signal !== undefined) {
                                            const t = performance.now() / 1000;
                                            setSignal(prev => [...prev.filter(p => t - p.t <= 15), { t, v: data.signal }]);
                                        }
                                        if (voiceOnRef.current) {
                                            if (data.event === 'calibrated') speak('Ready. Start when you like.');
                                            else if (data.event === 'reached') speak('Hold');
                                            else if (data.event === 'held') speak('And relax');
                                            else if (data.event === 'rep') speak(String(data.reps));
                                        }
                                    }
                                } else {
                                    setStatus(data.status);
                                    setFeedback(data.feedback);
                                }
                            }
                        };

                        ws.onerror = (e) => {
                            console.error("WS Error:", e);
                            setError("Connection to analysis server lost.");
                        };

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
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [id, navigate]);

    const handleLandmarks = useCallback((landmarks: any[], dims: {width: number, height: number}) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        
        const now = Date.now();
        // Throttle to ~10 FPS for the backend to not get overwhelmed
        if (now - lastLandmarkSentTime.current < 100) return;
        
        lastLandmarkSentTime.current = now;
        
        wsRef.current.send(JSON.stringify({
            type: 'landmarks',
            data: landmarks,
            dimensions: dims,
            t: performance.now() / 1000
        }));
    }, []);

    const handleFinish = () => {
        setSessionFinished(true);
        setIsPaused(true);
        if (wsRef.current) {
            wsRef.current.close();
        }
    };

    const handleSaveSession = async () => {
        setIsSaving(true);
        setSaveError(false);
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

            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/exercises/sessions`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (res.ok) {
                navigate('/dashboard');
            } else {
                setSaveError(true);
            }
        } catch (err) {
            setSaveError(true);
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

    if (sessionFinished && reps === 0) {
        return (
            <div className="max-w-xl mx-auto pt-8">
                <section className="bg-white border border-rule rounded-[4px] p-8">
                    <h2 className="text-[28px] text-ink">No reps were counted</h2>
                    <p className="text-muted mt-2">Nothing has been saved. Check the camera can see the body parts this exercise needs, then try again.</p>
                    <div className="flex flex-wrap gap-3 mt-6">
                        <Button onClick={() => window.location.reload()}>Try again</Button>
                        <Button variant="secondary" onClick={() => navigate(-1)}>Back to the exercise</Button>
                    </div>
                </section>
            </div>
        );
    }

    if (sessionFinished) {
        return (
            <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pt-8">
                <Card className="rounded-3xl overflow-hidden">
                    <div className="bg-gray-900 p-8 text-center">
                        <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold text-white mb-2">Session Complete</h2>
                        <p className="text-gray-400">Great job completing your exercise!</p>
                        {reps >= TARGET_REPS && (
                            <p className="text-green-400 font-medium mt-2">Target completed!</p>
                        )}
                    </div>
                    
                    <CardContent className="p-8 space-y-8">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
                                <p className="text-sm font-medium text-gray-500 mb-1">Exercise</p>
                                <p className="text-xl font-bold text-gray-900">{exercise.name}</p>
                            </div>
                            <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
                                <p className="text-sm font-medium text-gray-500 mb-1">Completed Reps</p>
                                <p className="text-xl font-bold text-gray-900">
                                    {reps} <span className="text-gray-400 text-sm">/ {TARGET_REPS}</span>
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
                                <p className="text-sm font-medium text-gray-500 mb-1">Form Score</p>
                                <p className={`text-xl font-bold ${getScoreColor(formScore)}`}>
                                    {formScore}% <span className="text-sm font-normal text-gray-500">({getScoreLabel(formScore)})</span>
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
                                <p className="text-sm font-medium text-gray-500 mb-1">Duration</p>
                                <p className="text-xl font-bold text-gray-900">{formatTime(duration)}</p>
                            </div>
                        </div>

                        <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
                            <p className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
                                <Activity className="w-4 h-4 mr-2" />
                                Final Form Feedback
                            </p>
                            <p className="text-blue-800 text-lg">"{feedback}"</p>
                        </div>

                        {saveError && (
                            <div className="bg-red-50 rounded-2xl p-6 text-center border border-red-100">
                                <p className="text-red-600 font-medium mb-4">Unable to save your session.</p>
                                <div className="flex space-x-4 justify-center">
                                    <Button onClick={handleSaveSession} variant="outline" className="border-red-200 text-red-600 hover:bg-red-100">
                                        Retry Save
                                    </Button>
                                    <Button onClick={() => setSessionFinished(false)} variant="ghost" className="text-gray-500">
                                        Back to Exercise
                                    </Button>
                                </div>
                            </div>
                        )}

                        {!saveError && (
                            <Button 
                                onClick={handleSaveSession} 
                                className="w-full h-14 text-lg bg-[#00806E] hover:bg-blue-600 rounded-xl text-white"
                                disabled={isSaving}
                            >
                                {isSaving ? "Saving..." : "Save Session"}
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="lg:h-[calc(100vh-6rem)] flex flex-col space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-[28px] leading-tight text-ink">{exercise.name}</h1>
                        <p className="text-sm text-muted flex items-center">
                            <span className="w-2 h-2 rounded-full bg-primary mr-2" aria-hidden="true"></span>
                            Camera on: only body points are analysed
                        </p>
                    </div>
                </div>
                
                <div className="flex flex-wrap gap-2 justify-end">
                    <Button
                        variant="outline"
                        onClick={() => setVoiceOn(v => !v)}
                        aria-pressed={voiceOn}
                        aria-label={voiceOn ? 'Turn spoken counts off' : 'Turn spoken counts on'}
                    >
                        {voiceOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </Button>
                    <Button 
                        variant="outline" 
                        className={isPaused ? "border-green-200 text-green-700 bg-green-50" : "border-yellow-200 text-yellow-700 bg-yellow-50"}
                        onClick={() => setIsPaused(!isPaused)}
                    >
                        {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                        {isPaused ? "Resume" : "Pause"}
                    </Button>
                    <Button onClick={handleFinish} className="bg-red-500 hover:bg-red-600 text-white">
                        <Square className="w-4 h-4 mr-2" />
                        Finish
                    </Button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                <PoseOverlay 
                    isPaused={isPaused} 
                    onLandmarks={handleLandmarks} 
                    onError={setError} 
                />

                {/* HUD Sidebar */}
                <div className="flex flex-col space-y-4">
                    <RepCounter reps={reps} targetReps={TARGET_REPS} />
                    {live && live.phase === 'calibrating' && (
                        <Card className="bg-white rounded-2xl">
                            <CardContent className="p-5">
                                <p className="text-sm font-semibold text-gray-900 mb-2">Measuring your start position</p>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div className="h-2 rounded-full bg-[#00806E] transition-all duration-200" style={{ width: `${live.calibrationProgress * 100}%` }} />
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {live && live.phase === 'active' && (
                        <Card className="bg-white rounded-2xl">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-semibold text-gray-900">Your movement</p>
                                    {live.repsBySide && (
                                        <p className="text-xs text-gray-500">Left {live.repsBySide.left} · Right {live.repsBySide.right}</p>
                                    )}
                                </div>
                                <SignalPlot points={signal} tHi={live.tHi} tLo={live.tLo} twoSided={live.twoSided} unit={live.unit} />
                                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3" aria-label="Hold progress">
                                    <div className="h-1.5 rounded-full bg-green-500 transition-all duration-150" style={{ width: `${live.holdProgress * 100}%` }} />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">A rep counts when the line passes the target, is held, then comes back under the return line.</p>
                            </CardContent>
                        </Card>
                    )}
                    <ExerciseFeedback formScore={reps > 0 ? formScore : null} status={status} feedback={feedback} />
                </div>
            </div>
        </div>
    );
};
