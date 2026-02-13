import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { useTrainerStore } from "./lib/store";

// Placeholder Pages (will be implemented next)
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import WorkoutManager from "./pages/WorkoutManager";
import WorkoutBuilder from "./pages/WorkoutBuilder";
import WorkoutSession from "./pages/WorkoutSession";
import WorkoutPreview from "./pages/WorkoutPreview";
import ActiveWorkout from "./pages/ActiveWorkout";
import HistoryPage from "./pages/History";
import Profile from "./pages/Profile";

// ...

import { useEffect } from "react";

// ...

function App() {
  const { user, syncExercises } = useTrainerStore();

  useEffect(() => {
    syncExercises();
  }, [syncExercises]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Onboarding Route - Independent of Layout if needed, but mostly consistent */}
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Main App Routes wrapped in Layout */}
        <Route element={<Layout />}>
          {/* Redirect to Onboarding if no user exists */}
          <Route path="/" element={user ? <Dashboard /> : <Navigate to="/onboarding" replace />} />

          {/* Workout Section */}
          <Route path="/workout" element={<WorkoutManager />} />
          <Route path="/workout/preview/:id" element={<WorkoutPreview />} />
          <Route path="/workout/active" element={<ActiveWorkout />} />
          <Route path="/workout/session" element={<WorkoutSession />} />
          <Route path="/workout/builder/:id" element={<WorkoutBuilder />} />

          <Route path="/history" element={<HistoryPage />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
