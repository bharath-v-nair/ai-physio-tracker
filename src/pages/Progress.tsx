import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Calendar as CalendarIcon, TrendingUp, Award, Clock, Activity, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '../components/ui/Badge';

export const Progress = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('http://127.0.0.1:8000/api/v1/rehab/history', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setHistory(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const completedSessions = history.filter(h => !h.skipped).length;
  const skippedSessions = history.filter(h => h.skipped).length;
  const adherence = history.length > 0 ? Math.round((completedSessions / history.length) * 100) : 0;

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
                <p className="text-blue-100 font-medium">Recovery Status</p>
                <h3 className="text-3xl font-bold mt-1">On Track</h3>
              </div>
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Award className="w-8 h-8" />
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/20">
              <p className="text-sm text-blue-100">You're recovering 15% faster than average for your condition.</p>
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
             <div className="flex flex-col">
              <div className="p-3 bg-purple-100 rounded-xl w-fit mb-4">
                <CheckCircle2 className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-gray-500 font-medium text-sm">Sessions Completed</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{completedSessions}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="h-[400px] flex flex-col">
          <CardHeader>
            <CardTitle>Weekly Posture Score</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center">
            <div className="w-full h-full bg-gray-50 rounded-xl border border-gray-100 border-dashed flex flex-col items-center justify-center text-gray-400">
               <TrendingUp className="w-8 h-8 mb-2" />
               <span>Line Chart visualization goes here</span>
            </div>
          </CardContent>
        </Card>

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
    </div>
  );
};
