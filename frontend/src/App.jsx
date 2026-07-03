import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import AttendancePage from './pages/AttendancePage';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import Unauthorized from './pages/Unauthorized';

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

          <Route path="*" element={<Navigate to="/attendance" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
