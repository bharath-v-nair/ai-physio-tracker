import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { mockDashboardData, mockUserData } from '../utils/mockData';
import { Activity, Target, Flame, TrendingUp, BarChart2 } from 'lucide-react';

export const Dashboard = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back, {mockUserData.name.split(' ')[0]}</h1>
        <p className="text-gray-500 mt-1">Here is a summary of your recovery progress.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card variant="default" className="border-t-4 border-t-[#4F8EF7]">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Today's Score</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{mockDashboardData.postureScore}/100</h3>
              </div>
              <div className="p-3 bg-[#4F8EF7]/10 rounded-xl">
                <Activity className="w-5 h-5 text-[#4F8EF7]" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 font-medium">+2%</span>
              <span className="text-gray-500 ml-2">from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Streak</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{mockDashboardData.streak} days</h3>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Assessments</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{mockDashboardData.assessmentsThisWeek}</h3>
              </div>
              <div className="p-3 bg-indigo-100 rounded-xl">
                <Target className="w-5 h-5 text-indigo-500" />
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-500">This week</p>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Improvement</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{mockDashboardData.improvement}%</h3>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Placeholder */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="h-[400px] flex flex-col">
            <CardHeader>
              <CardTitle>Recovery Progress</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="w-full h-full bg-gray-50 rounded-xl border border-gray-100 border-dashed flex flex-col items-center justify-center text-gray-400">
                <BarChart2 className="w-8 h-8 mb-2" />
                <span>Chart visualization goes here</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Assessments */}
        <div className="space-y-6">
          <Card className="h-[400px] flex flex-col">
            <CardHeader>
              <CardTitle>Recent Assessments</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto pr-2 space-y-4">
              {mockDashboardData.recentAssessments.map(assessment => (
                <div key={assessment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                  <div>
                    <h4 className="font-medium text-gray-900">{assessment.type}</h4>
                    <p className="text-xs text-gray-500 mt-1">{assessment.date}</p>
                  </div>
                  <Badge variant={assessment.score > 80 ? 'success' : 'warning'}>
                    Score: {assessment.score}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
