import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { token, isAuthenticated, loading } = useAuth();

  const role = React.useMemo(() => {
    if (!token) {
      return null;
    }

    try {
      const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const pad = b64.length % 4;
      const payload = JSON.parse(atob(pad ? b64 + '='.repeat(4 - pad) : b64));
      return payload.role ?? null;
    } catch {
      return null;
    }
  }, [token]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && role !== 'ROLE_ADMIN' && role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
