import React, { useState, useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Play, Square, Pause, AlertCircle, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Issue {
  name: string;
  severity: string;
  recommendation: string;
}

interface Measurements {
  head_offset_pct?: number;
  shoulder_tilt_deg?: number;
  trunk_lean?: string | null;
  side_on?: boolean;
  neck_angle_deg?: number | null;
}

interface AnalysisResult {
  score: number | null;
  issues: Issue[];
  confidence: number;
  view?: 'front' | 'side';
  measurements?: Measurements | null;
}

type Step = 'front' | 'side';

// How long each view is measured for
const FRONT_SECONDS = 6;
const SIDE_SECONDS = 3;

const median = (values: number[]) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

const mostCommon = (values: string[]) => {
  const counts: Record<string, number> = {};
  values.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
};

const speak = (text: string) => {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
};

export const Assessment = () => {
  const [isActive, setIsActive] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionScores, setSessionScores] = useState<number[]>([]);
  // How many scored frames showed each issue, so the saved result reflects the whole session
  const issueCountsRef = useRef<Record<string, number>>({});
  // Guided check: front view first, then a short side view for the neck angle
  const [step, setStep] = useState<Step>('front');
  const stepRef = useRef<Step>('front');
  const [progress, setProgress] = useState(0);
  const frontRef = useRef<{ start: number; head: number[]; tilt: number[]; lean: string[] }>({ start: 0, head: [], tilt: [], lean: [] });
  const sideRef = useRef<{ start: number; neck: number[] }>({ start: 0, neck: [] });
  const savingRef = useRef(false);
  
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const requestRef = useRef<number>(0);
  // Time the last frame was sent while waiting for its result (0 = not waiting)
  const pendingSinceRef = useRef<number>(0);

  const navigate = useNavigate();

  // Connect to WebSocket
  useEffect(() => {
    if (isActive) {
      // Get token from localStorage (assuming it's stored as 'token' or inside 'auth')
      const token = localStorage.getItem('token') || '';
      
      const wsUrl = `${(import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace('http', 'ws')}/api/v1/assessments/ws/live?token=${token}`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket Connected');
      };
      
      ws.onmessage = (event) => {
        pendingSinceRef.current = 0;
        try {
          const data = JSON.parse(event.data);
          if (data.analysis) {
            const a: AnalysisResult = data.analysis;
            const m = a.measurements;
            const now = performance.now() / 1000;
            if (a.view === 'side') {
              if (m?.side_on && m.neck_angle_deg != null) {
                const side = sideRef.current;
                if (!side.start) side.start = now;
                side.neck.push(m.neck_angle_deg);
                setProgress(Math.min(1, (now - side.start) / SIDE_SECONDS));
                if (now - side.start >= SIDE_SECONDS && side.neck.length >= 8) finishRef.current();
              }
            } else {
              setAnalysis(a);
              if (a.score && a.score > 0 && m) {
                setSessionScores(prev => [...prev, a.score as number]);
                for (const issue of a.issues) {
                  issueCountsRef.current[issue.name] = (issueCountsRef.current[issue.name] || 0) + 1;
                }
                const front = frontRef.current;
                if (!front.start) front.start = now;
                if (m.head_offset_pct != null) front.head.push(m.head_offset_pct);
                if (m.shoulder_tilt_deg != null) front.tilt.push(m.shoulder_tilt_deg);
                if (m.trunk_lean) front.lean.push(m.trunk_lean);
                setProgress(Math.min(1, (now - front.start) / FRONT_SECONDS));
                if (stepRef.current === 'front' && now - front.start >= FRONT_SECONDS && front.head.length >= 10) {
                  stepRef.current = 'side';
                  setStep('side');
                  setProgress(0);
                  speak('Now turn your chair so one shoulder points at the screen, and look straight ahead.');
                }
              }
            }
          }
          
          if (data.landmarks && canvasRef.current && webcamRef.current) {
            drawSkeleton(data.landmarks, data.width, data.height);
          }
        } catch (err) {
          console.error("WS parse error", err);
        }
      };
      
      ws.onclose = () => console.log('WebSocket Disconnected');
      wsRef.current = ws;
      
      // Start frame capture loop
      const captureFrame = () => {
        // Only send a new frame once the server has answered the previous one
        // (or after 2s, in case a reply got lost). On a slow server this stops
        // frames from piling up and the skeleton lagging further and further behind.
        const now = Date.now();
        const canSend = pendingSinceRef.current === 0 || now - pendingSinceRef.current > 2000;
        if (canSend && webcamRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
          const imageSrc = webcamRef.current.getScreenshot();
          if (imageSrc) {
            wsRef.current.send(JSON.stringify({ image: imageSrc, view: stepRef.current }));
            pendingSinceRef.current = now;
          }
        }
        // Run ~10 fps
        setTimeout(() => {
          if (isActive) {
            requestRef.current = requestAnimationFrame(captureFrame);
          }
        }, 100);
      };
      
      requestRef.current = requestAnimationFrame(captureFrame);
      
    } else {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    }
    
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isActive]);

  const drawSkeleton = (landmarks: any[], _originalWidth: number, _originalHeight: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Match canvas size to display size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const connections = [
        [11, 12], [11, 23], [12, 24], [23, 24], // Torso
        [11, 13], [13, 15], // Left arm
        [12, 14], [14, 16], // Right arm
        [23, 25], [25, 27], // Left leg
        [24, 26], [26, 28]  // Right leg
    ];
    
    // Draw lines
    ctx.strokeStyle = '#4F8EF7';
    ctx.lineWidth = 3;
    connections.forEach(([start, end]) => {
        const startPoint = landmarks[start];
        const endPoint = landmarks[end];
        
        if (startPoint && endPoint && startPoint.visibility > 0.5 && endPoint.visibility > 0.5) {
            ctx.beginPath();
            ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height);
            ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height);
            ctx.stroke();
        }
    });
    
    // Draw points
    landmarks.forEach((lm) => {
        if (lm.visibility > 0.5) {
            ctx.beginPath();
            ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 5, 0, 2 * Math.PI);
            ctx.fillStyle = '#34C759';
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    });
  };

  const handleStopAndSave = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setIsActive(false);
    setIsSaving(true);
    
    try {
      const avgScore = sessionScores.length > 0 
        ? sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length
        : 0;

      // Save the issue seen most often, if it showed up in at least a quarter of the frames
      const [topIssue, topCount] = Object.entries(issueCountsRef.current)
        .sort((a, b) => b[1] - a[1])[0] || ["None", 0];
      const detectedIssue = topCount >= sessionScores.length / 4 ? topIssue : "None";
        
      const token = localStorage.getItem('token');
      // 1. Save Assessment
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/assessments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          posture_score: Math.round(avgScore),
          detected_issue: detectedIssue,
          confidence: analysis?.confidence || 0,
          head_offset_pct: median(frontRef.current.head),
          shoulder_tilt_deg: median(frontRef.current.tilt),
          trunk_lean: mostCommon(frontRef.current.lean),
          neck_angle_deg: median(sideRef.current.neck)
        })
      });
      
      if (response.ok) {
        const assessmentData = await response.json();
        navigate(`/assessment/report?assessment_id=${assessmentData.id}`);
      }
    } catch (err) {
      console.error("Save failed", err);
    } finally {
      setIsSaving(false);
      savingRef.current = false;
    }
  };

  // The side view finishes the check on its own; the socket handler calls the latest version
  const finishRef = useRef(handleStopAndSave);
  finishRef.current = handleStopAndSave;

  const startCheck = () => {
    setSessionScores([]);
    issueCountsRef.current = {};
    frontRef.current = { start: 0, head: [], tilt: [], lean: [] };
    sideRef.current = { start: 0, neck: [] };
    stepRef.current = 'front';
    setStep('front');
    setProgress(0);
    setIsActive(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Live Assessment</h1>
          <p className="text-gray-500 mt-1">Position yourself clearly in the camera frame.</p>
        </div>
        
        <div className="flex space-x-3">
          {!isActive ? (
            <Button onClick={startCheck} className="rounded-full px-6" disabled={isSaving}>
              <Play className="w-4 h-4 mr-2" />
              Start Assessment
            </Button>
          ) : (
            <>
              <Button variant="danger" onClick={handleStopAndSave} className="rounded-full px-6">
                <Save className="w-4 h-4 mr-2" />
                {step === 'side' ? 'Skip side view & save' : 'Stop & Save'}
              </Button>
            </>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Main Camera View */}
        <div className="lg:col-span-2 flex flex-col">
          <Card className="flex-1 min-h-[500px] relative overflow-hidden bg-gray-900 flex flex-col items-center justify-center border-0 shadow-2xl">
            {isActive ? (
              <>
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: "user" }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full z-10"
                />
                
                {/* HUD Elements */}
                <div className="absolute top-4 left-4 z-20">
                  <Badge variant="success" className="bg-black/50 text-white border border-white/20 backdrop-blur-md">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                    {step === 'front' ? 'Step 1 of 2: facing the camera' : 'Step 2 of 2: side view'}
                  </Badge>
                </div>
                <div className="absolute bottom-0 inset-x-0 z-20 p-4 bg-gradient-to-t from-black/70 to-transparent">
                  <p className="text-white font-medium mb-2">
                    {step === 'front'
                      ? 'Sit tall, face the camera and keep still for a few seconds.'
                      : 'Turn your chair so one shoulder points at the screen, and look straight ahead.'}
                  </p>
                  <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-green-400 rounded-full transition-all duration-200" style={{ width: `${progress * 100}%` }} />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-400">
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="w-8 h-8 text-gray-500 ml-1" />
                </div>
                <p>Camera is currently off.</p>
                <p className="text-sm">Click 'Start Assessment' to begin.</p>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar Metrics */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Live Posture Score</h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-5xl font-bold text-gray-900">
                    {isActive ? (analysis?.score != null ? Math.round(analysis.score) : '--') : '--'}
                  </span>
                  <span className="text-gray-500">/100</span>
                </div>
                {isActive && analysis && analysis.score != null && (
                  <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${analysis.score > 80 ? 'bg-green-500' : analysis.score > 60 ? 'bg-orange-500' : 'bg-red-500'}`} 
                      style={{ width: `${analysis.score}%` }}
                    />
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Detected Issues</h3>
                {isActive ? (
                  <div className="space-y-3">
                    {analysis?.issues && analysis.issues.length > 0 ? (
                      analysis.issues.map((issue, idx) => (
                        <div key={idx} className={`flex items-start space-x-3 p-3 rounded-xl border ${issue.severity === 'High' ? 'bg-red-50 border-red-100' : 'bg-orange-50 border-orange-100'}`}>
                          <AlertCircle className={`w-5 h-5 mt-0.5 shrink-0 ${issue.severity === 'High' ? 'text-red-500' : 'text-orange-500'}`} />
                          <div>
                            <p className={`text-sm font-medium ${issue.severity === 'High' ? 'text-red-800' : 'text-orange-800'}`}>{issue.name}</p>
                            <p className={`text-xs mt-1 ${issue.severity === 'High' ? 'text-red-600' : 'text-orange-600'}`}>{issue.recommendation}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-xl border border-green-100">
                        <div>
                          <p className="text-sm font-medium text-green-800">Perfect Posture</p>
                          <p className="text-xs text-green-600 mt-1">Keep it up! Your alignment is great.</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Waiting for analysis...</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
