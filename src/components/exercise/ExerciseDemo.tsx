import React, { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';

type Kind = 'side-bend' | 'shrugs' | 'wall-angels' | 'chin-tucks';

export const DEMO_KIND: Record<string, Kind> = {
  'Neck Side-Bend Stretch': 'side-bend',
  'Shoulder Shrugs': 'shrugs',
  'Wall Angels': 'wall-angels',
  'Chin Tucks': 'chin-tucks',
};

const CYCLE_MS = 3200;
const CYCLES = 3;
const INK = '#10181B';
const TEAL = '#00806E';

type P = [number, number];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rot = (p: P, o: P, deg: number): P => {
  const a = (deg * Math.PI) / 180;
  const x = p[0] - o[0], y = p[1] - o[1];
  return [o[0] + x * Math.cos(a) - y * Math.sin(a), o[1] + x * Math.sin(a) + y * Math.cos(a)];
};

// The movement drawn with the same points the camera tracks. Plays three reps, then stops.
export const ExerciseDemo: React.FC<{ exerciseName: string }> = ({ exerciseName }) => {
  const kind = DEMO_KIND[exerciseName];
  const reduce = useReducedMotion();
  // Position in the demo, in reps: 1.25 = a quarter of the way through the second rep
  const [pos, setPos] = useState(reduce ? 0.5 : 0);
  const [run, setRun] = useState(0);
  const [playing, setPlaying] = useState(!reduce);

  useEffect(() => {
    if (reduce || !kind) return;
    setPlaying(true);
    let frame = 0;
    let start: number | null = null;
    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsed = now - start;
      if (elapsed >= CYCLE_MS * CYCLES) {
        setPos(0);
        setPlaying(false);
        return;
      }
      setPos(elapsed / CYCLE_MS);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [run, reduce, kind]);

  if (!kind) return null;
  const t = pos % 1;
  const rep = Math.floor(pos);
  // Ease in, hold at the top, ease out: the rhythm of a rep
  const phase = t < 0.3 ? t / 0.3 : t < 0.6 ? 1 : t < 0.9 ? 1 - (t - 0.6) / 0.3 : 0;
  const e = (1 - Math.cos(phase * Math.PI)) / 2;

  const lines: [P, P][] = [];
  const dots: P[] = [];
  let head: { c: P; r: number } = { c: [150, 70], r: 26 };
  let extra: React.ReactNode = null;

  if (kind === 'chin-tucks') {
    // Side view, facing right: the head glides straight back
    const shift = -14 * e;
    const ear: P = [150 + shift, 92], shoulder: P = [140, 150], hip: P = [135, 260];
    head = { c: [ear[0] + 12, 78], r: 30 };
    lines.push([ear, shoulder], [shoulder, hip], [shoulder, [150, 200]], [[150, 200], [185, 225]]);
    dots.push(ear, shoulder, hip);
    extra = <path d={`M${head.c[0] + 30},${head.c[1] + 4} l10,4 l-10,4`} fill="none" stroke={INK} strokeWidth={3} strokeLinejoin="round" />;
  } else {
    let L: P = [205, 140], R: P = [95, 140];
    const neck: P = [150, 110];
    if (kind === 'shrugs') {
      L = [205, 140 - 16 * e];
      R = [95, 140 - 16 * e];
    }
    const hipL: P = [180, 262], hipR: P = [120, 262];
    lines.push([L, R], [L, hipL], [R, hipR], [hipL, hipR]);
    if (kind === 'side-bend') {
      // Alternate sides: odd reps to the left, even reps to the right
      const side = rep % 2 === 0 ? 1 : -1;
      const angle = 24 * e * side;
      head = { c: rot([150, 70], neck, angle), r: 26 };
      lines.push([neck, rot([150, 96], neck, angle)]);
    } else {
      lines.push([neck, [150, 96]]);
    }
    if (kind === 'wall-angels') {
      // Arms slide from a W (goalpost) up into a Y
      const elbowL: P = [lerp(250, 232, e), lerp(150, 62, e)], wristL: P = [lerp(252, 252, e), lerp(92, 18, e)];
      const elbowR: P = [300 - elbowL[0], elbowL[1]], wristR: P = [300 - wristL[0], wristL[1]];
      lines.push([L, elbowL], [elbowL, wristL], [R, elbowR], [elbowR, wristR]);
      dots.push(elbowL, wristL, elbowR, wristR);
    } else {
      lines.push([L, [218, 215]], [[218, 215], [222, 262]], [R, [82, 215]], [[82, 215], [78, 262]]);
    }
    dots.push(L, R, hipL, hipR);
  }

  return (
    <figure className="graph-paper border border-rule rounded-[4px] bg-white relative">
      <svg viewBox="0 0 300 290" className="w-full h-auto" role="img" aria-label={`Demonstration of ${exerciseName}`}>
        {kind !== 'chin-tucks' && <line x1={150} x2={150} y1={20} y2={280} stroke={TEAL} strokeWidth={1.5} strokeDasharray="5 5" />}
        {lines.map(([a, b], i) => <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={INK} strokeWidth={3.5} strokeLinecap="round" />)}
        <circle cx={head.c[0]} cy={head.c[1]} r={head.r} fill="#fff" stroke={INK} strokeWidth={3.5} />
        {extra}
        {dots.map((d, i) => <circle key={i} cx={d[0]} cy={d[1]} r={5} fill="#fff" stroke={TEAL} strokeWidth={2.5} />)}
      </svg>
      <figcaption className="flex items-center justify-between px-3 py-2 border-t border-faint bg-white text-[13px] text-muted">
        <span>{kind === 'chin-tucks' ? 'Seen from the side' : 'Seen from the front'}; teal points are what the camera tracks</span>
        {!playing && !reduce && (
          <button type="button" onClick={() => setRun(r => r + 1)} className="flex items-center gap-1 font-semibold text-primary hover:underline">
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> Replay
          </button>
        )}
      </figcaption>
    </figure>
  );
};
