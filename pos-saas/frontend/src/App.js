import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Users from './pages/Users';

const ProtectedRoute = ({ children, roles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={
          user?.role === 'cashier' ? <Navigate to="/pos" replace /> : <Dashboard />
        } />
        <Route path="pos" element={<POS />} />
        <Route path="products" element={
          <ProtectedRoute roles={['admin', 'manager']}>
            <Products />
          </ProtectedRoute>
        } />
        <Route path="sales" element={
          <ProtectedRoute roles={['admin', 'manager']}>
            <Sales />
          </ProtectedRoute>
        } />
        <Route path="users" element={
          <ProtectedRoute roles={['admin']}>
            <Users />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ style: { fontFamily: 'DM Sans, sans-serif' } }} />
      </BrowserRouter>
    </AuthProvider>
  );
}
