import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Download, Save, CheckCircle2, AlertTriangle, ArrowLeft, Loader2, PlayCircle } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export const AssessmentReport = () => {
  const [assessment, setAssessment] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchReport = async () => {
      const searchParams = new URLSearchParams(location.search);
      const assessmentId = searchParams.get('assessment_id');
      const token = localStorage.getItem('token');

      if (!assessmentId) {
        // Fallback or handle missing ID (for simplicity, we might just stop loading)
        setLoading(false);
        return;
      }

      try {
        // Since we don't have a GET /assessment/:id endpoint easily accessible,
        // we can fetch history and find it, or assume backend can provide it.
        // Actually, let's hit history and pick the right one.
        const histRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/assessments/history`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (histRes.ok) {
          const history = await histRes.json();
          const target = history.find((a: any) => a.id === parseInt(assessmentId));
          setAssessment(target);
          
          if (target && target.detected_issue) {
             const issues = target.detected_issue.split(',').map((i: string) => i.trim());
             const recRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/rehab/recommendations`, {
               method: 'POST',
               headers: { 
                 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${token}` 
               },
               body: JSON.stringify({ detected_issues: issues, severity: "low" })
             });
             if (recRes.ok) {
               const recData = await recRes.json();
               setRecommendations(recData.recommendations);
               setWarning(recData.warning);
             }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReport();
  }, [location]);

  const handleGeneratePlan = async () => {
    if (!assessment) return;
    setGenerating(true);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/v1/rehab/generate?assessment_id=${assessment.id}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        navigate('/rehab');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading your assessment results...</div>;
  }

  if (!assessment) {
    return <div className="p-8 text-center text-gray-500">Assessment not found.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <Link to="/assessment" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Assessment
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Assessment Report</h1>
          <p className="text-gray-500 mt-1">Detailed breakdown of your latest session.</p>
        </div>
        
        <div className="flex space-x-3">
          <Button onClick={handleGeneratePlan} disabled={generating} className="rounded-xl bg-blue-600 hover:bg-blue-700">
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Generate Rehab Plan
          </Button>
        </div>
      </header>

      {/* Overview */}
      <Card className="bg-gradient-to-r from-gray-900 to-slate-800 text-white border-0 shadow-xl">
        <CardContent className="p-8">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
             <div className="text-center md:text-left">
               <p className="text-slate-400 font-medium mb-1">Overall Score</p>
               <div className="flex items-baseline justify-center md:justify-start space-x-2">
                 <span className="text-6xl font-bold text-white">{assessment.posture_score}</span>
                 <span className="text-xl text-slate-400">/100</span>
               </div>
               {assessment.posture_score >= 80 ? (
                 <Badge variant="success" className="mt-4 bg-green-500/20 text-green-300 border border-green-500/30">Good Posture</Badge>
               ) : assessment.posture_score >= 50 ? (
                 <Badge variant="warning" className="mt-4 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">Needs Improvement</Badge>
               ) : (
                 <Badge variant="danger" className="mt-4 bg-red-500/20 text-red-300 border border-red-500/30">Poor Posture</Badge>
               )}
             </div>
             
             <div className="md:col-span-2">
               <p className="text-lg text-slate-300 leading-relaxed">
                 {assessment.posture_score >= 80 
                   ? "Your overall posture is good, but consistent practice can help maintain it."
                   : "We've detected some areas for improvement. A targeted rehab plan will help correct these issues."}
               </p>
             </div>
           </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Detected Issues */}
        <Card>
          <CardHeader>
            <CardTitle>Key Findings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             {assessment.detected_issue && assessment.detected_issue !== "None" ? (
               assessment.detected_issue.split(',').map((issue: string, idx: number) => (
                 <div key={idx} className="p-4 rounded-xl border border-orange-200 bg-orange-50 flex space-x-4">
                   <AlertTriangle className="w-6 h-6 text-orange-500 shrink-0" />
                   <div>
                     <h4 className="font-semibold text-gray-900 capitalize">{issue.replace('_', ' ')}</h4>
                     <p className="text-sm text-gray-600 mt-1 mb-3">Detected during your live assessment.</p>
                   </div>
                 </div>
               ))
             ) : (
               <div className="p-4 rounded-xl border border-green-200 bg-green-50 flex space-x-4">
                 <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                 <div>
                   <h4 className="font-semibold text-gray-900">Great alignment</h4>
                   <p className="text-sm text-gray-600 mt-1">No major postural issues detected.</p>
                 </div>
               </div>
             )}
          </CardContent>
        </Card>

        {/* Recommended Exercises */}
        <Card>
          <CardHeader>
            <CardTitle>Recommended Exercises</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             {warning && (
               <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm mb-4">
                 {warning}
               </div>
             )}
             
             {recommendations.length > 0 ? (
               recommendations.map((ex: any) => (
                 <div key={ex.id} className="flex items-center space-x-4 p-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm transition-all cursor-pointer" onClick={() => navigate(`/dashboard/exercises/${ex.id}`)}>
                   <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center shrink-0">
                     <PlayCircle className="w-6 h-6 text-gray-400" />
                   </div>
                   <div className="flex-1 min-w-0">
                     <h4 className="font-medium text-gray-900 truncate">{ex.name}</h4>
                     <p className="text-sm text-gray-500 truncate">{ex.target_muscle}</p>
                   </div>
                   <div className="text-right shrink-0">
                     <div className="text-sm font-medium text-gray-900">{ex.sets}x{ex.repetitions || '10'}</div>
                     <div className="text-xs text-gray-500">{ex.difficulty}</div>
                   </div>
                 </div>
               ))
             ) : (
               <p className="text-gray-500 text-sm">No specific recommendations.</p>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
