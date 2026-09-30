import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { CheckSummary } from '../components/dashboard/CheckSummary';
import type { Assessment } from '../components/dashboard/CheckSummary';
import { LIVE_EXERCISES } from './ExerciseDetail';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

interface Recommendation {
  id: number;
  name: string;
  target_muscle: string | null;
  sets: number | null;
  repetitions: string | null;
}

export const AssessmentReport = () => {
  const [check, setCheck] = useState<Assessment | null>(null);
  const [previous, setPrevious] = useState<Assessment | undefined>();
  const [isLatest, setIsLatest] = useState(true);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const id = Number(new URLSearchParams(location.search).get('assessment_id'));
    const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/assessments/history`, { headers });
        if (!res.ok) return;
        // Newest first
        const history: Assessment[] = await res.json();
        const index = history.findIndex(a => a.id === id);
        if (index < 0) return;
        const target = history[index];
        setCheck(target);
        setPrevious(history[index + 1]);
        setIsLatest(index === 0);

        const issues = (target.detected_issue ?? '').split(',').map(i => i.trim()).filter(i => i && i !== 'None');
        const recRes = await fetch(`${API_URL}/api/v1/rehab/recommendations`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ detected_issues: issues, severity: 'low' }),
        });
        if (recRes.ok) {
          const data = await recRes.json();
          // Camera-counted exercises first
          const recs: Recommendation[] = data.recommendations ?? [];
          setRecommendations([...recs].sort((a, b) => Number(LIVE_EXERCISES.includes(b.name)) - Number(LIVE_EXERCISES.includes(a.name))));
          setWarning(data.warning);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [location.search]);

  // Save these recommendations as the active plan (the assistant uses it), then go to today's routine
  const startRoutine = async () => {
    if (!check) return;
    setWorking(true);
    try {
      await fetch(`${API_URL}/api/v1/rehab/generate?assessment_id=${check.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
    } finally {
      navigate('/dashboard');
    }
  };

  if (loading) return <div className="py-20 text-muted">Loading the report…</div>;

  if (!check) {
    return (
      <div className="max-w-xl bg-white border border-rule rounded-[4px] p-8">
        <h1 className="text-[28px] text-ink">Report not found</h1>
        <p className="text-muted mt-2">This posture check doesn't exist or belongs to another account.</p>
        <Link to="/dashboard" className="inline-block mt-5 font-semibold text-primary hover:underline">Back to the dashboard</Link>
      </div>
    );
  }

  const flagged = (check.detected_issue ?? 'None') !== 'None';

  return (
    <div className="pb-12">
      <Link to="/assessment" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink mb-4">
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Posture check
      </Link>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[34px] md:text-[40px] leading-tight text-ink">Your posture check</h1>
          <p className="text-muted mt-1">
            {new Date(check.created_at).toLocaleString(undefined, { day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })}
            {isLatest ? ', your latest check' : ''}
          </p>
        </div>
        <Button onClick={startRoutine} isLoading={working}>Go to today's routine</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-6 items-start">
        <section className="bg-white border border-rule rounded-[4px]">
          <CheckSummary check={check} previous={previous} />
        </section>

        <section className="bg-white border border-rule rounded-[4px]">
          <header className="px-5 md:px-6 pt-4 pb-3 border-b border-faint">
            <h2 className="text-[22px] text-ink">{flagged ? 'Exercises for what was flagged' : 'Exercises to keep it that way'}</h2>
          </header>
          {warning && <p className="mx-5 md:mx-6 mt-4 text-sm bg-flag-wash rounded-[4px] px-3.5 py-3 text-ink">{warning}</p>}
          {recommendations.length ? (
            <ul className="px-5 md:px-6 py-1.5">
              {recommendations.map(ex => (
                <li key={ex.id} className="border-b border-faint last:border-b-0">
                  <Link to={`/dashboard/exercises/${ex.id}`} className="flex items-center justify-between gap-3 py-3 group">
                    <span>
                      <strong className="block font-semibold text-ink group-hover:underline">{ex.name}</strong>
                      <span className="text-sm text-muted">{ex.target_muscle}</span>
                    </span>
                    {LIVE_EXERCISES.includes(ex.name)
                      ? <span className="flex items-center gap-1.5 text-sm font-semibold text-primary whitespace-nowrap"><Camera className="w-4 h-4" aria-hidden="true" />Counted</span>
                      : <span className="text-sm text-muted whitespace-nowrap">{ex.sets ?? 3} × {ex.repetitions ?? '10'}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="px-6 py-5 text-sm text-muted">No specific exercises for this check. The daily routine covers the basics.</p>}
        </section>
      </div>
    </div>
  );
};
