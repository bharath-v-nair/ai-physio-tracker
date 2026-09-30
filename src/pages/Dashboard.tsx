import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Flame, Trophy, Timer } from 'lucide-react';
import { useUserProfile } from '../utils/useUserProfile';
import { PostureFigure } from '../components/dashboard/PostureFigure';
import type { Highlight } from '../components/dashboard/PostureFigure';
import { AnimatedNumber } from '../components/dashboard/AnimatedNumber';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// The daily routine: the exercises the camera can count, in the order they're done
const ROUTINE = ['Neck Side-Bend Stretch', 'Shoulder Shrugs', 'Wall Angels', 'Chin Tucks'];
const ROUTINE_NOTES: Record<string, string> = {
  'Neck Side-Bend Stretch': 'Hold 5 s each side, facing the camera',
  'Shoulder Shrugs': '10 reps, facing the camera',
  'Wall Angels': '10 reps, arms in view',
  'Chin Tucks': '10 reps, sitting sideways',
};
const LEAN_LABELS: Record<string, string> = {
  TUP: 'Upright', TLF: 'Leaning forward', TLB: 'Leaning backward', TLL: 'Leaning left', TLR: 'Leaning right',
};

interface Assessment {
  id: number;
  posture_score: number;
  detected_issue: string | null;
  created_at: string;
  head_offset_pct: number | null;
  shoulder_tilt_deg: number | null;
  trunk_lean: string | null;
  neck_angle_deg: number | null;
}

interface Session {
  id: number;
  exercise_id: number;
  completed_at: string;
  skipped: boolean;
  completed_reps: number | null;
  target_reps: number | null;
  form_score: number | null;
  exercise?: { id: number; name: string };
}

interface FocusSummary {
  id: number;
  started_at: string;
  duration_seconds: number;
  good_pct: number;
}

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const shortDate = (s: string) => new Date(s).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

// Days in a row, ending today or yesterday, with at least one completed exercise
const streakDays = (sessions: Session[]) => {
  const days = new Set(sessions.filter(s => !s.skipped).map(s => dayKey(new Date(s.completed_at))));
  const d = new Date();
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(dayKey(d))) {
    n += 1;
    d.setDate(d.getDate() - 1);
  }
  return n;
};

// How the score was reached, using the same rules as the posture check
const scoreReasons = (a: Assessment) => {
  const out: string[] = [];
  if (a.head_offset_pct != null && a.head_offset_pct > 12) out.push(`${a.head_offset_pct > 20 ? 20 : 10} points off for head position`);
  if (a.shoulder_tilt_deg != null && a.shoulder_tilt_deg > 5) out.push(`${a.shoulder_tilt_deg > 10 ? 15 : 5} off for shoulder level`);
  if (a.trunk_lean && a.trunk_lean !== 'TUP') out.push('10 off for trunk lean');
  return out.length ? `${out.join(', ')}.` : 'Nothing flagged.';
};

const Sheet: React.FC<{ title: string; meta?: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, meta, children, className }) => (
  <section className={`bg-white border border-rule rounded-[4px] ${className ?? ''}`}>
    <header className="flex items-baseline justify-between gap-4 px-5 md:px-6 pt-4 pb-3 border-b border-faint">
      <h2 className="text-[22px] text-ink">{title}</h2>
      {meta && <div className="text-sm text-muted text-right">{meta}</div>}
    </header>
    {children}
  </section>
);

export const Dashboard = () => {
  const navigate = useNavigate();
  const profile = useUserProfile();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [exercises, setExercises] = useState<{ id: number; name: string }[]>([]);
  const [focus, setFocus] = useState<FocusSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [highlight, setHighlight] = useState<Highlight>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    const get = (path: string) => fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : []))
      .catch(() => []);
    Promise.all([get('/api/v1/assessments/history'), get('/api/v1/rehab/history'), get('/api/v1/exercises'), get('/api/v1/focus/sessions')])
      .then(([a, s, e, f]) => {
        setAssessments(a);
        setSessions(s);
        setExercises(e);
        setFocus(f);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  // Oldest first for the trend; the newest check is shown unless one is picked on the chart
  const checks = useMemo(() => [...assessments].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at)), [assessments]);
  const shownIndex = selected ?? checks.length - 1;
  const shown = checks[shownIndex];
  const previous = shownIndex > 0 ? checks[shownIndex - 1] : undefined;

  const today = dayKey(new Date());
  const doneToday = new Set(sessions.filter(s => !s.skipped && dayKey(new Date(s.completed_at)) === today).map(s => s.exercise?.name ?? ''));
  const routine = ROUTINE.map(name => ({ name, id: exercises.find(e => e.name === name)?.id, done: doneToday.has(name) }));
  const next = routine.find(r => !r.done && r.id);
  const streak = streakDays(sessions);
  const bests = ROUTINE.map(name => ({
    name,
    best: Math.max(0, ...sessions.filter(s => s.exercise?.name === name && s.form_score != null).map(s => s.form_score as number)),
  })).filter(b => b.best > 0);
  const recent = sessions.filter(s => !s.skipped).slice(0, 5);
  const lastFocus = focus[0];

  if (loading) {
    return <div className="h-[60vh] grid place-items-center text-muted">Loading your dashboard…</div>;
  }

  const readings = shown ? [
    { key: 'head' as const, label: 'Head position', value: shown.head_offset_pct != null ? `${shown.head_offset_pct.toFixed(0)}% of shoulder width off centre` : 'Not recorded', limit: 'Over 12%', flag: (shown.head_offset_pct ?? 0) > 12, okText: 'Within 12%' },
    { key: 'shoulders' as const, label: 'Shoulder level', value: shown.shoulder_tilt_deg != null ? `${shown.shoulder_tilt_deg.toFixed(1)}° tilt` : 'Not recorded', limit: 'Over 5°', flag: (shown.shoulder_tilt_deg ?? 0) > 5, okText: 'Within 5°' },
    { key: 'trunk' as const, label: 'Trunk', value: shown.trunk_lean ? `${LEAN_LABELS[shown.trunk_lean]}, from the trained posture model` : 'Hips not in view, so lean was not measured', limit: 'Leaning', flag: !!shown.trunk_lean && shown.trunk_lean !== 'TUP', okText: shown.trunk_lean ? 'Good' : '–' },
  ] : [];
  const flagged = readings.filter(r => r.flag);

  return (
    <div className="pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-7">
        <div>
          <h1 className="text-[34px] md:text-[40px] leading-tight text-ink">{greeting()}{profile ? `, ${profile.full_name.split(' ')[0]}` : ''}</h1>
          <p className="text-muted mt-1">Your last posture check and today's exercises.</p>
        </div>
        {next ? (
          <Link to={`/dashboard/exercises/${next.id}/live`} className="inline-flex items-center justify-center rounded-[6px] bg-primary text-white font-semibold px-5 py-3 hover:bg-primary-hover transition-colors">
            {doneToday.size ? `Continue: ${next.name}` : "Start today's routine"}
          </Link>
        ) : (
          <Link to="/focus" className="inline-flex items-center justify-center rounded-[6px] bg-primary text-white font-semibold px-5 py-3 hover:bg-primary-hover transition-colors">
            Start a focus session
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-6 items-start">
        <div className="grid gap-6 min-w-0">
          <Sheet title="Posture check" meta={shown ? new Date(shown.created_at).toLocaleString(undefined, { day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' }) : undefined}>
            {shown ? (
              <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
                <figure className="graph-paper border-b md:border-b-0 md:border-r border-faint flex flex-col">
                  <div className="max-w-[260px] md:max-w-none mx-auto w-full">
                    <PostureFigure drawKey={shown.id} highlight={highlight}
                      m={{ head_offset_pct: shown.head_offset_pct, shoulder_tilt_deg: shown.shoulder_tilt_deg, trunk_lean: shown.trunk_lean }} />
                  </div>
                  <figcaption className="mt-auto px-4 py-2.5 text-[13px] text-muted bg-white border-t border-faint">
                    {shown.head_offset_pct != null ? 'Drawn from the measurements of this check' : 'This check was saved before measurements were recorded'}
                  </figcaption>
                </figure>
                <div className="p-5 md:p-6 flex flex-col gap-4">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <AnimatedNumber value={Math.round(shown.posture_score)} from={previous ? Math.round(previous.posture_score) : 0}
                        className="font-serif text-[64px] leading-none text-ink" />
                      <span className="font-serif text-[22px] text-muted">/ 100</span>
                    </div>
                    <p className="text-sm text-muted mt-1">{scoreReasons(shown)}</p>
                  </div>
                  <ol className="grid gap-3">
                    {readings.map((r, i) => (
                      <motion.li key={`${shown.id}-${r.key}`}
                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.24, delay: r.flag ? 1.25 : 0.5 + 0.08 * i }}
                        onMouseEnter={() => setHighlight(r.key)} onMouseLeave={() => setHighlight(null)}
                        onFocus={() => setHighlight(r.key)} onBlur={() => setHighlight(null)} tabIndex={0}
                        className="grid grid-cols-[12px_1fr_auto] gap-3 items-start rounded-[4px] -mx-2 px-2 py-1 hover:bg-paper focus:bg-paper outline-none">
                        <span className={`mt-1.5 w-2.5 h-2.5 rounded-full ${r.flag ? 'bg-flag' : 'bg-primary'}`} />
                        <span><strong className="block font-semibold text-ink">{r.label}</strong><span className="text-sm text-muted">{r.value}</span></span>
                        <span className={`text-sm font-semibold whitespace-nowrap ${r.flag ? 'text-flag-text' : 'text-primary'}`}>{r.flag ? r.limit : r.okText}</span>
                      </motion.li>
                    ))}
                  </ol>
                  {shown.neck_angle_deg != null && (
                    <p className="text-sm text-muted">Side view neck angle: <strong className="text-ink">{shown.neck_angle_deg.toFixed(1)}°</strong> (higher means the head sits further back).</p>
                  )}
                  {flagged.length > 0 ? (
                    <p className="text-sm bg-flag-wash rounded-[4px] px-3.5 py-3 text-ink">
                      {flagged[0].key === 'head' ? 'Keep your ears level and over the middle of your shoulders.' : flagged[0].key === 'shoulders' ? 'Let both shoulders drop and relax evenly.' : 'Sit back with your weight even on both hips.'} Check again after today's exercises.
                    </p>
                  ) : (
                    <p className="text-sm bg-teal-50 rounded-[4px] px-3.5 py-3 text-ink">Nothing flagged in this check. Keep the routine going to hold it there.</p>
                  )}
                  <Link to="/assessment" className="text-sm font-semibold text-primary hover:underline self-start">New posture check</Link>
                </div>
              </div>
            ) : (
              <div className="graph-paper p-10 text-center">
                <p className="text-ink font-semibold">No posture check yet</p>
                <p className="text-muted text-sm mt-1 mb-4">A 20-second check measures your head position, shoulder level and lean.</p>
                <Link to="/assessment" className="inline-flex rounded-[6px] bg-primary text-white font-semibold px-5 py-2.5 hover:bg-primary-hover">Take your first posture check</Link>
              </div>
            )}
          </Sheet>

          <Sheet title="Recent sessions" meta={<Link to="/progress" className="font-semibold text-primary hover:underline">See all progress</Link>}>
            {recent.length ? (
              <table className="w-full text-left tabular">
                <thead><tr className="text-[13px] text-muted">
                  <th className="font-semibold px-5 md:px-6 py-2.5">Date</th><th className="font-semibold px-2 py-2.5">Exercise</th>
                  <th className="font-semibold px-2 py-2.5 text-right">Reps</th><th className="font-semibold px-5 md:px-6 py-2.5 hidden sm:table-cell">Form score</th>
                </tr></thead>
                <tbody>
                  {recent.map(s => (
                    <tr key={s.id} className="border-t border-faint">
                      <td className="px-5 md:px-6 py-2.5 whitespace-nowrap">{shortDate(s.completed_at)}</td>
                      <td className="px-2 py-2.5">{s.exercise?.name}</td>
                      <td className="px-2 py-2.5 text-right whitespace-nowrap">{s.completed_reps ?? '–'}{s.target_reps ? ` of ${s.target_reps}` : ''}</td>
                      <td className="px-5 md:px-6 py-2.5 hidden sm:table-cell">
                        {s.form_score != null && (
                          <span className="flex items-center gap-2.5">
                            <motion.span className="h-1.5 rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: s.form_score }} transition={{ duration: 0.48, ease: [0.25, 1, 0.5, 1] }} />
                            {s.form_score}%
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="px-6 py-6 text-sm text-muted">Sessions you finish show up here.</p>}
          </Sheet>
        </div>

        <div className="grid gap-6 min-w-0">
          <Sheet title="Today's routine" meta={`${doneToday.size ? `${routine.filter(r => r.done).length} of ${ROUTINE.length} done` : 'About 10 minutes'}`}>
            <ol className="px-5 md:px-6 py-1.5">
              {routine.map((r, i) => (
                <li key={r.name} className="grid grid-cols-[28px_1fr_auto] gap-3 items-center py-3 border-b border-faint last:border-b-0">
                  <motion.span
                    initial={false}
                    animate={{ backgroundColor: r.done ? '#00806E' : '#FFFFFF', borderColor: r.done ? '#00806E' : '#CFDAD8' }}
                    className="w-[26px] h-[26px] rounded-full border-[1.5px] grid place-items-center text-[13px] font-semibold text-muted">
                    {r.done ? <Check className="w-4 h-4 text-white" aria-label="Done" /> : i + 1}
                  </motion.span>
                  <span>
                    <strong className="block font-semibold text-ink">{r.name}</strong>
                    <span className="text-sm text-muted">{r.done ? 'Done today' : ROUTINE_NOTES[r.name]}</span>
                  </span>
                  {r.id && !r.done && (
                    <Link to={`/dashboard/exercises/${r.id}/live`} className="text-sm font-semibold text-primary hover:underline">Start</Link>
                  )}
                </li>
              ))}
            </ol>
            <footer className="px-5 md:px-6 py-3.5 border-t border-faint flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
              <span className="flex items-center gap-1.5"><Flame className="w-4 h-4 text-flag" aria-hidden="true" /><strong className="text-ink">{streak} {streak === 1 ? 'day' : 'days'}</strong> in a row</span>
              {bests.length > 0 && (
                <span className="flex items-center gap-1.5"><Trophy className="w-4 h-4 text-primary" aria-hidden="true" />Best form: <strong className="text-ink">{Math.max(...bests.map(b => b.best))}%</strong></span>
              )}
            </footer>
          </Sheet>

          <Sheet title="Posture score" meta={checks.length ? `Last ${Math.min(checks.length, 8)} checks` : undefined}>
            <div className="px-5 md:px-6 py-4">
              {checks.length >= 2 ? (
                <>
                  <p className="text-sm text-muted mb-2">
                    {checks[checks.length - 1].posture_score >= checks[0].posture_score ? 'Up' : 'Down'} {Math.abs(Math.round(checks[checks.length - 1].posture_score - checks[0].posture_score))} points since your first check on {shortDate(checks[0].created_at)}. Pick a point to see that check.
                  </p>
                  <ScoreTrend checks={checks.slice(-8)} offset={Math.max(0, checks.length - 8)} selected={shownIndex} onSelect={setSelected} />
                </>
              ) : (
                <p className="text-sm text-muted">Your trend appears after two posture checks.</p>
              )}
            </div>
          </Sheet>

          <Sheet title="Focus mode" meta={lastFocus ? shortDate(lastFocus.started_at) : undefined}>
            <div className="px-5 md:px-6 py-4 flex items-center justify-between gap-4">
              <p className="text-sm text-muted">
                {lastFocus
                  ? <>Last session: <strong className="text-ink">{lastFocus.good_pct}%</strong> in good posture over {Math.round(lastFocus.duration_seconds / 60)} min.</>
                  : 'Keep PhysioAI open while you study and it nudges you when you slouch.'}
              </p>
              <Link to="/focus" className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"><Timer className="w-4 h-4" aria-hidden="true" />Start</Link>
            </div>
          </Sheet>
        </div>
      </div>
    </div>
  );
};

// Score over time on the full 0-100 scale. Each point is a button that shows that check in the diagram.
const ScoreTrend: React.FC<{ checks: Assessment[]; offset: number; selected: number; onSelect: (i: number) => void }> = ({ checks, offset, selected, onSelect }) => {
  const W = 360, H = 150;
  const x = (i: number) => (checks.length === 1 ? W / 2 : 40 + (i * (W - 60)) / (checks.length - 1));
  const y = (v: number) => 125 - v * 1.05;
  const d = checks.map((c, i) => `${i ? 'L' : 'M'}${x(i)},${y(c.posture_score)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="group" aria-label="Posture score over time">
      {[0, 50, 100].map(v => (
        <g key={v}>
          <line x1={28} x2={W - 8} y1={y(v)} y2={y(v)} stroke="#E6EDEC" />
          <text x={0} y={y(v) + 4} fontSize={11} fill="#46555A">{v}</text>
        </g>
      ))}
      <motion.path d={d} fill="none" stroke="#00806E" strokeWidth={2.5} strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.48, ease: [0.25, 1, 0.5, 1] }} />
      {checks.map((c, i) => {
        const active = offset + i === selected;
        return (
          <g key={c.id} role="button" tabIndex={0} aria-pressed={active}
             aria-label={`${shortDate(c.created_at)}: score ${Math.round(c.posture_score)}`}
             onClick={() => onSelect(offset + i)} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onSelect(offset + i)}
             className="cursor-pointer outline-none">
            {/* The whole column is clickable, not just the small dot */}
            <rect x={x(i) - (W - 60) / Math.max(1, checks.length - 1) / 2} y={0} width={(W - 60) / Math.max(1, checks.length - 1)} height={H} fill="transparent" />
            {active && <line x1={x(i)} x2={x(i)} y1={y(100)} y2={y(0)} stroke="#CFDAD8" strokeDasharray="3 3" />}
            <circle cx={x(i)} cy={y(c.posture_score)} r={active ? 6 : 4} fill={active ? '#00806E' : '#fff'} stroke="#00806E" strokeWidth={2.5} />
            <text x={x(i)} y={y(c.posture_score) - 11} textAnchor="middle" fontSize={14} fontFamily="Newsreader, Georgia, serif" fontWeight={600} fill="#10181B">{Math.round(c.posture_score)}</text>
            <text x={x(i)} y={146} textAnchor="middle" fontSize={11} fill="#46555A">{shortDate(c.created_at)}</text>
          </g>
        );
      })}
    </svg>
  );
};
