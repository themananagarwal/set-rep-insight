import { useEffect } from 'react';
import { useTrainerStore } from './lib/store';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Loader } from "lucide-react";

// Pages
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding"; // Likely deprecated but keeping for now
import WorkoutManager from "./pages/WorkoutManager";
import WorkoutBuilder from "./pages/WorkoutBuilder";
import WorkoutSession from "./pages/WorkoutSession";
import WorkoutPreview from "./pages/WorkoutPreview";
import ActiveWorkout from "./pages/ActiveWorkout";
import HistoryPage from "./pages/History";
import ProfileSetup from "./pages/ProfileSetup";
import ExerciseLibrary from "./pages/ExerciseLibrary";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth(); // Ensure signOut is destructured

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <Loader className="animate-spin text-red-500" size={32} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If no profile exists, they should likely be in the signup flow, but if they got here, drag them to signup?
  // Actually, if they are logged in but have no profile (e.g. old user?), force signup?
  // Or maybe just show loading until profile is fetched?
  if (!profile) {
    // Edge case: User Created but Profile creation failed. 
    // For now, let's redirect to signup or show error.
    return <Navigate to="/signup" replace />;
  }

  // Profile Status Checks
  if (profile.status === 'pending') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4">
          <Loader className="text-yellow-500" size={32} />
        </div>
        <h1 className="text-2xl font-bold mb-2">You're on the Waitlist</h1>
        <p className="text-zinc-400 max-w-sm mb-6">
          Your profile has been created and is waiting for administrator approval. You'll be able to access the dashboard soon.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-colors mb-4"
        >
          Refresh Status
        </button>
        <button onClick={signOut} className="text-sm text-zinc-500 hover:text-white underline">
          Sign Out
        </button>
      </div>
    );
  }

  if (profile.status === 'rejected') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
          <Loader className="text-red-500" size={32} />
        </div>
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-zinc-400 max-w-sm mb-6">
          Unfortunately, your request for access has been denied at this time.
        </p>
        <button onClick={signOut} className="px-6 py-2 bg-zinc-800 text-white font-bold rounded-full hover:bg-zinc-700 transition-colors">
          Sign Out
        </button>
      </div>
    );
  }

  // If Approved, check if they have Height/Weight (Setup Complete)
  // We can skip this check if we are ALREADY on the setup page to avoid loops
  const isSetupPage = window.location.pathname === '/setup';

  if (!profile.height || !profile.weight) {
    // Force Setup
    if (!isSetupPage) {
      return <Navigate to="/setup" replace />;
    }
    return <>{children}</>;
  }

  // If Setup is done but they verify setup page, redirect to dashboard?
  if (isSetupPage && profile.height && profile.weight) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { syncExercises } = useTrainerStore();

  useEffect(() => {
    syncExercises();
  }, [syncExercises]);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Main Flow: ProtectedRoute handles redirection to /setup or / */}
          <Route path="/setup" element={
            <ProtectedRoute>
              <ProfileSetup />
            </ProtectedRoute>
          } />

          <Route element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/" element={<Dashboard />} />
            <Route path="/onboarding" element={<Onboarding />} />

            {/* Workout Section */}
            <Route path="/workout" element={<WorkoutManager />} />
            <Route path="/workout/preview/:id" element={<WorkoutPreview />} />
            <Route path="/workout/active" element={<ActiveWorkout />} />
            <Route path="/workout/session" element={<WorkoutSession />} />
            <Route path="/workout/builder/:id" element={<WorkoutBuilder />} />

            <Route path="/history" element={<HistoryPage />} />
            <Route path="/library" element={<ExerciseLibrary />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          {/* Catch-all/Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App; // Final export
