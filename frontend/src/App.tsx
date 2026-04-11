import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './store/AppContext';
import { ThemeProvider, useTheme } from './store/ThemeContext';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import HomePage from './pages/HomePage';
import AdminHomePage from './pages/AdminHomePage';
import AdminLogsPage from './pages/AdminLogsPage';
import FreelancersPage from './pages/FreelancersPage';
import FreelancerDetailPage from './pages/FreelancerDetailPage';
import ClientDetailPage from './pages/ClientDetailPage';
import JobsPage from './pages/JobsPage';
import JobDetailPage from './pages/JobDetailPage';
import CreateJobPage from './pages/CreateJobPage';
import MyJobsPage from './pages/MyJobsPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';

// Layout components
import Navbar from './components/Navbar';
import AdminLayout from './components/AdminLayout';

// ── Route Guards ──────────────────────────────────────────────────────────────

/** Admin-only guard */
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useApp();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== 'administrator') return <Navigate to="/" replace />;
  return <>{children}</>;
};

/** Client / Freelancer guard — admins are redirected to their area */
const UserRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useApp();
  const location = useLocation();
  if (!currentUser) return <Navigate to="/login" state={{ from: location }} replace />;
  if (currentUser.role === 'administrator') return <Navigate to="/" replace />;
  return <>{children}</>;
};

/** Redirect logged-in users away from guest pages */
const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useApp();
  if (currentUser) return <Navigate to="/" replace />;
  return <>{children}</>;
};

// ── Layouts ───────────────────────────────────────────────────────────────────

/** User/public layout with theme support. */
const UserLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDark } = useTheme();

  return (
    <div className={isDark ? 'theme-dark min-h-screen bg-slate-950 text-slate-100 transition-colors duration-300' : 'min-h-screen bg-slate-50 transition-colors duration-300'}>
      <Navbar />
      <main>{children}</main>
    </div>
  );
};

/** Landing layout (no auth) */
const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDark } = useTheme();

  return (
    <div className={isDark ? 'theme-dark min-h-screen bg-slate-950 text-slate-100 transition-colors duration-300' : 'min-h-screen bg-slate-50 transition-colors duration-300'}>
      <Navbar />
      <main>{children}</main>
    </div>
  );
};

// ── Router ────────────────────────────────────────────────────────────────────

const AppRoutes: React.FC = () => {
  const { currentUser } = useApp();
  const isAdmin = currentUser?.role === 'administrator';

  return (
    <Routes>
      {/* Root — shows different content based on auth state */}
      <Route
        path="/"
        element={
          currentUser ? (
            isAdmin ? (
              <AdminLayout>
                <AdminHomePage />
              </AdminLayout>
            ) : (
              <UserLayout>
                <HomePage />
              </UserLayout>
            )
          ) : (
            <PublicLayout>
              <LandingPage />
            </PublicLayout>
          )
        }
      />

      {/* Auth pages (guests only) */}
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <GuestRoute>
            <ForgotPasswordPage />
          </GuestRoute>
        }
      />

      {/* ── Client / Freelancer routes ── */}
      <Route
        path="/freelancers"
        element={
          <UserRoute>
            <UserLayout>
              <FreelancersPage />
            </UserLayout>
          </UserRoute>
        }
      />
      <Route
        path="/freelancer/:id"
        element={
          <UserRoute>
            <UserLayout>
              <FreelancerDetailPage />
            </UserLayout>
          </UserRoute>
        }
      />
      <Route
        path="/client/:id"
        element={
          <UserRoute>
            <UserLayout>
              <ClientDetailPage />
            </UserLayout>
          </UserRoute>
        }
      />
      <Route
        path="/jobs"
        element={
          <UserRoute>
            <UserLayout>
              <JobsPage />
            </UserLayout>
          </UserRoute>
        }
      />
      <Route
        path="/job/:id"
        element={
          <UserRoute>
            <UserLayout>
              <JobDetailPage />
            </UserLayout>
          </UserRoute>
        }
      />
      <Route
        path="/create-job"
        element={
          <UserRoute>
            <UserLayout>
              <CreateJobPage />
            </UserLayout>
          </UserRoute>
        }
      />
      <Route
        path="/my-jobs"
        element={
          <UserRoute>
            <UserLayout>
              <MyJobsPage />
            </UserLayout>
          </UserRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <UserRoute>
            <UserLayout>
              <ProfilePage />
            </UserLayout>
          </UserRoute>
        }
      />

      {/* ── Admin-only routes — all wrapped in AdminLayout ── */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout>
              <AdminPage />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin-logs"
        element={
          <AdminRoute>
            <AdminLayout>
              <AdminLogsPage />
            </AdminLayout>
          </AdminRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => (
  <ThemeProvider>
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  </ThemeProvider>
);

export default App;
