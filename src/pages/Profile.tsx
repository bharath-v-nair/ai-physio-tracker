import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { useUserProfile } from '../utils/useUserProfile';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const inputClass = 'block w-full px-3.5 py-2.5 mt-1.5 bg-white border border-rule rounded-[6px] text-ink focus:outline-none focus:border-primary focus:ring-2 focus:ring-teal-100';

// FastAPI field errors -> one readable line
const readError = (detail: unknown) => {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail[0]) {
    const field = String(detail[0].loc?.[detail[0].loc.length - 1] ?? '').replace('_', ' ');
    return `${field ? `${field[0].toUpperCase()}${field.slice(1)}: ` : ''}${String(detail[0].msg).replace(/^Value error, /, '')}`;
  }
  return 'Could not save your changes.';
};

export const Profile = () => {
  const profile = useUserProfile();
  const [form, setForm] = useState({ full_name: '', age: '', height: '', weight: '', rehabilitation_goal: '' });
  const [status, setStatus] = useState<{ kind: 'saved' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? '',
      age: profile.age?.toString() ?? '',
      height: profile.height?.toString() ?? '',
      weight: profile.weight?.toString() ?? '',
      rehabilitation_goal: profile.rehabilitation_goal ?? '',
    });
  }, [profile]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setStatus(null);
    setForm(f => ({ ...f, [key]: e.target.value }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    const num = (v: string) => (v.trim() === '' ? null : Number(v));
    try {
      const res = await fetch(`${API_URL}/api/v1/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({
          full_name: form.full_name,
          age: num(form.age),
          height: num(form.height),
          weight: num(form.weight),
          rehabilitation_goal: form.rehabilitation_goal.trim() || null,
        }),
      });
      if (res.ok) {
        setStatus({ kind: 'saved', text: 'Changes saved.' });
      } else {
        const body = await res.json().catch(() => null);
        setStatus({ kind: 'error', text: readError(body?.detail) });
      }
    } catch {
      setStatus({ kind: 'error', text: "Can't reach the server. Try again in a moment." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl pb-12">
      <header className="mb-6">
        <h1 className="text-[34px] md:text-[40px] leading-tight text-ink">Profile</h1>
        <p className="text-muted mt-1">{profile?.email}</p>
      </header>

      <form onSubmit={save} className="bg-white border border-rule rounded-[4px] p-5 md:p-6 space-y-5">
        <label className="block text-sm font-semibold text-ink">
          Name
          <input value={form.full_name} onChange={set('full_name')} required maxLength={100} className={`${inputClass} break-words`} />
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="block text-sm font-semibold text-ink">
            Age
            <input type="number" min={1} max={120} value={form.age} onChange={set('age')} className={inputClass} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Height (cm)
            <input type="number" min={50} max={250} step="0.1" value={form.height} onChange={set('height')} className={inputClass} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Weight (kg)
            <input type="number" min={20} max={300} step="0.1" value={form.weight} onChange={set('weight')} className={inputClass} />
          </label>
        </div>
        <label className="block text-sm font-semibold text-ink">
          Your goal
          <textarea value={form.rehabilitation_goal} onChange={set('rehabilitation_goal')} maxLength={300} rows={3}
            placeholder="For example: less neck stiffness after long study days" className={inputClass} />
          <span className="block mt-1 font-normal text-muted">The assistant can see your goal. Age, height and weight are optional and not used for scoring.</span>
        </label>
        <div className="flex items-center gap-4">
          <Button type="submit" isLoading={saving}>Save changes</Button>
          {status && (
            <p role={status.kind === 'error' ? 'alert' : 'status'} className={`text-sm ${status.kind === 'error' ? 'text-flag-text' : 'text-primary font-semibold'}`}>{status.text}</p>
          )}
        </div>
      </form>

      <section className="mt-6 bg-white border border-rule rounded-[4px] p-5 md:p-6">
        <h2 className="text-[22px] text-ink mb-2">Your data</h2>
        <p className="text-sm text-muted">
          PhysioAI stores your scores, measurements, exercise sessions and focus sessions. Camera video is analysed as it streams and never saved.
        </p>
      </section>
    </div>
  );
};
