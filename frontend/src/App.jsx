import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import AttendancePage from './pages/AttendancePage';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import ProgramsPage from './pages/ProgramsPage';
import ProgramDetailPage from './pages/ProgramDetailPage';
import ApplicationsPage from './pages/ApplicationsPage';
import TasksPage from './pages/TasksPage';
import TaskDetailPage from './pages/TaskDetailPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import CertificatesPage from './pages/CertificatesPage';
import Unauthorized from './pages/Unauthorized';
import ChatBot from './components/ChatBot';
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route
            path="/attendance"
            element={
              <ProtectedRoute>
                <AttendancePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/analytics"
            element={
              <ProtectedRoute roles={['admin', 'mentor']}>
                <AnalyticsDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/programs"
            element={
              <ProtectedRoute roles={['admin', 'mentor']}>
                <ProgramsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/programs/:id"
            element={
              <ProtectedRoute roles={['admin', 'mentor']}>
                <ProgramDetailPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/applications"
            element={
              <ProtectedRoute roles={['admin']}>
                <ApplicationsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <TasksPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tasks/:id"
            element={
              <ProtectedRoute roles={['admin', 'mentor']}>
                <TaskDetailPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/announcements"
            element={
              <ProtectedRoute>
                <AnnouncementsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/certificates"
            element={
              <ProtectedRoute>
                <CertificatesPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/attendance" replace />} />
        </Routes>
        <ChatBot />
      </AuthProvider>
    </BrowserRouter>
  );
}
