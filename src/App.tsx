import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Assessment } from './pages/Assessment';
import { AssessmentReport } from './pages/AssessmentReport';
import { Exercises } from './pages/Exercises';
import { Progress } from './pages/Progress';
import { Assistant } from './pages/Assistant';
import { Profile } from './pages/Profile';
import { ExerciseDetail } from './pages/ExerciseDetail';
import { LiveExercise } from './pages/LiveExercise';
import { Focus } from './pages/Focus';
import { DashboardLayout } from './components/layout/DashboardLayout';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/register" element={<Auth mode="register" />} />
        
        {/* Dashboard Routes with Layout */}
        <Route
          path="/dashboard/*"
          element={
            <DashboardLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
              </Routes>
            </DashboardLayout>
          }
        />
        <Route
          path="/assessment/*"
          element={
            <DashboardLayout>
              <Routes>
                <Route path="/" element={<Assessment />} />
                <Route path="report" element={<AssessmentReport />} />
              </Routes>
            </DashboardLayout>
          }
        />
        {/* The routine lives on the dashboard now */}
        <Route path="/rehab" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/exercises"
          element={
            <DashboardLayout>
              <Exercises />
            </DashboardLayout>
          }
        />
        <Route
          path="/exercises/:id"
          element={
            <DashboardLayout>
              <ExerciseDetail />
            </DashboardLayout>
          }
        />
        <Route
          path="/exercises/:id/live"
          element={
            <DashboardLayout>
              <LiveExercise />
            </DashboardLayout>
          }
        />
        <Route
          path="/dashboard/exercises"
          element={
            <DashboardLayout>
              <Exercises />
            </DashboardLayout>
          }
        />
        <Route
          path="/dashboard/exercises/:id"
          element={
            <DashboardLayout>
              <ExerciseDetail />
            </DashboardLayout>
          }
        />
        <Route
          path="/dashboard/exercises/:id/live"
          element={
            <DashboardLayout>
              <LiveExercise />
            </DashboardLayout>
          }
        />
        <Route
          path="/focus"
          element={
            <DashboardLayout>
              <Focus />
            </DashboardLayout>
          }
        />
        <Route
          path="/progress"
          element={
            <DashboardLayout>
              <Progress />
            </DashboardLayout>
          }
        />
        <Route
          path="/assistant"
          element={
            <DashboardLayout>
              <Assistant />
            </DashboardLayout>
          }
        />
        <Route
          path="/profile"
          element={
            <DashboardLayout>
              <Profile />
            </DashboardLayout>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
