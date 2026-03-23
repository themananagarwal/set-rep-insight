import { useEffect } from 'react';
import { useTrainerStore } from './lib/store';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Loader } from "lucide-react";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import WorkoutManager from "./pages/WorkoutManager";
import WorkoutBuilder from "./pages/WorkoutBuilder";
import WorkoutSession from "./pages/WorkoutSession";
import WorkoutPreview from "./pages/WorkoutPreview";
import ActiveWorkout from "./pages/ActiveWorkout";
import HistoryPage from "./pages/History";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import ProfileSetup from "./pages/ProfileSetup";

// Protected Route Component
function ProtectedRoute({ children, reqRole }: { children: React.ReactNode, reqRole?: "admin" | "client" }) {
  const { user, loading, viewMode } = useAuth();
  const isSetupPage = window.location.pathname === '/setup';

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <Loader className="animate-spin text-red-500" size={32} />
      </div>
    );
  }

  // Not logged in -> go to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Mode validation
  if (reqRole && viewMode !== reqRole) {
    if (viewMode === "admin") return <Navigate to="/admin" replace />;
    if (viewMode === "client") return <Navigate to="/" replace />;
  }

  // Client Setup check: if actual client has no height/weight, force setup
  // Admins in client mode shouldn't be forced to do setup.
  if (viewMode === "client" && user.role === "client" && (!user.height || !user.weight)) {
    if (!isSetupPage) {
      return <Navigate to="/setup" replace />;
    }
    return <>{children}</>;
  }

  // If Setup is done but they visit setup page, redirect to dashboard
  if (isSetupPage && user.height && user.weight) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Public Route (Login): If already logged in, redirect based on mode
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, viewMode } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <Loader className="animate-spin text-red-500" size={32} />
      </div>
    );
  }

  if (user) {
    if (viewMode === "admin") return <Navigate to="/admin" replace />;
    if (viewMode === "client") return <Navigate to="/" replace />;
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
          {/* Public Authentication */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />

          {/* Client Setup Flow */}
          <Route path="/setup" element={
            <ProtectedRoute reqRole="client">
              <ProfileSetup />
            </ProtectedRoute>
          } />

          {/* Admin Flow */}
          <Route path="/admin/*" element={
            <ProtectedRoute reqRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Client Flow */}
          <Route element={
            <ProtectedRoute reqRole="client">
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/" element={<Dashboard />} />
            
            {/* Workout Section */}
            <Route path="/workout" element={<WorkoutManager />} />
            <Route path="/workout/preview/:id" element={<WorkoutPreview />} />
            <Route path="/workout/active" element={<ActiveWorkout />} />
            <Route path="/workout/session" element={<WorkoutSession />} />
            <Route path="/workout/builder/:id" element={<WorkoutBuilder />} />

            <Route path="/history" element={<HistoryPage />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Catch-all/Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
