import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { TrendingUp, Flame, Activity, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '../components/ui/Badge';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const DAY_MS = 24 * 60 * 60 * 1000;

const shortDate = (d: Date) => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// Monday of the week the date falls in
const startOfWeek = (d: Date) => {
  const day = startOfDay(d);
  const offset = (day.getDay() + 6) % 7;
  return new Date(day.getTime() - offset * DAY_MS);
};

// Days in a row, ending today or yesterday, with at least one completed session
const currentStreak = (sessions: any[]) => {
  const days = new Set(
    sessions.filter(s => !s.skipped).map(s => startOfDay(new Date(s.completed_at)).getTime())
  );
  let day = startOfDay(new Date()).getTime();
  if (!days.has(day)) day -= DAY_MS;
  let streak = 0;
  while (days.has(day)) {
    streak += 1;
    day -= DAY_MS;
  }
  return streak;
};

// Completed and skipped sessions per week, for the last 6 weeks
const weeklyCounts = (sessions: any[]) => {
  const thisWeek = startOfWeek(new Date()).getTime();
  const weeks = Array.from({ length: 6 }, (_, i) => {
    const start = thisWeek - (5 - i) * 7 * DAY_MS;
    return { start, week: shortDate(new Date(start)), completed: 0, skipped: 0 };
  });
  for (const s of sessions) {
    const start = startOfWeek(new Date(s.completed_at)).getTime();
    const week = weeks.find(w => w.start === start);
    if (week) {
      if (s.skipped) week.skipped += 1;
      else week.completed += 1;
    }
  }
  return weeks;
};

const EmptyChart = ({ message, linkTo, linkText }: { message: string; linkTo: string; linkText: string }) => (
  <div className="w-full h-full bg-gray-50 rounded-xl border border-gray-100 border-dashed flex flex-col items-center justify-center text-center text-gray-500 px-6">
    <p>{message}</p>
    <Link to={linkTo} className="mt-3 text-sm font-medium text-[#4F8EF7] hover:underline">{linkText}</Link>
  </div>
);

export const Progress = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
      try {
        const [historyRes, assessmentsRes] = await Promise.all([
          fetch(`${API_URL}/api/v1/rehab/history`, { headers }),
          fetch(`${API_URL}/api/v1/assessments/history`, { headers }),
        ]);
        if (historyRes.ok) setHistory(await historyRes.json());
        if (assessmentsRes.ok) setAssessments(await assessmentsRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const completedSessions = history.filter(h => !h.skipped).length;
  const adherence = history.length > 0 ? Math.round((completedSessions / history.length) * 100) : 0;
  const streak = currentStreak(history);
  const weeks = weeklyCounts(history);

  // Oldest first for the line chart
  const scorePoints = [...assessments]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map(a => ({ date: shortDate(new Date(a.created_at)), score: Math.round(a.posture_score) }));
  const scoreChange = scorePoints.length >= 2
    ? scorePoints[scorePoints.length - 1].score - scorePoints[0].score
    : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto pb-12">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Progress Tracker</h1>
        <p className="text-gray-500 mt-1">Monitor your rehabilitation journey and milestones.</p>
      </header>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-[#4F8EF7] to-[#3B72C6] text-white border-0 shadow-lg shadow-blue-500/20 md:col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 font-medium">Posture Score Change</p>
                <h3 className="text-3xl font-bold mt-1">
                  {scoreChange === null ? '–' : `${scoreChange > 0 ? '+' : ''}${scoreChange} points`}
                </h3>
              </div>
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                <TrendingUp className="w-8 h-8" />
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/20">
              <p className="text-sm text-blue-100">
                {scoreChange === null
                  ? 'Complete two posture checks to see how your score changes.'
                  : `From ${scorePoints[0].score} in your first posture check to ${scorePoints[scorePoints.length - 1].score} in your latest (${scorePoints.length} checks).`}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <div className="p-3 bg-green-100 rounded-xl w-fit mb-4">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-gray-500 font-medium text-sm">Exercise Adherence</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{adherence}%</h3>
              <p className="text-xs text-gray-500 mt-1">{completedSessions} of {history.length} sessions completed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <div className="p-3 bg-orange-100 rounded-xl w-fit mb-4">
                <Flame className="w-6 h-6 text-orange-600" />
              </div>
              <p className="text-gray-500 font-medium text-sm">Current Streak</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{streak} {streak === 1 ? 'day' : 'days'}</h3>
              <p className="text-xs text-gray-500 mt-1">Days in a row with a completed session</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="h-[400px] flex flex-col">
          <CardHeader>
            <CardTitle>Posture Score Over Time</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            {loading ? (
              <div className="text-center text-gray-500 py-8">Loading...</div>
            ) : scorePoints.length === 0 ? (
              <EmptyChart message="No posture checks yet." linkTo="/assessment" linkText="Take a posture check" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scorePoints} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="score" name="Posture score" stroke="#4F8EF7" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="h-[400px] flex flex-col">
          <CardHeader>
            <CardTitle>Sessions per Week</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            {loading ? (
              <div className="text-center text-gray-500 py-8">Loading...</div>
            ) : history.length === 0 ? (
              <EmptyChart message="No exercise sessions yet." linkTo="/dashboard/exercises" linkText="Browse exercises" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeks} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    labelFormatter={(label) => `Week of ${label}`}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="completed" name="Completed" stackId="s" fill="#10b981" />
                  <Bar dataKey="skipped" name="Skipped" stackId="s" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto max-h-[320px]">
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No exercise history found.</div>
          ) : (
            <div className="space-y-4">
              {history.map((session, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${session.skipped ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {session.skipped ? <XCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{session.exercise?.name}</p>
                      <p className="text-xs text-gray-500">{new Date(session.completed_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <Badge variant={session.skipped ? 'danger' : 'success'}>
                    {session.skipped ? 'Skipped' : 'Completed'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
