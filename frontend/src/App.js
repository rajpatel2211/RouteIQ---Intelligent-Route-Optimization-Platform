import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import MeterList from './components/MeterList';
import RouteOptimizer from './components/RouteOptimizer';
import Analytics from './components/Analytics';

function PrivateRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return token ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/meters" element={<PrivateRoute><MeterList /></PrivateRoute>} />
      <Route path="/optimize" element={<PrivateRoute><RouteOptimizer /></PrivateRoute>} />
      <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
