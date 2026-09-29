import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { mockUserData } from '../utils/mockData';
import { Activity, Target, Flame, TrendingUp, AlertCircle, Dumbbell } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
    const navigate = useNavigate();
    const [summary, setSummary] = useState<any>(null);
    const [progress, setProgress] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [filter, setFilter] = useState('All');

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(false);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const [summaryRes, progressRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/dashboard/summary`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/dashboard/progress`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (summaryRes.ok && progressRes.ok) {
                setSummary(await summaryRes.json());
                setProgress(await progressRes.json());
            } else {
                setError(true);
            }
        } catch (err) {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [navigate]);

    if (loading) {
        return (
            <div className="h-[calc(100vh-6rem)] flex flex-col items-center justify-center space-y-4">
                <Activity className="w-8 h-8 text-blue-500 animate-pulse" />
                <p className="text-gray-500 font-medium">Loading your progress...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-[calc(100vh-6rem)] flex flex-col items-center justify-center space-y-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <h2 className="text-xl font-bold text-gray-900">Unable to load your progress.</h2>
                <Button onClick={fetchDashboardData} variant="outline">Retry Loading</Button>
            </div>
        );
    }

    const filteredProgress = filter === 'All' ? progress : progress.filter(p => p.exercise_name === filter);
    const exercises = ['All', ...Array.from(new Set(progress.map(p => p.exercise_name)))];

    const hasData = progress.length > 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back, {mockUserData.name.split(' ')[0]}</h1>
                    <p className="text-gray-500 mt-1">Here is a summary of your exercise progress.</p>
                </div>
                {hasData && (
                    <div className="flex items-center space-x-2 bg-white rounded-lg p-1 border border-gray-200">
                        {exercises.map(ex => (
                            <button
                                key={ex}
                                onClick={() => setFilter(ex)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    filter === ex ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {ex}
                            </button>
                        ))}
                    </div>
                )}
            </header>

            {!hasData ? (
                <Card className="text-center py-16 border-dashed border-2 bg-gray-50">
                    <CardContent>
                        <Dumbbell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">No exercises completed yet</h2>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">Start your recovery journey by completing a recommended exercise session. Your progress will appear here.</p>
                        <Button onClick={() => navigate('/exercises')} className="bg-[#4F8EF7] hover:bg-blue-600">
                            Find Recommended Exercises
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card variant="default" className="border-t-4 border-t-[#4F8EF7]">
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Average Form Score</p>
                                        <h3 className="text-4xl font-bold text-gray-900 mt-2">{summary.average_form_score}%</h3>
                                    </div>
                                    <div className="p-3 bg-[#4F8EF7]/10 rounded-xl">
                                        <Activity className="w-5 h-5 text-[#4F8EF7]" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card variant="default">
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Total Sessions</p>
                                        <h3 className="text-4xl font-bold text-gray-900 mt-2">{summary.total_sessions}</h3>
                                    </div>
                                    <div className="p-3 bg-indigo-100 rounded-xl">
                                        <Target className="w-5 h-5 text-indigo-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card variant="default">
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Total Reps Completed</p>
                                        <h3 className="text-4xl font-bold text-gray-900 mt-2">{summary.total_reps}</h3>
                                    </div>
                                    <div className="p-3 bg-green-100 rounded-xl">
                                        <TrendingUp className="w-5 h-5 text-green-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Charts Area */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Form Score Progress</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={filteredProgress} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                <XAxis dataKey="date" tick={{fontSize: 12, fill: '#888'}} axisLine={false} tickLine={false} />
                                                <YAxis domain={[0, 100]} tick={{fontSize: 12, fill: '#888'}} axisLine={false} tickLine={false} />
                                                <Tooltip 
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                />
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="form_score" 
                                                    name="Form Score %"
                                                    stroke="#4F8EF7" 
                                                    strokeWidth={3}
                                                    dot={{ r: 4, strokeWidth: 2 }}
                                                    activeDot={{ r: 6 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                            
                            <Card>
                                <CardHeader>
                                    <CardTitle>Reps Completed</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[250px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={filteredProgress} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                <XAxis dataKey="date" tick={{fontSize: 12, fill: '#888'}} axisLine={false} tickLine={false} />
                                                <YAxis tick={{fontSize: 12, fill: '#888'}} axisLine={false} tickLine={false} />
                                                <Tooltip 
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    cursor={{ fill: '#f8fafc' }}
                                                />
                                                <Bar dataKey="completed_reps" name="Reps" fill="#10b981" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recent History Sidebar */}
                        <div className="space-y-6">
                            <Card className="h-full flex flex-col max-h-[700px]">
                                <CardHeader className="bg-white sticky top-0 z-10 border-b border-gray-100 pb-4">
                                    <CardTitle>Session History</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1 overflow-auto p-4 space-y-3">
                                    {[...progress].reverse().map((session, i) => (
                                        <div key={i} className="flex flex-col p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">{session.exercise_name}</h4>
                                                    <p className="text-xs text-gray-500">{session.date}</p>
                                                </div>
                                                <Badge variant={session.form_score >= 80 ? 'success' : (session.form_score >= 60 ? 'warning' : 'danger')}>
                                                    Score: {session.form_score}%
                                                </Badge>
                                            </div>
                                            <div className="text-sm font-medium text-gray-700 mt-1">
                                                <span className="text-gray-500 font-normal mr-1">Reps:</span> 
                                                {session.completed_reps}
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-blue-100">
                                <CardContent className="p-6">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                            <Activity className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-bold text-gray-900">AI Physiotherapy Assistant</h3>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-4">Have a question about your exercises, posture, or recent sessions?</p>
                                    <Button 
                                        onClick={() => navigate('/assistant')} 
                                        className="w-full bg-[#4F8EF7] hover:bg-blue-600 text-white shadow-sm"
                                    >
                                        Ask AI Assistant
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
