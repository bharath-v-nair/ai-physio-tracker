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

interface AnalysisResult {
  score: number;
  issues: Issue[];
  confidence: number;
}

export const Assessment = () => {
  const [isActive, setIsActive] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionScores, setSessionScores] = useState<number[]>([]);
  
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const requestRef = useRef<number>(0);
  
  const navigate = useNavigate();

  // Connect to WebSocket
  useEffect(() => {
    if (isActive) {
      // Get token from localStorage (assuming it's stored as 'token' or inside 'auth')
      const token = localStorage.getItem('token') || '';
      
      const wsUrl = `ws://127.0.0.1:8000/api/v1/assessments/ws/live?token=${token}`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket Connected');
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.analysis) {
            setAnalysis(data.analysis);
            if (data.analysis.score > 0) {
              setSessionScores(prev => [...prev, data.analysis.score]);
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
        if (webcamRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
          const imageSrc = webcamRef.current.getScreenshot();
          if (imageSrc) {
            wsRef.current.send(JSON.stringify({ image: imageSrc }));
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
    setIsActive(false);
    setIsSaving(true);
    
    try {
      const avgScore = sessionScores.length > 0 
        ? sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length
        : 0;
        
      const token = localStorage.getItem('token');
      // 1. Save Assessment
      const response = await fetch('http://127.0.0.1:8000/api/v1/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          posture_score: Math.round(avgScore),
          detected_issue: analysis?.issues[0]?.name || "None",
          confidence: analysis?.confidence || 0
        })
      });
      
      if (response.ok) {
        const assessmentData = await response.json();
        navigate(`/dashboard/report?assessment_id=${assessmentData.id}`);
      }
    } catch (err) {
      console.error("Save failed", err);
    } finally {
      setIsSaving(false);
    }
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
            <Button onClick={() => setIsActive(true)} className="rounded-full px-6" disabled={isSaving}>
              <Play className="w-4 h-4 mr-2" />
              Start Assessment
            </Button>
          ) : (
            <>
              <Button variant="danger" onClick={handleStopAndSave} className="rounded-full px-6">
                <Save className="w-4 h-4 mr-2" />
                Stop & Save
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
                    Analyzing Live
                  </Badge>
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
                    {isActive ? (analysis?.score !== undefined ? Math.round(analysis.score) : '--') : '--'}
                  </span>
                  <span className="text-gray-500">/100</span>
                </div>
                {isActive && analysis && (
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
