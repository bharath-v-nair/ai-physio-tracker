import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Camera, RefreshCcw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { LIVE_EXERCISES } from './ExerciseDetail';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

interface Exercise {
  id: number;
  name: string;
  body_part: string;
  description: string | null;
  difficulty: string | null;
  sets: number | null;
  repetitions: string | null;
  duration: string | null;
}

export const Exercises = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const filter = searchParams.get('filter') || 'all';

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`${API_URL}/api/v1/exercises`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      if (!res.ok) throw new Error();
      setExercises(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const areas = useMemo(() => Array.from(new Set(exercises.map(e => e.body_part))).sort(), [exercises]);
  const filters = [{ key: 'all', label: 'All' }, { key: 'live', label: 'Counted by camera' }, ...areas.map(a => ({ key: a, label: a }))];

  // Camera-counted exercises first, then alphabetical
  const shown = exercises
    .filter(e => filter === 'all' || (filter === 'live' ? LIVE_EXERCISES.includes(e.name) : e.body_part === filter))
    .sort((a, b) => Number(LIVE_EXERCISES.includes(b.name)) - Number(LIVE_EXERCISES.includes(a.name)) || a.name.localeCompare(b.name));

  return (
    <div className="pb-12">
      <header className="mb-6">
        <h1 className="text-[34px] md:text-[40px] leading-tight text-ink">Exercise library</h1>
        <p className="text-muted mt-1">Neck, shoulder and posture exercises. Four of them are counted live by the camera.</p>
      </header>

      <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Filter exercises">
        {filters.map(f => (
          <button key={f.key} type="button" aria-pressed={filter === f.key}
            onClick={() => setSearchParams(f.key === 'all' ? {} : { filter: f.key })}
            className={`px-3 py-1.5 rounded-[6px] text-sm border transition-colors ${filter === f.key ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-rule hover:border-ink'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-muted py-10">Loading exercises…</p>}

      {!loading && error && (
        <div className="bg-white border border-rule rounded-[4px] p-8">
          <p className="text-ink mb-4">The exercise library didn't load. Check your connection and try again.</p>
          <Button onClick={load} variant="secondary"><RefreshCcw className="w-4 h-4 mr-2" aria-hidden="true" />Try again</Button>
        </div>
      )}

      {!loading && !error && (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {shown.map(ex => {
            const live = LIVE_EXERCISES.includes(ex.name);
            return (
              <li key={ex.id}>
                <Link to={`/dashboard/exercises/${ex.id}`}
                  className="group flex flex-col h-full bg-white border border-rule rounded-[4px] p-5 hover:border-primary transition-colors duration-150">
                  <span className="text-[13px] text-muted">{ex.body_part}{ex.difficulty ? ` / ${ex.difficulty}` : ''}</span>
                  <span className="font-serif text-[22px] text-ink mt-1 leading-tight">{ex.name}</span>
                  {ex.description && <span className="text-sm text-muted mt-2">{ex.description}</span>}
                  <span className="mt-auto pt-4 flex items-center justify-between text-sm">
                    {live
                      ? <span className="flex items-center gap-1.5 text-primary font-semibold"><Camera className="w-4 h-4" aria-hidden="true" />Counted by camera</span>
                      : <span className="text-muted">{ex.sets || 3} × {ex.repetitions || '10'}{ex.duration ? `, ${ex.duration}` : ''}</span>}
                    <span className="font-semibold text-primary group-hover:underline">View exercise</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
