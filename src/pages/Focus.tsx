import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Play, Square, Eye, EyeOff, BellRing } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const Pose = (window as any).Pose;
const SAMPLE_EVERY_MS = 2000;

type Status = 'idle' | 'calibrating' | 'good' | 'poor' | 'away';

interface Minute {
  good: number;
  total: number;
}

interface SavedSession {
  id: number;
  started_at: string;
  duration_seconds: number;
  good_pct: number;
  nudges: number;
  timeline: { minute: number; good_pct: number }[];
}

const REASON_LABELS: Record<string, string> = {
  slouching: 'Slouching',
  leaning_in: 'Leaning towards the screen',
  head_tilt: 'Head tilted',
  uneven_shoulders: 'Uneven shoulders',
  trunk_lean: 'Leaning to one side',
};

const formatTime = (secs: number) => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return h ? `${h}h ${m}m` : `${m}:${String(s).padStart(2, '0')}`;
};

const minuteColor = (m: Minute) => {
  if (!m.total) return 'bg-gray-100';
  const pct = m.good / m.total;
  if (pct >= 0.8) return 'bg-green-500';
  if (pct >= 0.5) return 'bg-yellow-400';
  return 'bg-orange-500';
};

// A short, soft tone for nudges
const chime = () => {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // Sound is optional
  }
};

export const Focus = () => {
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [minutes, setMinutes] = useState<Minute[]>([]);
  const [nudgeAfter, setNudgeAfter] = useState(60);
  const [nudge, setNudge] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(true);
  const [summary, setSummary] = useState<SavedSession | null>(null);
  const [history, setHistory] = useState<SavedSession[]>([]);
  const [error, setError] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const poseRef = useRef<any>(null);
  const timerRef = useRef<number>(0);
  const tickRef = useRef<number>(0);
  const startRef = useRef<Date | null>(null);
  const statsRef = useRef({ samples: 0, good: 0, nudges: 0, reasons: {} as Record<string, number>, poorSince: 0 });
  const minutesRef = useRef<Minute[]>([]);
  const nudgeAfterRef = useRef(nudgeAfter);
  nudgeAfterRef.current = nudgeAfter;

  const token = localStorage.getItem('token');

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/focus/sessions`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setHistory(await res.json());
    } catch {
      // History is optional
    }
  }, [token]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleResult = (r: any) => {
    setMessage(r.message);
    if (r.phase === 'calibrating') {
      setStatus(r.status === 'away' ? 'away' : 'calibrating');
      return;
    }
    if (r.good === null) {
      setStatus('away');
      return;
    }
    const stats = statsRef.current;
    const minute = Math.floor((Date.now() - (startRef.current?.getTime() || Date.now())) / 60000);
    const buckets = minutesRef.current;
    while (buckets.length <= minute) buckets.push({ good: 0, total: 0 });
    buckets[minute].total += 1;
    stats.samples += 1;
    if (r.good) {
      buckets[minute].good += 1;
      stats.good += 1;
      stats.poorSince = 0;
      setNudge(null);
      setStatus('good');
    } else {
      for (const reason of r.reasons) stats.reasons[reason] = (stats.reasons[reason] || 0) + 1;
      if (!stats.poorSince) stats.poorSince = Date.now();
      setStatus('poor');
      if (Date.now() - stats.poorSince >= nudgeAfterRef.current * 1000) {
        stats.nudges += 1;
        stats.poorSince = Date.now();
        setNudge(r.message);
        chime();
        if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
          new Notification('Posture check', { body: r.message });
        }
      }
    }
    setMinutes([...buckets]);
  };

  const start = async () => {
    setError('');
    setSummary(null);
    if (!Pose) {
      setError('The pose model failed to load. Check your connection and reload the page.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setError('Camera access is needed for focus mode. Please allow it and try again.');
      return;
    }
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const ws = new WebSocket(`${API_URL.replace('http', 'ws')}/api/v1/focus/ws?token=${token}`);
    ws.onmessage = e => handleResult(JSON.parse(e.data));
    ws.onerror = () => setError('Lost connection to the server.');
    wsRef.current = ws;

    // MediaPipe runs here in the browser; only the body points are sent
    const pose = new Pose({ locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}` });
    pose.setOptions({ modelComplexity: 1, smoothLandmarks: false, enableSegmentation: false, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
    pose.onResults((results: any) => {
      const socket = wsRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN || !videoRef.current) return;
      socket.send(JSON.stringify({
        landmarks: results.poseLandmarks?.map((l: any) => ({ x: l.x, y: l.y, z: l.z, visibility: l.visibility })) ?? [],
        world: results.poseWorldLandmarks?.map((l: any) => ({ x: l.x, y: l.y, z: l.z })) ?? [],
        dimensions: { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight },
      }));
    });
    poseRef.current = pose;

    statsRef.current = { samples: 0, good: 0, nudges: 0, reasons: {}, poorSince: 0 };
    minutesRef.current = [];
    setMinutes([]);
    startRef.current = new Date();
    setElapsed(0);
    setStatus('calibrating');
    setMessage('Sit the way you want to sit while you work, and hold it.');
    setRunning(true);

    timerRef.current = window.setInterval(async () => {
      if (videoRef.current && poseRef.current && videoRef.current.readyState >= 2) {
        try { await poseRef.current.send({ image: videoRef.current }); } catch { /* skipped frame */ }
      }
    }, SAMPLE_EVERY_MS);
    tickRef.current = window.setInterval(() => {
      if (startRef.current) setElapsed(Math.round((Date.now() - startRef.current.getTime()) / 1000));
    }, 1000);
  };

  const stopCamera = () => {
    window.clearInterval(timerRef.current);
    window.clearInterval(tickRef.current);
    wsRef.current?.close();
    wsRef.current = null;
    poseRef.current?.close();
    poseRef.current = null;
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  useEffect(() => stopCamera, []);

  const stop = async () => {
    stopCamera();
    setRunning(false);
    setStatus('idle');
    setNudge(null);
    const stats = statsRef.current;
    if (!startRef.current || !stats.samples) return;
    const payload = {
      started_at: startRef.current.toISOString(),
      duration_seconds: Math.round((Date.now() - startRef.current.getTime()) / 1000),
      samples: stats.samples,
      good_samples: stats.good,
      nudges: stats.nudges,
      timeline: minutesRef.current.map((m, i) => ({ minute: i, good_pct: m.total ? Math.round((m.good / m.total) * 1000) / 10 : 0 })).filter((_, i) => minutesRef.current[i].total),
      reasons: stats.reasons,
    };
    try {
      const res = await fetch(`${API_URL}/api/v1/focus/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSummary(await res.json());
        loadHistory();
      } else {
        setError('Could not save this session.');
      }
    } catch {
      setError('Could not save this session.');
    }
  };

  const stats = statsRef.current;
  const goodPct = stats.samples ? Math.round((stats.good / stats.samples) * 100) : 0;
  const topReasons = Object.entries(stats.reasons).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const statusLabel: Record<Status, string> = {
    idle: 'Not running',
    calibrating: 'Learning your good posture',
    good: 'Good posture',
    poor: 'Check your posture',
    away: "Can't see you",
  };
  const statusColor: Record<Status, string> = {
    idle: 'bg-gray-100 text-gray-600',
    calibrating: 'bg-blue-50 text-blue-700',
    good: 'bg-green-50 text-green-700',
    poor: 'bg-orange-50 text-orange-700',
    away: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Focus Mode</h1>
          <p className="text-gray-500 mt-1">Keep this open while you study or work. It checks your posture every 2 seconds and nudges you when you slouch.</p>
        </div>
        {running ? (
          <Button onClick={stop} className="bg-red-500 hover:bg-red-600 text-white rounded-full px-6">
            <Square className="w-4 h-4 mr-2" /> Stop and see summary
          </Button>
        ) : (
          <Button onClick={start} className="rounded-full px-6">
            <Play className="w-4 h-4 mr-2" /> Start focus session
          </Button>
        )}
      </header>

      {error && <p className="p-4 rounded-xl bg-red-50 text-red-700 border border-red-100">{error}</p>}

      {nudge && (
        <div role="alert" className="p-4 rounded-xl bg-orange-50 border border-orange-200 flex items-center gap-3 text-orange-800">
          <BellRing className="w-5 h-5 shrink-0" />
          <p className="font-medium">{nudge}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="pt-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${statusColor[status]}`}>{statusLabel[status]}</span>
              <span className="text-2xl font-bold text-gray-900 tabular-nums">{formatTime(elapsed)}</span>
            </div>
            {message && running && <p className="text-gray-700">{message}</p>}

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Posture timeline (one square per minute)</p>
              <div className="flex flex-wrap gap-1.5" aria-label="Posture by minute">
                {minutes.length ? minutes.map((m, i) => (
                  <span key={i} title={`Minute ${i + 1}: ${m.total ? Math.round((m.good / m.total) * 100) : 0}% good`} className={`w-5 h-5 rounded ${minuteColor(m)}`} />
                )) : <span className="text-sm text-gray-400">Starts filling in once you begin.</span>}
              </div>
              <p className="text-xs text-gray-500 mt-2">Green: mostly good posture. Yellow: mixed. Orange: mostly poor.</p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-gray-50"><p className="text-2xl font-bold text-gray-900">{goodPct}%</p><p className="text-xs text-gray-500">good posture</p></div>
              <div className="p-3 rounded-xl bg-gray-50"><p className="text-2xl font-bold text-gray-900">{stats.nudges}</p><p className="text-xs text-gray-500">nudges</p></div>
              <div className="p-3 rounded-xl bg-gray-50"><p className="text-2xl font-bold text-gray-900">{stats.samples}</p><p className="text-xs text-gray-500">checks</p></div>
            </div>

            <label className="flex items-center gap-3 text-sm text-gray-700">
              Nudge me after
              <select value={nudgeAfter} onChange={e => setNudgeAfter(Number(e.target.value))} className="border border-gray-200 rounded-lg px-2 py-1">
                <option value={30}>30 seconds</option>
                <option value={60}>1 minute</option>
                <option value={120}>2 minutes</option>
                <option value={300}>5 minutes</option>
              </select>
              of poor posture
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">Camera</p>
              <button type="button" onClick={() => setShowCamera(v => !v)} className="text-sm text-gray-500 flex items-center gap-1 hover:text-gray-900">
                {showCamera ? <><EyeOff className="w-4 h-4" /> Hide</> : <><Eye className="w-4 h-4" /> Show</>}
              </button>
            </div>
            <video ref={videoRef} muted playsInline className={`w-full rounded-xl bg-gray-900 aspect-[4/3] object-cover -scale-x-100 ${showCamera ? '' : 'hidden'}`} />
            <p className="text-xs text-gray-500">The video never leaves your computer. Only 33 body points are sent to work out your posture. Keep this window visible (a corner of the screen is fine): browsers pause the camera in hidden tabs.</p>
          </CardContent>
        </Card>
      </div>

      {summary && (
        <Card>
          <CardHeader><CardTitle>Session summary</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-gray-700">
            <p><strong>{summary.good_pct}%</strong> of {formatTime(summary.duration_seconds)} in good posture, with {summary.nudges} {summary.nudges === 1 ? 'nudge' : 'nudges'}.</p>
            {topReasons.length > 0 && <p>Most common: {topReasons.map(([r, n]) => `${REASON_LABELS[r] ?? r} (${n})`).join(', ')}.</p>}
            {summary.timeline.length >= 4 && (() => {
              const half = Math.floor(summary.timeline.length / 2);
              const avg = (xs: { good_pct: number }[]) => xs.reduce((a, b) => a + b.good_pct, 0) / xs.length;
              const first = avg(summary.timeline.slice(0, half));
              const second = avg(summary.timeline.slice(half));
              return <p>First half {Math.round(first)}% good, second half {Math.round(second)}% good{second < first - 10 ? ': posture dropped as the session went on, so try a short break mid-session.' : '.'}</p>;
            })()}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Past focus sessions</CardTitle></CardHeader>
        <CardContent>
          {history.length >= 2 && <FocusTrend sessions={history.slice(0, 10).reverse()} />}
          {history.length ? (
            <ul className="divide-y divide-gray-100">
              {history.slice(0, 10).map(s => (
                <li key={s.id} className="py-3 flex items-center justify-between text-sm">
                  <span className="text-gray-700">{new Date(s.started_at).toLocaleString()}</span>
                  <span className="text-gray-500">{formatTime(s.duration_seconds)}</span>
                  <span className="font-semibold text-gray-900">{s.good_pct}% good</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-gray-500">No sessions yet. Start one next time you study.</p>}
        </CardContent>
      </Card>
    </div>
  );
};

// Share of each session spent in good posture, oldest to newest
const FocusTrend: React.FC<{ sessions: SavedSession[] }> = ({ sessions }) => {
  const W = 600, H = 130;
  const x = (i: number) => 40 + (i * (W - 70)) / Math.max(1, sessions.length - 1);
  const y = (v: number) => 100 - v * 0.85;
  const d = sessions.map((s, i) => `${i ? 'L' : 'M'}${x(i)},${y(s.good_pct)}`).join(' ');
  const first = sessions[0].good_pct, last = sessions[sessions.length - 1].good_pct;
  return (
    <div className="mb-4">
      <p className="text-sm text-muted mb-1">
        Good posture went from <strong className="text-ink">{first}%</strong> to <strong className="text-ink">{last}%</strong> over your last {sessions.length} sessions.
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`Good posture per focus session, from ${first}% to ${last}%`}>
        {[0, 50, 100].map(v => (
          <g key={v}>
            <line x1={30} x2={W - 10} y1={y(v)} y2={y(v)} stroke="#E6EDEC" />
            <text x={0} y={y(v) + 4} fontSize={11} fill="#46555A">{v}%</text>
          </g>
        ))}
        <path d={d} fill="none" stroke="#00806E" strokeWidth={2.5} strokeLinejoin="round" />
        {sessions.map((s, i) => (
          <g key={s.id}>
            <circle cx={x(i)} cy={y(s.good_pct)} r={4} fill="#fff" stroke="#00806E" strokeWidth={2.5} />
            <text x={x(i)} y={124} textAnchor="middle" fontSize={11} fill="#46555A">
              {new Date(s.started_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};
